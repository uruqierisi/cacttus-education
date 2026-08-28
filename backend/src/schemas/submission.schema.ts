import { z } from 'zod';
import { FormType, SubmissionStatus } from '@prisma/client';
import { FIELD_LIMITS } from '../config/constants';
import {
  isoDateSchema,
  paginationQuerySchema,
  phoneSchema,
  searchSchema,
  sortOrderSchema,
} from './common.schema';

/**
 * The public payload. `name` / `email` / `phone` are always required because they
 * are promoted to real columns; everything else arrives under `data` and is checked
 * against the form's own field definitions at runtime.
 */
export const createSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(FIELD_LIMITS.NAME_MAX),
  email: z.string().trim().toLowerCase().email().max(FIELD_LIMITS.EMAIL_MAX),
  phone: phoneSchema,
  data: z.record(z.unknown()).default({}),
  /**
   * Honeypot. Real browsers leave it empty; bots fill every input they find.
   * A filled value is accepted with 201 and silently discarded (see the service).
   */
  website: z.string().max(200).optional(),
  /**
   * OPTIONAL provenance: the training whose detail page this application was sent from.
   *
   * Additive by design — every existing caller (a form link shared on social media) omits
   * it and behaves exactly as before, so the public submit contract is unchanged. The
   * service validates that the id names a live training before storing it; see
   * `assertTrainingIdIsLive` for why this is deliberately not treated as trustworthy.
   */
  trainingId: z.string().trim().min(1).max(64).optional(),
});
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

/**
 * The three promoted columns, extracted from `createSubmissionSchema` rather than
 * rewritten.
 *
 * A CSV-imported lead is held to EXACTLY the same standard as one typed into the public
 * form — same length bounds, same lowercasing, same trimming — because a second,
 * hand-copied set of rules is a set of rules that will eventually disagree.
 */
export const csvContactSchema = createSubmissionSchema.pick({
  name: true,
  email: true,
  phone: true,
});
export type CsvContactInput = z.infer<typeof csvContactSchema>;

/**
 * Body of a CSV import. The file itself arrives as the multipart `file` part and is
 * handled by `middleware/upload.ts`; this validates the accompanying text fields.
 */
export const importSubmissionsSchema = z.object({
  formId: z.string().trim().min(1).max(64),
});
export type ImportSubmissionsInput = z.infer<typeof importSubmissionsSchema>;

export const updateSubmissionStatusSchema = z.object({
  status: z.nativeEnum(SubmissionStatus),
});
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;

const submissionFilterSchema = z.object({
  formId: z.string().trim().min(1).max(64).optional(),
  /**
   * Product-line filter (ZHVAM / CYBER / TRAINING / SCHOOL). Resolved through the
   * `Submission -> Form` relation, so it spans every form of that type at once.
   * Prefer `formId` when you already know the form — see the note in the service
   * about which filter combination the composite index can serve.
   */
  type: z.nativeEnum(FormType).optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  search: searchSchema,
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});

export const listSubmissionsQuerySchema = paginationQuerySchema
  .merge(submissionFilterSchema)
  .extend({ order: sortOrderSchema })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ['from'],
    message: '`from` must be before or equal to `to`.',
  });
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;

/** Export reuses the filters but never paginates — it streams up to EXPORT_MAX_ROWS. */
export const exportSubmissionsQuerySchema = submissionFilterSchema.refine(
  (value) => !value.from || !value.to || value.from <= value.to,
  { path: ['from'], message: '`from` must be before or equal to `to`.' },
);
export type ExportSubmissionsQuery = z.infer<typeof exportSubmissionsQuerySchema>;
