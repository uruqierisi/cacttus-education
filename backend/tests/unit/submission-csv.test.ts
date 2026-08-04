import { describe, expect, it } from 'vitest';
import { FormType, SubmissionStatus } from '@prisma/client';
import {
  FIXED_HEADERS,
  buildImportHeaderPlan,
  buildSubmissionCsvColumns,
  coerceCellForField,
  extractAnswerPayload,
  extractContactValues,
  formatAnswerCell,
  resolveDynamicColumnNames,
  type CsvFormMeta,
  type CsvSubmissionRow,
} from '../../src/lib/submission-csv';
import { parseStoredFields } from '../../src/services/form-fields.service';
import { SCHOOL_FIELDS } from '../helpers/db';

const fields = parseStoredFields(SCHOOL_FIELDS);

function formMeta(overrides: Partial<CsvFormMeta> = {}): CsvFormMeta {
  return {
    id: 'form-1',
    slug: 'aplikimi',
    title: 'Aplikimi',
    type: FormType.SCHOOL,
    fields,
    ...overrides,
  };
}

function row(overrides: Partial<CsvSubmissionRow> = {}): CsvSubmissionRow {
  return {
    formId: 'form-1',
    formTitle: 'Aplikimi',
    name: 'Arta',
    email: 'arta@example.com',
    phone: '044',
    data: {},
    status: SubmissionStatus.NEW,
    createdAt: new Date('2026-08-03T10:00:00.000Z'),
    ...overrides,
  };
}

describe('formatAnswerCell', () => {
  it('joins multiselect answers with the shared separator', () => {
    expect(formatAnswerCell(['ai', 'cyber'])).toBe('ai; cyber');
  });

  it('writes booleans as true/false', () => {
    expect(formatAnswerCell(true)).toBe('true');
    expect(formatAnswerCell(false)).toBe('false');
  });

  it('renders dates as ISO', () => {
    expect(formatAnswerCell(new Date('2026-08-03T10:00:00.000Z'))).toBe(
      '2026-08-03T10:00:00.000Z',
    );
  });

  it('renders null and undefined as empty', () => {
    expect(formatAnswerCell(null)).toBe('');
    expect(formatAnswerCell(undefined)).toBe('');
  });

  it('JSON-encodes a hand-edited object instead of printing [object Object]', () => {
    expect(formatAnswerCell({ a: 1 })).toBe('{"a":1}');
  });

  it('stringifies numbers', () => {
    expect(formatAnswerCell(42)).toBe('42');
  });
});

describe('resolveDynamicColumnNames', () => {
  it('orders columns by form slug, then by the form field order', () => {
    const forms = new Map<string, CsvFormMeta>([
      ['b', formMeta({ id: 'b', slug: 'zzz-later' })],
      ['a', formMeta({ id: 'a', slug: 'aaa-first' })],
    ]);

    expect(resolveDynamicColumnNames([], forms)).toEqual([
      'school_name',
      'city',
      'interests',
      'consent',
    ]);
  });

  it('never duplicates a key shared by two forms', () => {
    const forms = new Map<string, CsvFormMeta>([
      ['a', formMeta({ id: 'a', slug: 'a' })],
      ['b', formMeta({ id: 'b', slug: 'b' })],
    ]);

    const names = resolveDynamicColumnNames([], forms);

    expect(new Set(names).size).toBe(names.length);
  });

  it('appends residual keys from deleted questions last, sorted ascending', () => {
    const forms = new Map<string, CsvFormMeta>([['form-1', formMeta()]]);
    const rows = [row({ data: { zeta_old: '1', alpha_old: '2', school_name: 'x' } })];

    expect(resolveDynamicColumnNames(rows, forms)).toEqual([
      'school_name',
      'city',
      'interests',
      'consent',
      'alpha_old',
      'zeta_old',
    ]);
  });

  it('is deterministic regardless of Map insertion order', () => {
    const first = new Map<string, CsvFormMeta>([
      ['a', formMeta({ id: 'a', slug: 'a', fields: parseStoredFields([SCHOOL_FIELDS[0]]) })],
      ['b', formMeta({ id: 'b', slug: 'b', fields: parseStoredFields([SCHOOL_FIELDS[1]]) })],
    ]);
    const second = new Map([...first].reverse());

    expect(resolveDynamicColumnNames([], first)).toEqual(
      resolveDynamicColumnNames([], second),
    );
  });
});

describe('buildSubmissionCsvColumns', () => {
  it('emits the seven Albanian fixed headers first', () => {
    const columns = buildSubmissionCsvColumns([], new Map());

    expect(columns.map((column) => column.header)).toEqual([
      FIXED_HEADERS.NAME,
      FIXED_HEADERS.EMAIL,
      FIXED_HEADERS.PHONE,
      FIXED_HEADERS.FORM,
      FIXED_HEADERS.TYPE,
      FIXED_HEADERS.STATUS,
      FIXED_HEADERS.DATE,
    ]);
  });

  it('reads each fixed value off the row', () => {
    const forms = new Map<string, CsvFormMeta>([['form-1', formMeta()]]);
    const columns = buildSubmissionCsvColumns(['school_name'], forms);
    const subject = row({ data: { school_name: 'Gjimnazi' } });

    expect(columns.map((column) => column.value(subject))).toEqual([
      'Arta',
      'arta@example.com',
      '044',
      'Aplikimi',
      FormType.SCHOOL,
      SubmissionStatus.NEW,
      '2026-08-03T10:00:00.000Z',
      'Gjimnazi',
    ]);
  });

  it('leaves the type cell empty when the form metadata is missing', () => {
    const columns = buildSubmissionCsvColumns([], new Map());
    const typeColumn = columns.find((column) => column.header === FIXED_HEADERS.TYPE);

    expect(typeColumn?.value(row())).toBe('');
  });
});

