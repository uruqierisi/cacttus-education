import { STUDY_PROGRAMME_VALUES } from "../../marketing/lib/forms.config";



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
 * The popup's dropdown wording → the `programi` option VALUES the API accepts.
 *
 * These two lists read almost the same but are NOT identical ("Ueb" vs "Ueb-it",
 * "Siguri" vs "Siguria"), and a select answer is validated against `option.value`
 * exactly, so sending the visible label straight through would 400. The visible strings
 * above are Ernata's copy and stay untouched; this table is the only thing that moves if
 * either side is reworded.
 */
export const POPUP_PROGRAMME_VALUES: Record<string, string> = {
  "Zhvillim i Ueb dhe Aplikacioneve Mobile": STUDY_PROGRAMME_VALUES.ZHVAM,
  "Siguri Kibernetike": STUDY_PROGRAMME_VALUES.CYBER,
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
