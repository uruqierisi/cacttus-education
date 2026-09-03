/**
 * Audit trail helper.
 *
 * WHAT IS AUDITED
 * ---------------
 * STAFF actions only. Every mutation performed by a signed-in dashboard user leaves a
 * row here, plus the four session events (login success / login failure / logout /
 * password change) that explain *how* a session came to exist.
 *
 * PUBLIC FORM SUBMISSIONS ARE DELIBERATELY **NOT** AUDITED. A visitor filling in a
 * public form is not a staff action: the `Submission` row IS the record of what
 * happened, it is immutable in the admin API (no create, no delete — see
 * `routes/admin/submissions.routes.ts`), and it already carries `createdAt` plus the
 * full payload. Writing a second, near-identical row per submission would double the
 * write cost of the busiest endpoint on the API, dilute the trail an administrator
 * actually reads, and — because the submitter is anonymous — force a fake actor
 * identity into a table whose entire value is that its actor column is trustworthy.
 * Only the STAFF act of triaging a submission (`SUBMISSION_STATUS_CHANGED`) is logged.
 *
 * APPEND-ONLY
 * -----------
 * `create` is the ONLY Prisma verb this module (or any other) ever issues against
 * `AuditLog`. There is no update path, no delete path, and no soft-delete flag. If a
 * future feature appears to need one, the answer is a new row, not an edited one.
 *
 * IDENTITY IS SNAPSHOTTED, NEVER JOINED
 * -------------------------------------
 * `actorEmail` / `actorRole` are copied in at write time. Resolving them later through
 * the `actor` relation would (a) break the moment the user row is deleted — the FK is
 * `onDelete: SetNull` precisely so the log outlives the account — and (b) report who
 * the actor is *now* rather than who they *were*, which is exactly the question an
 * audit trail exists to answer. A demoted admin's past admin actions must keep reading
 * as admin actions.
 *
 * TWO WRITE MODES
 * ---------------
 * `recordAuditWithin(tx, entry)` — transaction-aware. Used by every staff mutation, so
 *   the domain write and its log row commit or roll back together. A failure here
 *   deliberately aborts the whole operation: an unlogged mutation is worse than a
 *   failed one.
 * `recordAudit(entry)` — best-effort. Used by the auth events, which have no domain
 *   transaction to join (a failed login writes nothing else at all). A failure is
 *   logged via the structured logger and swallowed, because a broken audit table must
 *   never turn a valid login into a 500. It is never swallowed *silently*.
 */
import type { Request } from 'express';
import { Prisma, Role, type AuditAction } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';
import { ApiError } from './api-error';
import { REDACTED_PLACEHOLDER, isDeniedKey, looksLikeSecretValue } from './redact';

/** The `AuditLog.entityType` vocabulary. Mirrors the doc comment in schema.prisma. */
export const AUDIT_ENTITY_TYPES = [
  'Form',
  'Submission',
  'User',
  'Post',
  'Auth',
  'Training',
  'TrainingCategory',
] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

/**
 * Role recorded for a `LOGIN_FAILED` event when no account matched the attempted
 * email. `AuditLog.actorRole` is NOT NULL, so a value must be chosen.
 *
 * EDITOR is that value: it is the LOWEST privilege the enum offers, and it is also the
 * schema default for `User.role`. A failed login establishes no principal at all, so
 * the column must not imply authority that was never held — writing ADMIN here would
 * make a filtered "admin activity" view show attacks that were never admin attempts.
 * The row is still unambiguous: `actorId` is null and `action` is `LOGIN_FAILED`, so
 * the role field is explicitly *not* a claim about the attempted account. The
 * attempted email is preserved verbatim in `actorEmail`, which is the field that
 * actually matters for spotting credential stuffing.
 */
export const UNKNOWN_ACTOR_ROLE: Role = Role.EDITOR;

/** Who performed the action, snapshotted at write time. */
export type AuditActor = {
  /** Null when no account was established (failed login) or the actor is anonymous. */
  readonly actorId: string | null;
  readonly actorEmail: string;
  readonly actorRole: Role;
};

/** Where the action came from. */
export type AuditOrigin = {
  readonly ip: string | null;
  readonly userAgent: string | null;
};

/**
 * The full context threaded explicitly from controller -> service.
 *
 * This is passed as a normal typed parameter on purpose. No AsyncLocalStorage, no
 * module-level "current request" global: a service must be callable from a script, a
 * job or a test without a request in scope, and an implicit ambient actor is exactly
 * how audit trails end up attributing one user's action to another.
 */
export type AuditContext = AuditActor & AuditOrigin;