describe('buildImportHeaderPlan', () => {
  it('maps the Albanian contact headers this API writes', () => {
    const plan = buildImportHeaderPlan(['Emri', 'Email', 'Telefoni'], fields);

    expect(plan.contactHeaders).toEqual({ name: 'Emri', email: 'Email', phone: 'Telefoni' });
    expect(plan.unknownHeaders).toEqual([]);
  });

  it('maps the English aliases a hand-built sheet is likely to use', () => {
    const plan = buildImportHeaderPlan(['Full Name', 'E-Mail', 'Phone Number'], fields);

    expect(plan.contactHeaders).toEqual({
      name: 'Full Name',
      email: 'E-Mail',
      phone: 'Phone Number',
    });
  });

  it('matches a dynamic column by field name', () => {
    const plan = buildImportHeaderPlan(['school_name'], fields);

    expect(plan.fieldByHeader.get('school_name')?.name).toBe('school_name');
  });

  it('matches a dynamic column by field label, case and spacing insensitively', () => {
    const plan = buildImportHeaderPlan(['  EMRI I SHKOLLËS  '], fields);

    expect([...plan.fieldByHeader.values()][0]?.name).toBe('school_name');
  });

  it('ignores the export-only fixed columns silently', () => {
    const plan = buildImportHeaderPlan(['Forma', 'Tipi', 'Statusi', 'Data', 'id'], fields);

    expect(plan.unknownHeaders).toEqual([]);
    expect(plan.fieldByHeader.size).toBe(0);
  });

  it('reports headers that match nothing', () => {
    const plan = buildImportHeaderPlan(['Emri', 'Rastesishme', 'Tjeter'], fields);

    expect(plan.unknownHeaders).toEqual(['Rastesishme', 'Tjeter']);
  });

  it('lets the first duplicate header win', () => {
    const plan = buildImportHeaderPlan(['Emri', 'Name'], fields);

    expect(plan.contactHeaders.name).toBe('Emri');
  });

  it('skips empty headers', () => {
    const plan = buildImportHeaderPlan(['', '   ', 'Emri'], fields);

    expect(plan.contactHeaders.name).toBe('Emri');
    expect(plan.unknownHeaders).toEqual([]);
  });
});

describe('coerceCellForField', () => {
  const byName = (name: string) => fields.find((field) => field.name === name)!;

  it('splits a multiselect cell on semicolons and trims the parts', () => {
    expect(coerceCellForField(byName('interests'), 'ai; cyber ')).toEqual(['ai', 'cyber']);
  });

  it('drops empty segments from a multiselect cell', () => {
    expect(coerceCellForField(byName('interests'), 'ai;;')).toEqual(['ai']);
  });

  it.each(['true', '1', 'yes', 'Y', 'po', 'X', 'on'])(
    'reads %j as a ticked checkbox',
    (cell) => {
      expect(coerceCellForField(byName('consent'), cell)).toBe(true);
    },
  );

  it.each(['false', '0', 'no', 'N', 'jo', 'off'])(
    'reads %j as an unticked checkbox — Boolean("false") would be true',
    (cell) => {
      expect(coerceCellForField(byName('consent'), cell)).toBe(false);
    },
  );

  it('passes an unrecognised checkbox value through for the real validator to judge', () => {
    expect(coerceCellForField(byName('consent'), 'maybe')).toBe('maybe');
  });

  it('returns an empty string for an empty cell', () => {
    expect(coerceCellForField(byName('school_name'), '')).toBe('');
  });

  it('leaves other field types untouched', () => {
    expect(coerceCellForField(byName('school_name'), 'Gjimnazi')).toBe('Gjimnazi');
  });
});

describe('extractContactValues / extractAnswerPayload', () => {
  const plan = buildImportHeaderPlan(
    ['Emri', 'Email', 'Telefoni', 'school_name', 'consent'],
    fields,
  );

  it('reads the three promoted columns and undoes the formula guard', () => {
    const values = extractContactValues(
      { Emri: " Arta ", Email: 'a@b.com', Telefoni: "'+38344123456" },
      plan,
    );

    expect(values).toEqual({ name: 'Arta', email: 'a@b.com', phone: '+38344123456' });
  });

  it('returns empty strings for contact columns the file does not provide', () => {
    const bare = buildImportHeaderPlan(['Emri'], fields);

    expect(extractContactValues({ Emri: 'Arta' }, bare)).toEqual({
      name: 'Arta',
      email: '',
      phone: '',
    });
  });

  it('builds the answer payload keyed by field name, not header text', () => {
    const payload = extractAnswerPayload({ school_name: 'Gjimnazi', consent: 'po' }, plan);

    expect(payload).toEqual({ school_name: 'Gjimnazi', consent: true });
  });

  it('omits empty cells rather than storing meaningless keys', () => {
    const payload = extractAnswerPayload({ school_name: '   ', consent: 'po' }, plan);

    expect(payload).toEqual({ consent: true });
    expect('school_name' in payload).toBe(false);
  });

  it('ignores columns the plan did not map', () => {
    const payload = extractAnswerPayload({ school_name: 'X', junk: 'ignored' }, plan);

    expect(payload).toEqual({ school_name: 'X' });
  });
});
