/**
 * `/api/admin/posts` — blog / news CRUD.
 *
 * Both roles can write posts (that is what EDITOR exists for); only an ADMIN can
 * permanently delete one.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { idParamSchema } from '../../schemas/common.schema';
import { createPostSchema, listPostsQuerySchema, updatePostSchema } from '../../schemas/post.schema';
import * as postsController from '../../controllers/posts.controller';

const router = Router();

// GET    /api/admin/posts/stats
router.get('/stats', asyncHandler(postsController.stats));

// GET    /api/admin/posts?page&pageSize&published&search&sort&order
router.get('/', validate({ query: listPostsQuerySchema }), asyncHandler(postsController.list));

// POST   /api/admin/posts
router.post('/', validate({ body: createPostSchema }), asyncHandler(postsController.create));

// GET    /api/admin/posts/:id
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(postsController.getById));

// PATCH  /api/admin/posts/:id
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updatePostSchema }),
  asyncHandler(postsController.update),
);

// DELETE /api/admin/posts/:id   (ADMIN only)
router.delete(
  '/:id',
  requireAdmin,
  validate({ params: idParamSchema }),
  asyncHandler(postsController.remove),
);

export const adminPostsRouter = router;
