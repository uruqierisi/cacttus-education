import { describe, expect, it } from 'vitest';
import { decodeCsvBuffer, parseCsvRecords } from '../../src/lib/csv-parse';
import { ApiError } from '../../src/lib/api-error';

const BOM = '﻿';

describe('decodeCsvBuffer', () => {
  it('decodes UTF-8 and preserves Albanian characters', () => {
    const text = decodeCsvBuffer(Buffer.from('Emri\nArtë Çela', 'utf8'));

    expect(text).toBe('Emri\nArtë Çela');
  });

  it('strips a leading BOM so it cannot become part of the first header', () => {
    const text = decodeCsvBuffer(Buffer.from(`${BOM}Emri,Email`, 'utf8'));

    expect(text.startsWith(BOM)).toBe(false);
    expect(text).toBe('Emri,Email');
  });
});

describe('parseCsvRecords', () => {
  it('parses headers and header-keyed records', () => {
    const parsed = parseCsvRecords('Emri,Email\r\nArta,arta@example.com\r\n', 10);

    expect(parsed.headers).toEqual(['Emri', 'Email']);
    expect(parsed.records).toEqual([{ Emri: 'Arta', Email: 'arta@example.com' }]);
    expect(parsed.errorsByRecord.size).toBe(0);
  });

  it('trims header whitespace and strips a BOM from the first header', () => {
    const parsed = parseCsvRecords(`${BOM}  Emri  , Email \nArta,a@b.com`, 10);

    expect(parsed.headers).toEqual(['Emri', 'Email']);
  });

  it('keeps every cell a string — no dynamic typing', () => {
    const parsed = parseCsvRecords('Kodi,Aktiv\n0031,no', 10);

    expect(parsed.records[0]).toEqual({ Kodi: '0031', Aktiv: 'no' });
  });

  it('handles quoted cells containing commas, quotes and newlines', () => {
    const parsed = parseCsvRecords('A,B\n"x,y","he said ""hi""\nagain"', 10);

    expect(parsed.records[0]).toEqual({ A: 'x,y', B: 'he said "hi"\nagain' });
  });

  it('skips blank and whitespace-only lines', () => {
    const parsed = parseCsvRecords('A,B\n1,2\n\n   \n3,4\n', 10);

    expect(parsed.records).toHaveLength(2);
  });

  it('rejects an empty document', () => {
    expect(() => parseCsvRecords('   \n  ', 10)).toThrowError(ApiError);
    expect(() => parseCsvRecords('', 10)).toThrow(/The CSV file is empty/);
  });

  it('rejects a file with more data rows than the cap', () => {
    const text = ['A,B', '1,1', '2,2', '3,3'].join('\n');

    expect(() => parseCsvRecords(text, 2)).toThrow(/more than 2 data rows/);
  });

  it('accepts a file exactly at the cap', () => {
    const parsed = parseCsvRecords(['A,B', '1,1', '2,2'].join('\n'), 2);

    expect(parsed.records).toHaveLength(2);
  });

  /**
   * DOCUMENTED BEHAVIOUR. papaparse cannot auto-detect a delimiter in a file that has
   * only one column, so it reports a document-level `Delimiter` error and the whole
   * request is refused. Harmless in practice — an import must supply at least the three
   * contact columns — but pinned so the message is not a surprise in a support ticket.
   */
  it('refuses a single-column file with a document-level delimiter error', () => {
    expect(() => parseCsvRecords(['A', '1', '2'].join('\n'), 10)).toThrow(
      /could not be parsed — Delimiter/,
    );
  });

  it('records a structural problem against the offending record index', () => {
    const parsed = parseCsvRecords('A,B\n1,2\n1,2,3\n', 10);

    expect(parsed.records).toHaveLength(2);
    expect(parsed.errorsByRecord.has(1)).toBe(true);
    expect(parsed.errorsByRecord.get(1)).toMatch(/FieldMismatch/);
  });

  it('surfaces the parse failure as a 400, not a 500', () => {
    try {
      parseCsvRecords('', 10);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
    }
  });
});
