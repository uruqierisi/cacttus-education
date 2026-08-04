/**
 * Real PDF detection, by CONTENT — the sibling of `image-type.ts`, same reasoning.
 *
 * The client-sent `Content-Type: application/pdf` and the `.pdf` filename are both
 * attacker-controlled strings in a multipart body. The only trustworthy signal is the
 * file's own header, so that is what this reads, and the extension written to disk is
 * derived from THIS result rather than copied from the upload.
 *
 * WHAT THIS DOES NOT DO
 * ---------------------
 * It does not make a PDF safe. A file can start with a valid `%PDF-` header and still
 * contain JavaScript, an embedded file, or a malformed object that targets a reader
 * bug. Sniffing only establishes "this is the file type it claims to be", which is what
 * stops a renamed `.exe` or an HTML polyglot from being stored under a `.pdf` name and
 * later served back. Containment of the file's CONTENTS is delivery-side — see the
 * `PDF_UPLOAD` note in config/constants.ts and the static handler in app.ts.
 */
import type { UploadedPdfExtension } from '../config/constants';

export type DetectedPdf = {
  readonly extension: UploadedPdfExtension;
  readonly mimeType: string;
};

/** `%PDF-` — the five bytes every PDF opens with, per ISO 32000-1 §7.5.2. */
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;

/**
 * Shortest thing that could plausibly be a PDF. The header alone is 5 bytes and a
 * document needs a trailer too; 32 is a generous floor that still rejects a file
 * consisting of nothing but the magic number.
 */
const MIN_PDF_BYTES = 32;

/**
 * How far from the END to look for the trailer.
 *
 * `%%EOF` is required to be the last line, but real-world writers leave trailing
 * whitespace or a stray newline after it, and some append a small amount of junk. A
 * 1 KB window tolerates that without scanning a 10 MB buffer.
 */
const TRAILER_WINDOW_BYTES = 1024;

function startsWith(buffer: Buffer, bytes: readonly number[]): boolean {
  if (buffer.length < bytes.length) {
    return false;
  }
  return bytes.every((byte, index) => buffer[index] === byte);
}

/**
 * Identify a buffer as a PDF, or return null.
 *
 * Both ends are checked. The header alone is trivial to prepend to arbitrary content —
 * that is exactly how polyglot files are built — so requiring a `%%EOF` trailer as well
 * raises the cost of passing this check with a file that is not really a document. It
 * is a cheap structural sanity check, not a parse, and it is not claimed to be more.
 */
export function detectPdf(buffer: Buffer): DetectedPdf | null {
  if (buffer.length < MIN_PDF_BYTES || !startsWith(buffer, PDF_SIGNATURE)) {
    return null;
  }

  const tail = buffer.subarray(Math.max(0, buffer.length - TRAILER_WINDOW_BYTES));

  if (!tail.includes('%%EOF')) {
    return null;
  }

  return { extension: 'pdf', mimeType: 'application/pdf' };
}
