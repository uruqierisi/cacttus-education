/**
 * The single response envelope every endpoint uses, so the dashboard and the
 * marketing site can share one unwrapping helper.
 *
 *   success: { success: true,  data: T,    meta?: PaginationMeta }
 *   failure: { success: false, error: { code, message, details } }
 */
import type { Response } from 'express';
import { EXPORT_TRUNCATED_HEADER, HTTP_STATUS } from '../config/constants';
import type { ErrorCode, ErrorDetail } from './api-error';

export type PaginationMeta = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
};

export type SuccessBody<T> = {
  readonly success: true;
  readonly data: T;
  readonly meta?: PaginationMeta;
};

export type ErrorBody = {
  readonly success: false;
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    readonly details: readonly ErrorDetail[];
  };
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  status: number = HTTP_STATUS.OK,
  meta?: PaginationMeta,
): void {
  const body: SuccessBody<T> = meta ? { success: true, data, meta } : { success: true, data };
  res.status(status).json(body);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, HTTP_STATUS.CREATED);
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details: readonly ErrorDetail[] = [],
): void {
  const body: ErrorBody = { success: false, error: { code, message, details } };
  res.status(status).json(body);
}

/**
 * Send a CSV as a download.
 *
 * `filename` MUST already be sanitised (see `csvDayFilename`): it is interpolated into
 * a quoted `Content-Disposition` header, so an unescaped quote or newline would let a
 * caller inject a header. `no-store` because the body is lead PII and must never sit in
 * a shared cache.
 */
export function sendCsv(res: Response, filename: string, csv: string, truncated = false): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');

  if (truncated) {
    res.setHeader(EXPORT_TRUNCATED_HEADER, 'true');
  }

  res.status(HTTP_STATUS.OK).send(csv);
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}
