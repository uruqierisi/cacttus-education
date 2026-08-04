/**
 * `/api/admin/forms` — form CRUD.
 *
 * DELETE is a soft delete; only an ADMIN may delete or restore, because a form
 * disappearing takes a public URL offline. EDITORs may still create and edit.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { csvRateLimiter } from '../../middleware/rate-limit';
import { idParamSchema } from '../../schemas/common.schema';
import {
  createFormSchema,
  listArchivedFormsQuerySchema,
  listFormsQuerySchema,
  updateFormSchema,
} from '../../schemas/form.schema';
import * as formsController from '../../controllers/forms.controller';

const router = Router();

// GET    /api/admin/forms/field-types
router.get('/field-types', asyncHandler(formsController.fieldTypes));

// GET    /api/admin/forms/archived?page&pageSize&type&search&sort&order   (ADMIN only)
//
// MUST stay above the `/:id` routes below. Express matches in declaration order, so a
// literal path declared after `/:id` would never be reached — the request would arrive
// at `getById` with id="archived" and 404 instead.
router.get(
  '/archived',
  requireAdmin,
  validate({ query: listArchivedFormsQuerySchema }),
  asyncHandler(formsController.listArchived),
);

// GET    /api/admin/forms?page&pageSize&type&isActive&includeDeleted&search&sort&order
router.get('/', validate({ query: listFormsQuerySchema }), asyncHandler(formsController.list));

// POST   /api/admin/forms
router.post('/', validate({ body: createFormSchema }), asyncHandler(formsController.create));

// GET    /api/admin/forms/:id/submissions/export  -> text/csv   (ADMIN only)
//
// Declared ABOVE `/:id` on purpose. It would in fact still match if declared below —
// `/:id` is a single path segment and cannot swallow a three-segment path — but keeping
// every literal-suffixed route above the bare `/:id` block means the file has ONE rule
// about ordering rather than a per-route judgement call about which ones are safe.
//
// This is the delete-with-backup flow: download, then DELETE /api/admin/forms/:id.
router.get(
  '/:id/submissions/export',
  requireAdmin,
  csvRateLimiter,
  validate({ params: idParamSchema }),
  asyncHandler(formsController.exportSubmissions),
);

// GET    /api/admin/forms/:id
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(formsController.getById));

// PATCH  /api/admin/forms/:id
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateFormSchema }),
  asyncHandler(formsController.update),
);

// DELETE /api/admin/forms/:id      (soft delete, ADMIN only)
router.delete(
  '/:id',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(formsController.remove),
);

// POST   /api/admin/forms/:id/restore  (ADMIN only)
router.post(
  '/:id/restore',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(formsController.restore),
);

export const adminFormsRouter = router;
