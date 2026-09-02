
/* ─── Phone number rule ───
   A MIRROR of the API's `phoneSchema` (backend/src/schemas/common.schema.ts), never a
   replacement for it: this half only buys instant feedback, and anything that skips the
   browser is still stopped server-side. Kept here, once, so all four phone inputs on this
   site enforce the same thing — a copy per form is a copy that drifts. */
export const PHONE_RULE = /^\+?[0-9]{5,}$/;

export const PHONE_ERROR = "Numri lejon vetëm shifra, me një '+' opsional në fillim.";


/**
 * Drops what the API would reject, as it is typed. Spaces survive so "+383 44 123 456"
 * stays readable while being entered; the server strips them before storing.
 *
 * The `+` needs its own pass: it is legal only as the very first character, so a stray one
 * typed mid-number is removed rather than allowed to sit there and fail validation later.
 */
export function sanitizePhone(value: string): string {
  const allowed = value.replace(/[^\d+\s]/g, "");
  const lead = allowed.startsWith("+") ? "+" : "";
  return lead + allowed.slice(lead.length).replace(/\+/g, "");
}


/** Judged on the stripped form, exactly as the server judges it. */
export function isValidPhone(value: string): boolean {
  return PHONE_RULE.test(value.replace(/\s+/g, ""));
}
