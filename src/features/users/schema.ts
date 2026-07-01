import { z } from 'zod';

export const userFiltersSchema = z.object({
  search: z.string().max(100, 'Search is too long'),
});

export type UserFiltersValues = z.infer<typeof userFiltersSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, 'Enter at least 2 characters'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'editor', 'viewer'], { message: 'Select a role' }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const usersSearchSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
});

export type UsersSearchValues = z.infer<typeof usersSearchSchema>;
