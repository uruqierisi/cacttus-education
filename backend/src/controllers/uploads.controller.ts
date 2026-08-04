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

/** Syllabus PDF for a training's "Shkarko planprogramin" button. */
export async function uploadPdf(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw ApiError.badRequest('Zgjidh një skedë PDF për ta ngarkuar.');
  }

  sendCreated(res, await uploadsService.storeSyllabusPdf(req.file));
}
