/**
 * Which backend form the public "Apliko tani" band renders.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  CHANGE THIS ONE LINE to point the site at a different form.             │
 * │  The value is the form's `slug` — visible in the dashboard under         │
 * │  Format → (open a form). It is derived from the title on creation,       │
 * │  e.g. "Aplikim për ZHVAM" → "aplikim-per-zhvam".                         │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * The form must be ACTIVE in the dashboard; `/api/public/forms/:slug` returns 404 for
 * an inactive or deleted one, and the band renders its "form unavailable" state.
 */
export const APPLICATION_FORM_SLUG = 'regjistrimi-kiber-siguri'
