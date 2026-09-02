import type {
  ApiErrorDetail,
  PublicFormField,
  PublicFormFieldType,
} from "../../marketing/lib/public-api";


/* ══════════════════════════════════════════
   2.3 / 3.3 — HORIZONTAL APPLICATION BAND
   (shared component, pixel-identical on all pages)

   The fields are NOT hard-coded: they are fetched from
   `/api/public/forms/:slug` so an admin can add or reword a question in the
   dashboard without a redeploy. Only `name` / `email` / `phone` are fixed —
   the API promotes those three to real columns and always requires them, and
   they are reserved names a form field may not use.

   To point the band at a different form, edit APPLICATION_FORM_SLUG in
   `src/marketing/lib/forms.config.ts`.
══════════════════════════════════════════ */

/** Answer values as held in local state, before being shaped into the API payload. */
export type AnswerValue = string | string[] | boolean;


export const EMPTY_CONTACT = { name: "", email: "", phone: "" };


/** Field types that render as a plain <input>, with the HTML type to use. */
export const TEXT_INPUT_TYPES: Partial<Record<PublicFormFieldType, string>> = {
  text: "text",
  email: "email",
  phone: "tel",
  number: "number",
  date: "date",
};


/** The blank answer for a field, used both on first render and after a successful send. */
export function emptyAnswer(field: PublicFormField, preselected: string): AnswerValue {
  if (field.type === "checkbox") return false;
  if (field.type === "multiselect") return [];

  // Carry the programme the visitor arrived from into the first matching choice
  // field, so /programim pre-selects "Zhvillues i Ueb-it..." exactly as before.
  if (preselected && (field.type === "select" || field.type === "radio")) {
    const match = field.options.find(
      (option) =>
        option.value.toLowerCase() === preselected.toLowerCase() ||
        option.label.toLowerCase() === preselected.toLowerCase(),
    );
    if (match) return match.value;
  }

  return "";
}


export function blankAnswers(
  fields: readonly PublicFormField[],
  preselected: string,
): Record<string, AnswerValue> {
  return Object.fromEntries(fields.map((field) => [field.name, emptyAnswer(field, preselected)]));
}


export function isBlank(value: AnswerValue): boolean {
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return value === false;
}


/**
 * Server-reported field errors, keyed for lookup by input.
 *
 * The API speaks two dialects: body-schema failures arrive as `body.email` (see the
 * validate middleware), answer failures as the bare field name. Stripping the prefix
 * lets one lookup serve both.
 */
export function indexErrorDetails(details: readonly ApiErrorDetail[]): Record<string, string> {
  const byField: Record<string, string> = {};

  for (const detail of details) {
    if (!detail.field) continue;
    byField[detail.field.replace(/^body\./, "")] = detail.message;
  }

  return byField;
}
