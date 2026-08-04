/**
 * Real image-type detection, by CONTENT.
 *
 * WHY NOT THE CLIENT-SENT MIME OR THE EXTENSION
 * ---------------------------------------------
 * Both are attacker-controlled strings in a multipart body. `malware.exe` renamed to
 * `photo.png` with `Content-Type: image/png` satisfies every naive check ever written.
 * The only trustworthy signal is the first few bytes of the file itself, so that is the
 * one this module reads — and the extension we later write to disk is DERIVED from the
 * sniff result, never copied from the upload.
 *
 * SVG IS NOT HERE, DELIBERATELY. It is XML, has no fixed magic number, and can carry
 * script — see the note on `IMAGE_UPLOAD` in config/constants.ts.
 */
import type { UploadedImageExtension } from '../config/constants';

export type DetectedImage = {
  readonly extension: UploadedImageExtension;
  readonly mimeType: string;
};

/** Longest signature we need to inspect (WEBP needs 12 bytes). */
const MAX_SIGNATURE_BYTES = 12;

function startsWith(buffer: Buffer, bytes: readonly number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) {
    return false;
  }
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

/** `RIFF....WEBP` — the format tag sits at offset 8, after the 4-byte size field. */
function isWebp(buffer: Buffer): boolean {
  return (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  );
}

/**
 * Identify a buffer, or return null when it is not one of the four allowed formats.
 *
 * Signatures:
 *   PNG   89 50 4E 47 0D 0A 1A 0A
 *   JPEG  FF D8 FF
 *   GIF   "GIF87a" | "GIF89a"
 *   WEBP  "RIFF" ....  "WEBP"
 */
export function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length < MAX_SIGNATURE_BYTES) {
    return null;
  }

  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extension: 'png', mimeType: 'image/png' };
  }

  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }

  if (isWebp(buffer)) {
    return { extension: 'webp', mimeType: 'image/webp' };
  }

  if (
    startsWith(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return { extension: 'gif', mimeType: 'image/gif' };
  }

  return null;
}
