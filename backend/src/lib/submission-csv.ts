/**
 * The submission CSV column model — shared by the export writer and the import reader
 * so the two can never drift apart. Pure functions only: no Prisma, no Express.
 *
 * FIXED COLUMNS
 * -------------
 * Emri, Email, Telefoni, Forma, Tipi, Statusi, Data — the seven attributes every
 * submission has regardless of which form produced it. Headers are Albanian because
 * the file is opened by Cacttus staff, not by a machine.
 *
 * DYNAMIC COLUMNS — THE ORDERING RULE
 * -----------------------------------
 * The dynamic part of the sheet is the UNION of the answer keys across the whole result
 * set. Object key order in JavaScript is per-object insertion order, so reading it from
 * "the first row" would produce a different sheet depending on which submission happened
 * to sort first — two exports of the same filter could disagree on column order, and a
 * form edited between two exports could reorder columns for rows that never changed.
 * The order is therefore derived ONLY from stored, stable data:
 *
 *   1. The forms contributing to the export, sorted by `slug` ASCENDING (code-unit
 *      comparison, not locale — a locale-sensitive sort is not stable across machines).
 *      Slug is used rather than title because it is immutable in practice and unique,
 *      so the tie-break is total.
 *   2. Within each form, its CURRENT field definitions in `parseStoredFields` order —
 *      `order` ascending, then `name` ascending. This is the order the questions appear
 *      in on the public form, which is the order a human reading the sheet expects.
 *      A key already emitted by an earlier form is skipped, never duplicated.
 *   3. RESIDUAL keys last: any key present in some row's `data` that no contributing
 *      form declares any more (a question that was renamed or removed after those
 *      submissions were taken), sorted ascending by code unit.
 *
 * The result is deterministic — the same rows and the same form configuration always
 * produce a byte-identical header line — and it degrades gracefully: answers to deleted
 * questions still appear, they just move to the right-hand end of the sheet.
 *
 * ROUND-TRIP CONTRACT
 * -------------------
 * Everything this module writes, it can read back:
 *   - multiselect answers are joined with `; ` and split on `;` on the way in;
 *   - booleans are written `true` / `false` and parsed case-insensitively, also
 *     accepting the Albanian `Po` / `Jo`;
 *   - a cell neutralised by `escapeCell` (leading `'` before `=`, `+`, `-`, `@`) has the
 *     guard removed by `stripFormulaGuard` on import.
 * On import, a dynamic column is matched by field NAME first and field LABEL second, so
 * a sheet produced by this API and a sheet typed by hand both import.
 */
import type { FormType, SubmissionStatus } from '@prisma/client';
import { stripFormulaGuard, type CsvColumn } from './csv';
import { CSV_IMPORT } from '../config/constants';
// Type-only import: erased at compile time, so `lib` gains no runtime dependency on
// `services`. The field-definition contract lives in one place and this module reads it.
import type { FieldDefinition } from '../services/form-fields.service';

/** The form metadata a CSV needs. A subset of the `Form` row, never the whole thing. */
export type CsvFormMeta = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly type: FormType;
  /** Already sorted by `parseStoredFields` (order, then name). */
  readonly fields: readonly FieldDefinition[];
};

/** The submission shape the writer needs. `SubmissionDto` satisfies it structurally. */
export type CsvSubmissionRow = {
  readonly formId: string;
  readonly formTitle: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly data: Record<string, unknown>;
  readonly status: SubmissionStatus;
  readonly createdAt: Date;
};

export const FIXED_HEADERS = {
  NAME: 'Emri',
  EMAIL: 'Email',
  PHONE: 'Telefoni',
  FORM: 'Forma',
  TYPE: 'Tipi',
  STATUS: 'Statusi',
  DATE: 'Data',
} as const;

/** Locale-independent ascending compare. `localeCompare` is not stable across hosts. */
function compareText(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

// --- Writing --------------------------------------------------------------

const BOOLEAN_TRUE = 'true';
const BOOLEAN_FALSE = 'false';

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? BOOLEAN_TRUE : BOOLEAN_FALSE;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

/** Render one stored answer as a single cell. */
export function formatAnswerCell(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatScalar).join(CSV_IMPORT.MULTI_VALUE_SEPARATOR);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    // Not reachable through `validateSubmissionData` (no field type yields a bare
    // object), but a hand-edited `data` blob must still export rather than print
    // "[object Object]" into a lead sheet.
    return JSON.stringify(value);
  }
  return formatScalar(value);
}

