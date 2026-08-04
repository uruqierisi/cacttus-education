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

function start(): void {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info('api listening', {
      port: env.PORT,
      env: env.NODE_ENV,
      allowedOrigins: [...env.allowedOrigins],
    });
  });

  registerShutdownHandlers(server);
}

start();
