/**
 * User management (ADMIN only).
 *
 * LOCKOUT SAFETY
 * --------------
 * Every mutation funnels through two guards before it touches the database:
 *
 *   `assertNotSelf`          — you cannot demote, deactivate or delete yourself.
 *   `assertNotLastActiveAdmin` — the system must always retain at least one ADMIN
 *                                who can still log in.
 *
 * Together they make it impossible to reach a state where nobody can administer the
 * system. Without them a single mis-click ends with a database-level fix.
 *
 * DELETION
 * --------
 * Hard delete is allowed only for a user who has authored nothing. `Post.authorId`
 * is `onDelete: Restrict`, so deleting an author would either fail at the database or
 * (with cascade) silently destroy published articles. Anyone with posts must be
 * deactivated instead — the byline survives, the login does not.
 */
import { AuditAction, Prisma, Role, type User } from '@prisma/client';
import { prisma, isUniqueViolation } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../lib/api-response';
import { resolvePageParams, toPrismaPageArgs } from '../lib/pagination';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { hashPassword } from '../lib/password';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from '../schemas/user.schema';

export type UserDto = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
  readonly isActive: boolean;
  /** Surfaced so the dashboard can explain up front why delete is unavailable. */
  readonly postCount: number;
  readonly passwordChangedAt: Date;
  readonly createdAt: Date;
};

export type UserListResult = {
  readonly users: readonly UserDto[];
  readonly meta: PaginationMeta;
};

type UserWithCount = User & { _count?: { posts: number } };

const withPostCount = { _count: { select: { posts: true } } } as const;

function toDto(user: UserWithCount): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    postCount: user._count?.posts ?? 0,
    passwordChangedAt: user.passwordChangedAt,
    createdAt: user.createdAt,
  };
}

function buildOrderBy(
  sort: ListUsersQuery['sort'],
  order: ListUsersQuery['order'],
): Prisma.UserOrderByWithRelationInput {
  switch (sort) {
    case 'name':
      return { name: order };
    case 'email':
      return { email: order };
    case 'createdAt':
    default:
      return { createdAt: order };
  }
}

function buildListWhere(query: ListUsersQuery): Prisma.UserWhereInput {
  return {
    ...(query.role ? { role: query.role } : {}),
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };
}

// --- Guards ---------------------------------------------------------------

function assertNotSelf(actorId: string, targetId: string, action: string): void {
  if (actorId === targetId) {
    throw ApiError.conflict(
      `You cannot ${action} your own account. Ask another administrator to do it.`,
    );
  }
}

/**
 * Refuse any change that would leave zero admins able to sign in. Counts only OTHER
 * users, so the target's own current state never props up the check.
 */
async function assertNotLastActiveAdmin(target: User, action: string): Promise<void> {
  if (target.role !== Role.ADMIN || !target.isActive) {
    return;
  }

  const others = await prisma.user.count({
    where: { role: Role.ADMIN, isActive: true, id: { not: target.id } },
  });

  if (others === 0) {
    throw ApiError.conflict(
      `Cannot ${action} the last active administrator. Promote another user to ADMIN first.`,
    );
  }
}

async function findUserOrThrow(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  return user;
}

// --- Reads ----------------------------------------------------------------

export async function listUsers(query: ListUsersQuery): Promise<UserListResult> {
  const page = resolvePageParams(query.page, query.pageSize);
  const where = buildListWhere(query);

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: buildOrderBy(query.sort, query.order),
      include: withPostCount,
      ...toPrismaPageArgs(page),
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: rows.map(toDto),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

export async function getUserById(id: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id }, include: withPostCount });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  return toDto(user);
}

// --- Mutations ------------------------------------------------------------

