/* Graduate portraits for the "Histori suksesi" carousel — see STUDENT_PHOTOS. Each is a
   finished 292x164 card: portrait on the brand purple, with the graduate's name, role and
   employer already set INTO the artwork. That matters downstream — the carousel must not
   print a name of its own over these or it would say it twice. The older lowercase files
   (eltonismaili / edanuka / erisuruqi / partin) were the first cut of this same set and
   are no longer imported anywhere. */
import suksesEltonIsmailii from "../../imports/EltonIsmailii.png";

import suksesErisUruqi from "../../imports/ErisUruqi.png";

import suksesPartinNallbani from "../../imports/PartinNallbani.png";

import suksesEdaNuka from "../../imports/EdaNuka.png";

import suksesArdiHyseni from "../../imports/ArdiHyseni.png";

import suksesGjinBardhi from "../../imports/GjinBardhi.png";

import suksesGjinMirdita from "../../imports/GjinMirdita.png";

import suksesAgonKrasniqi from "../../imports/AgonKrasniqi.png";

import suksesErnataKoliqi from "../../imports/ErnataKoliqi.png";


/* ── SUCCESS CAROUSEL ── */
export interface StudentPhoto {
  /* Always set, even when the artwork already shows it — the carousel needs a name it can
     hand to a screen reader whether or not it draws one. */
  readonly name: string;
  readonly src: string;
  /* True when the graphic itself already carries the name, so the code must NOT draw its
     own label on top. Every card in the current set is `true`; the flag exists because a
     plain photograph dropped in later would need the opposite, and the alternative — a
     future editor eyeballing nine images to work out which ones are safe — is exactly the
     kind of thing that gets a name printed twice. */
  readonly nameInImage: boolean;
  /* CSS `object-position` for this one slide. Per-entry, not one value for the carousel:
     each photo is framed differently, so a single shared setting would only ever be right
     for one of them. Second number is vertical — raise it to push the image DOWN. */
  readonly imgPosition: string;
}


export const STUDENT_PHOTOS: readonly StudentPhoto[] = [
  /* Real graduates, bundled rather than stock URLs. All nine are 292x164 — the same 16:9
     the slide frame uses — so they need no special handling and drop into the same
     `aspect-[16/9]` + `object-cover` box as every other slide.

     Everything downstream counts this array: the auto-advance wraps on its length, and
     the pagination dots are mapped straight off it. Adding an entry here is the whole
     edit — a new slide gets its own dot and its own step in the arrows for free. */
  { name: "Elton Ismaili", src: suksesEltonIsmailii, nameInImage: true, imgPosition: "center 50%" },
  { name: "Eris Uruqi", src: suksesErisUruqi, nameInImage: true, imgPosition: "center 50%" },
  { name: "Partin Nallbani", src: suksesPartinNallbani, nameInImage: true, imgPosition: "center 50%" },
  { name: "Eda Nuka", src: suksesEdaNuka, nameInImage: true, imgPosition: "center 50%" },
  { name: "Ardi Hyseni", src: suksesArdiHyseni, nameInImage: true, imgPosition: "center 50%" },
  { name: "Gjin Bardhi", src: suksesGjinBardhi, nameInImage: true, imgPosition: "center 50%" },
  { name: "Gjin Mirdita", src: suksesGjinMirdita, nameInImage: true, imgPosition: "center 50%" },
  { name: "Agon Krasniqi", src: suksesAgonKrasniqi, nameInImage: true, imgPosition: "center 50%" },
  { name: "Ernata Koliqi", src: suksesErnataKoliqi, nameInImage: true, imgPosition: "center 50%" },
];
