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
import { attachmentDisposition, syllabusFilename } from './lib/content-disposition';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';
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
  /*
   * Resolve a human download name for syllabus PDFs, BEFORE the static handler runs.
   *
   * `express.static`'s `setHeaders` hook is synchronous, so it cannot query anything —
   * which is why every PDF used to arrive as `<uuid>.pdf` with a bare `attachment`. This
   * middleware does the one lookup the name needs and leaves the answer on `res.locals`
   * for that hook to read; the static handler still serves the bytes.
   *
   * Only `.pdf` requests pay for it. Cover images — the overwhelming majority of traffic
   * through this mount — skip the query entirely.
   *
   * A failure here is never fatal: an orphaned PDF, a renamed training or a database
   * blip all fall through to the plain `attachment` this had before, which downloads
   * correctly under the UUID. A nice filename is not worth a 500 on a file download.
   */
  app.use(IMAGE_UPLOAD.PUBLIC_PATH, (req, res, next) => {
    if (!req.path.toLowerCase().endsWith('.pdf')) {
      next();
      return;
    }

    // The stored value is an absolute URL built by the StorageAdapter, so match on the
    // filename rather than reconstructing the full URL and depending on PUBLIC_API_URL.
    const filename = req.path.replace(/^\/+/, '');

    prisma.training
      .findFirst({
        where: { syllabusPdf: { endsWith: `/${filename}` }, deletedAt: null },
        select: { slug: true },
      })
      .then((training) => {
        if (training) {
          res.locals.downloadFilename = syllabusFilename(training.slug);
        }
      })
      .catch((error: unknown) => {
        logger.warn('could not resolve a download name for a syllabus PDF', {
          filename,
          reason: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => next());
  });

  app.use(
    IMAGE_UPLOAD.PUBLIC_PATH,
    express.static(uploadRoot(), {
      index: false,
      redirect: false,
      dotfiles: 'ignore',
      fallthrough: true,
      maxAge: 0,
      setHeaders: (response, filePath) => {
        response.setHeader('Cache-Control', IMAGE_UPLOAD.CACHE_CONTROL);
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        /*
         * Syllabus PDFs are DOWNLOADED, never rendered in place.
         *
         * Unlike an uploaded image, a PDF is not re-encoded on the way in (see the
         * PDF_UPLOAD note in config/constants.ts), so its contents are the uploader's
         * bytes. `attachment` keeps the browser's PDF viewer — a large scripting
         * surface — from ever running it inside a document served from our origin.
         * That property is unchanged by the filename below: `attachment` is still the
         * first token, and the three headers above still apply.
         *
         * The name comes from `res.locals`, set by the resolver mounted above, and is
         * sanitised in `attachmentDisposition` before it reaches the header — the stored
         * slug is trusted data but this is still a header-injection surface. With no
         * name resolved it degrades to exactly what it was: a bare `attachment`, which
         * downloads under the UUID.
         */
        if (filePath.toLowerCase().endsWith('.pdf')) {
          const downloadName = response.locals?.downloadFilename;
          response.setHeader(
            'Content-Disposition',
            typeof downloadName === 'string' && downloadName !== ''
              ? attachmentDisposition(downloadName)
              : 'attachment',
          );
        }
      },
    }),
  );

  app.use(rootRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
