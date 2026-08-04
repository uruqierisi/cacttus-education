import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';

/** Minimum length for a NEW password. Login itself never enforces a minimum. */
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(FIELD_LIMITS.EMAIL_MAX),
  // No min() here: rejecting a short password before the hash comparison would leak
  // policy details and shortcut the constant-time login path.
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one.',
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
