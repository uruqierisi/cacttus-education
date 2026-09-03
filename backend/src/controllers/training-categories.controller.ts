import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../lib/api-response';
import { HTTP_STATUS } from '../config/constants';
import { auditContextFromRequest } from '../lib/audit';
import { validatedBody, validatedParams } from '../middleware/validate';
import * as categoriesService from '../services/training-categories.service';
import type { IdParam } from '../schemas/common.schema';
import type {
  CreateTrainingCategoryInput,
  UpdateTrainingCategoryInput,
} from '../schemas/training-category.schema';

/**
 * The whole taxonomy, unpaginated.
 *
 * Deliberately so: this list feeds a `<select>` and a settings table, both of which need
 * every option at once. Paginating it would mean a dropdown that silently omits the
 * seventh category. The row count is bounded by how many labels a marketing team can
 * think of, not by anything that grows with traffic.
 */
export async function list(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await categoriesService.listTrainingCategories());
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = validatedBody<CreateTrainingCategoryInput>(req);
  sendCreated(res, await categoriesService.createTrainingCategory(input, auditContextFromRequest(req)));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const input = validatedBody<UpdateTrainingCategoryInput>(req);
  sendSuccess(
    res,
    await categoriesService.updateTrainingCategory(id, input, auditContextFromRequest(req)),
  );
}

/** Hard delete, refused while any training still references the category. */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  await categoriesService.deleteTrainingCategory(id, auditContextFromRequest(req));
  res.status(HTTP_STATUS.NO_CONTENT).end();
}
