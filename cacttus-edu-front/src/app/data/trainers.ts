import lektorArditi from "../../imports/arditi.png";

/* Newer instructor portraits, shared by TWO lists: TRAINERS (the /trajnime "Ligjëruesit
   tanë" strip) and LIGJËRUEIT (the /ligjërueit page). Alban, Ali and Hana appear on both,
   which is why these are one import each rather than a set per page.

   Delivered as Figma SVG exports — an 810x1012 wrapper around an embedded PNG — rather
   than the plain .png the older portraits use, and heavy with it: 23MB across the five.
   See the note on `lektorLuani` above; the same shrink was done there once already. */
import trajnerAlban from "../../imports/albantrajner.png";

import trajnerAli from "../../imports/alitrajner.png";

import trajnereHana from "../../imports/hanatrajnere.png";


/* ══════════════════════════════════════════
   PART 4 — TRAJNIME PAGE (filter labels)
══════════════════════════════════════════ */
export const TRAINERS = [
  /*
    Four real, photographed instructors. This list held six until the last two stock-photo
    placeholders — "Mentor Berisha" (Ethical Hacking) and "Enes Sermaxhaj" (Dizajn Grafik),
    Unsplash headshots of nobody in particular — were dropped, along with "Arsim Susuri"
    and "Era Gjakova" before them. The grid below is set to four tracks to match; adding a
    fifth person means widening it again, or the row breaks.

    `role` is blank on every entry. The
    card DOES render this line, so a blank leaves a small gap — that is deliberate. The
    roles here were invented alongside the stock photos, and attaching one of them to a
    named, photographed person would be asserting something about them that nobody has
    confirmed. Same reasoning already applied to LIGJËRUEIT further down. Fill them in
    once the real specialisations are known.
  */
  { name: "Ardit Beqiri", role: "", imgUrl: lektorArditi, imgPosition: "center 50%" },
  { name: "Hana Hoxha", role: "", imgUrl: trajnereHana, imgPosition: "center 50%" },
  { name: "Ali Kaçamaku", role: "", imgUrl: trajnerAli, imgPosition: "center 50%" },
  { name: "Alban Krasniqi", role: "", imgUrl: trajnerAlban, imgPosition: "center 50%" },
];
