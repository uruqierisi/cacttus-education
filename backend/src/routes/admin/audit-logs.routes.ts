/**
 * `/api/admin/audit-logs` — the audit trail, READ ONLY.
 *
 * THIS ROUTER DECLARES GET ROUTES AND NOTHING ELSE. There is deliberately no POST,
 * PATCH, PUT or DELETE: `AuditLog` is append-only and is written exclusively as a side
 * effect of a real action inside that action's own transaction (see `src/lib/audit.ts`).
 * A trail that can be written or pruned over HTTP is not a trail.
 *
 * `requireAdmin` is mounted ONCE on the router — the same pattern as
 * `users.routes.ts` — so an EDITOR is rejected with 403 at the middleware, before any
 * handler or query runs, and so any endpoint added here later is admin-gated by
 * default. The trail records who deactivated whom and which logins failed; that is
 * oversight information, not editorial information.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { listAuditLogsQuerySchema } from '../../schemas/audit.schema';
import * as auditController from '../../controllers/audit.controller';

const router = Router();

router.use(requireAdmin);

// GET /api/admin/audit-logs/actions   -> { actions: AuditAction[] }
//
// MUST stay above any parameterised route. Express matches in declaration order, so a
// literal path declared after a `/:id` would never be reached — the same trap called
// out on `/api/admin/forms/archived`. (There is no `/:id` route here today; the rule is
// stated so adding one later cannot silently shadow this endpoint.)
router.get('/actions', asyncHandler(auditController.actions));

// GET /api/admin/audit-logs?page&pageSize&actorId&action&entityType&entityId&from&to&search
router.get('/', validate({ query: listAuditLogsQuerySchema }), asyncHandler(auditController.list));

export const adminAuditLogsRouter = router;
