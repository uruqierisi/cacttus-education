/**
 * Cover-image intake.
 *
 * THE ORDER OF THESE CHECKS IS THE SECURITY DESIGN
 * ------------------------------------------------
 *   1. multer caps the byte count as the request streams (middleware/upload.ts).
 *   2. `detectImageType` sniffs MAGIC BYTES — the first point at which the file's real
 *      type is known. A `.exe` renamed to `.png` dies here.
 *   3. sharp re-decodes the pixels and RE-ENCODES the output. That is the step that
 *      matters most: the bytes written to disk are produced by sharp, not copied from
 *      the upload, so anything smuggled in a comment/EXIF/trailing-append segment of an
 *      otherwise-valid image is discarded rather than persisted. A polyglot file that
 *      is both valid PNG and valid HTML does not survive a re-encode.
 *   4. Only then does StorageAdapter assign a server-generated name and write it.
 *
 * WHY UPLOADS ARE NOT AUDITED
 * ---------------------------
 * Deliberate, and confirmed with the owner. An upload on its own changes nothing a
 * reader of the trail cares about: an orphaned file that no Post references is invisible
 * to the public site. The meaningful event is the Post create/update that ADOPTS the
 * URL, and `posts.service.ts` already audits both (POST_CREATED / POST_UPDATED) with the
 * cover URL in scope. Auditing here too would add a second row per image for no
 * additional accountability, and would have required a new AuditAction value that the
 * owner explicitly ruled out.
 */
import sharp from 'sharp';
import { IMAGE_UPLOAD } from '../config/constants';
import { ApiError } from '../lib/api-error';
import { detectImageType } from '../lib/image-type';
import { detectPdf } from '../lib/pdf-type';
import { storage } from '../lib/storage';
import { logger } from '../lib/logger';

export type UploadedImage = {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
};

/** A non-image upload. No dimensions — the only two facts a caller needs. */
export type UploadedDocument = {
  readonly url: string;
  readonly bytes: number;
};

const ALLOWED_LABEL = Object.keys(IMAGE_UPLOAD.ALLOWED).join(', ');

/**
 * Re-encode to the SAME format the sniff identified, downscaling only if the image is
 * wider than the cap. `withoutEnlargement` guarantees a small image is never upscaled.
 */
async function normalise(
  buffer: Buffer,
  extension: keyof typeof IMAGE_UPLOAD.ALLOWED,
): Promise<{ data: Buffer; width: number; height: number }> {
  // `animated: true` keeps every frame of an animated GIF/WebP; without it sharp would
  // silently flatten the image to its first frame.
  const pipeline = sharp(buffer, { animated: extension === 'gif' || extension === 'webp' }).resize({
    width: IMAGE_UPLOAD.MAX_WIDTH_PX,
    withoutEnlargement: true,
    fit: 'inside',
  });

  const encoded =
    extension === 'png'
      ? pipeline.png()
      : extension === 'jpg'
        ? pipeline.jpeg({ quality: 85, mozjpeg: true })
        : extension === 'webp'
          ? pipeline.webp({ quality: 85 })
          : pipeline.gif();

  const { data, info } = await encoded.toBuffer({ resolveWithObject: true });

  // For an animated image `info.height` is the height of the whole filmstrip; `pageHeight`
  // is the real frame height. Report the frame so the dashboard preview is not distorted.
  const height = info.pageHeight ?? info.height;

  return { data, width: info.width, height };
}

export async function storeCoverImage(file: Express.Multer.File): Promise<UploadedImage> {
  if (!file?.buffer || file.buffer.length === 0) {
    throw ApiError.badRequest('Nuk u dërgua asnjë foto.');
  }

  const detected = detectImageType(file.buffer);

  if (!detected) {
    // Intentionally does NOT echo the client-sent mime or filename back — that is
    // attacker-controlled text and echoing it invites header/log injection games.
    throw ApiError.badRequest(
      `Kjo skedë nuk është një foto e vlefshme. Formatet e lejuara: ${ALLOWED_LABEL}.`,
    );
  }

  let normalised: { data: Buffer; width: number; height: number };

  try {
    normalised = await normalise(file.buffer, detected.extension);
  } catch (error) {
    // The magic bytes matched but the decoder refused: a truncated or corrupt file, or a
    // header glued onto non-image data. Logged because it is also the signature of
    // someone probing the endpoint.
    logger.warn('image passed magic-byte sniffing but failed to decode', {
      extension: detected.extension,
      bytes: file.buffer.length,
      reason: error instanceof Error ? error.message : String(error),
    });
    throw ApiError.badRequest('Fotoja është e dëmtuar ose nuk mund të lexohet.');
  }

  const url = await storage.save({ buffer: normalised.data, extension: detected.extension });

  return {
    url,
    width: normalised.width,
    height: normalised.height,
    bytes: normalised.data.length,
  };
}

/**
 * Syllabus PDF intake ("Shkarko planprogramin").
 *
 * DELIBERATELY SHORTER THAN THE IMAGE PATH ABOVE, AND THAT IS THE POINT.
 * The image path's third step — sharp re-encoding the pixels so the stored bytes are
 * ours — has no counterpart here. Re-writing a PDF safely requires a real sanitiser,
 * and pretending a partial one is equivalent would be worse than being explicit: what
 * lands on disk is the uploader's bytes, unmodified.
 *
 * What still holds:
 *   1. multer capped the byte count while the request streamed;
 *   2. `detectPdf` sniffed the header AND the trailer, so a renamed executable or an
 *      HTML polyglot does not get stored under a .pdf name;
 *   3. StorageAdapter assigns a random-UUID filename — the client contributes nothing;
 *   4. delivery is inert: nosniff, CSP sandbox, and `Content-Disposition: attachment`
 *      so the browser downloads instead of running it in its viewer (see app.ts).
 * Combined with the endpoint being staff-only, that is the containment. It is a
 * distribution channel for a document an admin chose to publish, not a sandbox.
 *
 * NOT AUDITED, for the same reason cover images are not: an upload nobody references
 * is invisible. The meaningful event is the TRAINING_CREATED / TRAINING_UPDATED that
 * adopts the URL, and trainings.service.ts records `syllabusPdf` in that metadata.
 */
export async function storeSyllabusPdf(file: Express.Multer.File): Promise<UploadedDocument> {
  if (!file?.buffer || file.buffer.length === 0) {
    throw ApiError.badRequest('Nuk u dërgua asnjë skedë.');
  }

  const detected = detectPdf(file.buffer);

  if (!detected) {
    // Does not echo the client's filename or mime back — attacker-controlled text.
    throw ApiError.badRequest('Kjo skedë nuk është një PDF i vlefshëm. Lejohet vetëm PDF.');
  }

  const url = await storage.save({ buffer: file.buffer, extension: detected.extension });

  return { url, bytes: file.buffer.length };
}
