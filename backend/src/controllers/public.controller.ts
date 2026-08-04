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
import * as submissionsService from '../services/submissions.service';
import * as formsService from '../services/forms.service';
import type { SlugParam } from '../schemas/common.schema';
import type { PublicPostsQuery } from '../schemas/post.schema';
import type { CreateSubmissionInput } from '../schemas/submission.schema';

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
