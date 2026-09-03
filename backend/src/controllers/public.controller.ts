/**
 * Controllers for the two unauthenticated endpoints the marketing site consumes.
 *
 * These responses are cacheable at the CDN edge (blogs) or explicitly uncacheable
 * (submissions), so cache headers are set here rather than globally.
 */
import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { sendSuccess } from '../lib/api-response';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate';
import * as postsService from '../services/posts.service';
import * as postCategoriesService from '../services/post-categories.service';
import * as submissionsService from '../services/submissions.service';
import * as formsService from '../services/forms.service';
import * as trainingsService from '../services/trainings.service';
import type { SlugParam } from '../schemas/common.schema';
import type { PublicPostsQuery } from '../schemas/post.schema';
import type { CreateSubmissionInput } from '../schemas/submission.schema';
import type { PublicTrainingsQuery } from '../schemas/training.schema';

/** Serve stale for a day while revalidating — the blog changes rarely. */
const FEED_CACHE_CONTROL = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400';

export async function listPublishedPosts(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<PublicPostsQuery>(req);
  const { items, meta } = await postsService.listPublishedPosts(query);

  res.setHeader('Cache-Control', FEED_CACHE_CONTROL);
  sendSuccess(res, items, HTTP_STATUS.OK, meta);
}

export async function getPublishedPost(req: Request, res: Response): Promise<void> {
  const { slug } = validatedParams<SlugParam>(req);
  const post = await postsService.getPublishedPostBySlug(slug);

  res.setHeader('Cache-Control', FEED_CACHE_CONTROL);
  sendSuccess(res, post);
}

/**
 * The training catalogue grid.
 *
 * Cacheable like the blog feed: the catalogue changes when an admin edits it, which is
 * rare, and a stale card for a minute is not a correctness problem.
 */
export async function listTrainings(req: Request, res: Response): Promise<void> {
  const query = validatedQuery<PublicTrainingsQuery>(req);
  const items = await trainingsService.listPublicTrainings(query);

  res.setHeader('Cache-Control', FEED_CACHE_CONTROL);
  sendSuccess(res, items);
}

/** Filter chips, derived from what is actually on live cards. */
/**
 * The categories the /lajme chips should offer.
 *
 * Only those with at least one PUBLISHED post — a chip that leads to an empty list is a
 * dead end, the same rule `trainingFilters` follows. Uncategorised posts produce no chip
 * and are reachable under "Të gjitha" alone.
 */
export async function postCategories(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await postCategoriesService.getPublicPostCategories());
}

export async function trainingFilters(_req: Request, res: Response): Promise<void> {
  const filters = await trainingsService.getPublicTrainingFilters();

  res.setHeader('Cache-Control', FEED_CACHE_CONTROL);
  sendSuccess(res, filters);
}

/** Everything a training's detail page renders, minus the form's field definitions. */
export async function getTraining(req: Request, res: Response): Promise<void> {
  const { slug } = validatedParams<SlugParam>(req);
  const training = await trainingsService.getPublicTrainingBySlug(slug);

  res.setHeader('Cache-Control', FEED_CACHE_CONTROL);
  sendSuccess(res, training);
}

/** Field definitions so the marketing site can render a form it does not hard-code. */
export async function getFormSchema(req: Request, res: Response): Promise<void> {
  const { slug } = validatedParams<SlugParam>(req);
  const form = await formsService.getActiveFormBySlug(slug);

  res.setHeader('Cache-Control', FEED_CACHE_CONTROL);
  sendSuccess(res, {
    slug: form.slug,
    title: form.title,
    type: form.type,
    fields: form.fields,
  });
}

export async function submitForm(req: Request, res: Response): Promise<void> {
  const { slug } = validatedParams<SlugParam>(req);
  const input = validatedBody<CreateSubmissionInput>(req);

  const created = await submissionsService.createSubmissionForSlug(slug, input);

  res.setHeader('Cache-Control', 'no-store');
  // The public response deliberately carries no internal detail beyond an ack.
  sendSuccess(
    res,
    { id: created.id, receivedAt: created.createdAt },
    HTTP_STATUS.CREATED,
  );
}
