/**
 * Database seed — two users (one ADMIN, one EDITOR) and the three canonical
 * marketing forms.
 *
 * Passwords are read from the environment and bcrypt-hashed before insert; no
 * plaintext credential is ever written to a file in this repository. The defaults
 * below are deliberately non-secret placeholders so a fresh clone can boot, and the
 * script refuses to run them against a non-development NODE_ENV.
 *
 * Run with:  npm run db:seed
 */
import 'dotenv/config';
import { FormType, PrismaClient, Role } from '@prisma/client';
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

/* ── Canonical marketing forms ────────────────────────────────────────────────
 *
 * Three forms whose SLUGS AND FIELD KEYS ARE COMPILED INTO THE MARKETING SITE. The page
 * UIs are hand-built React, not rendered from the form definition, so these records are
 * the server-side half of a contract the client already assumes: without them
 * /kontakti, /biznese/trajnime, /biznese/talente and /biznese/klasa all 404 the moment
 * a visitor presses submit. Slugs and values are mirrored in
 * `cacttus-edu-front/src/marketing/lib/forms.config.ts`.
 *
 * NOT the application forms. `aplikim-zhvam` and `aplikim-siguria-kibernetike` are
 * editorial content staff own — the band reads whatever fields they declare — so
 * creating them here would fight the dashboard rather than support it.
 *
 * EXISTENCE ONLY. If a slug is already present the record is left completely alone: no
 * field sync, no `isActive` flip, no `updatedAt` bump. Staff customise these — adding a
 * question to `kontakt-biznesi` is a supported thing to do — and a seed that "restored"
 * the canonical shape on every deploy would silently undo their work. That is also why
 * this reads and creates rather than calling `upsert` with an empty update: Prisma
 * stamps `@updatedAt` on any update it issues, so even a no-op upsert would rewrite the
 * row and make an untouched form look edited.
 */
type SeedField = {
  readonly name: string;
  readonly label: string;
  readonly type: string;
  readonly required: boolean;
  readonly placeholder: string;
  readonly helpText: string;
  readonly order: number;
  readonly options: readonly { readonly value: string; readonly label: string }[];
};

type SeedForm = {
  readonly slug: string;
  readonly title: string;
  readonly type: FormType;
  readonly isActive: boolean;
  readonly fields: readonly SeedField[];
};

/**
 * Shape a field the way the dashboard's form editor emits one, so a seeded form opens in
 * that editor with nothing missing. `createEmptyField` there sets `placeholder` and
 * `helpText` to empty strings and `order` to the array index — both reproduced here, and
 * `order` is 0-based for the same reason: the editor re-stamps it from array position
 * whenever a field is moved or deleted.
 */
function seedField(
  order: number,
  name: string,
  label: string,
  type: string,
  required: boolean,
  options: readonly string[] = [],
): SeedField {
  return {
    name,
    label,
    type,
    required,
    placeholder: '',
    helpText: '',
    order,
    // The marketing pages send the VALUE, and for these three the value is the label —
    // `BUSINESS_REQUEST_TYPES` and `CLASS_BOOKING_ROOMS` are literal display strings, so
    // splitting them would mean two things to keep in step instead of one.
    options: options.map((option) => ({ value: option, label: option })),
  };
}

const CANONICAL_FORMS: readonly SeedForm[] = [
  {
    slug: 'kontakt',
    title: 'Kontakt',
    type: FormType.SCHOOL,
    isActive: true,
    fields: [
      seedField(0, 'subjekti', 'Subjekti', 'text', true),
      seedField(1, 'mesazhi', 'Mesazhi', 'textarea', true),
    ],
  },
  {
    slug: 'kontakt-biznesi',
    title: 'Kontakt biznesi',
    type: FormType.SCHOOL,
    isActive: true,
    fields: [
      // One form serves every /biznese lead box; `tipi_kerkeses` is what tells them apart
      // in the inbox. Its options must equal `BUSINESS_REQUEST_TYPES` exactly — the pages
      // send those strings and the server validates a select answer against the option
      // values character for character.
      seedField(0, 'tipi_kerkeses', 'Tipi i kërkesës', 'select', true, [
        'Trajnime të personalizuara',
        'Partneritet / Punëdhënës',
        'Rezervim klase',
      ]),
      // OPTIONAL, and that is the point: no single page sends both. /biznese/trajnime
      // sends `kompania`, /biznese/talente sends `kompania` and `fusha_interesit`. A key
      // the form does not DECLARE is dropped server-side, so an undeclared answer would
      // vanish silently rather than fail loudly — declaring them optional is what keeps
      // each page's data.
      seedField(1, 'kompania', 'Kompania', 'text', false),
      seedField(2, 'fusha_interesit', 'Fusha e interesit', 'text', false),
    ],
  },
  {
    slug: 'rezervo-klase',
    title: 'Rezervo klasë',
    type: FormType.SCHOOL,
    isActive: true,
    fields: [
      // Must equal `CLASS_BOOKING_ROOMS` byte for byte, diacritics included: the room
      // card's button sends the string straight through as the select answer.
      seedField(0, 'klasa', 'Klasa', 'select', true, [
        'Klasa Portokalli',
        'Klasa Rozë',
        'Klasa e verdhë',
        'Klasa e gjelbër',
        'Klasa e kuqe',
        'Hapsira e përbashkët',
      ]),
      seedField(1, 'data_deshiruar', 'Data e dëshiruar', 'text', true),
      seedField(2, 'nr_personave', 'Numri i personave', 'text', true),
      seedField(3, 'shenime', 'Shënime', 'textarea', false),
    ],
  },
];

async function seedCanonicalForm(form: SeedForm): Promise<void> {
  const existing = await prisma.form.findUnique({
    where: { slug: form.slug },
    select: { id: true, isActive: true, deletedAt: true },
  });

  if (existing) {
    console.log(`  ${form.slug.padEnd(16)} exists, skipped`);

    /*
     * Not a modification — a warning. The seed guarantees the ROW exists; it does not
     * guarantee the form is REACHABLE, and the public endpoint serves neither a
     * soft-deleted nor an inactive form. Staying silent here would hide exactly the
     * outage this section exists to prevent.
     */
    if (existing.deletedAt !== null) {
      console.warn(`  ${' '.repeat(16)} ^ WARNING: soft-deleted — the public endpoint will 404 it`);
    } else if (!existing.isActive) {
      console.warn(`  ${' '.repeat(16)} ^ WARNING: inactive — the public endpoint will 404 it`);
    }
    return;
  }

  await prisma.form.create({
    data: {
      slug: form.slug,
      title: form.title,
      type: form.type,
      isActive: form.isActive,
      fields: form.fields as unknown as object[],
    },
  });

  console.log(`  ${form.slug.padEnd(16)} created`);
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

  console.log(`Seeding ${CANONICAL_FORMS.length} canonical marketing forms...`);

  for (const form of CANONICAL_FORMS) {
    await seedCanonicalForm(form);
  }

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
