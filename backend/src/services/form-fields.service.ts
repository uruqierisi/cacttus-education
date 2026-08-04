/**
 * The generic form engine.
 *
 * `Form.fields` is a JSON array of field definitions. This module owns that
 * contract in one place: the shape admins write, and the runtime Zod schema used to
 * validate a public submission against it. Adding a question is a row update, never
 * a migration or a deploy.
 *
 * Field definition shape:
 * {
 *   "name": "school_name",          // stable key used inside Submission.data
 *   "label": "Emri i shkollës",
 *   "type": "text",                 // see FIELD_TYPES below
 *   "required": true,
 *   "placeholder": "",              // optional
 *   "helpText": "",                 // optional
 *   "order": 1,
 *   "options": [                     // required for select/multiselect/radio
 *     { "value": "public", "label": "Publike" }
 *   ]
 * }
 */
import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';
import { ApiError, type ErrorDetail } from '../lib/api-error';

export const FIELD_TYPES = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'select',
  'multiselect',
  'radio',
  'checkbox',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/**
 * Input aliases normalised on write, so storage only ever holds a canonical type.
 *
 * `tel` is the HTML input name and is what the dashboard and the marketing site
 * naturally speak; `phone` is canonical here because it matches the reserved
 * `Submission.phone` column. Accepting both avoids forcing either side to translate,
 * while keeping exactly one type in the database.
 */
const FIELD_TYPE_ALIASES: Readonly<Record<string, FieldType>> = {
  tel: 'phone',
  telephone: 'phone',
  string: 'text',
  boolean: 'checkbox',
};

function normaliseFieldType(value: unknown): unknown {
  return typeof value === 'string' && value in FIELD_TYPE_ALIASES
    ? FIELD_TYPE_ALIASES[value]
    : value;
}

/** Types whose answers come from a fixed option list. */
const CHOICE_TYPES: readonly FieldType[] = ['select', 'multiselect', 'radio'];

/** Reserved keys — these are promoted to real Submission columns, not JSON answers. */
const RESERVED_FIELD_NAMES = new Set(['name', 'email', 'phone', 'id', 'status', 'createdAt']);

const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;
const MAX_OPTIONS_PER_FIELD = 100;
const MAX_NUMBER_ANSWER = 1_000_000_000;

const optionSchema = z.object({
  value: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(200),
});

export const fieldDefinitionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(FIELD_NAME_PATTERN, 'must be snake_case, start with a letter, max 50 chars')
      .refine((value) => !RESERVED_FIELD_NAMES.has(value), {
        message: 'name is reserved (name, email and phone are stored as columns)',
      }),
    label: z.string().trim().min(1).max(200),
    type: z.preprocess(normaliseFieldType, z.enum(FIELD_TYPES)),
    required: z.boolean().default(false),
    placeholder: z.string().trim().max(200).optional(),
    helpText: z.string().trim().max(300).optional(),
    order: z.number().int().min(0).max(999).default(0),
    options: z.array(optionSchema).max(MAX_OPTIONS_PER_FIELD).default([]),
  })
  .superRefine((field, ctx) => {
    if (CHOICE_TYPES.includes(field.type) && field.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: `field "${field.name}" of type ${field.type} needs at least one option`,
      });
    }
  });

export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;

export const fieldDefinitionsSchema = z
  .array(fieldDefinitionSchema)
  .max(FIELD_LIMITS.FORM_FIELDS_MAX)
  .superRefine((fields, ctx) => {
    const seen = new Set<string>();
    for (const field of fields) {
      if (seen.has(field.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate field name "${field.name}"`,
        });
      }
      seen.add(field.name);
    }
  });

/**
 * Re-parse the JSON column into typed definitions. Stored JSON is trusted less than
 * it looks: a bad manual DB edit must surface as a clean 500, not a crash loop.
 */
export function parseStoredFields(raw: unknown): readonly FieldDefinition[] {
  const result = fieldDefinitionsSchema.safeParse(raw ?? []);

  if (!result.success) {
    throw ApiError.internal('This form has an invalid field configuration.');
  }

  return [...result.data].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function answerSchemaFor(field: FieldDefinition): z.ZodTypeAny {
  const allowedValues = field.options.map((option) => option.value);

  switch (field.type) {
    case 'textarea':
      return z.string().trim().max(FIELD_LIMITS.TEXT_ANSWER_MAX);
    case 'email':
      return z.string().trim().toLowerCase().email().max(FIELD_LIMITS.EMAIL_MAX);
    case 'phone':
      return z.string().trim().min(5).max(FIELD_LIMITS.PHONE_MAX);
    case 'number':
      return z.coerce.number().finite().min(-MAX_NUMBER_ANSWER).max(MAX_NUMBER_ANSWER);
    case 'date':
      return z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)');
    case 'checkbox':
      return z.coerce.boolean();
    case 'select':
    case 'radio':
      return z.string().trim().refine((value) => allowedValues.includes(value), {
        message: `must be one of: ${allowedValues.join(', ')}`,
      });
    case 'multiselect':
      return z
        .array(z.string().trim())
        .max(MAX_OPTIONS_PER_FIELD)
        .refine((values) => values.every((value) => allowedValues.includes(value)), {
          message: `each value must be one of: ${allowedValues.join(', ')}`,
        });
    case 'text':
    default:
      return z.string().trim().max(FIELD_LIMITS.TEXT_ANSWER_MAX);
  }
}

function isEmptyAnswer(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

/**
 * Validate one submission payload against the form's definitions.
 *
 * Unknown keys are dropped rather than rejected: the marketing site may lag a form
 * edit by a deploy, and losing an obsolete answer beats losing the whole lead.
 */
export function validateSubmissionData(
  fields: readonly FieldDefinition[],
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const accepted: Record<string, unknown> = {};
  const details: ErrorDetail[] = [];

  for (const field of fields) {
    const rawValue = payload[field.name];

    if (isEmptyAnswer(rawValue)) {
      if (field.required) {
        details.push({ field: field.name, message: `${field.label} is required.` });
      }
      continue;
    }

    const parsed = answerSchemaFor(field).safeParse(rawValue);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid value.';
      details.push({ field: field.name, message: `${field.label}: ${message}` });
      continue;
    }

    accepted[field.name] = parsed.data;
  }

  if (details.length > 0) {
    throw ApiError.badRequest('Some answers are invalid.', details);
  }

  return accepted;
}
