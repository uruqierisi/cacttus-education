/**
 * Audit trail reads.
 *
 * READ-ONLY BY CONSTRUCTION. This service exposes `findMany` / `count` and nothing
 * else. `AuditLog` is append-only: it is written solely by `src/lib/audit.ts`, as part
 * of the transaction of the action it records.
 */
import { AuditAction, Prisma, type AuditLog, type Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { buildPaginationMeta, type PaginationMeta } from '../lib/api-response';
import { toPrismaPageArgs, type PageParams } from '../lib/pagination';
import { AUDIT_PAGINATION } from '../config/constants';
import type { ListAuditLogsQuery } from '../schemas/audit.schema';

export type AuditLogDto = {
  readonly id: string;
  /** Null once the account has been deleted — the row deliberately outlives it. */
  readonly actorId: string | null;
  readonly actorEmail: string;
  readonly actorRole: Role;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly ip: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;
};

function toDto(row: AuditLog): AuditLogDto {
  return {
    id: row.id,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    actorRole: row.actorRole,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata:
      row.metadata === null || row.metadata === undefined
        ? null
        : (row.metadata as unknown as Record<string, unknown>),
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };
}

/**
 * Clamp to the AUDIT limits, not the shared ones.
 *
 * `resolvePageParams` in `lib/pagination` is bound to `PAGINATION.MAX_PAGE_SIZE` (100)
 * and is used by every other list endpoint, so it is left untouched; only the page
 * maths (`toPrismaPageArgs`) is shared. Zod has already rejected anything above the
 * max, so this is belt-and-braces for non-HTTP callers.
 */
function resolveAuditPageParams(page: number, pageSize: number): PageParams {
  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : AUDIT_PAGINATION.DEFAULT_PAGE,
    pageSize: Math.min(
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.floor(pageSize)
        : AUDIT_PAGINATION.DEFAULT_PAGE_SIZE,
      AUDIT_PAGINATION.MAX_PAGE_SIZE,
    ),
  };
}

/**
 * INDEX NOTES — the filters are shaped to land on the indexes declared in
 * schema.prisma, never on a sequential scan of a table that only ever grows:
 *
 *   no filter / date range   -> `@@index([createdAt])`         + ORDER BY createdAt DESC
 *   actorId (+ date range)   -> `@@index([actorId, createdAt])` — equality on the
 *                               leading column, range + sort on the trailing one, which
 *                               is the shape a composite B-tree serves end to end.
 *   entityType + entityId    -> `@@index([entityType, entityId])` — the per-row timeline.
 *   action (+ date range)    -> `@@index([action, createdAt])`  — e.g. "all failed logins".
 *
 * `search` is restricted to `actorEmail` on purpose. A multi-column OR (or an ILIKE
 * over `metadata`) cannot use any of those indexes and would degrade into a full scan
 * of the largest table in the schema; filtering by actor is the question the search box
 * is actually for.
 */
function buildWhere(query: ListAuditLogsQuery): Prisma.AuditLogWhereInput {
  const createdAt: Prisma.DateTimeFilter = {
    ...(query.from ? { gte: query.from } : {}),
    ...(query.to ? { lte: query.to } : {}),
  };

  return {
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(query.from || query.to ? { createdAt } : {}),
    ...(query.search
      ? { actorEmail: { contains: query.search, mode: Prisma.QueryMode.insensitive } }
      : {}),
  };
}

export async function listAuditLogs(
  query: ListAuditLogsQuery,
): Promise<{ items: readonly AuditLogDto[]; meta: PaginationMeta }> {
  const page = resolveAuditPageParams(query.page, query.pageSize);
  const where = buildWhere(query);

  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      // Newest first, always. The trail is read as a timeline; there is no sort
      // parameter because no other order is a useful view of an append-only log.
      orderBy: { createdAt: 'desc' },
      ...toPrismaPageArgs(page),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: rows.map(toDto),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

/**
 * The `AuditAction` vocabulary, for the dashboard's filter dropdown. Served from the
 * Prisma-generated enum so the UI can never drift from the database.
 */
export function listAuditActions(): readonly AuditAction[] {
  return Object.values(AuditAction);
}
