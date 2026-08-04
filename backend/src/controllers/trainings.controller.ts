import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../lib/api-response';
import { auditContextFromRequest } from '../lib/audit';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate';
import * as trainingsService from '../services/trainings.service';
import type { IdParam } from '../schemas/common.schema';
import type {
  CreateTrainingInput,
  ListTrainingsQuery,
  UpdateTrainingInput,
} from '../schemas/training.schema';

export async function list(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<ListTrainingsQuery>(req);
  const { items, meta } = await trainingsService.listTrainings(query);
  sendSuccess(res, items, 200, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  sendSuccess(res, await trainingsService.getTrainingById(id));
}

/**
 * Options for the editor's "Forma e aplikimit" dropdown.
 *
 * Deliberately NOT `GET /api/admin/forms?isActive=true`: that returns paginated FormDtos
 * with field definitions and submission counts, of which the dropdown needs two strings.
 * A purpose-built endpoint keeps the payload proportional to the widget.
 */
export async function formOptions(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await trainingsService.listFormOptions());
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = validatedBody<CreateTrainingInput>(req);
  sendCreated(res, await trainingsService.createTraining(input, auditContextFromRequest(req)));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const input = validatedBody<UpdateTrainingInput>(req);
  sendSuccess(res, await trainingsService.updateTraining(id, input, auditContextFromRequest(req)));
}

/** DELETE is a soft delete — the row survives so its submissions keep their provenance. */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  sendSuccess(res, await trainingsService.softDeleteTraining(id, auditContextFromRequest(req)));
}
