import { beforeEach, describe, expect, it } from 'vitest';
import { FormType, SubmissionStatus } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { api } from '../helpers/api';
import { SCHOOL_FIELDS, createActors, createForm } from '../helpers/db';

const VALID_CONTACT = {
  name: 'Arta Krasniqi',
  email: 'arta@example.com',
  phone: '+38344123456',
};

async function liveForm() {
  return createForm({
    slug: 'aplikimi-per-shkolle',
    title: 'Aplikimi për Shkollë',
    type: FormType.SCHOOL,
    fields: SCHOOL_FIELDS,
  });
}

const submit = (body: Record<string, unknown>) =>
  api.post('/api/public/forms/aplikimi-per-shkolle/submit').send(body);

describe('GET /api/public/forms/:slug', () => {
  it('returns only what the marketing site needs to render the form', async () => {
    await liveForm();

    const response = await api.get('/api/public/forms/aplikimi-per-shkolle');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual(['fields', 'slug', 'title', 'type']);
    expect(response.body.data.fields).toHaveLength(4);
    expect(response.headers['cache-control']).toContain('s-maxage=300');
  });

  it('404s for an inactive form', async () => {
    await createForm({ slug: 'e-fikur', isActive: false });

    expect((await api.get('/api/public/forms/e-fikur')).status).toBe(404);
  });

  it('404s for a soft-deleted form', async () => {
    await createForm({ slug: 'e-fshire', deletedAt: new Date() });

    expect((await api.get('/api/public/forms/e-fshire')).status).toBe(404);
  });

  it('400s for a slug that is not slug-shaped', async () => {
    const response = await api.get('/api/public/forms/NOT%20A%20SLUG');

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('params.slug');
  });
});

