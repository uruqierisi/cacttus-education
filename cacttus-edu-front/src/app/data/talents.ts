/* The five faces in the overlapping circle row on /biznese/talente, in the order they
   are shown left to right. NOTE the filename: the photo is `fatjonKerceli`, with a C —
   it was asked for as "fatjonKerqeli", with a Q. The file on disk wins. */
import talentMirlindArifi from "../../imports/mirlindArifi.jpeg";

import talentAltinMorina from "../../imports/altinMorina.jpeg";

import talentArjanaBellaqa from "../../imports/arjanaBellaqa.jpeg";

import talentFatjonKerceli from "../../imports/fatjonKerceli.jpeg";

/* The rest of the talent-network faces. Filenames differ from how they were listed,
   so they are spelled out here rather than guessed at the call site:
     - Eda Nuka   -> edaNukaRrjeti.jpeg, NOT the EdaNuka.png already imported above as
       `suksesEdaNuka` (that one is her success-story portrait, a different crop).
     - Gjin Bardhi -> gjinBardhi.jpeg, likewise distinct from `suksesGjinBardhi`.
     - Resul Manxholli -> .jpg, while its neighbours are .jpeg. */
import talentEdaNuka from "../../imports/edaNukaRrjeti.jpeg";

import talentNoraBekteshi from "../../imports/noraBekteshi.png";

import talentFlamurHaxholli from "../../imports/flamurHaxholli.jpeg";

import talentResulManxholli from "../../imports/resulManxholliRrjeti.jpg";

import talentKaltrinaQerimi from "../../imports/kaltrinaQerimi.jpeg";

import talentErnataKoliqi from "../../imports/nataDita.jpeg";

import talentGjinBardhi from "../../imports/gjinBardhi.jpeg";

import talentTritMeri from "../../imports/tritMeri.jpeg";


/* ── 5.2 RRJETI I TALENTËVE ── */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
/*
  ─── TALENT NETWORK ───

  One person = one entry here, and the categories below REFERENCE these objects rather
  than repeating them. Several people belong to more than one category (Arjana Bellaqa is
  in three), and duplicating a card per category is how a name, a role or — later — a CV
  link ends up corrected in one place and stale in another. Edit a person once; every
  carousel they appear in follows.

  `photo: null` renders the icon placeholder instead of an <img>. Every person has a real
  photo now — Trit Meri was the last holdout and his arrived — so nothing hits that branch
  today. It is kept because a new name added here before their portrait exists should
  render a complete card, not a broken image box.

  `imgPosition` is per person: a face sits differently in every crop, so one shared value
  cannot centre all twelve. Raise the second number to push that face DOWN in its circle.

  `cvUrl` is a PLAIN PATH into `public/`, never an `import`. Vite copies `public/` through
  untouched, so `/pdfs/cvs/x.pdf` stays that exact URL in dev and in the build and a CV can
  be replaced by dropping in a new file — no rebuild, no code change. Importing them would
  put twelve PDFs in the bundle graph under content-hashed names instead.

  Set once per PERSON, which is the point of this table: Eda Nuka appears in two carousels
  and Arjana Bellaqa in three, and they each resolve to one file rather than a copy per
  category. Correct a path here and every card showing that person follows.

  TalentCard still branches on it — a `null` renders the plain, inert button — so a new
  person can be added before their CV exists without producing a link to nothing.
*/
export type TalentPerson = {
  readonly name: string;
  readonly role: string;
  readonly photo: string | null;
  readonly imgPosition: string;
  readonly cvUrl: string | null;
};


