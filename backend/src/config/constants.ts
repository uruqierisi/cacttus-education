/**
 * Named constants shared across the API. Anything that would otherwise be a magic
 * number or a repeated string literal lives here.
 */

/** Cookie that carries the refresh token. Never readable from JavaScript. */
export const REFRESH_COOKIE_NAME = 'cacttus_rt';

/** Path the refresh cookie is scoped to — the browser sends it nowhere else. */
export const REFRESH_COOKIE_PATH = '/api/auth';

/** JWT `typ` claim values, so an access token can never be replayed as a refresh token. */
export const TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type TokenType = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

export const JWT_ISSUER = 'cacttus-edu-api';
export const JWT_AUDIENCE = 'cacttus-edu-dashboard';

/** Pagination guardrails — an unbounded list query must never reach Postgres. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Pagination guardrails for the audit trail, which are DELIBERATELY not `PAGINATION`.
 *
 * The trail is a dense, append-only forensic log: an administrator scanning "what
 * happened around 14:20" wants a screenful of history, not 20 rows, and the rows are
 * far smaller than a Form or a Post. Widening the shared `PAGINATION` constant to suit
 * it would silently raise the ceiling on every other list endpoint in the API, so the
 * audit limits live here as their own named constant instead.
 */
export const AUDIT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
} as const;

/** Hard ceiling on a single CSV export so one click cannot exhaust memory. */
export const EXPORT_MAX_ROWS = 5_000;

/**
 * Hard caps on a CSV import.
 *
 * Deliberately NOT environment-tunable. These are the guardrails that keep one
 * multipart request from exhausting the container's memory or holding a database
 * transaction open indefinitely; an operator who can edit `.env` must not be able to
 * raise 5 MB to 500 MB by accident. Everything in this block is a security limit, not
 * a per-environment preference.
 */
/**
 * Blog cover-image uploads.
 *
 * SVG IS DELIBERATELY EXCLUDED. An SVG is an XML document that may carry `<script>`,
 * `<foreignObject>` and event handlers; served from our own origin it would be stored
 * XSS the moment anything renders it inline. Making it safe needs a full sanitiser on
 * a format nobody needs for a photographic cover. The four raster formats below cannot
 * execute, so the allowlist is the mitigation and there is nothing left to sanitise.
 */
export const IMAGE_UPLOAD = {
  /** Enforced by multer at the UPLOAD boundary — the request aborts mid-stream. */
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  /** Anything wider is downscaled; height follows to preserve the aspect ratio. */
  MAX_WIDTH_PX: 2_000,
  /** Multipart field name the image must arrive under. */
  FIELD_NAME: 'file',
  /**
   * The ONLY types accepted, keyed by the extension we assign. The client-sent mime and
   * the client filename are never trusted — `lib/image-type.ts` sniffs magic bytes and
   * the extension is derived from THAT result.
   */
  ALLOWED: Object.freeze({
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
  }),
  /** Public URL prefix these files are served under. Must match the static mount. */
  PUBLIC_PATH: '/uploads',
  /** Immutable: filenames are content-addressed by a random id, so they never change. */
  CACHE_CONTROL: 'public, max-age=31536000, immutable',
} as const;

export type UploadedImageExtension = keyof typeof IMAGE_UPLOAD.ALLOWED;

/**
 * Syllabus PDFs ("Shkarko planprogramin" on a training's detail page).
 *
 * THIS PATH IS WEAKER THAN THE IMAGE PATH, AND THE DIFFERENCE IS WORTH STATING.
 * An uploaded image is re-encoded by sharp, so the bytes on disk are ones WE produced
 * and anything smuggled into a comment or trailing segment is discarded. There is no
 * equivalent re-encode for PDF here — a PDF can legitimately contain JavaScript, and
 * rewriting one safely needs a dedicated sanitiser this project does not carry.
 *
 * So the containment is delivery-side rather than content-side, and it is layered:
 *   1. multer caps the byte count as the request streams;
 *   2. magic bytes are sniffed (`lib/pdf-type.ts`) — the extension we write is derived
 *      from THAT, never from the client's filename or Content-Type;
 *   3. the file is served from the upload root, which already sets `nosniff` and
 *      `Content-Security-Policy: default-src 'none'; sandbox`;
 *   4. PDFs additionally get `Content-Disposition: attachment` (see app.ts), so the
 *      browser downloads rather than opening them in its in-page viewer. That is what
 *      keeps a hostile PDF from executing anything in OUR origin.
 * Uploading is staff-only (requireAuth on /api/admin), so the threat model is a
 * compromised or careless staff account, not an anonymous attacker.
 */
