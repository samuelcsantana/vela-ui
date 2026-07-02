import { describe, expect, it } from 'vitest';
import { formatDate, getDisplayNameFromEmail } from './format';

describe('getDisplayNameFromEmail', () => {
  it('extracts the local part before the @ symbol', () => {
    expect(getDisplayNameFromEmail('admin@vela.com')).toBe('admin');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string as a short human-readable date', () => {
    expect(formatDate('2026-07-02T00:41:12.113Z')).toBe('Jul 2, 2026');
  });
});
