/**
 * Database seed — two users (one ADMIN, one EDITOR), then the three canonical
 * marketing forms.
 *
 * The forms are NOT defined here. They live in `src/lib/canonical-forms.ts` because the
 * running server needs them too, and `tsc` only emits `src/**` into `dist/` — a copy in
 * this directory is invisible to the compiled container. The seed just calls the same
 * function the server calls at boot.
 *
 * Passwords are read from the environment and bcrypt-hashed before insert; no
 * plaintext credential is ever written to a file in this repository. The defaults
 * below are deliberately non-secret placeholders so a fresh clone can boot, and the
 * script refuses to run them against a non-development NODE_ENV.
 *
 * Run with:  npm run db:seed
 */
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
/*
 * From src/, deliberately. The seed runs through tsx so it could have kept its own
 * copy, but a second copy is how the two drift — and the RUNTIME needs this module
 * compiled into dist/, which is only true for files under src/.
 */
import { CANONICAL_FORMS, upsertCanonicalForms } from '../src/lib/canonical-forms';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;

/** Placeholder passwords. Safe to publish precisely because they are rejected outside dev. */
const PLACEHOLDER_ADMIN_PASSWORD = 'ChangeMe_Admin_123!';
const PLACEHOLDER_EDITOR_PASSWORD = 'ChangeMe_Editor_123!';

type SeedUser = {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly role: Role;
};

function readEnv(key: string, fallback: string): string {
  const raw = process.env[key];
  return raw === undefined || raw.trim() === '' ? fallback : raw.trim();
}

function readBcryptRounds(): number {
  const parsed = Number.parseInt(readEnv('BCRYPT_ROUNDS', String(DEFAULT_BCRYPT_ROUNDS)), 10);
  if (Number.isNaN(parsed) || parsed < 10 || parsed > 15) {
    throw new Error('BCRYPT_ROUNDS must be an integer between 10 and 15.');
  }
  return parsed;
}

function assertSafePassword(user: SeedUser, isProductionLike: boolean): void {
  if (user.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Seed password for ${user.email} is shorter than ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const isPlaceholder =
    user.password === PLACEHOLDER_ADMIN_PASSWORD || user.password === PLACEHOLDER_EDITOR_PASSWORD;

  if (isPlaceholder && isProductionLike) {
    throw new Error(
      `Refusing to seed ${user.email} with the placeholder password while NODE_ENV is not "development". ` +
        'Set SEED_ADMIN_PASSWORD / SEED_EDITOR_PASSWORD to real values first.',
    );
  }
}

function buildSeedUsers(): readonly SeedUser[] {
  return [
    {
      email: readEnv('SEED_ADMIN_EMAIL', 'admin@cacttus.education').toLowerCase(),
      name: readEnv('SEED_ADMIN_NAME', 'Cacttus Admin'),
      password: readEnv('SEED_ADMIN_PASSWORD', PLACEHOLDER_ADMIN_PASSWORD),
      role: Role.ADMIN,
    },
    {
      email: readEnv('SEED_EDITOR_EMAIL', 'editor@cacttus.education').toLowerCase(),
      name: readEnv('SEED_EDITOR_NAME', 'Cacttus Editor'),
      password: readEnv('SEED_EDITOR_PASSWORD', PLACEHOLDER_EDITOR_PASSWORD),
      role: Role.EDITOR,
    },
  ];
}

async function upsertUser(user: SeedUser, rounds: number): Promise<void> {
  const passwordHash = await bcrypt.hash(user.password, rounds);

  await prisma.user.upsert({
    where: { email: user.email },
    // Re-running the seed refreshes the password hash so a rotated env var takes effect.
    // `passwordChangedAt` must move with it, otherwise sessions minted under the OLD
    // password would survive the rotation. `isActive` is forced back on so a re-seed
    // is a reliable way to recover a locked-out admin.
    update: {
      name: user.name,
      role: user.role,
      passwordHash,
      passwordChangedAt: new Date(),
      isActive: true,
    },
    create: { email: user.email, name: user.name, role: user.role, passwordHash },
  });

  console.log(`  seeded ${user.role.padEnd(6)} ${user.email}`);
}

async function main(): Promise<void> {
  const isProductionLike = readEnv('NODE_ENV', 'development') !== 'development';
  const rounds = readBcryptRounds();
  const users = buildSeedUsers();

  console.log(`Seeding ${users.length} users (bcrypt rounds: ${rounds})...`);

  for (const user of users) {
    assertSafePassword(user, isProductionLike);
  }

  for (const user of users) {
    await upsertUser(user, rounds);
  }

  console.log(`Ensuring ${CANONICAL_FORMS.length} canonical marketing forms...`);
  await upsertCanonicalForms();

  console.log('Seed complete.');
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Seed failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
