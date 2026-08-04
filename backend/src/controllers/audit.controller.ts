import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { sendSuccess } from '../lib/api-response';
import { validatedQuery } from '../middleware/validate';
import * as auditService from '../services/audit.service';
import type { ListAuditLogsQuery } from '../schemas/audit.schema';

export async function list(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<ListAuditLogsQuery>(req);
  const { items, meta } = await auditService.listAuditLogs(query);

  sendSuccess(res, items, HTTP_STATUS.OK, meta);
}

/** Enum values for the dashboard's action filter. No query parameters, no DB read. */
export async function actions(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { actions: auditService.listAuditActions() });
}
