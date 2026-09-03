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

   WHICH form it renders is the caller's decision, passed as `slug`: /programim hands it
   the ZHVAM form and /siguria the CYBER one, so the programme is carried by the
   destination rather than by a pre-selected answer on a shared form. Surfaces with no
   programme of their own (home, /rreth-nesh) take the default. The slugs live in
   `src/marketing/lib/forms.config.ts`.
══════════════════════════════════════════ */

/** Answer values as held in local state, before being shaped into the API payload. */
export type AnswerValue = string | string[] | boolean;


export const EMPTY_CONTACT = { name: "", email: "", phone: "" };

/**
 * The apply band's own split of the single `name` field into two visible inputs. The
 * API, the database column and the dashboard all still hold ONE name — the two parts
 * are joined with a single space on submit and never travel separately.
 */
export const EMPTY_NAME_PARTS = { firstName: "", lastName: "" };

/** `"  Ana Maria " + " Gashi  "` -> `"Ana Maria Gashi"`. Only the edges are trimmed, so
 *  a space INSIDE either part is preserved. */
export function joinName(parts: { firstName: string; lastName: string }): string {
  return `${parts.firstName.trim()} ${parts.lastName.trim()}`;
}


/** Field types that render as a plain <input>, with the HTML type to use. */
export const TEXT_INPUT_TYPES: Partial<Record<PublicFormFieldType, string>> = {
  text: "text",
  email: "email",
  phone: "tel",
  number: "number",
  date: "date",
};


/** The blank answer for a field, used both on first render and after a successful send. */
export function emptyAnswer(field: PublicFormField): AnswerValue {
  if (field.type === "checkbox") return false;
  if (field.type === "multiselect") return [];
  return "";
}


export function blankAnswers(fields: readonly PublicFormField[]): Record<string, AnswerValue> {
  return Object.fromEntries(fields.map((field) => [field.name, emptyAnswer(field)]));
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