export type AuditEntry = AuditContext & {
  readonly action: AuditAction;
  readonly entityType: AuditEntityType;
  /** Null for auth events, which act on a session rather than on a row. */
  readonly entityId?: string | null;
  /** Small, structured context. Sanitised before it is stored — see below. */
  readonly metadata?: Record<string, unknown>;
};

/**
 * Any Prisma client: the singleton, or an interactive-transaction client.
 * `Prisma.TransactionClient` is `PrismaClient` minus the transaction-control methods,
 * so the singleton is assignable to it and one implementation serves both modes.
 */
export type AuditClient = Prisma.TransactionClient;

// --- Metadata safety ------------------------------------------------------

const TRUNCATED_PLACEHOLDER = '[truncated]';

/** Hard caps. Metadata is a hint for a human reading the trail, not a data store. */
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_DEPTH = 2;
const MAX_METADATA_STRING = 200;
const MAX_USER_AGENT = 512;
const MAX_IP = 64;

/**
 * The denylist itself lives in `lib/redact.ts` so that the structured logger enforces
 * the identical list. See that file for the normalisation rules and for why `email` is
 * allowed through while `phone` is not.
 */

function truncate(value: string, max: number = MAX_METADATA_STRING): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

type SanitizedValue = string | number | boolean | null | SanitizedValue[] | SanitizedObject;
type SanitizedObject = { readonly [key: string]: SanitizedValue };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, depth: number): SanitizedValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    // Shape-based catch for a credential that arrived under an innocent key — the one
    // class of leak a key denylist structurally cannot see. See `lib/redact.ts`.
    return looksLikeSecretValue(value) ? REDACTED_PLACEHOLDER : truncate(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return depth >= MAX_METADATA_DEPTH
      ? TRUNCATED_PLACEHOLDER
      : value.slice(0, MAX_METADATA_KEYS).map((entry) => sanitizeValue(entry, depth + 1));
  }
  if (isPlainObject(value)) {
    return depth >= MAX_METADATA_DEPTH ? TRUNCATED_PLACEHOLDER : sanitizeObject(value, depth + 1);
  }
  // bigint / symbol / function: stringified rather than stored raw, so nothing
  // unserialisable can ever reach Postgres.
  return truncate(String(value));
}

function sanitizeObject(input: Record<string, unknown>, depth: number): SanitizedObject {
  return Object.fromEntries(
    Object.entries(input)
      .slice(0, MAX_METADATA_KEYS)
      .map(([key, value]): [string, SanitizedValue] =>
        isDeniedKey(key) ? [key, REDACTED_PLACEHOLDER] : [key, sanitizeValue(value, depth)],
      ),
  );
}

/**
 * Every forbidden key anywhere in the object, for the warning log line.
 *
 * This MUST walk the same shape `sanitizeObject` walks, including through arrays.
 * Previously it bailed on anything that was not a plain object, so a denied key inside
 * an array of objects (`{ rows: [{ password: '…' }] }`) was correctly REDACTED but
 * never WARNED about — and the warning is the whole mechanism by which a careless call
 * site gets discovered and fixed. A silent redaction is a bug that never gets reported.
 */
function collectDeniedKeys(value: unknown, depth: number): readonly string[] {
  // `>` not `>=`: `sanitizeObject` still applies the denylist at depth === MAX_METADATA_DEPTH
  // (it is `sanitizeValue` that truncates BELOW that level), so stopping one level early
  // here would under-report exactly the keys that were in fact redacted.
  if (depth > MAX_METADATA_DEPTH) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_METADATA_KEYS)
      .flatMap((entry) => collectDeniedKeys(entry, depth + 1));
  }

  if (!isPlainObject(value)) {
    return [];
  }

  return Object.entries(value)
    .slice(0, MAX_METADATA_KEYS)
    .flatMap(([key, nested]) => (isDeniedKey(key) ? [key] : collectDeniedKeys(nested, depth + 1)));
}

/**
 * Defence in depth, enforced HERE rather than trusted to every call site.
 *
 * Convention alone ("don't pass a password") fails the first time somebody spreads a
 * whole DTO into metadata. This strips forbidden keys, bounds depth, key count and
 * string length, and loudly warns when it had to redact something — a redaction in the
 * logs is a bug report about the caller.
 */
export function sanitizeAuditMetadata(metadata: unknown): Prisma.InputJsonValue | undefined {
  if (metadata === undefined || metadata === null) {
    return undefined;
  }

  if (!isPlainObject(metadata)) {
    logger.warn('audit metadata must be a plain object; dropping it', {
      receivedType: Array.isArray(metadata) ? 'array' : typeof metadata,
    });
    return undefined;
  }

  const denied = collectDeniedKeys(metadata, 0);

  if (denied.length > 0) {
    logger.warn('audit metadata contained forbidden keys; they were redacted', {
      redactedKeys: denied,
    });
  }

  return sanitizeObject(metadata, 0) as Prisma.InputJsonValue;
}

