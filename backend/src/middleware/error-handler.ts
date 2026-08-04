/**
 * Terminal error middleware — the single place an HTTP error response is produced.
 *
 * Known `ApiError`s are echoed to the client. Everything else is logged with its
 * stack and reported as an opaque 500, so a Prisma/driver message can never leak the
 * schema or a connection string to a browser.
 */
import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ERROR_CODE, HTTP_STATUS } from '../config/constants';
import { ApiError, isApiError } from '../lib/api-error';
import { sendError } from '../lib/api-response';
import { logger } from '../lib/logger';
import { isRecordNotFound, isUniqueViolation, uniqueViolationTargets } from '../lib/prisma';

/** Express body-parser marks oversized/invalid JSON with these properties. */
type BodyParserError = Error & { readonly type?: string; readonly status?: number };

function translate(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (isUniqueViolation(error)) {
    const targets = uniqueViolationTargets(error);
    return ApiError.conflict(
      'A record with these values already exists.',
      targets.map((field) => ({ field, message: 'must be unique' })),
    );
  }

  if (isRecordNotFound(error)) {
    return ApiError.notFound();
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('The request could not be applied to the database.');
  }

  const candidate = error as BodyParserError;

  if (candidate?.type === 'entity.too.large') {
    return new ApiError(
      HTTP_STATUS.PAYLOAD_TOO_LARGE,
      ERROR_CODE.VALIDATION_FAILED,
      'Request body is too large.',
    );
  }

  if (candidate?.type === 'entity.parse.failed') {
    return ApiError.badRequest('Request body is not valid JSON.');
  }

  return ApiError.internal();
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const apiError = translate(error);
  const isUnexpected = apiError.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const context = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status: apiError.status,
    code: apiError.code,
    userId: req.auth?.id,
  };

  if (isUnexpected) {
    logger.error(apiError.message, {
      ...context,
      stack: error instanceof Error ? error.stack : String(error),
    });
  } else {
    logger.warn(apiError.message, context);
  }

  sendError(res, apiError.status, apiError.code, apiError.message, apiError.details);
};
