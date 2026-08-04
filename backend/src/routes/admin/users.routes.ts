/**
 * `/api/admin/users` — staff account management.
 *
 * `requireAdmin` is mounted ONCE on the router rather than per-route, so a new
 * endpoint added here is admin-gated by default. An EDITOR gets 403 on every verb,
 * including the reads: the roster shows who holds ADMIN, which is not information an
 * editor needs.
 *
 * The password-reset route additionally carries the credential rate limiter, because
 * it is the one place an authenticated session can set someone else's password.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limit';
import { idParamSchema } from '../../schemas/common.schema';
import {
  createUserSchema,
  listUsersQuerySchema,
  resetUserPasswordSchema,
  updateUserSchema,
} from '../../schemas/user.schema';
import * as usersController from '../../controllers/users.controller';

const router = Router();

router.use(requireAdmin);

// GET    /api/admin/users?page&pageSize&role&isActive&search&sort&order
router.get('/', validate({ query: listUsersQuerySchema }), asyncHandler(usersController.list));

// POST   /api/admin/users
router.post('/', validate({ body: createUserSchema }), asyncHandler(usersController.create));

// GET    /api/admin/users/:id
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(usersController.getById));

// PATCH  /api/admin/users/:id        { name?, role?, isActive? }
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(usersController.update),
);

// POST   /api/admin/users/:id/reset-password   { newPassword }  -> 204
router.post(
  '/:id/reset-password',
  authRateLimiter,
  validate({ params: idParamSchema, body: resetUserPasswordSchema }),
  asyncHandler(usersController.resetPassword),
);

// DELETE /api/admin/users/:id   -> 204 (blocked if the user has authored posts)
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(usersController.remove));

export const adminUsersRouter = router;
