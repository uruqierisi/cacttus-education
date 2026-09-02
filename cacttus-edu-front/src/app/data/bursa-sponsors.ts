import sponsorHarrisia from "../../imports/harrisia.png";

import sponsorDoni from "../../imports/doni.png";

import sponsorCacttus from "../../imports/cacttus.png";


/*
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  SPONSORS — ⚠ PLACEHOLDER DATA. This is the array to edit.                   │
  │                                                                              │
  │  To add a real sponsor:                                                      │
  │    1. drop the logo file into src/imports/                                   │
  │    2. `import sponsorTeb from "../../imports/teb.svg";` up with the other        │
  │       image imports at the top of this file                                  │
  │    3. set `logo: sponsorTeb` on its row below, and set `name` + `scholarships`│
  │                                                                              │
  │  `logo: null` is what marks a row as still-a-placeholder — the card then      │
  │  draws a building glyph and the word "Logo" instead of an image. Nothing      │
  │  else needs touching; the card renders whichever branch applies, so real and  │
  │  placeholder sponsors can sit side by side while the set is filled in.        │
  │                                                                              │
  │  Row count is free — the grid is 1 / 2 / 4 across and reflows on its own.     │
  └──────────────────────────────────────────────────────────────────────────────┘
*/
export interface BursaSponsor {
  /* Shown under the logo area and used as the image's alt text. */
  readonly name: string;
  /* An imported image, or null while this row is a placeholder. */
  readonly logo: string | null;
  /* Scholarships funded, rendered as "20x Bursa". */
  readonly scholarships: number;
}


export const BURSA_SPONSORS: readonly BursaSponsor[] = [
  /* ⚠ Logos are real; the scholarship counts are still placeholders. */
  { name: "Harrisia", logo: sponsorHarrisia, scholarships: 20 },
  { name: "Doni", logo: sponsorDoni, scholarships: 20 },
  { name: "Cacttus", logo: sponsorCacttus, scholarships: 20 },
];