/**
 * Resolve the dynamic column names for a result set. See the ordering rule at the top
 * of this file.
 *
 * `forms` is the set of forms that may contribute columns — for a per-form export that
 * is exactly one entry, which is why a form with zero submissions still exports a full
 * header line instead of a bare seven columns.
 */
export function resolveDynamicColumnNames(
  rows: readonly CsvSubmissionRow[],
  forms: ReadonlyMap<string, CsvFormMeta>,
): readonly string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const contributingForms = [...forms.values()].sort((a, b) => compareText(a.slug, b.slug));

  for (const form of contributingForms) {
    for (const field of form.fields) {
      if (!seen.has(field.name)) {
        seen.add(field.name);
        ordered.push(field.name);
      }
    }
  }

  const residual = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row.data)) {
      if (!seen.has(key)) {
        residual.add(key);
      }
    }
  }

  return [...ordered, ...[...residual].sort(compareText)];
}

/**
 * Build the full column list: the seven fixed columns, then the dynamic ones.
 *
 * Dynamic headers are the field NAME (the key inside `Submission.data`) rather than the
 * human label, because a name is unique per form and round-trips unambiguously; two
 * forms may legitimately share the label "Qyteti" while storing it under different keys.
 * The import side accepts either spelling, so a hand-written sheet using labels also
 * works.
 */
export function buildSubmissionCsvColumns(
  dynamicNames: readonly string[],
  forms: ReadonlyMap<string, CsvFormMeta>,
): readonly CsvColumn<CsvSubmissionRow>[] {
  const fixed: readonly CsvColumn<CsvSubmissionRow>[] = [
    { header: FIXED_HEADERS.NAME, value: (row) => row.name },
    { header: FIXED_HEADERS.EMAIL, value: (row) => row.email },
    { header: FIXED_HEADERS.PHONE, value: (row) => row.phone },
    { header: FIXED_HEADERS.FORM, value: (row) => row.formTitle },
    { header: FIXED_HEADERS.TYPE, value: (row) => forms.get(row.formId)?.type ?? '' },
    { header: FIXED_HEADERS.STATUS, value: (row) => row.status },
    { header: FIXED_HEADERS.DATE, value: (row) => row.createdAt.toISOString() },
  ];

  const dynamic = dynamicNames.map(
    (name): CsvColumn<CsvSubmissionRow> => ({
      header: name,
      value: (row) => formatAnswerCell(row.data[name]),
    }),
  );

  return [...fixed, ...dynamic];
}

// --- Reading --------------------------------------------------------------

export type ContactTarget = 'name' | 'email' | 'phone';

