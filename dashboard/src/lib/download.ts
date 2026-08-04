/**
 * Authenticated file downloads.
 *
 * A plain `<a href>` cannot be used for these: the CSV endpoints are bearer-protected
 * and the browser will not attach the in-memory access token to a normal navigation.
 * So the request goes through the axios client, and the resulting blob is turned into
 * an object URL and clicked programmatically.
 *
 * `URL.revokeObjectURL` is not optional — every un-revoked object URL pins its blob in
 * memory for the lifetime of the document, and an admin exporting the inbox a dozen
 * times a day would otherwise leak megabytes of lead PII into the tab.
 */
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './api-client';

/** Set by the API when an export was cut off at the row ceiling. */
export const EXPORT_TRUNCATED_HEADER = 'x-export-truncated';

const FILENAME_PATTERN = /filename="([^"]+)"/;

export type CsvDownloadResult = {
  readonly filename: string;
  /** True when the API signalled the export hit `EXPORT_MAX_ROWS`. */
  readonly isTruncated: boolean;
};

function readFilename(disposition: unknown, fallback: string): string {
  if (typeof disposition !== 'string') {
    return fallback;
  }
  return FILENAME_PATTERN.exec(disposition)?.[1] ?? fallback;
}

/**
 * GET `url` as a CSV and save it to disk.
 *
 * Errors are deliberately NOT swallowed — they propagate as `ApiError` so the calling
 * page can show an Albanian toast. That matters most for the delete-with-backup flow,
 * where a silent export failure followed by a successful delete would destroy exactly
 * the data the backup existed to protect.
 */
export async function downloadCsv(
  url: string,
  fallbackFilename: string,
  options?: AxiosRequestConfig,
): Promise<CsvDownloadResult> {
  const response = await apiClient.get<Blob>(url, { ...options, responseType: 'blob' });

  const filename = readFilename(response.headers['content-disposition'], fallbackFilename);
  const objectUrl = URL.createObjectURL(response.data);

  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return {
    filename,
    isTruncated: response.headers[EXPORT_TRUNCATED_HEADER] === 'true',
  };
}

/** Copy text to the clipboard, reporting whether it worked. */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Clipboard access is permission-gated and fails in insecure contexts; the caller
    // shows a toast telling the user to copy manually.
    return false;
  }
}
