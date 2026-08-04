/**
 * Test environment loading + the MANDATORY database-isolation guard.
 *
 * Imported for its side effects by BOTH `tests/global-setup.ts` (main vitest
 * process) and `tests/setup.ts` (every worker), so there is no path into the
 * suite that skips the guard.
 *
 * WHY IT MUST RUN FIRST
 * ---------------------
 * `src/config/env.ts` runs `import 'dotenv/config'` at module load, which reads
 * `backend/.env` — the DEV database. dotenv does not overwrite variables that are
 * already set, so loading `.env.test` with `override: true` here, before any src/
 * module is imported, is what makes the test URL win.
 *
 * THE GUARD
 * ---------
 * `assertTestDatabase()` throws unless the resolved database name is exactly
 * `cacttus_test`. Every destructive helper in the suite (TRUNCATE, migrate deploy)
 * calls it again immediately before doing anything, so a misconfiguration cannot
 * reach the dev database `cacttus`.
 */
import path from 'node:path';
import dotenv from 'dotenv';

/** The ONLY database this suite is ever allowed to touch. */
export const REQUIRED_TEST_DATABASE = 'cacttus_test';

export const BACKEND_ROOT = path.resolve(__dirname, '..');
export const PROJECT_ROOT = path.resolve(BACKEND_ROOT, '..');

let loaded = false;

/** Load `.env.test` over anything already in the environment. Idempotent. */
export function loadTestEnv(): void {
  if (loaded) {
    return;
  }

  const result = dotenv.config({
    path: path.join(BACKEND_ROOT, '.env.test'),
    override: true,
  });

  if (result.error) {
    throw new Error(
      `Could not read backend/.env.test — the test suite refuses to run without it. ` +
        `Reason: ${result.error.message}`,
    );
  }

  loaded = true;
}

/** Extract the database name from a Postgres connection URL. */
export function databaseNameOf(url: string): string {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch (error) {
    throw new Error(
      `DATABASE_URL is not a parseable URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
}

/**
 * HARD GUARD. Throws unless every configured connection URL points at
 * `cacttus_test`. Called by the setup files and again by every helper that
 * issues a destructive statement.
 */
export function assertTestDatabase(): void {
  loadTestEnv();

  const urls: readonly [string, string | undefined][] = [
    ['DATABASE_URL', process.env.DATABASE_URL],
    ['DIRECT_DATABASE_URL', process.env.DIRECT_DATABASE_URL],
  ];

  for (const [key, url] of urls) {
    if (!url) {
      if (key === 'DIRECT_DATABASE_URL') {
        continue;
      }
      throw new Error(`${key} is not set — refusing to run the test suite.`);
    }

    const name = databaseNameOf(url);

    if (name !== REQUIRED_TEST_DATABASE) {
      throw new Error(
        `REFUSING TO RUN: ${key} points at database "${name}", not "${REQUIRED_TEST_DATABASE}". ` +
          'The test suite truncates every table it can reach; running it against ' +
          'anything but the dedicated test database would destroy real data.',
      );
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `REFUSING TO RUN: NODE_ENV is "${process.env.NODE_ENV}", expected "test".`,
    );
  }
}

/** The verified test connection URL. Never returns a non-test URL. */
export function testDatabaseUrl(): string {
  assertTestDatabase();
  return process.env.DATABASE_URL as string;
}

loadTestEnv();
