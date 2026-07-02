import { z } from 'zod';

export const registerSchema = z.object({
  companyName: z.string().min(2, 'auth.validation.companyNameTooShort'),
  slug: z
    .string()
    .min(2, 'auth.validation.slugTooShort')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'auth.validation.slugInvalid'),
  email: z.string().email('users.validation.invalidEmail'),
  password: z.string().min(6, 'users.validation.passwordTooShort'),
});

export type RegisterValues = z.infer<typeof registerSchema>;
