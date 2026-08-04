import axios from 'axios';

/** Mirrors the backend error envelope. */
export type ApiErrorDetail = {
  readonly field: string;
  readonly message: string;
};

export type ApiErrorBody = {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details: readonly ApiErrorDetail[];
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: readonly ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details: readonly ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { error?: { message?: unknown; code?: unknown } };
  return typeof candidate.error?.message === 'string' && typeof candidate.error?.code === 'string';
}

const NETWORK_ERROR_STATUS = 0;

/**
 * Normalise anything thrown by axios into an `ApiError`, so every UI surface can
 * render `error.message` without re-deriving the shape.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const body = error.response?.data;

    if (isApiErrorBody(body)) {
      return new ApiError(
        error.response?.status ?? NETWORK_ERROR_STATUS,
        body.error.code,
        body.error.message,
        body.error.details ?? [],
      );
    }

    if (!error.response) {
      return new ApiError(
        NETWORK_ERROR_STATUS,
        'NETWORK_ERROR',
        'Could not reach the server. Check your connection and try again.',
        [],
      );
    }

    return new ApiError(
      error.response.status,
      'UNEXPECTED_RESPONSE',
      error.message || 'The server returned an unexpected response.',
      [],
    );
  }

  return new ApiError(
    NETWORK_ERROR_STATUS,
    'UNKNOWN',
    error instanceof Error ? error.message : 'Something went wrong.',
    [],
  );
}

/** Human-readable message including field-level detail, for toasts. */
export function describeApiError(error: unknown): string {
  const apiError = toApiError(error);

  if (apiError.details.length === 0) {
    return apiError.message;
  }

  const first = apiError.details[0];
  return first ? `${apiError.message} (${first.field}: ${first.message})` : apiError.message;
}