export const TALENT_PEOPLE = {
  altinMorina: { name: "Altin Morina", role: "Web & Mobile Development", photo: talentAltinMorina, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/altinCV.pdf" },
  edaNuka: { name: "Eda Nuka", role: "Web & Mobile Development and UI/UX", photo: talentEdaNuka, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/edaCV.pdf" },
  arjanaBellaqa: { name: "Arjana Bellaqa", role: "Web & Mobile Development, UI/UX Designer, Data Analysis", photo: talentArjanaBellaqa, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/arjanaCV.pdf" },
  noraBekteshi: { name: "Nora Bekteshi", role: "Web & Mobile Development and UI/UX Designer", photo: talentNoraBekteshi, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/noraCV.pdf" },
  flamurHaxholli: { name: "Flamur Haxholli", role: "Web & Mobile Development", photo: talentFlamurHaxholli, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/flamurCV.pdf" },
  resulManxholli: { name: "Resul Manxholli", role: "Web & Mobile Development", photo: talentResulManxholli, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/resulCV.pdf" },
  kaltrinaQerimi: { name: "Kaltrina Qerimi", role: "Web & Mobile Development", photo: talentKaltrinaQerimi, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/kaltrinaCV.pdf" },
  ernataKoliqi: { name: "Ernata Koliqi", role: "Web & Mobile Development and UI/UX Designer", photo: talentErnataKoliqi, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/ernataCV.pdf" },
  mirlindArifi: { name: "Mirlind Arifi", role: "Data Analysis", photo: talentMirlindArifi, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/mirlindCV.pdf" },
  gjinBardhi: { name: "Gjin Bardhi", role: "DevOps Engineer", photo: talentGjinBardhi, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/gjinCV.pdf" },
  tritMeri: { name: "Trit Meri", role: "Network Engineer", photo: talentTritMeri, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/tritCV.pdf" },
  fatjonKerceli: { name: "Fatjon Kërqeli", role: "Network Engineer", photo: talentFatjonKerceli, imgPosition: "center 50%", cvUrl: "/pdfs/cvs/fatjonCV.pdf" },
} satisfies Record<string, TalentPerson>;


/*
  The left-hand list AND the carousel both read this one array, so a category cannot exist
  in the list without a carousel behind it. `people` order IS carousel order.

  ⚠ The `skills` strings are carried over EXACTLY as they were on the page before this
  change, including the fact that three of them are attached to the wrong role — UI/UX
  Designers reads "Penetration testing, SOC, incident response" and Network Engineers reads
  "Figma, prototyping, user research". That mismatch predates this work and is left alone
  rather than silently rewritten; it is flagged so it can be fixed deliberately.
*/
export const TALENT_CATEGORIES = [
  {
    role: "Web & Mobile Developers",
    skills: "React, Node.js, React Native, API design",
    people: [
      TALENT_PEOPLE.altinMorina,
      TALENT_PEOPLE.edaNuka,
      TALENT_PEOPLE.arjanaBellaqa,
      TALENT_PEOPLE.noraBekteshi,
      TALENT_PEOPLE.flamurHaxholli,
      TALENT_PEOPLE.resulManxholli,
      TALENT_PEOPLE.kaltrinaQerimi,
      TALENT_PEOPLE.ernataKoliqi,
    ],
  },
  {
    role: "UI/UX Designers",
    skills: "Penetration testing, SOC, incident response",
    people: [
      TALENT_PEOPLE.edaNuka,
      TALENT_PEOPLE.arjanaBellaqa,
      TALENT_PEOPLE.noraBekteshi,
      TALENT_PEOPLE.ernataKoliqi,
    ],
  },
  {
    role: "Data Analysts",
    skills: "Python, SQL, visualization, reporting",
    people: [TALENT_PEOPLE.arjanaBellaqa, TALENT_PEOPLE.mirlindArifi],
  },
  {
    role: "DevOps Engineers",
    skills: "Cloud (AWS/Azure), CI/CD, containerization",
    people: [TALENT_PEOPLE.gjinBardhi],
  },
  {
    role: "Network Engineers",
    skills: "Figma, prototyping, user research",
    people: [TALENT_PEOPLE.tritMeri, TALENT_PEOPLE.fatjonKerceli],
  },
];
