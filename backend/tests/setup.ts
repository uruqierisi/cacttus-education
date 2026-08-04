/**
 * Per-worker setup. Runs before every test file.
 *
 * RESET STRATEGY — TRUNCATE, not transaction rollback.
 * ---------------------------------------------------
 * The application opens its own interactive transactions (`prisma.$transaction`)
 * for every audited mutation, so wrapping each test in an outer transaction and
 * rolling back would require nested-transaction emulation and would change the
 * very isolation behaviour several of these tests exist to verify. Instead every
 * test starts from an empty database: `TRUNCATE ... RESTART IDENTITY CASCADE`
 * across all five tables in one statement, in a `beforeEach`.
 *
 * That is only safe because vitest is pinned to a single fork (see
 * vitest.config.ts) — a shared Postgres cannot be truncated concurrently.
 */
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { assertTestDatabase } from './env-guard';

// MUST run before anything imports src/ — it is what points src/config/env.ts at
// the test database and throws if that database is not `cacttus_test`.
assertTestDatabase();

import { prisma } from '../src/lib/prisma';
import { installLogCapture, restoreLogCapture } from './helpers/logs';
import { truncateAll } from './helpers/db';

beforeAll(async () => {
  assertTestDatabase();
  installLogCapture();
  await prisma.$connect();
});

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  restoreLogCapture();
  await prisma.$disconnect();
});
