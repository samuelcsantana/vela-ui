import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('users.validation.invalidEmail'),
  password: z.string().min(1, 'auth.validation.passwordRequired'),
});

export type LoginValues = z.infer<typeof loginSchema>;