/** Trim, drop the BOM, lowercase and collapse whitespace so header matching is forgiving. */
function normaliseHeader(header: string): string {
  return header.replace(/^﻿/, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Header spellings that map onto the three promoted columns.
 *
 * Both the Albanian headers this API writes and the English ones a hand-built sheet is
 * likely to use are accepted. These take precedence over field names and labels.
 *
 * They cannot collide with a field NAME — `name` / `email` / `phone` are reserved and a
 * form can never declare them (RESERVED_FIELD_NAMES in form-fields.service.ts). They can
 * in principle shadow a field LABEL: a form may legitimately label a question "Email"
 * (say, a parent's address). That only bites on a hand-written sheet, because an export
 * from this API headers dynamic columns by field NAME, so the round trip is unaffected.
 * Contact wins deliberately: a column headed exactly "Email" is far more likely to be
 * the submitter's own address than a secondary one.
 */
const CONTACT_HEADER_ALIASES: Readonly<Record<string, ContactTarget>> = {
  emri: 'name',
  'emri i plote': 'name',
  'emri i plotë': 'name',
  emri_mbiemri: 'name',
  name: 'name',
  'full name': 'name',
  email: 'email',
  emaili: 'email',
  'e-mail': 'email',
  'email address': 'email',
  telefoni: 'phone',
  telefon: 'phone',
  tel: 'phone',
  phone: 'phone',
  'phone number': 'phone',
};

/**
 * Fixed columns that carry no importable information. `Forma` / `Tipi` are determined by
 * the target form chosen in the request, `Statusi` always starts at NEW, and `Data` is
 * the insert timestamp — accepting any of them from a file would let an uploader forge
 * the record. They are ignored silently rather than reported as unknown columns, because
 * they are present in every file this API produces.
 */
const IGNORED_HEADERS: ReadonlySet<string> = new Set([
  'forma',
  'form',
  'form slug',
  'formslug',
  'tipi',
  'type',
  'statusi',
  'status',
  'data',
  'date',
  'submitted at',
  'krijuar',
  'id',
  'answers',
]);

export type ImportHeaderPlan = {
  /** CSV header text for each promoted column, when the file provides one. */
  readonly contactHeaders: Readonly<Partial<Record<ContactTarget, string>>>;
  /** CSV header text -> the field definition it fills. */
  readonly fieldByHeader: ReadonlyMap<string, FieldDefinition>;
  /** Headers that matched nothing. Reported once, not per row. */
  readonly unknownHeaders: readonly string[];
};

/**
 * Work out, ONCE per file, what each header column means. Doing this per row would be
 * both slow and a place for the mapping to drift between rows.
 *
 * Precedence: contact alias, then field name, then field label. First header wins on a
 * duplicate so a repeated column cannot silently overwrite the first one's mapping.
 */
export function buildImportHeaderPlan(
  headers: readonly string[],
  fields: readonly FieldDefinition[],
): ImportHeaderPlan {
  const byName = new Map<string, FieldDefinition>();
  const byLabel = new Map<string, FieldDefinition>();

  for (const field of fields) {
    const name = normaliseHeader(field.name);
    const label = normaliseHeader(field.label);

    if (!byName.has(name)) {
      byName.set(name, field);
    }
    if (label.length > 0 && !byLabel.has(label)) {
      byLabel.set(label, field);
    }
  }

  const contactHeaders: Partial<Record<ContactTarget, string>> = {};
  const fieldByHeader = new Map<string, FieldDefinition>();
  const unknownHeaders: string[] = [];

  for (const header of headers) {
    const key = normaliseHeader(header);

    if (key.length === 0) {
      continue;
    }

    const contact = CONTACT_HEADER_ALIASES[key];

    if (contact) {
      if (contactHeaders[contact] === undefined) {
        contactHeaders[contact] = header;
      }
      continue;
    }

    const field = byName.get(key) ?? byLabel.get(key);

    if (field) {
      if (!fieldByHeader.has(header)) {
        fieldByHeader.set(header, field);
      }
      continue;
    }

    if (!IGNORED_HEADERS.has(key)) {
      unknownHeaders.push(header);
    }
  }

  return { contactHeaders, fieldByHeader, unknownHeaders };
}

/** Read one cell, undoing the writer's formula guard. Always returns a trimmed string. */
function readCell(record: Readonly<Record<string, string>>, header: string): string {
  const raw = record[header];
  return typeof raw === 'string' ? stripFormulaGuard(raw).trim() : '';
}

export type ContactValues = {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
};

export function extractContactValues(
  record: Readonly<Record<string, string>>,
  plan: ImportHeaderPlan,
): ContactValues {
  const read = (target: ContactTarget): string => {
    const header = plan.contactHeaders[target];
    return header === undefined ? '' : readCell(record, header);
  };

  return { name: read('name'), email: read('email'), phone: read('phone') };
}

const TRUE_CELLS: ReadonlySet<string> = new Set(['true', '1', 'yes', 'y', 'po', 'x', 'on']);
const FALSE_CELLS: ReadonlySet<string> = new Set(['false', '0', 'no', 'n', 'jo', 'off']);

/**
 * Turn a raw CSV string into the JS shape the field's validator expects.
 *
 * This is a PRE-normaliser, not a second validator: it only converts the CSV wire format
 * (everything is a string) into the types `validateSubmissionData` already accepts, and
 * then hands over. `checkbox` is the case that makes it necessary — the field schema is
 * `z.coerce.boolean()`, and `Boolean('false')` is `true`, so an un-normalised "false"
 * cell would import as a ticked box. Unrecognised values are passed through untouched so
 * the real validator, not this function, decides what is invalid.
 */
export function coerceCellForField(field: FieldDefinition, cell: string): unknown {
  if (cell.length === 0) {
    return '';
  }

  if (field.type === 'multiselect') {
    return cell
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  if (field.type === 'checkbox') {
    const key = cell.toLowerCase();

    if (TRUE_CELLS.has(key)) {
      return true;
    }
    if (FALSE_CELLS.has(key)) {
      return false;
    }
    return cell;
  }

  return cell;
}

/** Build the `data` payload for one record, ready for `validateSubmissionData`. */
export function extractAnswerPayload(
  record: Readonly<Record<string, string>>,
  plan: ImportHeaderPlan,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [header, field] of plan.fieldByHeader) {
    const cell = readCell(record, header);

    if (cell.length === 0) {
      // Left absent rather than set to '': `validateSubmissionData` treats both as
      // empty, and omitting keeps the stored blob free of meaningless keys.
      continue;
    }

    payload[field.name] = coerceCellForField(field, cell);
  }

  return payload;
}
