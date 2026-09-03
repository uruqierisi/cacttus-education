/**
 * `/api/admin` — everything the dashboard talks to.
 *
 * `requireAuth` is applied once, here, so no child route can ever be added without
 * authentication by accident.
 */
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { adminFormsRouter } from './forms.routes';
import { adminTrainingsRouter } from './trainings.routes';
import { adminTrainingCategoriesRouter } from './training-categories.routes';
import { adminSubmissionsRouter } from './submissions.routes';
import { adminPostsRouter } from './posts.routes';
import { adminPostCategoriesRouter } from './post-categories.routes';
import { adminUsersRouter } from './users.routes';
import { adminUploadsRouter } from './uploads.routes';
import { adminAuditLogsRouter } from './audit-logs.routes';
import { adminStatsRouter } from './stats.routes';

const router = Router();

router.use(requireAuth);

// Admin responses must never be stored by a shared cache.
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

router.use('/forms', adminFormsRouter);
// ADMIN + EDITOR for CRUD; DELETE is admin-gated inside, like forms.
router.use('/trainings', adminTrainingsRouter);
// The catalogue taxonomy. Same split as trainings: both roles curate, ADMIN deletes.
router.use('/training-categories', adminTrainingCategoriesRouter);
router.use('/submissions', adminSubmissionsRouter);
router.use('/posts', adminPostsRouter);
// The blog taxonomy. Same split as posts: both roles write, ADMIN deletes.
router.use('/post-categories', adminPostCategoriesRouter);
// Self-gated with requireAdmin inside — EDITORs get 403 on every verb.
router.use('/users', adminUsersRouter);
// ADMIN + EDITOR: both roles author blog posts, so both may attach a cover image.
router.use('/uploads', adminUploadsRouter);
// Same pattern: requireAdmin is mounted on the router itself. Read-only (GET only).
router.use('/audit-logs', adminAuditLogsRouter);
// Ditto — admin-gated on the router, GET only, and NOT audited (reads are not events).
router.use('/stats', adminStatsRouter);

export const adminRouter = router;
