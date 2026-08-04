/**
 * Validation for ADMIN-only user management.
 *
 * Password rules are imported from `auth.schema` rather than restated, so the policy
 * for an admin-created password and a self-service change can never drift apart.
 */
import { z } from 'zod';
import { Role } from '@prisma/client';
import { FIELD_LIMITS } from '../config/constants';
import { paginationQuerySchema, searchSchema, sortOrderSchema } from './common.schema';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from './auth.schema';

export const roleSchema = z.nativeEnum(Role);

const emailSchema = z.string().trim().toLowerCase().email().max(FIELD_LIMITS.EMAIL_MAX);
const nameSchema = z.string().trim().min(1).max(FIELD_LIMITS.NAME_MAX);
const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH);

export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  // Defaulting to the lower privilege means a forgotten field can never mint an admin.
  role: roleSchema.default(Role.EDITOR),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Email is deliberately NOT updatable: it is the login identifier and the unique key,
 * and silently changing it would lock the account holder out with no audit trail.
 * Delete-and-recreate, or add a verified email-change flow later.
 */
export const updateUserSchema = z
  .object({
    name: nameSchema,
    role: roleSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Admin-initiated reset. The current password is not required — that is the point. */
export const resetUserPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: roleSchema.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: searchSchema,
  sort: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
  order: sortOrderSchema,
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
