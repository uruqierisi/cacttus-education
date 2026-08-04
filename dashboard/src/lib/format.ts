/**
 * Display formatting helpers.
 *
 * Dates are rendered in Albanian with hand-written month names rather than
 * `Intl.DateTimeFormat('sq')`. Two reasons: the ICU data shipped by browsers renders
 * Albanian months lowercase and abbreviates them inconsistently between engines, and
 * the audit trail has to read as a sentence — "3 Gusht 2026, 18:23" — which no locale
 * pattern produces reliably. Fixing the strings here makes every surface identical.
 */

/** Month names as used in a date like "3 Gusht 2026". */
const MONTHS_SQ = [
  'Janar',
  'Shkurt',
  'Mars',
  'Prill',
  'Maj',
  'Qershor',
  'Korrik',
  'Gusht',
  'Shtator',
  'Tetor',
  'Nëntor',
  'Dhjetor',
] as const;

const MONTHS_SHORT_SQ = [
  'Jan',
  'Shk',
  'Mar',
  'Pri',
  'Maj',
  'Qer',
  'Kor',
  'Gus',
  'Sht',
  'Tet',
  'Nën',
  'Dhj',
] as const;

const EM_DASH = '—';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** Unicode combining diacritical marks, stripped after NFD normalisation. */
const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_SLUG_CHARS = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;
const SLUG_MAX_LENGTH = 120;

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** "3 Gusht 2026" */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return EM_DASH;
  }
  return `${date.getDate()} ${MONTHS_SQ[date.getMonth()]} ${date.getFullYear()}`;
}

/** "3 Gusht 2026, 18:23" — the form used throughout the audit trail. */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return EM_DASH;
  }
  return `${formatDate(date)}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** "3 Gus" — compact axis / table label. */
export function formatDateShort(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return EM_DASH;
  }
  return `${date.getDate()} ${MONTHS_SHORT_SQ[date.getMonth()]}`;
}

/** "Gusht 2026" — month bucket label on the chart. */
export function formatMonth(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return EM_DASH;
  }
  return `${MONTHS_SQ[date.getMonth()]} ${date.getFullYear()}`;
}

/** "3 orë më parë" style label, falling back to an absolute date past a week. */
export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return EM_DASH;
  }

  const elapsed = Date.now() - date.getTime();

  if (elapsed < MINUTE_MS) {
    return 'tani';
  }
  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)} min më parë`;
  }
  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)} orë më parë`;
  }
  if (elapsed < WEEK_MS) {
    return `${Math.floor(elapsed / DAY_MS)} ditë më parë`;
  }

  return formatDate(date);
}

/** Thousands-separated integer, e.g. "1.204". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value);
}

/**
 * Signed percentage for the month-over-month badges.
 *
 * `null` is a real, expected input — it means the previous month had no applications,
 * so there is no percentage to compute — and renders as an em dash rather than "0 %",
 * which would falsely claim the months were equal.
 */
export function formatPercentChange(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return EM_DASH;
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })}%`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return EM_DASH;
  }
  return `${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })}%`;
}

/**
 * Turn a title into a URL slug matching the API's `^[a-z0-9]+(-[a-z0-9]+)*$` rule.
 *
 * `ë` and `ç` decompose to `e` / `c` under NFD, so Albanian titles survive intact —
 * "Aplikimi për Shkollë" becomes "aplikimi-per-shkolle" rather than a string of gaps.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_SLUG_CHARS, '-')
    .replace(EDGE_DASHES, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(EDGE_DASHES, '');
}

export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength).trimEnd()}…`;
}

/** Turn a stored field key ("data_lindjes") into a readable label ("Data lindjes"). */
export function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  if (spaced.length === 0) {
    return key;
  }
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
