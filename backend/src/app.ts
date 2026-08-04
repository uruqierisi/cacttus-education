/**
 * Express application assembly.
 *
 * Middleware order matters and is deliberate:
 *   proxy trust -> security headers -> CORS -> body parsing -> cookies ->
 *   logging -> rate limit -> routes -> 404 -> error handler.
 *
 * Exported separately from `server.ts` so tests can mount the app without binding a
 * port.
 */
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { corsOptionsDelegate } from './config/cors';
import { IMAGE_UPLOAD, JSON_BODY_LIMIT } from './config/constants';
import { uploadRoot } from './lib/storage';
import { requestLogger } from './middleware/request-logger';
import { apiRateLimiter } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { rootRouter } from './routes';

export function createApp(): Express {
  const app = express();

  // Railway/Vercel terminate TLS upstream; without this the rate limiter keys every
  // request to the proxy IP and `req.secure` is always false.
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // This is a JSON API: it never returns a document, so a restrictive default
      // CSP is appropriate and no framing is ever legitimate.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { 'default-src': ["'none'"], 'frame-ancestors': ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // A delegate, not a static options object: `Access-Control-Allow-Credentials` is
  // emitted per-origin (dashboard only) — see `config/cors.ts`.
  app.use(cors(corsOptionsDelegate));
  app.options('*', cors(corsOptionsDelegate));

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  app.use(requestLogger);
  app.use('/api', apiRateLimiter);

  /**
   * Uploaded cover images, served as INERT static files.
   *
   * Mounted outside `/api`, so the blanket API rate limiter does not throttle a page
   * that renders several images. Every hardening option here is deliberate:
   *
   *   index/redirect false  — no directory listing, and no 301 that would disclose
   *                           whether a directory exists.
   *   dotfiles 'ignore'     — nothing beginning with `.` is reachable.
   *   nosniff + CSP none    — the two headers that stop a browser treating a file as
   *                           anything other than its declared image type. Even if a
   *                           polyglot survived upload validation it cannot execute:
   *                           `sandbox` and `default-src 'none'` neuter scripts, and
   *                           nosniff blocks content-type guessing.
   *   immutable cache       — filenames are random UUIDs and are never reused, so the
   *                           bytes behind a URL can never change.
   *
   * Files are only ever READ from here; the write path is the StorageAdapter.
   */
  app.use(
    IMAGE_UPLOAD.PUBLIC_PATH,
    express.static(uploadRoot(), {
      index: false,
      redirect: false,
      dotfiles: 'ignore',
      fallthrough: true,
      maxAge: 0,
      setHeaders: (response) => {
        response.setHeader('Cache-Control', IMAGE_UPLOAD.CACHE_CONTROL);
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );

  app.use(rootRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
