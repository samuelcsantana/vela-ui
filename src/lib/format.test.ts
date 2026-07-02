import { describe, expect, it } from 'vitest';
import { formatDate, getDisplayNameFromEmail, slugify } from './format';

describe('getDisplayNameFromEmail', () => {
  it('extracts the local part before the @ symbol', () => {
    expect(getDisplayNameFromEmail('admin@vela.com')).toBe('admin');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Minha Empresa')).toBe('minha-empresa');
  });

  it('strips accents', () => {
    expect(slugify('Café & Cia')).toBe('cafe-cia');
  });

  it('collapses runs of non-alphanumeric characters into a single hyphen', () => {
    expect(slugify('Acme---Corp!!')).toBe('acme-corp');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -Acme Corp-  ')).toBe('acme-corp');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string as a short human-readable date', () => {
    expect(formatDate('2026-07-02T00:41:12.113Z')).toBe('Jul 2, 2026');
  });
});
