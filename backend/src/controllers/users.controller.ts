import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { sendCreated, sendSuccess } from '../lib/api-response';
import { auditContextFromRequest } from '../lib/audit';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate';
import { currentUser } from '../middleware/auth';
import * as usersService from '../services/users.service';
import type { IdParam } from '../schemas/common.schema';
import type {
  CreateUserInput,
  ListUsersQuery,
  ResetUserPasswordInput,
  UpdateUserInput,
} from '../schemas/user.schema';

export async function list(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<ListUsersQuery>(req);
  const { users, meta } = await usersService.listUsers(query);

  sendSuccess(res, users, HTTP_STATUS.OK, meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);

  sendSuccess(res, await usersService.getUserById(id));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = validatedBody<CreateUserInput>(req);

  sendCreated(res, await usersService.createUser(input, auditContextFromRequest(req)));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const input = validatedBody<UpdateUserInput>(req);

  sendSuccess(
    res,
    await usersService.updateUser(currentUser(req).id, id, input, auditContextFromRequest(req)),
  );
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);
  const { newPassword } = validatedBody<ResetUserPasswordInput>(req);

  await usersService.resetUserPassword(id, newPassword, auditContextFromRequest(req));

  res.status(HTTP_STATUS.NO_CONTENT).end();
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams<IdParam>(req);

  await usersService.deleteUser(currentUser(req).id, id, auditContextFromRequest(req));

  res.status(HTTP_STATUS.NO_CONTENT).end();
}
