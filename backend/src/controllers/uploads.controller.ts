import type { Request, Response } from 'express';
import { sendCreated } from '../lib/api-response';
import { ApiError } from '../lib/api-error';
import * as uploadsService from '../services/uploads.service';

export async function uploadImage(req: Request, res: Response): Promise<void> {
  // `req.file` is populated by `uploadImageFile`. Absent means the client sent no file
  // part at all — a client bug rather than a rejected file.
  if (!req.file) {
    throw ApiError.badRequest('Zgjidh një foto për ta ngarkuar.');
  }

  sendCreated(res, await uploadsService.storeCoverImage(req.file));
}
