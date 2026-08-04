import type { Request, Response } from 'express';
import { sendCsv, sendSuccess } from '../lib/api-response';
import { ApiError } from '../lib/api-error';
import { auditContextFromRequest } from '../lib/audit';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate';
import { CSV_UPLOAD_FIELD } from '../middleware/upload';
import * as submissionsService from '../services/submissions.service';
import * as submissionsCsvService from '../services/submissions-csv.service';
import type { IdParam } from '../schemas/common.schema';
import type {
  ExportSubmissionsQuery,
  ImportSubmissionsInput,
  ListSubmissionsQuery,
  UpdateSubmissionStatusInput,
} from '../schemas/submission.schema';

export async function list(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<ListSubmissionsQuery>(req);
  const { items, meta } = await submissionsService.listSubmissions(query);
  sendSuccess(res, items, 200, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  sendSuccess(res, await submissionsService.getSubmissionById(id));
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const { status } = validatedBody<UpdateSubmissionStatusInput>(req);
  sendSuccess(
    res,
    await submissionsService.updateSubmissionStatus(id, status, auditContextFromRequest(req)),
  );
}

/**
 * `GET /api/admin/submissions/export` — the filtered inbox as a CSV download.
 *
 * Same filters as `GET /api/admin/submissions`, enforced by sharing one query builder in
 * the service layer. The audit row is written before the body is streamed.
 */
export async function exportCsv(req: Request, res: Response): Promise<void> {
  const filters = validatedQuery<ExportSubmissionsQuery>(req);
  const result = await submissionsCsvService.exportSubmissionsCsv(
    filters,
    auditContextFromRequest(req),
  );

  sendCsv(res, result.filename, result.csv, result.truncated);
}

/**
 * `POST /api/admin/submissions/import` — bulk-create submissions for one form from a
 * multipart CSV upload. ADMIN only.
 *
 * Invalid rows are skipped and reported; the batch is never aborted for one bad row.
 */
export async function importCsv(req: Request, res: Response): Promise<void> {
  const input = validatedBody<ImportSubmissionsInput>(req);
  const file = req.file;

  if (!file) {
    // The size/type guards live in `uploadCsvFile`; this is the "no file at all" case.
    throw ApiError.badRequest(`Attach the CSV file in the "${CSV_UPLOAD_FIELD}" field.`);
  }

  sendSuccess(
    res,
    await submissionsCsvService.importSubmissionsCsv(input, file, auditContextFromRequest(req)),
  );
}

export async function stats(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await submissionsService.getSubmissionStats());
}
