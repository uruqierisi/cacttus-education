import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../lib/api-response';
import { HTTP_STATUS } from '../config/constants';
import { auditContextFromRequest } from '../lib/audit';
import { validatedBody, validatedParams } from '../middleware/validate';
import * as categoriesService from '../services/post-categories.service';
import type { IdParam } from '../schemas/common.schema';
import type {
  CreatePostCategoryInput,
  UpdatePostCategoryInput,
} from '../schemas/post-category.schema';

/**
 * The whole taxonomy, unpaginated — it feeds a `<select>` and a management dialog, both
 * of which need every option at once. The row count is bounded by how many labels an
 * editorial team can think of, not by anything that grows with traffic.
 */
export async function list(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await categoriesService.listPostCategories());
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = validatedBody<CreatePostCategoryInput>(req);
  sendCreated(res, await categoriesService.createPostCategory(input, auditContextFromRequest(req)));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const input = validatedBody<UpdatePostCategoryInput>(req);
  sendSuccess(
    res,
    await categoriesService.updatePostCategory(id, input, auditContextFromRequest(req)),
  );
}

/** Hard delete, refused while any post still references the category. */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  await categoriesService.deletePostCategory(id, auditContextFromRequest(req));
  res.status(HTTP_STATUS.NO_CONTENT).end();
}
