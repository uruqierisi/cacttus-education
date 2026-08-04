/**
 * CSV *reading*. The counterpart to `lib/csv.ts`, which owns all CSV *writing*.
 *
 * WHY papaparse HERE AND NOT IN THE WRITER
 * ----------------------------------------
 * Parsing real-world CSV correctly is genuinely hard — quoted fields containing commas,
 * doubled quotes, CRLF vs LF, embedded newlines, BOMs, `\r` inside a quoted cell — and
 * getting it subtly wrong means silently importing corrupted lead data. papaparse is the
 * battle-tested answer to that problem, so the import path uses it.
 *
 * The WRITE path deliberately does not. `Papa.unparse` produces spec-correct CSV but
 * performs no formula-injection neutralisation, so a cell of `=cmd|'/c calc'!A0` would
 * be written verbatim and execute when an administrator opens the file in Excel.
 * `lib/csv.ts` prefixes those cells with an apostrophe. Never route output through
 * papaparse.
 *
 * TRUST MODEL
 * -----------
 * Nothing this module returns is trusted. Every cell comes back as a raw string; typing,
 * coercion and validation happen afterwards against the target form's field definitions
 * (`services/form-fields.service.ts`), which is the same validator the public submission
 * endpoint uses.
 */
import Papa from 'papaparse';
import { ApiError } from './api-error';

/** One CSV record, keyed by trimmed header text. Values are always raw strings. */
export type CsvRecord = Readonly<Record<string, string>>;

export type ParsedCsv = {
  /** Header texts in file order, trimmed and BOM-stripped. */
  readonly headers: readonly string[];
  readonly records: readonly CsvRecord[];
  /**
   * Structural problems papaparse reported for a specific record, keyed by the record's
   * zero-based index. These rows are returned in `records` too, but the caller is
   * expected to fail them rather than import a row whose column count did not line up.
   */
  readonly errorsByRecord: ReadonlyMap<number, string>;
};

const UTF8_BOM = '﻿';

/** Excel writes a BOM; left in place it becomes part of the first header's name. */
function stripBom(text: string): string {
  return text.startsWith(UTF8_BOM) ? text.slice(1) : text;
}

/**
 * Decode an uploaded buffer as UTF-8.
 *
 * UTF-8 is the only encoding accepted, and that is a deliberate limit rather than an
 * oversight: guessing between UTF-8 and Windows-1252 is unreliable, and a wrong guess
 * corrupts exactly the Albanian characters (ë, ç) this project cares most about. Files
 * exported by this API are UTF-8 with a BOM, so the round trip is always clean.
 */
export function decodeCsvBuffer(buffer: Buffer): string {
  return stripBom(buffer.toString('utf8'));
}

function describeParseError(error: Papa.ParseError): string {
  return `${error.type}: ${error.message}`;
}

/**
 * Parse a CSV document into header-keyed records.
 *
 * `maxRecords` is enforced by reading exactly one row more than the cap and rejecting
 * on overflow, so an oversized file is refused rather than materialised in full.
 */
export function parseCsvRecords(text: string, maxRecords: number): ParsedCsv {
  const trimmed = stripBom(text).trim();

  if (trimmed.length === 0) {
    throw ApiError.badRequest('The CSV file is empty.');
  }

  const result = Papa.parse<Record<string, string>>(stripBom(text), {
    header: true,
    // 'greedy' also drops rows that contain only whitespace/empty cells, which is what
    // a trailing newline or an Excel-padded sheet produces.
    skipEmptyLines: 'greedy',
    transformHeader: (header) => stripBom(header).trim(),
    // No dynamicTyping: every cell stays a string and is coerced per FIELD TYPE later,
    // so papaparse can never decide that "0031" is the number 31 or that "no" is false.
    dynamicTyping: false,
    // One row beyond the cap is enough to detect (and reject) an oversized file.
    preview: maxRecords + 1,
  });

  const headers = (result.meta.fields ?? []).filter((header) => header.length > 0);

  if (headers.length === 0) {
    throw ApiError.badRequest('The CSV file has no header row.');
  }

  // Errors with no row index are document-level (no delimiter could be detected, quotes
  // never closed) — the file is unusable, so fail the whole request rather than report
  // 5 000 identical row failures.
  const fatal = result.errors.find((error) => typeof error.row !== 'number');

  if (fatal) {
    throw ApiError.badRequest(`The CSV file could not be parsed — ${describeParseError(fatal)}`);
  }

  if (result.data.length > maxRecords) {
    throw ApiError.badRequest(
      `The CSV file has more than ${maxRecords} data rows. Split it and import in batches.`,
    );
  }

  const errorsByRecord = new Map<number, string>();

  for (const error of result.errors) {
    if (typeof error.row === 'number' && !errorsByRecord.has(error.row)) {
      errorsByRecord.set(error.row, describeParseError(error));
    }
  }

  return { headers, records: result.data, errorsByRecord };
}
