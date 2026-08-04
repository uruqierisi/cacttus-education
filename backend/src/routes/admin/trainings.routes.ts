/**
 * `/api/admin/trainings` — training catalogue CRUD.
 *
 * Same role split as `forms.routes.ts`, for the same reason: ADMIN and EDITOR both
 * curate the catalogue, but only an ADMIN may delete, because a training disappearing
 * takes a public page offline. There is no restore route — see the comment on the
 * TRAINING_* values in schema.prisma.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { idParamSchema } from '../../schemas/common.schema';
import {
  createTrainingSchema,
  listTrainingsQuerySchema,
  updateTrainingSchema,
} from '../../schemas/training.schema';
import * as trainingsController from '../../controllers/trainings.controller';

const router = Router();

// GET    /api/admin/trainings/form-options  -> [{ slug, title }]
//
// MUST stay above `/:id`. Express matches in declaration order, so declared below it
// this would arrive at `getById` with id="form-options" and 404 — the same trap
// documented in forms.routes.ts.
router.get('/form-options', asyncHandler(trainingsController.formOptions));

// GET    /api/admin/trainings?page&pageSize&category&city&isActive&includeDeleted&search&sort&order
router.get(
  '/',
  validate({ query: listTrainingsQuerySchema }),
  asyncHandler(trainingsController.list),
);

// POST   /api/admin/trainings
router.post(
  '/',
  validate({ body: createTrainingSchema }),
  asyncHandler(trainingsController.create),
);

// GET    /api/admin/trainings/:id
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(trainingsController.getById),
);

// PATCH  /api/admin/trainings/:id
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateTrainingSchema }),
  asyncHandler(trainingsController.update),
);

// DELETE /api/admin/trainings/:id   (ADMIN only, soft delete)
router.delete(
  '/:id',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(trainingsController.remove),
);

export const adminTrainingsRouter = router;
