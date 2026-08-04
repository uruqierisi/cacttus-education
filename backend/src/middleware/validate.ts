/**
 * Zod validation middleware.
 *
 * Validation happens at the HTTP boundary and nowhere else: controllers and services
 * only ever receive parsed, typed, trimmed data.
 *
 * Parsed output is written to `req.validated` rather than back onto `req.body` /
 * `req.query`, because `req.query` is a prototype getter and assigning to it throws.
 */
import type { Request, RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { ApiError, type ErrorDetail } from '../lib/api-error';

export type RequestSchemas = {
  readonly body?: ZodTypeAny;
  readonly query?: ZodTypeAny;
  readonly params?: ZodTypeAny;
};

type RequestPart = keyof RequestSchemas;

function toDetails(part: RequestPart, error: z.ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: [part, ...issue.path.map(String)].join('.'),
    message: issue.message,
  }));
}

export function validate(schemas: RequestSchemas): RequestHandler {
  const entries = Object.entries(schemas) as [RequestPart, ZodTypeAny][];

  return (req, _res, next) => {
    const details: ErrorDetail[] = [];
    const parsed: Record<string, unknown> = {};

    for (const [part, schema] of entries) {
      const result = schema.safeParse(req[part]);

      if (result.success) {
        parsed[part] = result.data;
        continue;
      }

      details.push(...toDetails(part, result.error));
    }

    if (details.length > 0) {
      next(ApiError.badRequest('Request validation failed.', details));
      return;
    }

    req.validated = { ...req.validated, ...parsed };
    next();
  };
}

function readValidated<T>(req: Request, part: RequestPart): T {
  const value = req.validated?.[part];

  if (value === undefined) {
    // A programming error, not a client error: the route forgot its validate() call.
    throw ApiError.internal(`Request ${part} was not validated.`);
  }

  return value as T;
}

export const validatedBody = <T>(req: Request): T => readValidated<T>(req, 'body');
export const validatedQuery = <T>(req: Request): T => readValidated<T>(req, 'query');
export const validatedParams = <T>(req: Request): T => readValidated<T>(req, 'params');
