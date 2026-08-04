/**
 * Typed application errors.
 *
 * Every deliberate failure path throws an `ApiError`. The error middleware turns it
 * into the response envelope; anything that is NOT an `ApiError` is treated as an
 * unexpected bug, logged with its stack, and reported as a generic 500 so internal
 * details never leak to a client.
 */
import { ERROR_CODE, HTTP_STATUS } from '../config/constants';

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

/** Field-level detail, safe to show to the caller. */
export type ErrorDetail = {
  readonly field: string;
  readonly message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: readonly ErrorDetail[];

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details: readonly ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message: string, details: readonly ErrorDetail[] = []): ApiError {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_CODE.VALIDATION_FAILED, message, details);
  }

  static unauthorized(message = 'Authentication required.'): ApiError {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODE.UNAUTHORIZED, message);
  }

  static forbidden(message = 'You do not have access to this resource.'): ApiError {
    return new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_CODE.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found.'): ApiError {
    return new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_CODE.NOT_FOUND, message);
  }

  static conflict(message: string, details: readonly ErrorDetail[] = []): ApiError {
    return new ApiError(HTTP_STATUS.CONFLICT, ERROR_CODE.CONFLICT, message, details);
  }

  static internal(message = 'Something went wrong.'): ApiError {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODE.INTERNAL, message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