export async function createUser(input: CreateUserInput, audit: AuditContext): Promise<UserDto> {
  const passwordHash = await hashPassword(input.password);

  try {
    // Minting a staff account is the single highest-privilege action in the API, so
    // the row and its audit entry share one interactive transaction.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          passwordHash,
        },
        include: withPostCount,
      });

      await recordAuditWithin(tx, {
        ...audit,
        action: AuditAction.USER_CREATED,
        entityType: 'User',
        entityId: created.id,
        // `input.password` and `passwordHash` are in scope here and are deliberately
        // NOT referenced. The helper would redact them anyway; this never relies on it.
        metadata: { targetEmail: created.email, role: created.role },
      });

      return created;
    });

    return toDto(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw ApiError.conflict('A user with that email already exists.', [
        { field: 'body.email', message: 'Email is already taken.' },
      ]);
    }
    throw error;
  }
}

export async function updateUser(
  actorId: string,
  id: string,
  input: UpdateUserInput,
  audit: AuditContext,
): Promise<UserDto> {
  const target = await findUserOrThrow(id);

  const isDemotion = input.role !== undefined && input.role !== Role.ADMIN;
  const isDeactivation = input.isActive === false;

  if (isDemotion) {
    assertNotSelf(actorId, id, 'change the role of');
    await assertNotLastActiveAdmin(target, 'demote');
  }

  if (isDeactivation) {
    assertNotSelf(actorId, id, 'deactivate');
    await assertNotLastActiveAdmin(target, 'deactivate');
  }

  // Deactivation is the closest thing to revoking someone's access, so it gets its own
  // action rather than hiding inside a generic USER_UPDATED. Re-activation and every
  // other field change stay USER_UPDATED.
  const action = isDeactivation ? AuditAction.USER_DEACTIVATED : AuditAction.USER_UPDATED;

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.role === undefined ? {} : { role: input.role }),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      },
      include: withPostCount,
    });

    await recordAuditWithin(tx, {
      ...audit,
      action,
      entityType: 'User',
      entityId: updated.id,
      metadata: {
        targetEmail: updated.email,
        ...(input.name === undefined ? {} : { nameChanged: true }),
        ...(input.role === undefined ? {} : { fromRole: target.role, role: updated.role }),
        ...(input.isActive === undefined ? {} : { isActive: updated.isActive }),
      },
    });

    return updated;
  });

  return toDto(user);
}

/**
 * Admin-initiated password reset. Bumping `passwordChangedAt` is the whole point:
 * it evicts every existing session for that user on their next request, which is
 * what makes this usable as a response to a compromised account.
 */
export async function resetUserPassword(
  id: string,
  newPassword: string,
  audit: AuditContext,
): Promise<void> {
  const target = await findUserOrThrow(id);

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    // PASSWORD_RESET is written INSIDE the transaction, not best-effort like the
    // `/api/auth/*` session events. It is an admin acting on somebody else's
    // credentials — a staff mutation with a domain write to join — and it silently
    // evicts every one of that user's live sessions. That must not be able to happen
    // without a record. (The best-effort mode is for events that have no domain write
    // at all, such as a failed login.)
    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.PASSWORD_RESET,
      entityType: 'User',
      entityId: target.id,
      // `newPassword` and `passwordHash` are in scope and deliberately not referenced.
      metadata: { targetEmail: target.email, sessionsRevoked: true },
    });
  });
}

export async function deleteUser(actorId: string, id: string, audit: AuditContext): Promise<void> {
  assertNotSelf(actorId, id, 'delete');

  const target = await findUserOrThrow(id);
  await assertNotLastActiveAdmin(target, 'delete');

  // Checked explicitly rather than letting the FK constraint fire, so the caller gets
  // an actionable message instead of a raw Prisma error code.
  const postCount = await prisma.post.count({ where: { authorId: id } });

  if (postCount > 0) {
    throw ApiError.conflict(
      `This user has authored ${postCount} post(s) and cannot be deleted. ` +
        'Deactivate the account instead — the posts keep their byline.',
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id } });

    // Written AFTER the delete, inside the same transaction. `AuditLog.actorId` is
    // `onDelete: SetNull`, so the deleted user's OWN historical rows survive with a
    // null actorId; this row describes the admin who performed the deletion and keeps
    // the victim's identity in `metadata.targetEmail`, where no FK can erase it.
    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.USER_DELETED,
      entityType: 'User',
      entityId: target.id,
      metadata: { targetEmail: target.email, targetRole: target.role },
    });
  });
}
