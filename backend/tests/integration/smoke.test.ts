/**
 * Infrastructure smoke test: proves the suite is wired to `cacttus_test`, that the
 * guard is live, and that the app mounts without binding a port.
 */
import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { assertTestDatabase, databaseNameOf } from '../env-guard';
import { api } from '../helpers/api';
import { createActors } from '../helpers/db';

describe('test harness', () => {
  it('is connected to the cacttus_test database, never the dev database', async () => {
    assertTestDatabase();

    const rows = await prisma.$queryRawUnsafe<{ current_database: string }[]>(
      'SELECT current_database()',
    );

    expect(rows[0]?.current_database).toBe('cacttus_test');
    expect(databaseNameOf(process.env.DATABASE_URL as string)).toBe('cacttus_test');
  });

  it('starts every test from an empty database', async () => {
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.form.count(),
      prisma.submission.count(),
      prisma.auditLog.count(),
      prisma.post.count(),
    ]);

    expect(counts).toEqual([0, 0, 0, 0, 0]);
  });

  it('serves the liveness probe from the mounted app', async () => {
    const response = await api.get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
  });

  it('serves the readiness probe with a real database round-trip', async () => {
    const response = await api.get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: 'ready', database: 'up' });
  });

  it('can create fixtures and authenticate with a signed access token', async () => {
    const { adminToken, admin } = await createActors();

    const response = await api.get('/api/auth/me', { token: adminToken });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(admin.email);
  });
});
