/**
 * `/api/public/forms` — form schema lookup + submission intake.
 *
 * The submission route carries its own tighter rate limiter because it is the only
 * unauthenticated endpoint that writes to the database.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { publicSubmitRateLimiter } from '../../middleware/rate-limit';
import { slugParamSchema } from '../../schemas/common.schema';
import { createSubmissionSchema } from '../../schemas/submission.schema';
import * as publicController from '../../controllers/public.controller';

const router = Router();

// GET  /api/public/forms/:slug              -> field definitions for rendering
router.get(
  '/:slug',
  validate({ params: slugParamSchema }),
  asyncHandler(publicController.getFormSchema),
);

// POST /api/public/forms/:slug/submit       -> 201 { id, receivedAt }
//
// `/submissions` is kept as an alias so an already-deployed marketing build does not
// break; both paths run the identical handler. Prefer `/submit` in new integrations.
router.post(
  ['/:slug/submit', '/:slug/submissions'],
  publicSubmitRateLimiter,
  validate({ params: slugParamSchema, body: createSubmissionSchema }),
  asyncHandler(publicController.submitForm),
);

export const publicFormsRouter = router;
