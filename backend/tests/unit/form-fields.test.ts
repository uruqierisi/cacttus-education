import { describe, expect, it } from 'vitest';
import {
  FIELD_TYPES,
  fieldDefinitionsSchema,
  parseStoredFields,
  validateSubmissionData,
  type FieldDefinition,
} from '../../src/services/form-fields.service';
import { ApiError } from '../../src/lib/api-error';
import { SCHOOL_FIELDS } from '../helpers/db';

const fields = parseStoredFields(SCHOOL_FIELDS);
const byName = (name: string): FieldDefinition =>
  fields.find((field) => field.name === name)!;

describe('fieldDefinitionsSchema', () => {
  it('accepts a well-formed definition and applies defaults', () => {
    const result = fieldDefinitionsSchema.parse([
      { name: 'age', label: 'Mosha', type: 'number' },
    ]);

    expect(result[0]).toMatchObject({ required: false, order: 0, options: [] });
  });

  it('normalises input aliases to the canonical type', () => {
    const parsed = fieldDefinitionsSchema.parse([
      { name: 'a', label: 'A', type: 'tel' },
      { name: 'b', label: 'B', type: 'telephone' },
      { name: 'c', label: 'C', type: 'string' },
      { name: 'd', label: 'D', type: 'boolean' },
    ]);

    expect(parsed.map((field) => field.type)).toEqual(['phone', 'phone', 'text', 'checkbox']);
  });

  it('rejects a reserved field name that collides with a promoted column', () => {
    for (const reserved of ['name', 'email', 'phone', 'id', 'status', 'createdAt']) {
      const result = fieldDefinitionsSchema.safeParse([
        { name: reserved, label: 'X', type: 'text' },
      ]);

      expect(result.success).toBe(false);
    }
  });

  it('rejects a field name that is not snake_case', () => {
    expect(
      fieldDefinitionsSchema.safeParse([{ name: 'School Name', label: 'X', type: 'text' }])
        .success,
    ).toBe(false);
    expect(
      fieldDefinitionsSchema.safeParse([{ name: '1abc', label: 'X', type: 'text' }]).success,
    ).toBe(false);
  });

  it('rejects a choice field with no options', () => {
    for (const type of ['select', 'multiselect', 'radio']) {
      const result = fieldDefinitionsSchema.safeParse([
        { name: 'choice', label: 'Zgjidh', type },
      ]);

      expect(result.success).toBe(false);
    }
  });

  it('rejects duplicate field names', () => {
    const result = fieldDefinitionsSchema.safeParse([
      { name: 'city', label: 'A', type: 'text' },
      { name: 'city', label: 'B', type: 'text' },
    ]);

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => /duplicate field name/.test(issue.message))).toBe(
      true,
    );
  });

  it('rejects an unknown field type', () => {
    expect(
      fieldDefinitionsSchema.safeParse([{ name: 'x', label: 'X', type: 'wormhole' }]).success,
    ).toBe(false);
  });

  it('exposes every supported field type', () => {
    expect(FIELD_TYPES).toContain('multiselect');
    expect(FIELD_TYPES).toHaveLength(10);
  });
});

describe('parseStoredFields', () => {
  it('sorts by order then by name', () => {
    const parsed = parseStoredFields([
      { name: 'zulu', label: 'Z', type: 'text', order: 1 },
      { name: 'alpha', label: 'A', type: 'text', order: 1 },
      { name: 'first', label: 'F', type: 'text', order: 0 },
    ]);

    expect(parsed.map((field) => field.name)).toEqual(['first', 'alpha', 'zulu']);
  });

  it('treats null/undefined as an empty definition list', () => {
    expect(parseStoredFields(null)).toEqual([]);
    expect(parseStoredFields(undefined)).toEqual([]);
  });

  it('turns a corrupt stored configuration into a clean 500, not a crash', () => {
    try {
      parseStoredFields([{ name: 'Bad Name!', label: '', type: 'nope' }]);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(500);
      expect((error as ApiError).message).toMatch(/invalid field configuration/);
    }
  });
});

