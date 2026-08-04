/**
 * Singleton Prisma client.
 *
 * `tsx watch` re-evaluates modules on every save. Without the global cache each
 * reload would open a fresh connection pool against Neon and exhaust the connection
 * limit within a few edits, so the instance is stashed on `globalThis` in
 * non-production and reused.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
    errorFormat: env.isDevelopment ? 'pretty' : 'minimal',
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

/** Prisma error code for a unique-constraint violation. */
export const PRISMA_UNIQUE_VIOLATION = 'P2002';
/** Prisma error code for "record required but not found". */
export const PRISMA_RECORD_NOT_FOUND = 'P2025';

export function isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_UNIQUE_VIOLATION
  );
}

export function isRecordNotFound(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_RECORD_NOT_FOUND
  );
}

/** Field names that tripped a unique constraint, e.g. `['slug']`. */
export function uniqueViolationTargets(
  error: Prisma.PrismaClientKnownRequestError,
): readonly string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.filter((entry): entry is string => typeof entry === 'string');
  }
  return typeof target === 'string' ? [target] : [];
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
