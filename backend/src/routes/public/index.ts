/**
 * `/api/public` — the only surface the marketing site is allowed to call.
 *
 * No authentication, no cookies. Kept in its own router so the unauthenticated
 * attack surface is exactly this file plus the two it mounts.
 */
import { Router } from 'express';
import { publicPostsRouter } from './posts.routes';
import { publicFormsRouter } from './forms.routes';

const router = Router();

router.use('/posts', publicPostsRouter);
router.use('/forms', publicFormsRouter);

export const publicRouter = router;
