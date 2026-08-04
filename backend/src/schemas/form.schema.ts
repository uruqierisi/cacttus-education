import { z } from 'zod';
import { FormType } from '@prisma/client';
import { FIELD_LIMITS } from '../config/constants';
import { fieldDefinitionsSchema } from '../services/form-fields.service';
import { paginationQuerySchema, searchSchema, slugSchema, sortOrderSchema } from './common.schema';

export const createFormSchema = z.object({
  /**
   * Optional. When omitted the service derives it from `title` (Albanian-safe,
   * de-duplicated with a `-2` / `-3` suffix). Supplying it explicitly is still
   * allowed so an existing public URL can be preserved during a migration.
   */
  slug: slugSchema.optional(),
  title: z.string().trim().min(1).max(FIELD_LIMITS.TITLE_MAX),
  type: z.nativeEnum(FormType),
  fields: fieldDefinitionsSchema.default([]),
  isActive: z.boolean().default(true),
});
export type CreateFormInput = z.infer<typeof createFormSchema>;

/** Every field optional, but at least one present — an empty PATCH is a client bug. */
export const updateFormSchema = createFormSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Provide at least one field to update.' },
);
export type UpdateFormInput = z.infer<typeof updateFormSchema>;

export const listFormsQuerySchema = paginationQuerySchema.extend({
  type: z.nativeEnum(FormType).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  /** Admins can opt into the soft-deleted archive; the default view hides it. */
  includeDeleted: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('false'),
  search: searchSchema,
  sort: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  order: sortOrderSchema,
});
export type ListFormsQuery = z.infer<typeof listFormsQuerySchema>;

/**
 * The ADMIN-only archive view. Deliberately has no `includeDeleted` switch: this
 * endpoint means "soft-deleted rows ONLY", and the service hard-codes that predicate
 * rather than trusting a query parameter to select it.
 */
export const listArchivedFormsQuerySchema = paginationQuerySchema.extend({
  type: z.nativeEnum(FormType).optional(),
  search: searchSchema,
  sort: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  order: sortOrderSchema,
});
export type ListArchivedFormsQuery = z.infer<typeof listArchivedFormsQuerySchema>;
