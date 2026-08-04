import type { Request, Response } from 'express';
import { AuditAction, type Role } from '@prisma/client';
import { HTTP_STATUS, REFRESH_COOKIE_NAME } from '../config/constants';
import { ApiError, isApiError } from '../lib/api-error';
import { sendSuccess } from '../lib/api-response';
import { clearRefreshCookie, setRefreshCookie } from '../lib/cookies';
import { verifyRefreshToken } from '../lib/jwt';
import { logger } from '../lib/logger';
import {
  auditContextForActor,
  auditContextFromRequest,
  recordAudit,
  unknownActor,
  type AuditActor,
} from '../lib/audit';
import { validatedBody } from '../middleware/validate';
import { currentUser } from '../middleware/auth';
import * as authService from '../services/auth.service';
import type { ChangePasswordInput, LoginInput } from '../schemas/auth.schema';

/**
 * SESSION EVENTS ARE BEST-EFFORT, BY DESIGN.
 *
 * Unlike the staff mutations — which commit their audit row inside the same
 * interactive transaction as the domain write — the events below have no domain
 * transaction to join. A failed login writes nothing at all; a logout only clears a
 * cookie. There is therefore nothing to be atomic *with*.
 *
 * `recordAudit` is awaited (so the row is durable before the response is sent) but it
 * never throws: an audit-table problem must not turn a valid login into a 500 or trap
 * a user in a session they cannot end. Failures are reported through the structured
 * logger inside `recordAudit` — logged, never silently swallowed.
 */

/**
 * Identify the principal behind an unauthenticated `/logout`.
 *
 * The route intentionally carries no `requireAuth` (signing out must work even with an
 * expired access token), so `req.auth` is normally absent and the refresh cookie is
 * the only identity available. It is a signed JWT, so verifying it is a real
 * authentication check, not a guess.
 */
function identifyLogoutActor(req: Request): AuditActor | null {
  if (req.auth) {
    return { actorId: req.auth.id, actorEmail: req.auth.email, actorRole: req.auth.role };
  }

  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }

  try {
    const claims = verifyRefreshToken(token);
    return { actorId: claims.sub, actorEmail: claims.email, actorRole: claims.role as Role };
  } catch (error) {
    // Not swallowed: an expired or forged cookie is recorded at debug level and the
    // event is skipped. Writing an "unknown actor" LOGOUT row for every anonymous POST
    // would let anyone flood the trail with unattributable noise.
    logger.debug('logout could not be attributed to a session', {
      requestId: req.requestId,
      reason: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = validatedBody<LoginInput>(req);

  try {
    const { user, accessToken, refreshToken } = await authService.login(input);

    await recordAudit({
      ...auditContextForActor(req, {
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
      }),
      action: AuditAction.LOGIN_SUCCESS,
      entityType: 'Auth',
      entityId: null,
      metadata: { role: user.role },
    });

    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user, accessToken });
  } catch (error) {
    // Only a CREDENTIAL rejection is a failed login. A database outage or a bug also
    // lands here, and recording that as LOGIN_FAILED would fabricate an attack pattern
    // out of an infrastructure incident, so it is rethrown untouched.
    if (!isApiError(error) || error.status !== HTTP_STATUS.UNAUTHORIZED) {
      throw error;
    }

    // The service returns one identical error for "unknown email", "wrong password"
    // and "deactivated account", and this handler preserves that: the attempted email
    // is recorded, but nothing here reveals which of the three it was. `unknownActor`
    // stamps actorId=null and the lowest-privilege role — see its doc comment.
    await recordAudit({
      ...auditContextForActor(req, unknownActor(input.email)),
      action: AuditAction.LOGIN_FAILED,
      entityType: 'Auth',
      entityId: null,
      // No password, no attempt count, no reason string — just the fact and the origin.
      metadata: { outcome: 'rejected' },
    });

    throw error;
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (typeof token !== 'string' || token.length === 0) {
    throw ApiError.unauthorized('No refresh session found.');
  }

  try {
    const { user, accessToken, refreshToken } = await authService.refresh(token);
    // Rotate on every use so a stolen cookie has a bounded useful life.
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { user, accessToken });
  } catch (error) {
    // An expired or tampered cookie should not keep bouncing the browser forever.
    clearRefreshCookie(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const actor = identifyLogoutActor(req);

  clearRefreshCookie(res);

  if (actor) {
    await recordAudit({
      ...auditContextForActor(req, actor),
      action: AuditAction.LOGOUT,
      entityType: 'Auth',
      entityId: null,
    });
  }

  res.status(HTTP_STATUS.NO_CONTENT).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getProfile(currentUser(req).id);
  sendSuccess(res, { user });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const input = validatedBody<ChangePasswordInput>(req);

  await authService.changePassword(currentUser(req).id, input.currentPassword, input.newPassword);

  // Recorded only after the change succeeded, so a wrong-current-password attempt
  // (which throws above) never appears as a completed change. `input` is NOT spread
  // into metadata — it holds two plaintext passwords.
  await recordAudit({
    ...auditContextFromRequest(req),
    action: AuditAction.PASSWORD_CHANGED,
    entityType: 'Auth',
    entityId: null,
    metadata: { selfService: true, sessionsRevoked: true },
  });

  // Every existing refresh session for this browser is dropped; other devices keep
  // their cookie until it expires, which is the accepted trade-off of stateless JWTs.
  clearRefreshCookie(res);
  res.status(HTTP_STATUS.NO_CONTENT).end();
}
