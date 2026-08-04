import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { api } from '../helpers/api';
import { auditRows, createActors, latestAudit, type Actors } from '../helpers/db';

let actors: Actors;

beforeEach(async () => {
  actors = await createActors();
});

const create = (body: Record<string, unknown>, token = actors.editorToken) =>
  api.post('/api/admin/posts', { token }).send(body);

const VALID_POST = {
  slug: 'lajmi-i-pare',
  title: 'Lajmi i parë',
  content: '<p>Përmbajtja</p>',
};

describe('POST /api/admin/posts', () => {
  it('creates a draft authored by the caller and audits it', async () => {
    const response = await create(VALID_POST);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      slug: 'lajmi-i-pare',
      title: 'Lajmi i parë',
      published: false,
      coverImage: null,
      author: { id: actors.editor.id, name: 'Test Editor' },
    });
    expect(response.body.data.excerpt).toBe('Përmbajtja');

    const row = await latestAudit(AuditAction.POST_CREATED);
    expect(row?.metadata).toEqual({
      slug: 'lajmi-i-pare',
      title: 'Lajmi i parë',
      published: false,
      contentLength: '<p>Përmbajtja</p>'.length,
    });
    // The body itself is never copied into the trail.
    expect(JSON.stringify(row?.metadata)).not.toContain('Përmbajtja</p>');
  });

  it('takes authorship from the session, never from the body', async () => {
    const response = await create({ ...VALID_POST, authorId: actors.admin.id });

    expect(response.body.data.author.id).toBe(actors.editor.id);
  });

  it('sanitises the content on the way IN', async () => {
    const response = await create({
      ...VALID_POST,
      content: '<p>ok</p><script>alert(1)</script><a href="javascript:x()">bad</a>',
    });

    const stored = await prisma.post.findUniqueOrThrow({ where: { id: response.body.data.id } });

    expect(stored.content).not.toContain('<script>');
    expect(stored.content).not.toContain('javascript:');
    expect(stored.content).toContain('<p>ok</p>');
  });

  it('409s a duplicate slug', async () => {
    await create(VALID_POST);

    const response = await create(VALID_POST);

    expect(response.status).toBe(409);
    expect(response.body.error.details).toEqual([
      { field: 'body.slug', message: 'must be unique' },
    ]);
  });

  it('rejects a non-http(s) cover image', async () => {
    const response = await create({ ...VALID_POST, coverImage: 'javascript:alert(1)' });

    expect(response.status).toBe(400);
  });

  it('accepts an https cover image', async () => {
    const response = await create({
      ...VALID_POST,
      coverImage: 'https://cdn.example.com/a.png',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.coverImage).toBe('https://cdn.example.com/a.png');
  });

  it('rejects an empty body or a missing slug', async () => {
    expect((await create({})).status).toBe(400);
    expect((await create({ title: 'X', content: 'y' })).status).toBe(400);
  });
});

describe('PATCH /api/admin/posts/:id', () => {
  it('updates and records the publish transition', async () => {
    const created = await create(VALID_POST);

    const response = await api
      .patch(`/api/admin/posts/${created.body.data.id}`, { token: actors.editorToken })
      .send({ published: true, title: 'Titull i ri' });

    expect(response.status).toBe(200);
    expect(response.body.data.published).toBe(true);

    const row = await latestAudit(AuditAction.POST_UPDATED);
    expect(row?.metadata).toMatchObject({
      changed: 'title,published',
      wasPublished: false,
      published: true,
    });
  });

  it('re-sanitises replacement content', async () => {
    const created = await create(VALID_POST);

    await api
      .patch(`/api/admin/posts/${created.body.data.id}`, { token: actors.editorToken })
      .send({ content: '<p>e re</p><iframe src="https://evil.test"></iframe>' });

    const stored = await prisma.post.findUniqueOrThrow({ where: { id: created.body.data.id } });
    expect(stored.content).toBe('<p>e re</p>');
  });

  it('409s a slug already owned by another post', async () => {
    await create({ ...VALID_POST, slug: 'i-pari' });
    const second = await create({ ...VALID_POST, slug: 'i-dyti' });

    const response = await api
      .patch(`/api/admin/posts/${second.body.data.id}`, { token: actors.editorToken })
      .send({ slug: 'i-pari' });

    expect(response.status).toBe(409);
  });

  it('404s an unknown id and refuses an empty patch', async () => {
    expect(
      (await api.patch('/api/admin/posts/missing', { token: actors.editorToken }).send({ title: 'X' }))
        .status,
    ).toBe(404);

    const created = await create(VALID_POST);
    expect(
      (await api
        .patch(`/api/admin/posts/${created.body.data.id}`, { token: actors.editorToken })
        .send({})).status,
    ).toBe(400);
  });
});

