/**
 * `/api/admin/submissions` — read, triage, export and bulk-import leads.
 *
 * There is deliberately no per-row create and no delete: a submission is a legal/lead
 * record that the admin UI must not destroy, and single rows are created only by the
 * public endpoint. `POST /import` is the one exception on the create side — a bulk,
 * ADMIN-only, fully audited migration path for leads collected outside this system. It
 * does not weaken the no-delete rule.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { csvRateLimiter } from '../../middleware/rate-limit';
import { uploadCsvFile } from '../../middleware/upload';
import { idParamSchema } from '../../schemas/common.schema';
import {
  exportSubmissionsQuerySchema,
  importSubmissionsSchema,
  listSubmissionsQuerySchema,
  updateSubmissionStatusSchema,
} from '../../schemas/submission.schema';
import * as submissionsController from '../../controllers/submissions.controller';

const router = Router();

// GET   /api/admin/submissions/stats
router.get('/stats', asyncHandler(submissionsController.stats));

// GET   /api/admin/submissions/export?formId&type&status&search&from&to  -> text/csv
// ADMIN + EDITOR: the same people who can read the inbox may take it with them.
router.get(
  '/export',
  csvRateLimiter,
  validate({ query: exportSubmissionsQuerySchema }),
  asyncHandler(submissionsController.exportCsv),
);

// POST  /api/admin/submissions/import   multipart: file=<csv>, formId=<id>   (ADMIN only)
//
// Middleware order is load-bearing:
//   requireAdmin  — reject before a byte of the upload is read;
//   csvRateLimiter — bound how often the parse/insert work can be triggered;
//   uploadCsvFile  — multer, which enforces the 5 MB cap AS THE BODY STREAMS IN and
//                    populates `req.file` plus the text fields on `req.body`;
//   validate       — Zod over those text fields, which do not exist until multer ran.
router.post(
  '/import',
  requireAdmin,
  csvRateLimiter,
  uploadCsvFile,
  validate({ body: importSubmissionsSchema }),
  asyncHandler(submissionsController.importCsv),
);

// GET   /api/admin/submissions?page&pageSize&formId&status&search&from&to&order
router.get(
  '/',
  validate({ query: listSubmissionsQuerySchema }),
  asyncHandler(submissionsController.list),
);

// GET   /api/admin/submissions/:id
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(submissionsController.getById),
);

// PATCH /api/admin/submissions/:id/status   { status: NEW | CONTACTED | ARCHIVED }
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateSubmissionStatusSchema }),
  asyncHandler(submissionsController.updateStatus),
);

export const adminSubmissionsRouter = router;
