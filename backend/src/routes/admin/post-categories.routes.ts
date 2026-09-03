/**
 * `/api/admin/post-categories` — the blog taxonomy.
 *
 * Same role split as `training-categories.routes.ts`, for the same reason: ADMIN and
 * EDITOR both write the blog, so both may add and rename a category, but only an ADMIN
 * may delete one — a category disappearing removes a filter chip from the public feed
 * for every visitor at once.
 *
 * The delete is additionally refused, for either role, while any post still references
 * the category; that guard lives in the service, inside the same transaction as the
 * delete, because a role check cannot know about referential state.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { idParamSchema } from '../../schemas/common.schema';
import {
  createPostCategorySchema,
  updatePostCategorySchema,
} from '../../schemas/post-category.schema';
import * as categoriesController from '../../controllers/post-categories.controller';

const router = Router();

// GET    /api/admin/post-categories  -> the whole list, with per-category usage counts
router.get('/', asyncHandler(categoriesController.list));

// POST   /api/admin/post-categories
router.post(
  '/',
  validate({ body: createPostCategorySchema }),
  asyncHandler(categoriesController.create),
);

// PATCH  /api/admin/post-categories/:id
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updatePostCategorySchema }),
  asyncHandler(categoriesController.update),
);

// DELETE /api/admin/post-categories/:id   (ADMIN only, hard delete, in-use guarded)
router.delete(
  '/:id',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(categoriesController.remove),
);

export const adminPostCategoriesRouter = router;
