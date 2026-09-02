/* Project-partner logos for the /projektet hero grid — see HERO_PARTNERS. */
import heroPartner30 from "../../imports/30.svg";

import heroPartner31 from "../../imports/31.svg";

import heroPartner32 from "../../imports/32.svg";

import heroPartner33 from "../../imports/33.svg";

import heroPartner34 from "../../imports/34.svg";

import heroPartner35 from "../../imports/35.svg";


/* ── PARTNER LOGO GRID (/projektet hero) ──

   The organisations behind the projects listed further down the page.

   ┌─── ADDING OR SWAPPING A LOGO ───────────────────────────────────────────────┐
   │ 1. Put the file in `src/imports/` — the same folder as the marquee logos.    │
   │ 2. Import it at the TOP of this file, beside the other image imports.        │
   │ 3. Add or edit an entry below.                                               │
   │ The grid lays itself out from this array, but it is sized for SIX: three     │
   │ across makes two clean rows. A seventh would leave a ragged last row, so     │
   │ adjust `sm:grid-cols-3` below if the count ever changes.                     │
   └─────────────────────────────────────────────────────────────────────────────┘

   A slot with `src: null` still falls back to its label, so a logo that has not been
   delivered yet leaves a named card rather than a hole.

   Imported rather than referenced by URL string so a missing or renamed file fails
   the build instead of leaving a broken image on a live page. Each file arrived as a
   4:5 portrait canvas with the logo adrift in the middle; their root viewBoxes were
   tightened onto the artwork itself, as with the marquee set. */
export const HERO_PARTNERS: readonly { name: string; src: string | null }[] = [
  { name: "USAID", src: heroPartner30 },
  { name: "Helvetas", src: heroPartner31 },
  { name: "WOW", src: heroPartner32 },
  { name: "KODE — Kosovo Digital Economy", src: heroPartner33 },
  { name: "Regional Challenge Fund", src: heroPartner34 },
  { name: "Virtual Innovation Consortium", src: heroPartner35 },
];
