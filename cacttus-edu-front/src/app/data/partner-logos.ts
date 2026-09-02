/* Partner logos for the scrolling marquee — see PARTNER_LOGO_IMAGES. Numeric filenames
   are the export names as delivered; the readable label lives in the data array. */
import partner17 from "../../imports/17.svg";

import partner18 from "../../imports/18.svg";

import partner19 from "../../imports/19.svg";

import partner20 from "../../imports/20.svg";

import partner21 from "../../imports/21.svg";

import partner22 from "../../imports/22.svg";

import partner23 from "../../imports/23.svg";

import partner24 from "../../imports/24.svg";

import partner25 from "../../imports/25.svg";

import partner26 from "../../imports/26.svg";

import partner27 from "../../imports/27.svg";

import partner28 from "../../imports/28.svg";

import partner29 from "../../imports/29.svg";

/* Four more employer logos. PNG rather than SVG because that is what was delivered; they
   were 4:5 portrait canvases like the rest and have been trimmed to their artwork. */
import partner51 from "../../imports/51.png";

import partner53 from "../../imports/53.png";

import partner54 from "../../imports/54.png";

import partner55 from "../../imports/55.png";

/* Certification-body logos for the /trajnime strip — see PARTNER_LOGOS. */
import cert36 from "../../imports/36.svg";

import cert37 from "../../imports/37.svg";

import cert38 from "../../imports/38.svg";

import cert39 from "../../imports/39.svg";

import cert40 from "../../imports/40.svg";

import cert41 from "../../imports/41.svg";

import cert42 from "../../imports/42.svg";

import cert43 from "../../imports/43.svg";

import cert44 from "../../imports/44.svg";


/* ══════════════════════════════════════════
   PART 3 — PROGRAMIM PAGE
══════════════════════════════════════════ */

/* 3.2 — INFINITE LOGO MARQUEE

   Two logo sets feed the same marquee. A card renders the artwork when the entry has a
   `src` and falls back to its label when it does not, so the two sets can coexist without
   the component branching on which page it is on.

   `PARTNER_LOGOS` is the /trajnime strip: the bodies whose certifications the trainings
   are built against, which is a different list from the employer logos below. It is also
   the component's default, and /trajnime is the only caller that takes that default. */
export type MarqueeLogo = string | { name: string; src: string };


/* Order is deliberate and matches the delivered file numbering — keep 36 first, 44 last. */
export const PARTNER_LOGOS: readonly MarqueeLogo[] = [
  { name: "Microsoft", src: cert36 },
  { name: "Cisco", src: cert37 },
  { name: "Oracle", src: cert38 },
  { name: "CompTIA", src: cert39 },
  { name: "Linux Professional Institute", src: cert40 },
  { name: "EC-Council", src: cert41 },
  { name: "Palo Alto Networks", src: cert42 },
  { name: "ECDL", src: cert43 },
  { name: "Pearson", src: cert44 },
];


/* The real employer logos, shown on the programme pages and the /biznese section.

   ┌─── ADDING A PARTNER ────────────────────────────────────────────────────────┐
   │ 1. Drop the file in `src/imports/`.                                         │
   │ 2. `import partnerX from "../../imports/<file>";` at the top of this file.     │
   │ 3. Append `{ name: "Company", src: partnerX }` below.                       │
   │ Both marquee rows are built from this array's length, so nothing else needs │
   │ touching — the loop stays seamless at any count.                            │
   └─────────────────────────────────────────────────────────────────────────────┘

   `name` is what screen readers announce, since the artwork itself carries no text they
   can reach. The delivered files were 4:5 portrait canvases with the logo floating in the
   middle and 70-85% of the height empty, which renders unreadably small in a 180x90 card;
   each file's root viewBox was tightened onto its own artwork so `object-contain` has a
   box worth fitting. The embedded artwork is untouched. */
export const PARTNER_LOGO_IMAGES: readonly MarqueeLogo[] = [
  { name: "Kosbit", src: partner17 },
  { name: "dua.com", src: partner18 },
  { name: "TEB", src: partner19 },
  { name: "Ritech", src: partner20 },
  { name: "KEDS", src: partner21 },
  { name: "Gjirafa.com", src: partner22 },
  { name: "Borek Solutions Group", src: partner23 },
  { name: "Frakton", src: partner24 },
  { name: "Raiffeisen Bank", src: partner25 },
  { name: "Mikkena", src: partner26 },
  { name: "Starlabs", src: partner27 },
  { name: "Cacttus", src: partner28 },
  { name: "IPKO", src: partner29 },
  /* More distinct names in the loop = a longer gap before any one logo comes round
     again, which is the point of adding these.

     Two of the six delivered files were left out on purpose: 52.png is KEDS and 56.png
     is Frakton, both already above as 21.svg and 24.svg. Adding them would put those two
     brands in the loop twice and make the repetition worse, not better. */
  { name: "ProCredit Bank", src: partner51 },
  { name: "KEK", src: partner53 },
  { name: "NLB Banka", src: partner54 },
  { name: "UNMIK", src: partner55 },
];
