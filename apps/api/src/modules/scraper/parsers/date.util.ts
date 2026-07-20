const PT_MONTHS: Record<string, number> = {
  "jan.": 0,
  "fev.": 1,
  "mar.": 2,
  "abr.": 3,
  "mai.": 4,
  "jun.": 5,
  "jul.": 6,
  "ago.": 7,
  "set.": 8,
  "out.": 9,
  "nov.": 10,
  "dez.": 11,
};

/**
 * Parses RubinOT's Portuguese datetime format, e.g. "12 de jul. de 2026, 19:17".
 * Also handles the dateless variant "8 de fev. de 2026" used on some pages.
 */
export function parsePortugueseDateTime(input: string): Date | null {
  const match = input
    .trim()
    .match(/(\d{1,2}) de ([a-zç]+\.) de (\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/i);
  if (!match) return null;

  const [, dayStr, monthStr, yearStr, hourStr, minuteStr] = match;
  const month = PT_MONTHS[monthStr.toLowerCase()];
  if (month === undefined) return null;

  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  const hour = hourStr ? parseInt(hourStr, 10) : 0;
  const minute = minuteStr ? parseInt(minuteStr, 10) : 0;

  return new Date(year, month, day, hour, minute);
}

/**
 * Parses RubinOT's English short date format used in the guild member table,
 * e.g. "Jul 04, 2026".
 */
export function parseEnglishShortDate(input: string): Date | null {
  const trimmed = input.trim();
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Parses the transfers page's "DD/MM/YYYY, HH:mm:ss" timestamps. */
export function parseSlashDateTime(input: string): Date | null {
  const match = input.trim().match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, day, month, year, hour, minute, second] = match;
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10),
  );
}

/** Parses the deaths page's "D MMM YYYY, HH:mm:ss" timestamps (English month abbreviation). */
export function parseEnglishDateTime(input: string): Date | null {
  const parsed = new Date(input.trim().replace(",", ""));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
