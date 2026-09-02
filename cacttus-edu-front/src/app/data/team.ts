/* Elmaze Gashi, /ekipi. */
import ekipiElmaze from "../../imports/eli.png";


/* Team portraits — /ekipi. See TEAM_MEMBERS. Prefixed `ekipi` because several of
   these names already exist as other imports: `vetoni.png` is the LECTURER Veton on
   /ligjërueit (this one is `vetoniEkipi.png`), and `ErnataKoliqi.png` is the graduate in
   the homepage carousel. Same people, different photos and different pages.
   `ekipiRilindi` points at `rilind.png` — the file arrived without the trailing i. */
import ekipiDritoni from "../../imports/dritoni.png";

import ekipiVili from "../../imports/vili.png";

import ekipiShuki from "../../imports/shuki.png";

import ekipiVetoni from "../../imports/vetoniEkipi.png";

import ekipiDonjeta from "../../imports/donjeta.png";

import ekipiVjosa from "../../imports/vjosa.png";

import ekipiRinoni from "../../imports/rinoni.png";

import ekipiTina from "../../imports/tina.png";

import ekipiGona from "../../imports/gona.png";

import ekipiArnisa from "../../imports/arnisa.png";

import ekipiEdona from "../../imports/edona.png";

import ekipiYlljeta from "../../imports/ylljeta.png";

import ekipiFinesa from "../../imports/finesa.png";

import ekipiDafina from "../../imports/dafina.png";

import ekipiRinesa from "../../imports/rinesa.png";

import ekipiErnata from "../../imports/ernata.png";

import ekipiBani from "../../imports/bani.png";

import ekipiRilindi from "../../imports/rilind.png";

import ekipiKrenare from "../../imports/krenare.png";

import ekipiAnesa from "../../imports/anesa.png";


export const TEAM_MEMBERS = [
  /*
    The real team, in the order given. `city` is what the filter on this page compares
    against with `===`, so these three strings must match the buttons exactly, diacritics
    and all — "Prishtine" or "Prishtinë " would silently filter to an empty grid rather
    than error. They were copied out of the `cities` list rather than retyped.

    Elmaze Gashi now has her photo; her `role` is still empty, which PersonCard renders as
    a blank line rather than inventing a title. Fill it in when it is known. The `role`-less
    entries are deliberate everywhere on this page — see LIGJËRUEIT for the same reasoning.
  */
  { name: "Driton Hapçiu", role: "Chairman of the Board", city: "Prishtinë", imgUrl: ekipiDritoni },
  { name: "Vildane Kelmendi", role: "CEO", city: "Prishtinë", imgUrl: ekipiVili },
  { name: "Shukran Murseli-Hapçiu", role: "Vice President of Administration, Operations, and Human Resources", city: "Prishtinë", imgUrl: ekipiShuki },
  { name: "Veton Xhelili", role: "BDM and Training Manager", city: "Prishtinë", imgUrl: ekipiVetoni },
  { name: "Donjeta Ismajli", role: "Chief Operating Officer", city: "Prishtinë", imgUrl: ekipiDonjeta },
  { name: "Vjosa Osmani", role: "Head of Human Resources and Quality Control", city: "Prishtinë", imgUrl: ekipiVjosa },
  { name: "Rinon Hoxha", role: "Project Manager", city: "Prishtinë", imgUrl: ekipiRinoni },
  { name: "Elmaze Gashi", role: "", city: "Prishtinë", imgUrl: ekipiElmaze },
  { name: "Florentina Osmani", role: "Marketing Manager", city: "Prishtinë", imgUrl: ekipiTina },
  { name: "Antigona Beha-Breznica", role: "Financial Assistant", city: "Prishtinë", imgUrl: ekipiGona },
  { name: "Arnisa Aliqkaj", role: "Career Counsellor", city: "Prishtinë", imgUrl: ekipiArnisa },
  { name: "Edona Selmani", role: "Sales Specialist", city: "Prishtinë", imgUrl: ekipiEdona },
  { name: "Ylljeta Morina", role: "Sales Assistant", city: "Prishtinë", imgUrl: ekipiYlljeta },
  { name: "Finesa Hiseni", role: "Financial and Administrative Officer", city: "Prishtinë", imgUrl: ekipiFinesa },
  { name: "Dafina Paqarizi", role: "Financial and Administrative Officer", city: "Prishtinë", imgUrl: ekipiDafina },
  { name: "Rinesa Gashi", role: "Social Media Specialist", city: "Prishtinë", imgUrl: ekipiRinesa },
  { name: "Ernata Koliqi", role: "Marketing Assistant", city: "Prishtinë", imgUrl: ekipiErnata },
  { name: "Shaban Rexhepi", role: "Logistic Officer", city: "Prishtinë", imgUrl: ekipiBani },
  { name: "Rilind Zulfiu", role: "Coordinator of Parku Teknologjik", city: "Kamenicë", imgUrl: ekipiRilindi },
  { name: "Krenare Pireva", role: "Administration and Marketing Assistant", city: "Kamenicë", imgUrl: ekipiKrenare },
  { name: "Anesa Topko", role: "Business Development Manager", city: "Prizren", imgUrl: ekipiAnesa },
];
