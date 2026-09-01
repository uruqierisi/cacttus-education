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
 *
 * Shared by the "Apliko tani" band (home, /programim, /siguria, /rreth-nesh) AND the
 * scroll popup, deliberately: they are two skins on ONE application path, so a lead is
 * the same record whichever one it came through.
 *
 * Points at the ZHVAM form "Aplikim — Studime Profesionale", whose `programi` select
 * carries the applicant's chosen programme. It previously pointed at the CYBER form
 * `regjistrimi-kiber-siguri`, whose only field was `motivimi` — so a /programim
 * applicant was filed as CYBER and their programme choice was silently dropped, having
 * matched no field on that form.
 */
export const APPLICATION_FORM_SLUG = 'aplikim-studime-profesionale'

/**
 * The option VALUES of that form's `programi` select.
 *
 * They are the strings the server validates against (a select answer is checked against
 * `option.value`, never the label), and they are also what `ProgramPage` passes as
 * `preselected` — which is why the band pre-selects correctly without a lookup table.
 * The popup's own dropdown wording differs slightly and is mapped onto these; see
 * POPUP_PROGRAMME_VALUES in App.tsx.
 */
export const STUDY_PROGRAMME_VALUES = {
  ZHVAM: 'Zhvillim i Ueb-it dhe Aplikacioneve Mobile',
  CYBER: 'Siguria Kibernetike',
} as const

/**
 * Which backend form the /kontakti "Na dërgo mesazh" box submits to.
 *
 * Same contract as `APPLICATION_FORM_SLUG` above — change this one line to point the
 * contact box at a different form, and keep that form ACTIVE in the dashboard.
 *
 * Unlike the application band, /kontakti does NOT render the form's fields: its inputs
 * are laid out by hand. The form record exists so the messages land in the same inbox as
 * every other submission, so its custom field NAMES are load-bearing — the page sends
 * `subjekti` and `mesazhi`, and the server drops any key the form does not declare.
 */
export const CONTACT_FORM_SLUG = 'kontakt'

/**
 * Which backend form the three /biznese lead boxes submit to.
 *
 * Same contract as the two above — change this one line to repoint them, and keep the
 * form ACTIVE in the dashboard.
 *
 * ONE form serves all three pages (/biznese/trajnime, /biznese/talente, /biznese/klasa)
 * rather than three near-identical ones: they ask for the same contact details and differ
 * only in intent. Each page sets `tipi_kerkeses` to its own value, which is what tells the
 * three apart in the inbox. Every other custom field is OPTIONAL because no page sends all
 * of them — the server drops the keys a given page omits.
 */
export const BUSINESS_FORM_SLUG = 'kontakt-biznesi'

/** `tipi_kerkeses` values — must match the form's option VALUES exactly. */
export const BUSINESS_REQUEST_TYPES = {
  TRAININGS: 'Trajnime të personalizuara',
  PARTNERSHIP: 'Partneritet / Punëdhënës',
  ROOM_BOOKING: 'Rezervim klase',
} as const
