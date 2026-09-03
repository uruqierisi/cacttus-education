/**
 * Which backend form each public application surface submits to.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  THE PROGRAMME IS THE FORM.                                             │
 * │  A study programme is no longer a `programi` answer on one shared form;  │
 * │  it is expressed by WHICH form receives the submission. /programim posts │
 * │  to ZHVAM, /siguria to CYBER, and an admin reads the two as separate     │
 * │  inboxes without filtering on a field.                                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Each value is the form's `slug` — visible in the dashboard under Format → (open a
 * form). It is derived from the title on creation, e.g. "Aplikim ZHVAM" → "aplikim-zhvam".
 *
 * Every form named here must be ACTIVE in the dashboard. `/api/public/forms/:slug`
 * returns 404 for an inactive or deleted one, and each surface renders its own
 * "Formulari i aplikimit nuk është aktiv" state — the same behaviour as before, now per
 * programme rather than for the single shared form.
 *
 * WHAT USES WHICH
 * ---------------
 *   ZHVAM    /programim
 *   CYBER    /siguria
 *   DEFAULT  every surface with no programme of its own — the band on the home page and
 *            on /rreth-nesh. It points at ZHVAM deliberately rather than at a third
 *            "general" form: a lead from the home page is a real lead and must land in an
 *            inbox someone reads, not in one nobody opens. Change this line the day a
 *            general intake form exists.
 *
 * The scroll popup is the exception: it asks the visitor which programme they want, so it
 * chooses between ZHVAM and CYBER at submit time rather than taking a fixed slug. See
 * POPUP_PROGRAMME_SLUGS in App.tsx.
 *
 * REPLACES the previous single `APPLICATION_FORM_SLUG` plus a `STUDY_PROGRAMME_VALUES`
 * lookup, where every surface posted to one form and the programme travelled as a
 * `programi` select answer that each caller had to pre-select correctly.
 */
export const APPLICATION_FORM_SLUGS = {
  ZHVAM: 'aplikim-zhvam',
  CYBER: 'aplikim-siguria-kibernetike',
  DEFAULT: 'aplikim-zhvam',
} as const

export type ApplicationFormSlug =
  (typeof APPLICATION_FORM_SLUGS)[keyof typeof APPLICATION_FORM_SLUGS]

/**
 * Which backend form the /kontakti "Na dërgo mesazh" box submits to.
 *
 * Same contract as `APPLICATION_FORM_SLUGS` above — change this one line to point the
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

/**
 * Which backend form the /biznese/klasa room "Rezervo" buttons submit to.
 *
 * Same contract as the slugs above — change this one line to repoint them, and keep the
 * form ACTIVE in the dashboard.
 *
 * ONE form for all six rooms rather than six near-identical ones: the room is a FIELD
 * (`klasa`), pre-selected by whichever card's button was pressed, which is what tells the
 * bookings apart in the inbox.
 */
export const CLASS_BOOKING_FORM_SLUG = 'rezervo-klase'

/** `klasa` values — must match the form's option VALUES exactly. */
export const CLASS_BOOKING_ROOMS = [
  'Klasa Portokalli',
  'Klasa Rozë',
  'Klasa e verdhë',
  'Klasa e gjelbër',
  'Klasa e kuqe',
  'Hapsira e përbashkët',
] as const
