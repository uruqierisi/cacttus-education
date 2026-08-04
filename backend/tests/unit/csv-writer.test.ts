import { describe, expect, it } from 'vitest';
import {
  csvDayFilename,
  csvFilename,
  stripFormulaGuard,
  toCsv,
  type CsvColumn,
} from '../../src/lib/csv';

type Row = { readonly a: string; readonly b: number | null };

const columns: readonly CsvColumn<Row>[] = [
  { header: 'A', value: (row) => row.a },
  { header: 'B', value: (row) => row.b },
];

const BOM_BYTES = Buffer.from([0xef, 0xbb, 0xbf]);

describe('toCsv', () => {
  it('starts with the UTF-8 BOM bytes EF BB BF', () => {
    const csv = toCsv([{ a: 'x', b: 1 }], columns);
    const bytes = Buffer.from(csv, 'utf8');

    expect(bytes.subarray(0, 3)).toEqual(BOM_BYTES);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('quotes every cell and terminates rows with CRLF', () => {
    const csv = toCsv([{ a: 'x', b: 1 }], columns);

    expect(csv).toBe('﻿"A","B"\r\n"x","1"\r\n');
  });

  it('renders null and undefined as an empty cell', () => {
    const csv = toCsv([{ a: '', b: null }], columns);

    expect(csv.endsWith('"",""\r\n')).toBe(true);
  });

  it('doubles embedded quotes so the cell cannot break out', () => {
    const csv = toCsv([{ a: 'say "hi", ok', b: 0 }], columns);

    expect(csv).toContain('"say ""hi"", ok"');
  });

  it('preserves embedded newlines inside the quoted cell', () => {
    const csv = toCsv([{ a: 'line1\nline2', b: 0 }], columns);

    expect(csv).toContain('"line1\nline2"');
  });

  it.each(['=', '+', '-', '@', '\t', '\r'])(
    'neutralises a cell beginning with %j by prefixing an apostrophe',
    (trigger) => {
      const csv = toCsv([{ a: `${trigger}cmd|'/c calc'!A0`, b: 0 }], columns);

      expect(csv).toContain(`"'${trigger}cmd|'/c calc'!A0"`);
    },
  );

  it('neutralises a formula in the HEADER too', () => {
    const csv = toCsv<Row>([], [{ header: '=1+1', value: (row) => row.a }]);

    expect(csv).toContain('"\'=1+1"');
  });

  it('leaves an inert cell untouched', () => {
    const csv = toCsv([{ a: 'Arta Krasniqi', b: 2 }], columns);

    expect(csv).toContain('"Arta Krasniqi"');
    expect(csv).not.toContain("'Arta");
  });

  it('emits only the header line for an empty result set', () => {
    expect(toCsv<Row>([], columns)).toBe('﻿"A","B"\r\n');
  });
});

describe('stripFormulaGuard', () => {
  it('is the exact inverse of the writer guard', () => {
    for (const trigger of ['=', '+', '-', '@', '\t', '\r']) {
      expect(stripFormulaGuard(`'${trigger}1+1`)).toBe(`${trigger}1+1`);
    }
  });

  it('keeps a legitimate leading apostrophe', () => {
    expect(stripFormulaGuard("'93")).toBe("'93");
    expect(stripFormulaGuard("'Arta")).toBe("'Arta");
  });

  it('returns anything without a leading apostrophe untouched', () => {
    expect(stripFormulaGuard('=1+1')).toBe('=1+1');
    expect(stripFormulaGuard('')).toBe('');
  });
});

describe('filenames', () => {
  it('stamps the day only for the export filename', () => {
    expect(csvDayFilename('aplikimet', new Date('2026-08-03T22:15:09.000Z'))).toBe(
      'aplikimet-2026-08-03.csv',
    );
  });

  it('strips anything that could break out of the Content-Disposition quotes', () => {
    // Everything outside [A-Za-z0-9_-] is removed, spaces included.
    expect(csvDayFilename('../../etc/passwd"; x', new Date('2026-01-02T00:00:00.000Z'))).toBe(
      'etcpasswdx-2026-01-02.csv',
    );
  });

  it('falls back to "export" when the prefix sanitises to nothing', () => {
    expect(csvDayFilename('///', new Date('2026-01-02T00:00:00.000Z'))).toBe(
      'export-2026-01-02.csv',
    );
  });

  it('stamps to the second for the generic filename', () => {
    const name = csvFilename('leads');

    expect(name).toMatch(/^leads-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/);
  });
});
