/**
 * CSV serialisation for submission exports.
 *
 * Hand-rolled rather than pulled from npm because the requirement is one function
 * and the security-relevant part (formula injection) needs explicit handling anyway.
 *
 * THIS FILE IS THE ONLY CSV *WRITER* IN THE CODEBASE. `papaparse` is a dependency, but
 * it is used for PARSING ONLY (see `lib/csv-parse.ts`): `Papa.unparse` does not
 * neutralise formula-injection payloads, so routing any output through it would
 * silently undo `escapeCell` below. Extend this module if the writer needs to do more.
 */

/** Excel/Sheets treat these leading characters as the start of a formula. */
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

const QUOTE = '"';
/** Prefix that demotes a formula-triggering cell back to inert text. */
const QUOTE_GUARD = "'";
const DELIMITER = ',';
const ROW_SEPARATOR = '\r\n';
/** Excel only detects UTF-8 reliably when the file starts with a BOM. */
const UTF8_BOM = '﻿';

export type CsvColumn<T> = {
  readonly header: string;
  readonly value: (row: T) => string | number | boolean | null | undefined;
};

function stringify(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Neutralise CSV-injection payloads (`=cmd|...`) by prefixing a single quote, then
 * quote and escape the cell.
 */
function escapeCell(raw: string): string {
  const neutralised = FORMULA_TRIGGERS.some((trigger) => raw.startsWith(trigger))
    ? `${QUOTE_GUARD}${raw}`
    : raw;

  return `${QUOTE}${neutralised.split(QUOTE).join(`${QUOTE}${QUOTE}`)}${QUOTE}`;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const headerLine = columns.map((column) => escapeCell(column.header)).join(DELIMITER);

  const dataLines = rows.map((row) =>
    columns.map((column) => escapeCell(stringify(column.value(row)))).join(DELIMITER),
  );

  return `${UTF8_BOM}${[headerLine, ...dataLines].join(ROW_SEPARATOR)}${ROW_SEPARATOR}`;
}

/**
 * Strip the leading apostrophe `escapeCell` adds to a formula-triggering cell.
 *
 * The exact inverse of the neutralisation above, and the reason it lives next to it:
 * an exported file must re-import to the same values, and only this module knows which
 * characters were guarded. Anything else is returned untouched, so a legitimate cell
 * that merely starts with an apostrophe (`'93` as a year) survives intact.
 */
export function stripFormulaGuard(cell: string): string {
  if (!cell.startsWith(QUOTE_GUARD)) {
    return cell;
  }

  const next = cell.charAt(1);
  return FORMULA_TRIGGERS.includes(next) ? cell.slice(1) : cell;
}

/** Reject anything that could break out of the quoted `Content-Disposition` filename. */
function safeFilenamePrefix(prefix: string): string {
  return prefix.replace(/[^a-zA-Z0-9_-]/g, '') || 'export';
}

/** Build a filesystem-safe `Content-Disposition` filename, stamped to the second. */
export function csvFilename(prefix: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${safeFilenamePrefix(prefix)}-${stamp}.csv`;
}

/**
 * Build a filesystem-safe filename stamped with the ISO DAY only:
 * `aplikimet-2026-08-03.csv`.
 *
 * Separate from `csvFilename` rather than a flag on it because the two are contracts
 * with different consumers: the dashboard's export button promises a day-stamped name
 * a user can recognise in their Downloads folder, and that string must not drift.
 */
export function csvDayFilename(prefix: string, at: Date = new Date()): string {
  return `${safeFilenamePrefix(prefix)}-${at.toISOString().slice(0, 10)}.csv`;
}
