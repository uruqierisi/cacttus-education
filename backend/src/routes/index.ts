/**
 * Root router — the complete route map in one place.
 *
 *   GET  /health                                     liveness
 *   GET  /health/ready                               readiness (DB round-trip)
 *
 *   POST /api/auth/login                             public
 *   POST /api/auth/refresh                           refresh cookie
 *   POST /api/auth/logout                            refresh cookie
 *   GET  /api/auth/me                                bearer
 *   POST /api/auth/change-password                   bearer
 *
 *   GET  /api/public/posts                           public
 *   GET  /api/public/posts/:slug                     public
 *   GET  /api/public/forms/:slug                     public
 *   POST /api/public/forms/:slug/submissions         public (rate limited)
 *
 *   /api/admin/forms         (bearer)                CRUD + soft delete/restore
 *   /api/admin/submissions   (bearer)                list/filter/status/export/stats
 *   /api/admin/posts         (bearer)                CRUD + stats
 */
import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { adminRouter } from './admin';
import { publicRouter } from './public';

const router = Router();

router.use('/health', healthRouter);
router.use('/api/auth', authRouter);
router.use('/api/public', publicRouter);
router.use('/api/admin', adminRouter);

export const rootRouter = router;
