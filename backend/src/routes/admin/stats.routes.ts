/**
 * `/api/admin/stats` — aggregates for the overview screen. READ ONLY.
 *
 * THIS ROUTER DECLARES GET ROUTES AND NOTHING ELSE, for the same reason
 * `audit-logs.routes.ts` does: there is nothing here to write. Every number served
 * from this file is derived from rows that `submissions` and `forms` already own.
 *
 * `requireAdmin` is mounted ONCE on the router — the same pattern as
 * `users.routes.ts` and `audit-logs.routes.ts` — so an EDITOR is rejected with 403 at
 * the middleware before any query runs, and any endpoint added here later is
 * admin-gated by default. Business-wide conversion and month-over-month numbers are
 * management information, not editorial information.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { requireAdmin } from '../../middleware/auth';
import { statsTimeseriesQuerySchema } from '../../schemas/stats.schema';
import * as statsController from '../../controllers/stats.controller';

const router = Router();

router.use(requireAdmin);

// GET /api/admin/stats/summary
router.get('/summary', asyncHandler(statsController.summary));

// GET /api/admin/stats/timeseries?granularity=day|week|month&from&to
router.get(
  '/timeseries',
  validate({ query: statsTimeseriesQuerySchema }),
  asyncHandler(statsController.timeseries),
);

// GET /api/admin/stats/by-type
router.get('/by-type', asyncHandler(statsController.byType));

export const adminStatsRouter = router;
