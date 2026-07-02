import { describe, expect, it } from 'vitest';
import { registerSchema } from './schema';

describe('registerSchema', () => {
  const validInput = { companyName: 'Vela Corp', slug: 'vela-corp', email: 'admin@vela.com', password: 'secret123' };

  it('accepts a fully valid payload', () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects a company name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validInput, companyName: 'A' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('auth.validation.companyNameTooShort');
    }
  });

  it('rejects a slug shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validInput, slug: 'a' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('auth.validation.slugTooShort');
    }
  });

  it('rejects a slug with uppercase letters, spaces, or symbols', () => {
    const result = registerSchema.safeParse({ ...validInput, slug: 'Vela Corp!' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('auth.validation.slugInvalid');
    }
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ ...validInput, email: 'not-an-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.invalidEmail');
    }
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({ ...validInput, password: '123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.passwordTooShort');
    }
  });
});
