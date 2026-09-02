import heroPartner30 from "../../imports/30.svg";
import heroPartner31 from "../../imports/31.svg";
import heroPartner32 from "../../imports/32.svg";
import heroPartner33 from "../../imports/33.svg";
import heroPartner34 from "../../imports/34.svg";
import heroPartner35 from "../../imports/35.svg";

/* The two projects with no entry in HERO_PARTNERS — their funders never appeared in the
   /projektet hero grid, so these are the only files that carry their marks. Used by
   PROJEKTET_LIST so all eight dropdown rows can show a logo rather than six of eight. */
import projectSkillFactory from "../../imports/skill factory.png";

import projectLuxDev from "../../imports/luxdev.png";


/*
  Each row carries the funder's mark so the dropdown is scannable by logo, not just by a
  wall of eight similar-length Albanian titles.

  `icon` is deliberately the SAME file the /projektet hero grid already shows for that
  funder — see HERO_PARTNERS below, where 30–35 are keyed by partner name. The imports are
  referenced directly rather than read off HERO_PARTNERS because that const is declared
  further down the module and would still be in its temporal dead zone here; the comments
  are what keep the two lists honest with each other. Skill Factory and LuxDev have no
  HERO_PARTNERS entry at all, so they use their own dedicated files.
*/
export const PROJEKTET_LIST = [
  { name: "Skill Factory", path: "/projektet/skill-factory", icon: projectSkillFactory },
  { name: "Partneriteti për Impaktin në TIK", path: "/projektet/usaid", icon: heroPartner30 }, // HERO_PARTNERS "USAID"
  { name: "SDC", path: "/projektet/sdc", icon: heroPartner31 }, // HERO_PARTNERS "Helvetas" — the SDC project's implementer
  { name: "Gratë në Punë Online", path: "/projektet/wow", icon: heroPartner32 }, // HERO_PARTNERS "WOW"
  { name: "KODE", path: "/projektet/kode", icon: heroPartner33 }, // HERO_PARTNERS "KODE — Kosovo Digital Economy"
  { name: "Regional Challenge Fund (RCF)", path: "/projektet/rcf", icon: heroPartner34 }, // HERO_PARTNERS "Regional Challenge Fund"
  { name: "LuxDev Smart Mobility Project", path: "/projektet/luxdev", icon: projectLuxDev },
  { name: "Virtual Innovation Consortium (VIC)", path: "/projektet/vic", icon: heroPartner35 }, // HERO_PARTNERS "Virtual Innovation Consortium"
];
