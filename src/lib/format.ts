const DIACRITIC_MARK_RANGE_START = 0x0300;
const DIACRITIC_MARK_RANGE_END = 0x036f;
const DIACRITIC_MARKS_PATTERN = new RegExp(
  `[${String.fromCharCode(DIACRITIC_MARK_RANGE_START)}-${String.fromCharCode(DIACRITIC_MARK_RANGE_END)}]`,
  'g',
);

export function getDisplayNameFromEmail(email: string): string {
  return email.split('@')[0];
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITIC_MARKS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Maps an i18next language code to the BCP 47 locale used for date formatting.
const DATE_LOCALES: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-BR',
};

export function formatDate(isoDate: string, language: string): string {
  return new Date(isoDate).toLocaleDateString(DATE_LOCALES[language] ?? 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
