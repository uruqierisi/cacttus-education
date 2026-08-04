import type { Request, Response } from 'express';
import { sendCreated, sendCsv, sendSuccess } from '../lib/api-response';
import { auditContextFromRequest } from '../lib/audit';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate';
import * as formsService from '../services/forms.service';
import * as submissionsCsvService from '../services/submissions-csv.service';
import { FIELD_TYPES } from '../services/form-fields.service';
import type { IdParam } from '../schemas/common.schema';
import type {
  CreateFormInput,
  ListArchivedFormsQuery,
  ListFormsQuery,
  UpdateFormInput,
} from '../schemas/form.schema';

export async function list(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<ListFormsQuery>(req);
  const { items, meta } = await formsService.listForms(query);
  sendSuccess(res, items, 200, meta);
}

/** ADMIN-only view of soft-deleted forms. */
export async function listArchived(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<ListArchivedFormsQuery>(req);
  const { items, meta } = await formsService.listArchivedForms(query);
  sendSuccess(res, items, 200, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  sendSuccess(res, await formsService.getFormById(id));
}

// The audit context is assembled HERE, at the HTTP boundary, and handed to the service
// as an ordinary parameter. Controllers stay HTTP-shaped; services stay logic-shaped
// and never reach into a request object.
export async function create(req: Request, res: Response): Promise<void> {
  const input = validatedBody<CreateFormInput>(req);
  sendCreated(res, await formsService.createForm(input, auditContextFromRequest(req)));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const input = validatedBody<UpdateFormInput>(req);
  sendSuccess(res, await formsService.updateForm(id, input, auditContextFromRequest(req)));
}

/** DELETE is a soft delete — the row survives and can be restored. */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  sendSuccess(res, await formsService.softDeleteForm(id, auditContextFromRequest(req)));
}

export async function restore(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  sendSuccess(res, await formsService.restoreForm(id, auditContextFromRequest(req)));
}

/**
 * `GET /api/admin/forms/:id/submissions/export` — this form's submissions as a CSV.
 * ADMIN only.
 *
 * Backs the delete-with-backup flow: the dashboard downloads this, then issues the soft
 * delete. Identical CSV format to the global export, scoped to one form.
 */
export async function exportSubmissions(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const result = await submissionsCsvService.exportFormSubmissionsCsv(
    id,
    auditContextFromRequest(req),
  );

  sendCsv(res, result.filename, result.csv, result.truncated);
}

/** Metadata the dashboard form-builder uses to render its type picker. */
export async function fieldTypes(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { fieldTypes: FIELD_TYPES });
}
