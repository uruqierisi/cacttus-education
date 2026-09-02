
/* ── TESTIMONIALS ──
   Real, attributable reviews from past participants.

   Text only, by design: no avatars. A testimonial card with a stock face reads as
   decoration and quietly implies the person is a stock photo too — the quote and who
   said it are the whole payload. Card shell (radius, border, brandSoft fill) is lifted
   from "Pikat e Forta" on the training detail page so it needs no new design language.

   ┌─── ADDING A SIXTH REVIEW ───────────────────────────────────────────────────┐
   │ Append one object below — name, role, quote, stars. Nothing else to touch:  │
   │ the carousel counts the slides itself, so an extra entry gets its own dot   │
   │ and its own step in the arrows automatically.                               │
   └─────────────────────────────────────────────────────────────────────────────┘ */
export const TESTIMONIALS: readonly { quote: string; name: string; role: string; stars: number }[] = [
  {
    quote:
      "Kam pasur shumë përvojë duke përdorur Azure në laboratorë, më dha shumë gjëra. Trajnerët ishin të mrekullueshëm, ata kishin shumë njohuri për atë që spjegonin. Ata na dhanë shumë aftësi dhe sygjerime se çfarë mund të bëjmë me Azure.",
    name: "Cansel Zurnaci",
    role: "Microsoft Azure Cloud",
    stars: 5,
  },
  {
    quote:
      "Trajnimi më ndihmoi shumë në avancimin profesional, duke më ofruar përvojë të vlefshme falë mbështetjes së trajnerëve dhe bashkëpunimit me grupin e trajnimit.",
    name: "Elinda Osmani",
    role: "Burime Njerëzore",
    stars: 5,
  },
  {
    quote:
      "Si një nënë e re, për mua ishte e vështirë të aplikoja për punë, prandaj vendosa që të ndjek disa trajnime profesionale. Trajnimet që përfundova me sukses përfshijnë Social Media Marketing, dhe Dizajn Grafik.",
    name: "Aida Kastrati Miftari",
    role: "Social Media Marketing & Dizajn Grafik",
    stars: 5,
  },
  {
    quote:
      "Kam përfituar shumë njohuri në lidhje me Cloud dhe Linux. Ky trajnim ka hapur mundësi për avancimin tim të mëtejshëm në karrierë.",
    name: "Uvejs Danjolli",
    role: "Microsoft Azure Cloud & LINUX",
    stars: 5,
  },
  {
    quote:
      "Trajnimi në PHP dhe ReactJS ka luajtur një rol thelbësor në ndihmën time për të krijuar sisteme menaxhimi të suksesshme. Pas këtij trajnimi, kam zhvilluar dhe implementuar disa sisteme menaxhimi të cilat tani janë në përdorim në kompani të ndryshme.",
    name: "Jeta Shehu",
    role: "React JS & PHP",
    stars: 5,
  },
];
