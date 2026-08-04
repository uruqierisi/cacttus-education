/**
 * Liveness and readiness probes.
 *
 * `/health` answers without touching the database so a Neon hiccup does not make the
 * platform recycle a healthy container; `/health/ready` is the one that proves the
 * DB round-trips and is what a deploy gate should watch.
 */
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/async-handler';
import { sendSuccess } from '../lib/api-response';
import { HTTP_STATUS } from '../config/constants';
import { logger } from '../lib/logger';

const router = Router();

router.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    try {
      await prisma.$queryRaw`SELECT 1`;
      sendSuccess(res, { status: 'ready', database: 'up' });
    } catch (error) {
      logger.error('readiness probe failed', {
        reason: error instanceof Error ? error.message : String(error),
      });
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Database unreachable.', details: [] } });
    }
  }),
);

export const healthRouter = router;
