/**
 * Cover-image upload.
 *
 * Uses the shared `apiClient` rather than a bare axios call so the upload inherits the
 * Authorization header and the 401 -> refresh -> replay interceptor. A replayed
 * multipart request works because the `FormData` body is re-sent by reference; the
 * browser rebuilds the multipart stream from the same File handle.
 *
 * `Content-Type` MUST be cleared per request — see UPLOAD_HEADERS below.
 */
import type { AxiosProgressEvent } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiEnvelope } from '@/lib/api-client';

export type UploadedImage = {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
};

/** Mirrors the server allowlist; used only to set the file picker's `accept` filter. */
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

/** Mirrors the server cap. Client-side check is a courtesy — the server re-enforces it. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Clears the JSON default so the multipart body is sent correctly.
 *
 * `apiClient` is created with `headers: { 'Content-Type': 'application/json' }`, which is
 * right for every other endpoint and WRONG here. axios does not drop an explicitly
 * configured Content-Type just because the body is FormData, so without this override the
 * request goes out as `application/json` with **no multipart boundary**. multer then
 * finds nothing to parse, `req.file` is undefined, and the server answers
 * 400 "Zgjidh një foto për ta ngarkuar." — which is exactly the bug this fixes.
 *
 * Setting the value to `undefined` makes axios delete the header, after which it (in the
 * browser, the FormData serialiser) sets `multipart/form-data; boundary=…` itself. The
 * boundary can only be generated at send time, which is why it must never be hardcoded.
 */
const UPLOAD_HEADERS = { 'Content-Type': undefined } as const;

export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedImage> {
  const body = new FormData();
  // Must match IMAGE_UPLOAD.FIELD_NAME / upload.single(...) on the backend.
  body.append('file', file);

  const response = await apiClient.post<ApiEnvelope<UploadedImage>>('/api/admin/uploads', body, {
    headers: UPLOAD_HEADERS,
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!onProgress || !event.total) {
        return;
      }
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
  });

  return response.data.data;
}