export const PDF_UPLOAD = {
  /** 10 MB — a planprogram is a few pages of text, not a media file. */
  MAX_FILE_BYTES: 10 * 1024 * 1024,
  /** Multipart field name the PDF must arrive under. Same as images, for one client helper. */
  FIELD_NAME: 'file',
  ALLOWED: Object.freeze({ pdf: 'application/pdf' }),
} as const;

export type UploadedPdfExtension = keyof typeof PDF_UPLOAD.ALLOWED;

/**
 * Every extension the StorageAdapter may write. Both upload kinds share one directory
 * and one URL prefix, so the filename allowlist that guards deletion must know both.
 */
export type StoredFileExtension = UploadedImageExtension | UploadedPdfExtension;

export const CSV_IMPORT = {
  /** Enforced by multer at the UPLOAD boundary — the request is aborted mid-stream. */
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  /** Data rows, excluding the header line. */
  MAX_ROWS: 5_000,
  /** Rows per `createMany` statement inside the single import transaction. */
  INSERT_CHUNK_SIZE: 500,
  /** Prisma's interactive-transaction default is 5 s, which is too tight for 5 000 rows. */
  TRANSACTION_TIMEOUT_MS: 30_000,
  /** How long to wait for a free connection before giving up on the transaction. */
  TRANSACTION_MAX_WAIT_MS: 10_000,
  /**
   * Ceiling on how many per-row failures are echoed back. A 5 000-row file of rubbish
   * would otherwise produce a multi-megabyte JSON response; `failedCount` always
   * reports the true total.
   */
  MAX_REPORTED_FAILURES: 500,
  /** Separator used for multiselect answers in a CSV cell, both written and read. */
  MULTI_VALUE_SEPARATOR: '; ',
} as const;

/**
 * Response header that warns an export was cut off at EXPORT_MAX_ROWS.
 *
 * Lives here because two unrelated modules must agree on the exact string: the response
 * helper that sets it and the CORS policy that exposes it. A browser hides every
 * non-safelisted response header from cross-origin JavaScript, so a typo in either place
 * turns the warning into silence — which is the one failure mode a truncation warning
 * must not have.
 */
export const EXPORT_TRUNCATED_HEADER = 'X-Export-Truncated';

/**
 * Throttle for the bulk CSV endpoints, tighter than the blanket API limit.
 *
 * Export reads up to EXPORT_MAX_ROWS of lead PII per call and import writes up to
 * CSV_IMPORT.MAX_ROWS; neither is something a human does dozens of times a minute, so
 * a low ceiling both protects the database and bounds how fast a compromised staff
 * token can siphon the inbox.
 */
export const CSV_RATE_LIMIT = {
  WINDOW_MS: 900_000,
  MAX: 30,
} as const;

/** Largest JSON body we accept; rich-text post content is the biggest legitimate payload. */
export const JSON_BODY_LIMIT = '1mb';

/** Length ceilings enforced at the validation boundary. */
export const FIELD_LIMITS = {
  SLUG_MAX: 120,
  TITLE_MAX: 200,
  NAME_MAX: 120,
  EMAIL_MAX: 254,
  PHONE_MAX: 32,
  URL_MAX: 2_048,
  CONTENT_MAX: 200_000,
  TEXT_ANSWER_MAX: 5_000,
  FORM_FIELDS_MAX: 60,
} as const;

/** Slug shape shared by forms and posts: lowercase, digits, single dashes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Machine-readable error codes returned in the response envelope. */
export const ERROR_CODE = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL_ERROR',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
