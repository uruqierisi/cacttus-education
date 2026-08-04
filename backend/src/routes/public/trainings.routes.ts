/**
 * `/api/public/trainings` — the marketing catalogue. Read-only and credential-free.
 *
 * There is no submit route here on purpose. Applying from a training's detail page goes
 * through `POST /api/public/forms/:slug/submit` like every other application, carrying
 * the training's id as provenance. One intake path, one validator, one rate limiter.
 */
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { validate } from '../../middleware/validate';
import { slugParamSchema } from '../../schemas/common.schema';
import { publicTrainingsQuerySchema } from '../../schemas/training.schema';
import * as publicController from '../../controllers/public.controller';

const router = Router();

// GET /api/public/trainings/filters  -> { categories, cities }
//
// Above `/:slug` — a literal path declared after a param route is unreachable.
router.get('/filters', asyncHandler(publicController.trainingFilters));

// GET /api/public/trainings?category=&city=  -> card data + applyUrl
router.get(
  '/',
  validate({ query: publicTrainingsQuerySchema }),
  asyncHandler(publicController.listTrainings),
);

// GET /api/public/trainings/:slug  -> full detail payload
router.get(
  '/:slug',
  validate({ params: slugParamSchema }),
  asyncHandler(publicController.getTraining),
);

export const publicTrainingsRouter = router;
