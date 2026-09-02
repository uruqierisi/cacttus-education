import lektorArditi from "../../imports/arditi.png";
import trajnerAlban from "../../imports/albantrajner.png";
import trajnerAli from "../../imports/alitrajner.png";
import trajnereHana from "../../imports/hanatrajnere.png";

/* Instructor portraits — /ligjërueit. See LIGJËRUEIT for which card each lands on.
   The `2` files are the small ones (~1MB); the plain .jpg originals are ~9MB each. */
import lektorLuani from "../../imports/luani2.png";

import lektorNaimi from "../../imports/naimi2.png";

import lektorGezimi from "../../imports/gezimi2.png";

import lektorJoni from "../../imports/joni2.png";

import lektorJehona from "../../imports/jehona.png";

import lektorVetoni from "../../imports/vetoni.png";

import lektorAzra from "../../imports/azra.png";

import lektorDrenusha from "../../imports/drenusha.png";

/* Filenames here are the ones actually on disk, which differ slightly from how these six
   were listed: engjulli / valton / rafet, not engjull / valtoni / rafeti. */
import lektorPegmatiti from "../../imports/pegmatiti.png";

import lektorGili from "../../imports/gili.png";

import lektorEngjulli from "../../imports/engjulli.png";

import lektorValtoni from "../../imports/valton.png";

import lektorRafeti from "../../imports/rafet.png";

/* `ardititrajner.png` is on disk but no longer imported: the /trajnime card for Ardit
   Beqiri was pointed back at `lektorArditi` (arditi.png). Re-add this line and swap the
   `imgUrl` in TRAINERS to use the newer export instead. */
import trajnerFisnik from "../../imports/fisniktrajner.png";

/* Dinion Svirca, /ligjërueit. */
import lektorDinion from "../../imports/dinionProfa.png";


export const LIGJËRUEIT = [
  /* ── First four cards, in this exact order. `role` is intentionally blank: this page
     renders name only, and inventing specialisations would put words in people's mouths.
     `city` stays because the shared PersonCard type requires it, not because it shows. */
  { name: "Luan Gashi", role: "", city: "Prishtinë", imgUrl: lektorLuani },
  { name: "Naim Sulejmani", role: "", city: "Prishtinë", imgUrl: lektorNaimi },
  { name: "Gëzim Ciriku", role: "", city: "Prishtinë", imgUrl: lektorGezimi },
  { name: "Jon Kursani", role: "", city: "Prishtinë", imgUrl: lektorJoni },
  /* ── Second row, same order as given. Same blank `role` as row 1: this page renders
     name only. */
  { name: "Jehona Xhaferi", role: "", city: "Prishtinë", imgUrl: lektorJehona },
  { name: "Veton Xhelili", role: "", city: "Prishtinë", imgUrl: lektorVetoni },
  { name: "Azra Krasniqi", role: "", city: "Prishtinë", imgUrl: lektorAzra },
  { name: "Drenushe Imeraj", role: "", city: "Prishtinë", imgUrl: lektorDrenusha },
  /* ── Cards 9-14. Blank `role` like the real instructors above: the page renders name
     only, so a specialisation would never be seen anyway.

     Four stock-photo entries used to sit here — Arber Gashi, Era Gjakova, Fatlum Ahmeti
     and Vlora Dema, all pointing at Unsplash headshots of nobody in particular. They
     were the placeholders showing at positions 9-12; removing them leaves fourteen real
     instructors and puts the six below where they belong. */
  { name: "Pegmatit Bruçi", role: "", city: "Prishtinë", imgUrl: lektorPegmatiti },
  { name: "Gili Hoxhaj", role: "", city: "Prishtinë", imgUrl: lektorGili },
  { name: "Engjëll Gashi", role: "", city: "Prishtinë", imgUrl: lektorEngjulli },
  { name: "Valton Kamberaj", role: "", city: "Prishtinë", imgUrl: lektorValtoni },
  { name: "Ardit Beqiri", role: "", city: "Prishtinë", imgUrl: lektorArditi },
  { name: "Rafet Duriqi", role: "", city: "Prishtinë", imgUrl: lektorRafeti },
  /* ── Cards 15-18. Ardit Beqiri is NOT repeated here: he is already card 13 above, on
     `lektorArditi`. The newer `trajnerArdit` export belongs to the /trajnime strip. */
  { name: "Alban Krasniqi", role: "", city: "Prishtinë", imgUrl: trajnerAlban },
  { name: "Ali Kaçamaku", role: "", city: "Prishtinë", imgUrl: trajnerAli },
  { name: "Fisnik Avdiu", role: "", city: "Prishtinë", imgUrl: trajnerFisnik },
  { name: "Hana Hoxha", role: "", city: "Prishtinë", imgUrl: trajnereHana },
  /* Card 19. `role` left empty like every other entry here — see the note at the top of
     this array: a title nobody has confirmed is worse than a blank line. */
  { name: "Dinion Svirca", role: "", city: "Prishtinë", imgUrl: lektorDinion },
];
