import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { sendSuccess } from '../lib/api-response';
import { validatedQuery } from '../middleware/validate';
import * as statsService from '../services/stats.service';
import type { StatsTimeseriesQuery } from '../schemas/stats.schema';

/**
 * `GET /api/admin/stats/summary` — the top card row on the overview screen.
 *
 * No `auditContextFromRequest` here, and none in the two handlers below: these are
 * reads. See the header of `services/stats.service.ts`.
 */
export async function summary(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await statsService.getSummary(), HTTP_STATUS.OK);
}

/** `GET /api/admin/stats/timeseries?granularity=day|week|month&from&to` */
export async function timeseries(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<StatsTimeseriesQuery>(req);
  sendSuccess(res, await statsService.getTimeseries(query), HTTP_STATUS.OK);
}

/** `GET /api/admin/stats/by-type` — applications per FormType, zeros included. */
export async function byType(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await statsService.getByType(), HTTP_STATUS.OK);
}
