/**
 * Database helpers and fixture factories.
 *
 * Every destructive statement re-asserts the isolation guard immediately before it
 * runs, so even a helper called from a stray script cannot reach the dev database.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuditAction, FormType, Prisma, Role, SubmissionStatus } from '@prisma/client';
import type { AuditLog, Form, Submission, User } from '@prisma/client';
import { assertTestDatabase } from '../env-guard';
import { prisma } from '../../src/lib/prisma';
import { signAccessToken } from '../../src/lib/jwt';
import { env } from '../../src/config/env';
import { JWT_AUDIENCE, JWT_ISSUER, TOKEN_TYPE } from '../../src/config/constants';

/** Every table, child-first. One statement, so CASCADE never surprises us. */
const ALL_TABLES = ['audit_logs', 'submissions', 'posts', 'forms', 'users'] as const;

export const TEST_PASSWORD = 'CorrectHorse-9-Battery';
export const WRONG_PASSWORD = 'ThisIsNotTheSecret-42';

let cachedHash: string | null = null;

/** bcrypt is the single slowest thing in the suite; hash the shared password once. */
export async function testPasswordHash(): Promise<string> {
  if (cachedHash === null) {
    cachedHash = await bcrypt.hash(TEST_PASSWORD, 10);
  }
  return cachedHash;
}

export async function truncateAll(): Promise<void> {
  assertTestDatabase();

  const list = ALL_TABLES.map((table) => `"${table}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

// --- Users ----------------------------------------------------------------

export type CreateUserOptions = {
  readonly email?: string;
  readonly name?: string;
  readonly role?: Role;
  readonly isActive?: boolean;
  readonly passwordHash?: string;
  readonly passwordChangedAt?: Date;
};

/**
 * `passwordChangedAt` is backdated by default so a token signed immediately after
 * creation can never be judged stale by `isTokenStale` on a second boundary.
 */
export async function createUser(options: CreateUserOptions = {}): Promise<User> {
  const hash = options.passwordHash ?? (await testPasswordHash());

  return prisma.user.create({
    data: {
      email: options.email ?? `user-${Math.random().toString(36).slice(2, 10)}@cacttus.test`,
      name: options.name ?? 'Test User',
      role: options.role ?? Role.EDITOR,
      isActive: options.isActive ?? true,
      passwordHash: hash,
      passwordChangedAt: options.passwordChangedAt ?? new Date(Date.now() - 60_000),
    },
  });
}

export function accessTokenFor(user: Pick<User, 'id' | 'email' | 'role'>): string {
  return signAccessToken({ sub: user.id, email: user.email, role: user.role });
}

/**
 * A valid, unexpired access token with an explicitly BACKDATED `iat`.
 *
 * `isTokenStale` compares whole seconds, so a token minted in the same second as a
 * password change is legitimately not stale. Tests that need to prove session eviction
 * must therefore pin the issue time rather than race the clock.
 */
export function accessTokenIssuedSecondsAgo(
  user: Pick<User, 'id' | 'email' | 'role'>,
  secondsAgo: number,
): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      typ: TOKEN_TYPE.ACCESS,
      iat: Math.floor(Date.now() / 1000) - secondsAgo,
    },
    env.JWT_ACCESS_SECRET,
    { issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '15m' },
  );
}

export type Actors = {
  readonly admin: User;
  readonly editor: User;
  readonly adminToken: string;
  readonly editorToken: string;
};

/** One ADMIN + one EDITOR, with ready-to-use bearer tokens. */
export async function createActors(): Promise<Actors> {
  const admin = await createUser({
    email: 'admin@cacttus.test',
    name: 'Test Admin',
    role: Role.ADMIN,
  });
  const editor = await createUser({
    email: 'editor@cacttus.test',
    name: 'Test Editor',
    role: Role.EDITOR,
  });

  return {
    admin,
    editor,
    adminToken: accessTokenFor(admin),
    editorToken: accessTokenFor(editor),
  };
}

// --- Forms ----------------------------------------------------------------

export type TestFieldDefinition = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options: { value: string; label: string }[];
};

/** A realistic Albanian school form: one of every interesting field type. */
export const SCHOOL_FIELDS: TestFieldDefinition[] = [
  {
    name: 'school_name',
    label: 'Emri i shkollës',
    type: 'text',
    required: true,
    order: 1,
    options: [],
  },
  {
    name: 'city',
    label: 'Qyteti',
    type: 'select',
    required: false,
    order: 2,
    options: [
      { value: 'prishtine', label: 'Prishtinë' },
      { value: 'peje', label: 'Pejë' },
    ],
  },
  {
    name: 'interests',
    label: 'Interesat',
    type: 'multiselect',
    required: false,
    order: 3,
    options: [
      { value: 'ai', label: 'AI' },
      { value: 'cyber', label: 'Cyber' },
    ],
  },
  {
    name: 'consent',
    label: 'Pëlqimi',
    type: 'checkbox',
    required: false,
    order: 4,
    options: [],
  },
];

export type CreateFormOptions = {
  readonly slug?: string;
  readonly title?: string;
  readonly type?: FormType;
  readonly fields?: TestFieldDefinition[];
  readonly isActive?: boolean;
  readonly deletedAt?: Date | null;
};

export async function createForm(options: CreateFormOptions = {}): Promise<Form> {
  const suffix = Math.random().toString(36).slice(2, 8);

  return prisma.form.create({
    data: {
      slug: options.slug ?? `form-${suffix}`,
      title: options.title ?? 'Test Form',
      type: options.type ?? FormType.SCHOOL,
      fields: (options.fields ?? SCHOOL_FIELDS) as unknown as Prisma.InputJsonValue,
      isActive: options.isActive ?? true,
      deletedAt: options.deletedAt ?? null,
    },
  });
}

// --- Submissions ----------------------------------------------------------

export type CreateSubmissionOptions = {
  readonly formId: string;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly data?: Record<string, unknown>;
  readonly status?: SubmissionStatus;
  readonly createdAt?: Date;
};

export async function createSubmission(
  options: CreateSubmissionOptions,
): Promise<Submission> {
  return prisma.submission.create({
    data: {
      formId: options.formId,
      name: options.name ?? 'Arta Krasniqi',
      email: options.email ?? `lead-${Math.random().toString(36).slice(2, 8)}@example.com`,
      phone: options.phone ?? '+38344123456',
      data: (options.data ?? { school_name: 'Gjimnazi Sami Frashëri' }) as Prisma.InputJsonValue,
      ...(options.status === undefined ? {} : { status: options.status }),
      ...(options.createdAt === undefined ? {} : { createdAt: options.createdAt }),
    },
  });
}

// --- Audit ----------------------------------------------------------------

export async function auditRows(action?: AuditAction): Promise<AuditLog[]> {
  return prisma.auditLog.findMany({
    ...(action === undefined ? {} : { where: { action } }),
    orderBy: { createdAt: 'asc' },
  });
}

export async function latestAudit(action: AuditAction): Promise<AuditLog | null> {
  return prisma.auditLog.findFirst({ where: { action }, orderBy: { createdAt: 'desc' } });
}
