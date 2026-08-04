/**
 * Vitest globalSetup — runs ONCE, in the main process, before any worker starts.
 *
 * 1. Creates the `cacttus_test` database on the SAME container as the dev DB
 *    (idempotent: "already exists" is tolerated).
 * 2. Provisions the schema with `prisma migrate deploy` against the TEST url.
 *
 * It never touches `cacttus`: every step runs behind `assertTestDatabase()`.
 */
import { execFileSync, execSync } from 'node:child_process';
import {
  BACKEND_ROOT,
  PROJECT_ROOT,
  REQUIRED_TEST_DATABASE,
  assertTestDatabase,
  testDatabaseUrl,
} from './env-guard';

const ALREADY_EXISTS = /already exists/i;

function createTestDatabase(): void {
  assertTestDatabase();

  try {
    execFileSync(
      'docker',
      [
        'compose',
        'exec',
        '-T',
        'db',
        'psql',
        '-U',
        'cacttus',
        '-d',
        'postgres',
        '-c',
        `CREATE DATABASE ${REQUIRED_TEST_DATABASE};`,
      ],
      { cwd: PROJECT_ROOT, stdio: 'pipe' },
    );
    process.stdout.write(`[test-db] created database ${REQUIRED_TEST_DATABASE}\n`);
  } catch (error) {
    const output = [
      (error as { stdout?: Buffer }).stdout?.toString() ?? '',
      (error as { stderr?: Buffer }).stderr?.toString() ?? '',
      error instanceof Error ? error.message : String(error),
    ].join('\n');

    if (ALREADY_EXISTS.test(output)) {
      process.stdout.write(`[test-db] database ${REQUIRED_TEST_DATABASE} already exists\n`);
      return;
    }

    throw new Error(
      `Could not create the test database. Is the \`cacttus-db\` container up?\n${output}`,
    );
  }
}

function migrateTestDatabase(): void {
  const url = testDatabaseUrl();

  execSync('npx prisma migrate deploy', {
    cwd: BACKEND_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: url,
      DIRECT_DATABASE_URL: url,
    },
  });
}

export async function setup(): Promise<void> {
  assertTestDatabase();
  createTestDatabase();
  migrateTestDatabase();
}

export async function teardown(): Promise<void> {
  // The container is deliberately left running, and the test database is left in
  // place so a failed run can be inspected. Nothing to do.
}
