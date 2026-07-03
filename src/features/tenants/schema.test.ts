import { describe, expect, it } from 'vitest';
import { createTenantSchema, joinTenantSchema } from './schema';

describe('createTenantSchema', () => {
  const validInput = { name: 'Vela Corp', slug: 'vela-corp' };

  it('accepts a payload with only the required fields', () => {
    const result = createTenantSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts a fully valid payload including optional fields', () => {
    const result = createTenantSchema.safeParse({ ...validInput, primaryColor: '#0052cc' });
    expect(result.success).toBe(true);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = createTenantSchema.safeParse({ ...validInput, name: 'A' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('tenants.validation.nameTooShort');
    }
  });

  it('rejects a slug with uppercase letters, spaces, or symbols', () => {
    const result = createTenantSchema.safeParse({ ...validInput, slug: 'Vela Corp!' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('tenants.validation.slugInvalid');
    }
  });

  it('rejects a primaryColor that is not a hex color', () => {
    const result = createTenantSchema.safeParse({ ...validInput, primaryColor: 'blue' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('tenants.validation.primaryColorInvalid');
    }
  });

});

describe('joinTenantSchema', () => {
  const validInput = { tenantId: 'tenant-1', role: 'MEMBER' as const, email: 'admin@vela.com', password: 'secret123' };

  it('accepts a fully valid payload', () => {
    const result = joinTenantSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects an empty tenantId', () => {
    const result = joinTenantSchema.safeParse({ ...validInput, tenantId: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('auth.validation.tenantRequired');
    }
  });

  it('rejects a role outside the allowed enum', () => {
    const result = joinTenantSchema.safeParse({ ...validInput, role: 'OWNER' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = joinTenantSchema.safeParse({ ...validInput, email: 'not-an-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.invalidEmail');
    }
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = joinTenantSchema.safeParse({ ...validInput, password: '123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.passwordTooShort');
    }
  });
});
