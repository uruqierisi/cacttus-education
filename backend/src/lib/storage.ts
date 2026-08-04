/**
 * Object storage behind a two-method seam.
 *
 * THE SEAM
 * --------
 * Controllers and services depend on `StorageAdapter`, never on `fs`. Moving to S3 or
 * Cloudflare R2 is therefore ONE new file implementing this interface plus one line in
 * `storage` below — no route, controller, service or schema changes. That is the whole
 * point of the indirection, and it is why `save()` returns a finished public URL rather
 * than a path or a key: a bucket adapter hands back a CDN URL, and nothing upstream can
 * tell the difference.
 *
 * PATH-TRAVERSAL SAFETY (LocalDiskAdapter)
 * ----------------------------------------
 * The client's filename is never used, not even sanitised — it is discarded entirely and
 * replaced with `crypto.randomUUID()` plus an extension derived from CONTENT sniffing.
 * A name can therefore contain `../`, a drive letter, a NUL byte or 4 KB of Unicode and
 * none of it reaches the filesystem. `assertInsideRoot` is a second, independent check
 * that the resolved absolute path is still under the upload root, so even a future bug
 * in id generation cannot write outside it.
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { IMAGE_UPLOAD, type UploadedImageExtension } from '../config/constants';
import { env } from '../config/env';
import { logger } from './logger';

export type SaveImageInput = {
  readonly buffer: Buffer;
  readonly extension: UploadedImageExtension;
};

export interface StorageAdapter {
  /** Persist the bytes and return the absolute, publicly reachable URL. */
  save(input: SaveImageInput): Promise<string>;
  /**
   * Remove a previously saved object, addressed by the URL `save` returned.
   * Returns false when the URL is not ours or the object is already gone — deleting
   * something that does not exist is not an error worth propagating.
   */
  delete(publicUrl: string): Promise<boolean>;
}

/** Absolute path of the upload root. Resolved once, reused for every containment check. */
const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);

export function uploadRoot(): string {
  return UPLOAD_ROOT;
}

/**
 * Throw unless `candidate` resolves to something inside the upload root.
 *
 * `path.relative` is the reliable form: a result that is empty, starts with `..`, or is
 * absolute all mean the candidate escaped. String prefix comparison would be fooled by
 * a sibling directory such as `uploads-evil`.
 */
function assertInsideRoot(candidate: string): void {
  const relative = path.relative(UPLOAD_ROOT, candidate);

  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to touch a path outside the upload root: ${candidate}`);
  }
}

export class LocalDiskAdapter implements StorageAdapter {
  async save({ buffer, extension }: SaveImageInput): Promise<string> {
    // The ONLY source of the filename. Nothing from the client contributes to it.
    const filename = `${randomUUID()}.${extension}`;
    const absolute = path.join(UPLOAD_ROOT, filename);

    assertInsideRoot(absolute);

    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    // `wx` fails rather than overwriting if the name somehow already exists.
    await fs.writeFile(absolute, buffer, { flag: 'wx' });

    return `${env.PUBLIC_API_URL}${IMAGE_UPLOAD.PUBLIC_PATH}/${filename}`;
  }

  async delete(publicUrl: string): Promise<boolean> {
    const filename = filenameFromPublicUrl(publicUrl);

    if (!filename) {
      return false;
    }

    const absolute = path.join(UPLOAD_ROOT, filename);

    try {
      assertInsideRoot(absolute);
      await fs.unlink(absolute);
      return true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === 'ENOENT') {
        return false;
      }

      // Never swallowed: a permission problem on the upload directory is an operational
      // fault someone needs to see, even though it must not fail the caller's request.
      logger.error('failed to delete uploaded file', {
        filename,
        reason: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Extract the stored filename from a URL this adapter produced, or null for anything
 * else — an externally pasted cover URL must never resolve to a local path.
 *
 * The strict pattern is the security control: only `<uuid>.<allowed-ext>` is accepted,
 * so no traversal sequence, nested path or query string can survive the parse.
 */
const STORED_FILENAME = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(?:${Object.keys(
    IMAGE_UPLOAD.ALLOWED,
  ).join('|')})$`,
  'i',
);

export function filenameFromPublicUrl(publicUrl: string): string | null {
  const prefix = `${env.PUBLIC_API_URL}${IMAGE_UPLOAD.PUBLIC_PATH}/`;

  if (!publicUrl.startsWith(prefix)) {
    return null;
  }

  const candidate = publicUrl.slice(prefix.length);

  return STORED_FILENAME.test(candidate) ? candidate : null;
}

/**
 * The active adapter. Swap this line — and only this line — for S3/R2:
 *   export const storage: StorageAdapter = new S3Adapter();
 */
export const storage: StorageAdapter = new LocalDiskAdapter();
