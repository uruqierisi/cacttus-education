/**
 * `/api/admin/training-categories` — the catalogue taxonomy.
 *
 * Same role split as `trainings.routes.ts`, and for the same reason: ADMIN and EDITOR
 * both curate the catalogue, so both may add and rename a category, but only an ADMIN
 * may delete one. A category disappearing is not a local edit — it is a filter chip
 * vanishing from the public catalogue for every visitor at once.
 *
 * The delete is additionally refused, for either role, while any training still
 * references the category; that guard lives in the service, inside the same transaction
 * as the delete, because a role check cannot know about referential state.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { idParamSchema } from '../../schemas/common.schema';
import {
  createTrainingCategorySchema,
  updateTrainingCategorySchema,
} from '../../schemas/training-category.schema';
import * as categoriesController from '../../controllers/training-categories.controller';

const router = Router();

// GET    /api/admin/training-categories  -> the whole list, with per-category usage counts
router.get('/', asyncHandler(categoriesController.list));

// POST   /api/admin/training-categories
router.post(
  '/',
  validate({ body: createTrainingCategorySchema }),
  asyncHandler(categoriesController.create),
);

// PATCH  /api/admin/training-categories/:id
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateTrainingCategorySchema }),
  asyncHandler(categoriesController.update),
);

// DELETE /api/admin/training-categories/:id   (ADMIN only, hard delete, in-use guarded)
router.delete(
  '/:id',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(categoriesController.remove),
);

export const adminTrainingCategoriesRouter = router;
