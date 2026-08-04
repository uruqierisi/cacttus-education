/**
 * Multipart CSV upload.
 *
 * WHERE THE SIZE CAP IS ENFORCED
 * ------------------------------
 * At the UPLOAD boundary, by multer's own `limits.fileSize`, not by inspecting a buffer
 * afterwards. multer counts bytes as they stream in and aborts the request the moment
 * the cap is crossed, so a 2 GB upload costs 5 MB of memory and is rejected in
 * milliseconds. Checking `file.buffer.length` after the fact would mean the whole file
 * had already been read into the process — which is precisely the denial-of-service the
 * limit exists to prevent.
 *
 * WHY MEMORY STORAGE
 * ------------------
 * The file is bounded to 5 MB, parsed once and discarded. Writing it to disk would add a
 * temp-file lifecycle, a cleanup obligation on every error path, and a filename supplied
 * by the client — `memoryStorage` has none of those. Nothing here ever touches the
 * filesystem, so `file.originalname` is only ever used for extension sniffing and is
 * never joined onto a path.
 */
import type { RequestHandler } from 'express';
import multer, { MulterError } from 'multer';
import { CSV_IMPORT, ERROR_CODE, HTTP_STATUS, IMAGE_UPLOAD } from '../config/constants';
import { ApiError } from '../lib/api-error';

/** Multipart field name the CSV must be uploaded under. */
export const CSV_UPLOAD_FIELD = 'file';

/**
 * Content types browsers and OSes actually attach to a .csv file. Windows commonly
 * reports `application/vnd.ms-excel`, and several clients fall back to
 * `application/octet-stream`, so the extension is accepted as an alternative signal.
 * Neither check is a security control — the content is parsed strictly regardless — they
 * exist to fail an obvious mistake (uploading a PDF) with a clear message.
 */
const ACCEPTED_MIME_TYPES: ReadonlySet<string> = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

function looksLikeCsv(file: Express.Multer.File): boolean {
  const mimeType = (file.mimetype ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  const hasCsvExtension = /\.csv$/i.test(file.originalname ?? '');

  return hasCsvExtension || ACCEPTED_MIME_TYPES.has(mimeType);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CSV_IMPORT.MAX_FILE_BYTES,
    // Exactly one file, and a handful of small text fields (`formId`). Anything beyond
    // that is either a bug in the client or someone probing the endpoint.
    files: 1,
    fields: 10,
    fieldSize: 100 * 1024,
    parts: 12,
  },
  fileFilter: (_req, file, callback) => {
    if (!looksLikeCsv(file)) {
      callback(ApiError.badRequest('The uploaded file must be a .csv file.'));
      return;
    }
    callback(null, true);
  },
});

function translateUploadError(error: unknown): unknown {
  if (error instanceof ApiError) {
    return error;
  }

  if (!(error instanceof MulterError)) {
    // Not a multipart problem — hand it to the error middleware untouched so a genuine
    // bug is logged with its stack rather than disguised as a 400.
    return error;
  }

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ApiError(
        HTTP_STATUS.PAYLOAD_TOO_LARGE,
        ERROR_CODE.VALIDATION_FAILED,
        `The CSV file is larger than ${Math.floor(CSV_IMPORT.MAX_FILE_BYTES / (1024 * 1024))} MB.`,
      );
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return ApiError.badRequest(
        `Upload exactly one CSV file, in the "${CSV_UPLOAD_FIELD}" field.`,
      );
    case 'LIMIT_FIELD_COUNT':
    case 'LIMIT_FIELD_KEY':
    case 'LIMIT_FIELD_VALUE':
    case 'LIMIT_PART_COUNT':
      return ApiError.badRequest('The upload contains too many or too large form fields.');
    default:
      return ApiError.badRequest('The file upload could not be processed.');
  }
}

/**
 * Accept a single CSV file plus the accompanying text fields.
 *
 * multer's own errors are translated here rather than in the terminal error handler, so
 * the size cap surfaces as a 413 with a message a user can act on instead of a generic
 * 500. Text fields land on `req.body`, so a `validate({ body })` MUST run after this.
 */
export const uploadCsvFile: RequestHandler = (req, res, next) => {
  upload.single(CSV_UPLOAD_FIELD)(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    next(translateUploadError(error));
  });
};

// ---------------------------------------------------------------------------
// Blog cover images
// ---------------------------------------------------------------------------

/**
 * NO `fileFilter` HERE, ON PURPOSE.
 *
 * multer's `fileFilter` only ever sees the client-supplied mime and filename, both of
 * which an attacker controls outright. Rejecting there would look like validation while
 * proving nothing. The real gate is `detectImageType`, which reads the file's own magic
 * bytes once the bounded buffer is in hand — see services/uploads.service.ts. multer's
 * job is narrowed to what it is genuinely good at: capping the byte count as the request
 * streams, so an oversized upload dies mid-flight instead of filling memory.
 */
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_UPLOAD.MAX_FILE_BYTES,
    files: 1,
    fields: 4,
    fieldSize: 8 * 1024,
    parts: 6,
  },
});

function translateImageUploadError(error: unknown): unknown {
  if (error instanceof ApiError) {
    return error;
  }

  if (!(error instanceof MulterError)) {
    return error;
  }

  const megabytes = Math.floor(IMAGE_UPLOAD.MAX_FILE_BYTES / (1024 * 1024));

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ApiError(
        HTTP_STATUS.PAYLOAD_TOO_LARGE,
        ERROR_CODE.VALIDATION_FAILED,
        `Fotoja është më e madhe se ${megabytes} MB. Zgjidh një foto më të vogël.`,
      );
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return ApiError.badRequest(
        `Ngarko vetëm një foto, në fushën "${IMAGE_UPLOAD.FIELD_NAME}".`,
      );
    default:
      return ApiError.badRequest('Ngarkimi i fotos dështoi. Provo përsëri.');
  }
}

/** Accept a single cover image. Type validation happens downstream, by content. */
export const uploadImageFile: RequestHandler = (req, res, next) => {
  imageUpload.single(IMAGE_UPLOAD.FIELD_NAME)(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    next(translateImageUploadError(error));
  });
};
