/**
 * `/api/auth`
 *
 * Mounted at the same path the refresh cookie is scoped to, so the browser never
 * ships the refresh token to any other part of the API.
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';
import { changePasswordSchema, loginSchema } from '../schemas/auth.schema';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/login            -> { user, accessToken } + refresh cookie
router.post('/login', authRateLimiter, validate({ body: loginSchema }), asyncHandler(authController.login));

// POST /api/auth/refresh          -> { user, accessToken } + rotated refresh cookie
router.post('/refresh', authRateLimiter, asyncHandler(authController.refresh));

// POST /api/auth/logout           -> 204, clears the refresh cookie
router.post('/logout', asyncHandler(authController.logout));

// GET  /api/auth/me               -> { user }
router.get('/me', requireAuth, asyncHandler(authController.me));

// POST /api/auth/change-password  -> 204
router.post(
  '/change-password',
  requireAuth,
  authRateLimiter,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);

export const authRouter = router;
