/**
 * `/api/admin/uploads` — cover-image intake for the blog editor.
 *
 * ADMIN **and** EDITOR, matching `posts.routes.ts`: both roles author articles, so both
 * must be able to attach a cover. `requireAuth` is already mounted once on the parent
 * `/api/admin` router, so there is no unauthenticated path to this endpoint — an anon
 * request 401s before multer reads a single byte.
 *
 * Rate-limited with the CSV limiter: this is the other endpoint that accepts megabytes
 * from a client, and the same "a compromised staff token should not be able to hammer
 * it" reasoning applies.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { csvRateLimiter } from '../../middleware/rate-limit';
import { uploadImageFile, uploadPdfFile } from '../../middleware/upload';
import * as uploadsController from '../../controllers/uploads.controller';

const router = Router();

// POST /api/admin/uploads   multipart, field "file"  -> 201 { url, width, height, bytes }
//
// Middleware order matters: the rate limiter runs BEFORE multer, so a throttled caller is
// rejected without the server reading the upload body.
router.post('/', csvRateLimiter, uploadImageFile, asyncHandler(uploadsController.uploadImage));

// POST /api/admin/uploads/pdf   multipart, field "file"  -> 201 { url, bytes }
//
// A separate route rather than a mode flag on the one above: the two differ in size cap,
// in what validation can prove (see uploads.service.ts), and in how the result is served.
// Collapsing them behind a parameter would hide all three differences behind a boolean.
router.post('/pdf', csvRateLimiter, uploadPdfFile, asyncHandler(uploadsController.uploadPdf));

export const adminUploadsRouter = router;