describe('validateSubmissionData', () => {
  it('keeps only declared fields and drops unknown keys', () => {
    const data = validateSubmissionData(fields, {
      school_name: 'Gjimnazi Sami Frashëri',
      junk: 'drop me',
      status: 'ARCHIVED',
      __proto__: 'nope',
    });

    expect(data).toEqual({ school_name: 'Gjimnazi Sami Frashëri' });
    expect(Object.keys(data)).not.toContain('junk');
    expect(Object.keys(data)).not.toContain('status');
  });

  it('names the missing required field in the 400', () => {
    try {
      validateSubmissionData(fields, { city: 'peje' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(400);
      expect(apiError.details).toEqual([
        { field: 'school_name', message: 'Emri i shkollës is required.' },
      ]);
    }
  });

  it('treats an empty string, empty array and null as missing', () => {
    for (const empty of ['', '   ', [], null, undefined]) {
      expect(() => validateSubmissionData(fields, { school_name: empty })).toThrow(
        /Some answers are invalid/,
      );
    }
  });

  it('reports every invalid field at once', () => {
    try {
      validateSubmissionData(fields, { city: 'atlantis', interests: ['quantum'] });
      expect.unreachable('should have thrown');
    } catch (error) {
      const details = (error as ApiError).details;
      expect(details.map((detail) => detail.field).sort()).toEqual([
        'city',
        'interests',
        'school_name',
      ]);
    }
  });

  it('accepts a valid select option and rejects one outside the list', () => {
    expect(
      validateSubmissionData(fields, { school_name: 'x', city: 'peje' }),
    ).toMatchObject({ city: 'peje' });

    expect(() =>
      validateSubmissionData(fields, { school_name: 'x', city: 'atlantis' }),
    ).toThrow(ApiError);
  });

  it('accepts a multiselect subset and rejects an unknown member', () => {
    expect(
      validateSubmissionData(fields, { school_name: 'x', interests: ['ai', 'cyber'] }),
    ).toMatchObject({ interests: ['ai', 'cyber'] });

    expect(() =>
      validateSubmissionData(fields, { school_name: 'x', interests: ['ai', 'nope'] }),
    ).toThrow(ApiError);
  });

  it('coerces a checkbox answer to a boolean', () => {
    expect(
      validateSubmissionData(fields, { school_name: 'x', consent: true }),
    ).toMatchObject({ consent: true });
  });

  it('validates every scalar field type', () => {
    const typed = parseStoredFields([
      { name: 'note', label: 'Note', type: 'textarea', order: 0 },
      { name: 'contact_email', label: 'Email', type: 'email', order: 1 },
      { name: 'mobile', label: 'Mobile', type: 'phone', order: 2 },
      { name: 'age', label: 'Age', type: 'number', order: 3 },
      { name: 'born', label: 'Born', type: 'date', order: 4 },
      {
        name: 'pick',
        label: 'Pick',
        type: 'radio',
        order: 5,
        options: [{ value: 'a', label: 'A' }],
      },
    ]);

    const data = validateSubmissionData(typed, {
      note: '  hello  ',
      contact_email: '  ARTA@Example.COM ',
      mobile: '+38344123456',
      age: '17',
      born: '2009-04-01',
      pick: 'a',
    });

    expect(data).toEqual({
      note: 'hello',
      contact_email: 'arta@example.com',
      mobile: '+38344123456',
      age: 17,
      born: '2009-04-01',
      pick: 'a',
    });
  });

  it('rejects a malformed value per field type', () => {
    const typed = parseStoredFields([
      { name: 'contact_email', label: 'Email', type: 'email', order: 0 },
      { name: 'born', label: 'Born', type: 'date', order: 1 },
      { name: 'age', label: 'Age', type: 'number', order: 2 },
      { name: 'mobile', label: 'Mobile', type: 'phone', order: 3 },
    ]);

    for (const payload of [
      { contact_email: 'not-an-email' },
      { born: '01/04/2009' },
      { age: 'seventeen' },
      { mobile: '123' },
    ]) {
      expect(() => validateSubmissionData(typed, payload)).toThrow(ApiError);
    }
  });

  it('rejects a number beyond the guarded range', () => {
    const typed = parseStoredFields([{ name: 'n', label: 'N', type: 'number', order: 0 }]);

    expect(() => validateSubmissionData(typed, { n: 2_000_000_000 })).toThrow(ApiError);
  });

  it('returns an empty object when the form declares no fields', () => {
    expect(validateSubmissionData([], { anything: 'goes' })).toEqual({});
  });
});
