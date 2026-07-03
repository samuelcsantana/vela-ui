import { describe, expect, it } from 'vitest';
import { loginSchema } from './schema';

describe('loginSchema', () => {
  const validInput = { email: 'admin@vela.com', password: 'admin123' };

  it('accepts a fully valid payload', () => {
    const result = loginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ ...validInput, email: 'not-an-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.invalidEmail');
    }
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ ...validInput, password: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('auth.validation.passwordRequired');
    }
  });
});
