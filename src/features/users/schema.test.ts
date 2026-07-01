import { describe, expect, it } from 'vitest';
import { createUserSchema, userFiltersSchema, usersSearchSchema } from './schema';

describe('userFiltersSchema', () => {
  it('accepts a short search term', () => {
    const result = userFiltersSchema.safeParse({ search: 'ana' });
    expect(result.success).toBe(true);
  });

  it('rejects a search term longer than 100 characters', () => {
    const result = userFiltersSchema.safeParse({ search: 'a'.repeat(101) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.searchTooLong');
    }
  });
});

describe('createUserSchema', () => {
  const validInput = { name: 'Ana Silva', email: 'ana@velaui.demo', role: 'admin' as const };

  it('accepts a fully valid payload', () => {
    const result = createUserSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = createUserSchema.safeParse({ ...validInput, name: 'A' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.nameTooShort');
    }
  });

  it('rejects an invalid email', () => {
    const result = createUserSchema.safeParse({ ...validInput, email: 'not-an-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.invalidEmail');
    }
  });

  it('rejects a role outside the allowed enum', () => {
    const result = createUserSchema.safeParse({ ...validInput, role: 'superadmin' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('users.validation.roleRequired');
    }
  });
});

describe('usersSearchSchema', () => {
  it('accepts an explicit search and page', () => {
    const result = usersSearchSchema.safeParse({ search: 'ana', page: 2 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ search: 'ana', page: 2 });
  });

  it('defaults page to 1 and allows an omitted search', () => {
    const result = usersSearchSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ page: 1 });
  });

  it('rejects a page below 1', () => {
    const result = usersSearchSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer page', () => {
    const result = usersSearchSchema.safeParse({ page: 1.5 });
    expect(result.success).toBe(false);
  });
});