describe('POST /api/public/forms/:slug/submit — injected keys are STRIPPED', () => {
  beforeEach(async () => {
    await liveForm();
  });

  it('ignores an injected top-level status and stores NEW', async () => {
    const response = await submit({
      ...VALID_CONTACT,
      status: 'ARCHIVED',
      data: { school_name: 'Gjimnazi Sami Frashëri' },
    });

    expect(response.status).toBe(201);

    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(stored.status).toBe(SubmissionStatus.NEW);
  });

  it('ignores injected identity and timestamp fields', async () => {
    const response = await submit({
      ...VALID_CONTACT,
      id: 'forged-id',
      createdAt: '1999-01-01T00:00:00.000Z',
      formId: 'some-other-form',
      data: { school_name: 'Gjimnazi' },
    });

    expect(response.status).toBe(201);
    expect(response.body.data.id).not.toBe('forged-id');

    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(stored.createdAt.getFullYear()).toBeGreaterThan(2020);
  });

  it('stores ONLY declared fields — unknown answer keys are dropped, not rejected', async () => {
    const response = await submit({
      ...VALID_CONTACT,
      data: {
        school_name: 'Gjimnazi Sami Frashëri',
        city: 'peje',
        junk: 'should not be stored',
        status: 'ARCHIVED',
        id: 'forged',
        __proto__: { polluted: true },
      },
    });

    expect(response.status).toBe(201);

    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    const data = stored.data as Record<string, unknown>;

    expect(data).toEqual({ school_name: 'Gjimnazi Sami Frashëri', city: 'peje' });
    expect(Object.keys(data).sort()).toEqual(['city', 'school_name']);
    expect(data).not.toHaveProperty('junk');
    expect(data).not.toHaveProperty('status');
    expect(stored.status).toBe(SubmissionStatus.NEW);
  });

  it('does not pollute Object.prototype through an injected __proto__ answer', async () => {
    await submit({
      ...VALID_CONTACT,
      data: { school_name: 'X', ['__proto__']: { polluted: 'yes' } },
    });

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('returns only an acknowledgement, never internal detail', async () => {
    const response = await submit({ ...VALID_CONTACT, data: { school_name: 'X' } });

    expect(Object.keys(response.body.data).sort()).toEqual(['id', 'receivedAt']);
    expect(response.headers['cache-control']).toBe('no-store');
  });
});

describe('POST /api/public/forms/:slug/submit — validation', () => {
  beforeEach(async () => {
    await liveForm();
  });

  it('400s naming the missing required field', async () => {
    const response = await submit({ ...VALID_CONTACT, data: { city: 'peje' } });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Some answers are invalid.');
    expect(response.body.error.details).toEqual([
      { field: 'school_name', message: 'Emri i shkollës is required.' },
    ]);
    expect(await prisma.submission.count()).toBe(0);
  });

  it('400s naming a field whose answer is outside the option list', async () => {
    const response = await submit({
      ...VALID_CONTACT,
      data: { school_name: 'X', city: 'atlantis' },
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('city');
    expect(response.body.error.details[0].message).toMatch(/must be one of/);
  });

  it('accepts a multiselect and a checkbox answer', async () => {
    const response = await submit({
      ...VALID_CONTACT,
      data: { school_name: 'X', interests: ['ai', 'cyber'], consent: true },
    });

    expect(response.status).toBe(201);

    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(stored.data).toEqual({ school_name: 'X', interests: ['ai', 'cyber'], consent: true });
  });

  it.each([
    ['name too short', { ...VALID_CONTACT, name: 'A' }],
    ['email invalid', { ...VALID_CONTACT, email: 'nope' }],
    ['phone too short', { ...VALID_CONTACT, phone: '12' }],
  ])('400s on %s', async (_label, body) => {
    const response = await submit({ ...body, data: { school_name: 'X' } });

    expect(response.status).toBe(400);
    expect(await prisma.submission.count()).toBe(0);
  });

  it('normalises the contact fields it does store', async () => {
    const response = await submit({
      name: '  Arta Krasniqi  ',
      email: '  ARTA@Example.COM ',
      phone: ' +38344123456 ',
      data: { school_name: 'X' },
    });

    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(stored).toMatchObject({
      name: 'Arta Krasniqi',
      email: 'arta@example.com',
      phone: '+38344123456',
    });
  });

  it('defaults data to an empty object when omitted', async () => {
    await createForm({ slug: 'pa-fusha', fields: [] });

    const response = await api
      .post('/api/public/forms/pa-fusha/submit')
      .send({ ...VALID_CONTACT });

    expect(response.status).toBe(201);
  });

  it('accepts the /submissions alias for the same handler', async () => {
    const response = await api
      .post('/api/public/forms/aplikimi-per-shkolle/submissions')
      .send({ ...VALID_CONTACT, data: { school_name: 'X' } });

    expect(response.status).toBe(201);
    expect(await prisma.submission.count()).toBe(1);
  });

  it('silently discards a honeypot hit without persisting anything', async () => {
    const response = await submit({
      ...VALID_CONTACT,
      website: 'http://spam.example',
      data: { school_name: 'X' },
    });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('discarded');
    expect(await prisma.submission.count()).toBe(0);
  });

  it('does not treat an empty honeypot as a bot', async () => {
    const response = await submit({
      ...VALID_CONTACT,
      website: '   ',
      data: { school_name: 'X' },
    });

    expect(response.status).toBe(201);
    expect(await prisma.submission.count()).toBe(1);
  });

  it('never writes an audit row for an anonymous public submission', async () => {
    await submit({ ...VALID_CONTACT, data: { school_name: 'X' } });

    expect(await prisma.auditLog.count()).toBe(0);
  });
});

describe('public submission rate limit', () => {
  it('throttles a single IP once the window budget is spent', async () => {
    await liveForm();

    const ip = '198.51.100.77';
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await api
        .post('/api/public/forms/aplikimi-per-shkolle/submit', { ip })
        .send({ ...VALID_CONTACT, data: { school_name: 'X' } });
      statuses.push(response.status);
    }

    // PUBLIC_RATE_LIMIT_MAX is 5 in .env.test.
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it('answers a throttled request with the shared error envelope', async () => {
    await liveForm();
    const ip = '198.51.100.78';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await api
        .post('/api/public/forms/aplikimi-per-shkolle/submit', { ip })
        .send({ ...VALID_CONTACT, data: { school_name: 'X' } });
    }

    const throttled = await api
      .post('/api/public/forms/aplikimi-per-shkolle/submit', { ip })
      .send({ ...VALID_CONTACT, data: { school_name: 'X' } });

    expect(throttled.status).toBe(429);
    expect(throttled.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('public blog feed', () => {
  beforeEach(async () => {
    const { editor } = await createActors();

    await prisma.post.createMany({
      data: [
        {
          slug: 'i-publikuar',
          title: 'I publikuar',
          content: '<p>Trupi i artikullit</p>',
          published: true,
          authorId: editor.id,
        },
        {
          slug: 'draft',
          title: 'Draft',
          content: '<p>Nuk duhet parë</p>',
          published: false,
          authorId: editor.id,
        },
      ],
    });
  });

  it('lists only published posts, without the body', async () => {
    const response = await api.get('/api/public/posts');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).not.toHaveProperty('content');
    expect(response.body.data[0]).not.toHaveProperty('published');
    expect(response.body.data[0].excerpt).toBe('Trupi i artikullit');
    expect(response.body.data[0].author.name).toBe('Test Editor');
  });

  it('searches published titles', async () => {
    const hit = await api.get('/api/public/posts?search=publik');
    const miss = await api.get('/api/public/posts?search=draft');

    expect(hit.body.data).toHaveLength(1);
    expect(miss.body.data).toHaveLength(0);
  });

  it('serves a published post by slug with its sanitised body', async () => {
    const response = await api.get('/api/public/posts/i-publikuar');

    expect(response.status).toBe(200);
    expect(response.body.data.content).toBe('<p>Trupi i artikullit</p>');
    expect(response.headers['cache-control']).toContain('stale-while-revalidate');
  });

  it('404s an unpublished post even by direct slug', async () => {
    const response = await api.get('/api/public/posts/draft');

    expect(response.status).toBe(404);
  });
});
