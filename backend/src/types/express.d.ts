import type { Role } from '@prisma/client';

/** The authenticated principal attached by `requireAuth`. */
export type AuthenticatedUser = {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
};

/** Output of the Zod validation middleware, keyed by request part. */
export type ValidatedRequest = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Present only after `requireAuth` has run. */
      auth?: AuthenticatedUser;
      /** Present only after `validate()` has run for that request part. */
      validated?: ValidatedRequest;
      /** Correlation id assigned by the request logger. */
      requestId?: string;
    }
  }
}

export {};
