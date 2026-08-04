/**
 * `/api/public/posts` — the published blogs/news feed consumed by the marketing site.
 * Only `published = true` rows are ever reachable here.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { slugParamSchema } from '../../schemas/common.schema';
import { publicPostsQuerySchema } from '../../schemas/post.schema';
import * as publicController from '../../controllers/public.controller';

const router = Router();

// GET /api/public/posts?page&pageSize&search   -> summaries (no body HTML)
router.get(
  '/',
  validate({ query: publicPostsQuerySchema }),
  asyncHandler(publicController.listPublishedPosts),
);

// GET /api/public/posts/:slug                  -> full post with sanitised HTML
router.get(
  '/:slug',
  validate({ params: slugParamSchema }),
  asyncHandler(publicController.getPublishedPost),
);

export const publicPostsRouter = router;
