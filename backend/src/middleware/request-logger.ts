/**
 * Request/response logging with a correlation id.
 *
 * The id is echoed in the `X-Request-Id` response header and included in every error
 * log line, so a user-reported failure can be traced to one log entry.
 */
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '../lib/logger';

const REQUEST_ID_HEADER = 'X-Request-Id';
const SLOW_REQUEST_MS = 1_000;
const SERVER_ERROR_THRESHOLD = 500;
const CLIENT_ERROR_THRESHOLD = 400;

export const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    const context = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      userId: req.auth?.id,
    };

    if (res.statusCode >= SERVER_ERROR_THRESHOLD) {
      logger.error('request failed', context);
      return;
    }

    if (res.statusCode >= CLIENT_ERROR_THRESHOLD || durationMs > SLOW_REQUEST_MS) {
      logger.warn('request completed', context);
      return;
    }

    logger.debug('request completed', context);
  });

  next();
};