// --- Request context ------------------------------------------------------

/**
 * Client IP and user agent.
 *
 * TRUST-PROXY STATUS (verified, not aspirational): `src/app.ts` already calls
 * `app.set('trust proxy', env.TRUST_PROXY_HOPS)`, and `.env` / `.env.example` ship
 * `TRUST_PROXY_HOPS=1`. So `req.ip` here is the last entry of `X-Forwarded-For`
 * counted back one hop — correct for the current single-proxy deployment
 * (Railway / Vercel terminate TLS in front of the API).
 *
 * The value is only as trustworthy as that number. `TRUST_PROXY_HOPS` MUST equal the
 * ACTUAL number of reverse proxies in front of the API in each environment:
 *   - too HIGH (e.g. 2 when only 1 proxy exists) — Express walks past the hop the real
 *     proxy appended and reads a segment of `X-Forwarded-For` the CLIENT supplied, so
 *     any caller can forge the IP recorded in this table simply by sending its own
 *     `X-Forwarded-For` header. That poisons the audit trail and also lets an attacker
 *     evade the per-IP rate limiters in `middleware/rate-limit.ts`.
 *   - too LOW (e.g. 0 behind a proxy) — every row records the proxy's own address and
 *     the trail becomes useless for attributing an action to an origin.
 * Re-check this value whenever the deployment topology changes (adding Cloudflare, an
 * ALB, or a second ingress in front of Railway changes the correct count).
 */
export function auditOrigin(req: Request): AuditOrigin {
  const userAgent = req.headers['user-agent'];

  return {
    ip: typeof req.ip === 'string' && req.ip.length > 0 ? truncate(req.ip, MAX_IP) : null,
    userAgent:
      typeof userAgent === 'string' && userAgent.length > 0
        ? truncate(userAgent, MAX_USER_AGENT)
        : null,
  };
}

/** Context for a STAFF action. Requires `requireAuth` to have run on the route. */
export function auditContextFromRequest(req: Request): AuditContext {
  const actor = req.auth;

  if (!actor) {
    // A programming error, not a client error — same contract as `currentUser`.
    throw ApiError.internal('Route is missing the requireAuth middleware.');
  }

  return {
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    ...auditOrigin(req),
  };
}

/**
 * Context for an auth event, where the principal is known from credentials or a token
 * rather than from `requireAuth` (login) — or not known at all (failed login).
 */
export function auditContextForActor(req: Request, actor: AuditActor): AuditContext {
  return { ...actor, ...auditOrigin(req) };
}

/** Actor stand-in for a login attempt that matched no account. */
export function unknownActor(attemptedEmail: string): AuditActor {
  return {
    actorId: null,
    actorEmail: truncate(attemptedEmail, MAX_METADATA_STRING),
    actorRole: UNKNOWN_ACTOR_ROLE,
  };
}

// --- Writes ---------------------------------------------------------------

/**
 * The ONE place an `AuditLog` row is created. `create` is the only verb; there is no
 * update, delete, deleteMany or upsert anywhere in this file by design.
 */
async function insertAuditLog(client: AuditClient, entry: AuditEntry): Promise<void> {
  const metadata = sanitizeAuditMetadata(entry.metadata);

  await client.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      ...(metadata === undefined ? {} : { metadata }),
      ip: entry.ip,
      userAgent: entry.userAgent,
    },
  });
}

/**
 * Transaction-aware write. MUST be called with the `tx` client from an interactive
 * `prisma.$transaction(async (tx) => ...)`, alongside the domain write it describes.
 *
 * It intentionally does NOT catch: a rejection rolls the whole transaction back, so
 * the mutation and its audit row are all-or-nothing. There is no state in which the
 * action happened but the log is missing, or the log exists but the action did not.
 */
export async function recordAuditWithin(tx: AuditClient, entry: AuditEntry): Promise<void> {
  await insertAuditLog(tx, entry);
}

/**
 * Best-effort write for auth events, which have no domain transaction to join.
 *
 * The failure is LOGGED, never silently swallowed — but it is not rethrown, because an
 * audit-table outage must not convert a successful login into a 500 or leave a user
 * unable to sign out. Awaited so the row is durable before the response is sent.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await insertAuditLog(prisma, entry);
  } catch (error) {
    logger.error('audit write failed', {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      actorId: entry.actorId,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}
