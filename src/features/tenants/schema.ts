import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2, 'tenants.validation.nameTooShort'),
  slug: z
    .string()
    .min(2, 'tenants.validation.slugTooShort')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'tenants.validation.slugInvalid'),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'tenants.validation.primaryColorInvalid')
    .optional()
    .or(z.literal('')),
});

export type CreateTenantValues = z.infer<typeof createTenantSchema>;

export const joinTenantSchema = z.object({
  tenantId: z.string().min(1, 'auth.validation.tenantRequired'),
  role: z.enum(['ADMIN', 'MEMBER']),
  email: z.string().email('users.validation.invalidEmail'),
  password: z.string().min(6, 'users.validation.passwordTooShort'),
});

export type JoinTenantValues = z.infer<typeof joinTenantSchema>;
