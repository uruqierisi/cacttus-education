import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { sendCreated, sendSuccess } from '../lib/api-response';
import { auditContextFromRequest } from '../lib/audit';
import { currentUser } from '../middleware/auth';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate';
import * as postsService from '../services/posts.service';
import type { IdParam } from '../schemas/common.schema';
import type { CreatePostInput, ListPostsQuery, UpdatePostInput } from '../schemas/post.schema';

export async function list(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<ListPostsQuery>(req);
  const { items, meta } = await postsService.listPosts(query);
  sendSuccess(res, items, 200, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  sendSuccess(res, await postsService.getPostById(id));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = validatedBody<CreatePostInput>(req);
  // Authorship AND the audit actor are taken from the authenticated session, never
  // from the request body — see `auditContextFromRequest`, which reads only `req.auth`.
  sendCreated(
    res,
    await postsService.createPost(currentUser(req).id, input, auditContextFromRequest(req)),
  );
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const input = validatedBody<UpdatePostInput>(req);
  sendSuccess(res, await postsService.updatePost(id, input, auditContextFromRequest(req)));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  await postsService.deletePost(id, auditContextFromRequest(req));
  res.status(HTTP_STATUS.NO_CONTENT).end();
}

export async function stats(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await postsService.getPostStats());
}
