/**
 * Authentication service.
 *
 * Strategy: a 15-minute access JWT returned in the response body (held in dashboard
 * memory, never localStorage) plus a long-lived refresh JWT in an httpOnly cookie.
 * This keeps the XSS blast radius to one short-lived token while still surviving a
 * page reload.
 */
import type { Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { hashPassword, verifyAgainstDummyHash, verifyPassword } from '../lib/password';
import { isTokenStale, signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import type { LoginInput } from '../schemas/auth.schema';

export type PublicUser = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
  readonly createdAt: Date;
};

export type AuthResult = {
  readonly user: PublicUser;
  readonly accessToken: string;
  readonly refreshToken: string;
};

function toPublicUser(user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt'>): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function issueTokens(user: PublicUser): Pick<AuthResult, 'accessToken' | 'refreshToken'> {
  const claims = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(claims),
    refreshToken: signRefreshToken(claims),
  };
}

export async function login({ email, password }: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Identical error and identical timing for "unknown email" and "wrong password",
  // so the endpoint cannot be used to enumerate valid accounts.
  const isValid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyAgainstDummyHash(password);

  if (!user || !isValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // Checked only AFTER the hash comparison, so a deactivated account costs exactly as
  // much time as an active one and the distinct message leaks no timing signal.
  if (!user.isActive) {
    throw ApiError.unauthorized('This account has been deactivated. Contact an administrator.');
  }

  const publicUser = toPublicUser(user);
  return { user: publicUser, ...issueTokens(publicUser) };
}

/**
 * Rotate a refresh token. The user row is re-read so a deleted or role-changed
 * account cannot keep refreshing, and the new access token always carries the
 * current role.
 */
export async function refresh(refreshToken: string): Promise<AuthResult> {
  const claims = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: claims.sub } });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Session is no longer valid.');
  }

  // Without this the refresh cookie would outlive a password reset by its full TTL,
  // which is precisely the hole the reset is meant to close.
  if (isTokenStale(claims.iat, user.passwordChangedAt)) {
    throw ApiError.unauthorized('Session ended because the password changed. Please sign in again.');
  }

  const publicUser = toPublicUser(user);
  return { user: publicUser, ...issueTokens(publicUser) };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists.');
  }

  return toPublicUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists.');
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect.', [
      { field: 'body.currentPassword', message: 'Incorrect password.' },
    ]);
  }

  const passwordHash = await hashPassword(newPassword);

  // Stamping this evicts every session on every device, not just this browser.
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
}