describe('DELETE /api/admin/posts/:id', () => {
  it('hard-deletes and snapshots the article into the audit row', async () => {
    const created = await create({ ...VALID_POST, published: true });

    const response = await api.delete(`/api/admin/posts/${created.body.data.id}`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(204);
    expect(await prisma.post.count()).toBe(0);

    const row = await latestAudit(AuditAction.POST_DELETED);
    expect(row?.metadata).toEqual({
      slug: 'lajmi-i-pare',
      title: 'Lajmi i parë',
      published: true,
      authorId: actors.editor.id,
    });
  });

  it('404s an unknown id', async () => {
    const response = await api.delete('/api/admin/posts/missing', {
      token: actors.adminToken,
    });

    expect(response.status).toBe(404);
  });
});

describe('GET /api/admin/posts', () => {
  beforeEach(async () => {
    await create({ slug: 'a-draft', title: 'Alfa draft', content: '<p>a</p>' });
    await create({ slug: 'b-live', title: 'Beta live', content: '<p>b</p>', published: true });
  });

  it('lists both drafts and published posts', async () => {
    const response = await api.get('/api/admin/posts', { token: actors.editorToken });

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta.total).toBe(2);
  });

  it('filters by published', async () => {
    expect(
      (await api.get('/api/admin/posts?published=true', { token: actors.editorToken })).body.data,
    ).toHaveLength(1);
    expect(
      (await api.get('/api/admin/posts?published=false', { token: actors.editorToken })).body.data,
    ).toHaveLength(1);
  });

  it('searches title and slug', async () => {
    const response = await api.get('/api/admin/posts?search=BETA', {
      token: actors.editorToken,
    });

    expect(response.body.data).toHaveLength(1);
  });

  it('sorts by title ascending', async () => {
    const response = await api.get('/api/admin/posts?sort=title&order=asc', {
      token: actors.editorToken,
    });

    expect(response.body.data.map((post: { slug: string }) => post.slug)).toEqual([
      'a-draft',
      'b-live',
    ]);
  });

  it('returns a single post by id and 404s an unknown one', async () => {
    const post = await prisma.post.findFirstOrThrow({ where: { slug: 'a-draft' } });

    expect(
      (await api.get(`/api/admin/posts/${post.id}`, { token: actors.editorToken })).status,
    ).toBe(200);
    expect(
      (await api.get('/api/admin/posts/missing', { token: actors.editorToken })).status,
    ).toBe(404);
  });

  it('reports the stats without being shadowed by /:id', async () => {
    const response = await api.get('/api/admin/posts/stats', { token: actors.editorToken });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ total: 2, published: 1 });
  });
});

describe('post audit coverage', () => {
  it('writes exactly one row per mutation and none for reads', async () => {
    const created = await create(VALID_POST);
    const id = created.body.data.id;

    await api.get(`/api/admin/posts/${id}`, { token: actors.editorToken });
    await api.patch(`/api/admin/posts/${id}`, { token: actors.editorToken }).send({ title: 'B' });
    await api.delete(`/api/admin/posts/${id}`, { token: actors.adminToken });

    expect((await auditRows()).map((row) => row.action)).toEqual([
      AuditAction.POST_CREATED,
      AuditAction.POST_UPDATED,
      AuditAction.POST_DELETED,
    ]);
  });
});
