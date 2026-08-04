/**
 * Catch-all for unmatched routes. Mounted after every router and before the error
 * handler so a typo'd path returns the same JSON envelope as any other failure
 * instead of Express's default HTML page.
 */
import type { RequestHandler } from 'express';
import { ApiError } from '../lib/api-error';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}.`));
};
