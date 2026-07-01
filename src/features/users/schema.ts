import { z } from 'zod';

export const userFiltersSchema = z.object({
  search: z.string().max(100, 'users.validation.searchTooLong'),
});

export type UserFiltersValues = z.infer<typeof userFiltersSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, 'users.validation.nameTooShort'),
  email: z.string().email('users.validation.invalidEmail'),
  role: z.enum(['admin', 'editor', 'viewer'], { message: 'users.validation.roleRequired' }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const usersSearchSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
});

export type UsersSearchValues = z.infer<typeof usersSearchSchema>;
