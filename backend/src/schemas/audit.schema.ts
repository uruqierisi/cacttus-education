/**
 * Validation for the READ-ONLY audit trail API.
 *
 * There is no create / update / delete schema in this file and there never will be:
 * `AuditLog` is append-only and is written exclusively by `src/lib/audit.ts` as a side
 * effect of a real action. Nothing may be posted into the trail over HTTP.
 */
import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { AUDIT_PAGINATION } from '../config/constants';
import { AUDIT_ENTITY_TYPES } from '../lib/audit';
import { isoDateSchema, searchSchema } from './common.schema';

/**
 * Audit-specific pagination. Mirrors the shape of `paginationQuerySchema` but is bound
 * to `AUDIT_PAGINATION` (50 / 200) rather than the shared `PAGINATION` (20 / 100) —
 * see the comment on the constant for why the shared one is not widened.
 */
export const auditPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(AUDIT_PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(AUDIT_PAGINATION.MAX_PAGE_SIZE)
    .default(AUDIT_PAGINATION.DEFAULT_PAGE_SIZE),
});

export const auditEntityTypeSchema = z.enum(AUDIT_ENTITY_TYPES);

export const listAuditLogsQuerySchema = auditPaginationQuerySchema
  .extend({
    /** Cuid, same bound as `idParamSchema` — junk never reaches the query planner. */
    actorId: z.string().trim().min(1).max(64).optional(),
    action: z.nativeEnum(AuditAction).optional(),
    entityType: auditEntityTypeSchema.optional(),
    entityId: z.string().trim().min(1).max(64).optional(),
    /** Matches `actorEmail` only — see the service for why not a wildcard search. */
    search: searchSchema,
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ['from'],
    message: '`from` must be before or equal to `to`.',
  });
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
