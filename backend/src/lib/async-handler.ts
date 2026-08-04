/**
 * Express 4 does not forward rejected promises to the error middleware, so every
 * async route handler is wrapped here. Without this a thrown error inside an async
 * controller silently hangs the request.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
