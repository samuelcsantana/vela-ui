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

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
