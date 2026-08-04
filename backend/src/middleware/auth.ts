/**
 * Authentication and authorisation middleware.
 *
 * `requireAuth` verifies the short-lived access token and re-reads the user from the
 * database on every request. That extra query is deliberate: it is what makes a
 * deleted or demoted account stop working immediately instead of at token expiry.
 */
import type { Request, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { extractBearerToken, isTokenStale, verifyAccessToken } from '../lib/jwt';
import type { AuthenticatedUser } from '../types/express';
import { asyncHandler } from '../lib/async-handler';

export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw ApiError.unauthorized('Missing bearer token.');
  }

  const claims = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, role: true, isActive: true, passwordChangedAt: true },
  });

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists.');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('This account has been deactivated.');
  }

  // Evicts every session issued before the last password change — self-service or
  // admin reset — on the very next request, across all devices.
  if (isTokenStale(claims.iat, user.passwordChangedAt)) {
    throw ApiError.unauthorized('Session ended because the password changed. Please sign in again.');
  }

  req.auth = { id: user.id, email: user.email, role: user.role };
  next();
});

/** Guard a route to a set of roles. Always mount it after `requireAuth`. */
export function requireRole(...roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(ApiError.unauthorized());
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(ApiError.forbidden('This action requires a different role.'));
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(Role.ADMIN);

/** Read the authenticated principal, or fail loudly if the route forgot `requireAuth`. */
export function currentUser(req: Request): AuthenticatedUser {
  if (!req.auth) {
    throw ApiError.internal('Route is missing the requireAuth middleware.');
  }
  return req.auth;
}
