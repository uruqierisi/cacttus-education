/**
 * Process entry point: bind the port, then shut down cleanly.
 *
 * Graceful shutdown matters on Railway — an unclosed Prisma pool on SIGTERM leaves
 * connections dangling against Neon through the next deploy.
 */
import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { disconnectPrisma } from './lib/prisma';
import { upsertCanonicalForms } from './lib/canonical-forms';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function registerShutdownHandlers(server: Server): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.info('shutting down', { signal });

    const forceExit = setTimeout(() => {
      logger.error('graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async () => {
      try {
        await disconnectPrisma();
        logger.info('shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('error during shutdown', {
          reason: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled promise rejection', { reason: String(reason) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('uncaught exception', { reason: error.message, stack: error.stack });
    process.exit(1);
  });
}

/**
 * Which interface to bind.
 *
 * Production keeps the original no-host `listen(PORT)`: that binds `::` with IPv4
 * fallback, which is what the hosting platform's health check and router expect, and
 * hard-coding `0.0.0.0` there would drop IPv6 silently.
 *
 * Outside production the default is `0.0.0.0`, so a phone on the same WiFi can reach the
 * API at `http://<host-lan-ip>:4000`. `HOST` overrides either way — set `HOST=127.0.0.1`
 * to go back to a loopback-only dev server.
 */
function resolveHost(): string | undefined {
  if (env.HOST) {
    return env.HOST;
  }

  return env.isProduction ? undefined : '0.0.0.0';
}

/*
 * IN server.ts, NOT app.ts. `createApp` is imported by `tests/helpers/api.ts`, so a
 * database write hung off app construction would fire on every test file's import and
 * write into the test database as a side effect of building an Express app. This is the
 * process entry point — the one place a boot-time side effect belongs.
 *
 * Awaited BEFORE the port is bound, so the forms are in place before the first request
 * can arrive. It never throws (see the module), so a database that is briefly down
 * delays the listen by one failed round trip and nothing more.
 */
async function start(): Promise<void> {
  await upsertCanonicalForms();

  const app = createApp();

  const host = resolveHost();

  const onListening = (): void => {
    logger.info('api listening', {
      host: host ?? '::',
      port: env.PORT,
      env: env.NODE_ENV,
      allowedOrigins: [...env.allowedOrigins],
      credentialedOrigins: [...env.credentialedOrigins],
    });
  };

  const server = host ? app.listen(env.PORT, host, onListening) : app.listen(env.PORT, onListening);

  registerShutdownHandlers(server);
}

void start();
