import { APPLICATION_FORM_SLUGS } from "../../marketing/lib/forms.config";



/* ══════════════════════════════════════════
   POPUP FORM — controlled by Layout

   Layout owns the open/closed state, because the banner and Navbar buttons need
   to open this too and they are siblings of it, not children.
   Fully static: nothing is fetched, nothing is submitted anywhere.
══════════════════════════════════════════ */

export const POPUP_DREJTIMET = [
  "Zhvillim i Ueb dhe Aplikacioneve Mobile",
  "Siguri Kibernetike",
];


/**
 * The popup's dropdown wording → the FORM that choice submits to.
 *
 * The popup is the one surface that cannot take a fixed slug: it asks which programme the
 * visitor wants, so the answer decides the destination. Under the previous model this
 * table mapped the visible label onto a `programi` option value, because a select answer
 * is validated against `option.value` exactly and the two wordings differ ("Ueb" vs
 * "Ueb-it", "Siguri" vs "Siguria"). The programme is now the form, so it maps onto a slug
 * instead and no answer is sent at all.
 *
 * The visible strings in POPUP_DREJTIMET above are Ernata's copy and stay untouched; this
 * table is still the only thing that moves if either side is reworded.
 */
export const POPUP_PROGRAMME_SLUGS: Record<string, string> = {
  "Zhvillim i Ueb dhe Aplikacioneve Mobile": APPLICATION_FORM_SLUGS.ZHVAM,
  "Siguri Kibernetike": APPLICATION_FORM_SLUGS.CYBER,
};


/* ─── Motion timings. POPUP_EXIT_MS also gates the delayed unmount below. ─── */
export const POPUP_ENTER_MS = 400;        // the card arriving

export const POPUP_EXIT_MS = 180;         // the card leaving

export const POPUP_ROW_MS = 280;          // one staggered row

export const POPUP_ROW_STAGGER_MS = 50;   // gap between consecutive rows

export const POPUP_ROW_START_MS = 100;    // rows begin while the card is still settling

export const POPUP_REDUCED_MS = 150;      // reduced motion: one plain quick fade

/* Floor under the open transition — see the reveal effect for why rAF alone is not
   enough. Comfortably longer than two frames on a slow device, short enough that a
   real user never waits on it. */
export const POPUP_REVEAL_FALLBACK_MS = 120;


/* The 1.56 overshoots past the final value before easing back to it, so the card
   grows a touch past full size and settles. Last row lands at 100+8*50+280=780ms. */
export const POPUP_ENTER_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const POPUP_ROW_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
