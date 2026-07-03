import { z } from 'zod';

export const userFiltersSchema = z.object({
  search: z.string().max(100, 'users.validation.searchTooLong'),
});

export type UserFiltersValues = z.infer<typeof userFiltersSchema>;

export const createUserSchema = z.object({
  email: z.string().email('users.validation.invalidEmail'),
  password: z.string().min(6, 'users.validation.passwordTooShort'),
  role: z.enum(['ADMIN', 'MEMBER']),
  // Always present in the form (pre-filled with the caller's own tenant for a plain
  // ADMIN, or picked from a <select> for VELA_ADMIN), so it's simply required here.
  tenantId: z.string().min(1, 'users.validation.tenantRequired'),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const usersSearchSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
});

export type UsersSearchValues = z.infer<typeof usersSearchSchema>;
