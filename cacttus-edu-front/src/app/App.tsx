import React, { useState, useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import heroGraduates from "../imports/group4.png";
import studimePhoto from "../imports/Bursa_Redesign.png";
/* Hero photos for the two programme pages. Both are passed to `ProgramPage` as its
   `imgUrl` prop, so each page picks its own and neither can affect the other. */
import programimHero from "../imports/programimPage.png";
import cyberHero from "../imports/cyberPage.png";
import bizneseHero from "../imports/perbiznese.png";
/* Hero photo for /rreth-nesh, replacing the Bursa_Redesign.png placeholder that column
   borrowed. Shot 3:2 (8192x5464) and dropped into a 4:3 frame, so the crop is real:
   RRETH_AMBIENT_IMG_POSITION decides which band of it survives. */
import rrethNeshStafi from "../imports/rrethNeshStafi.jpeg";
/* Hero photo for /biznese/trajnime, replacing the Unsplash stock URL. Same 3:2 source in
   a 4:3 frame — see BIZNESE_TRAJNIME_IMG_POSITION. */
import trajnimePersonalizuara from "../imports/trajnimePersonalizuara.jpeg";
/* The five faces in the overlapping circle row on /biznese/talente, in the order they
   are shown left to right. NOTE the filename: the photo is `fatjonKerceli`, with a C —
   it was asked for as "fatjonKerqeli", with a Q. The file on disk wins. */
import talentMirlindArifi from "../imports/mirlindArifi.jpeg";
import talentDinaZejneli from "../imports/dinaZejneli.jpeg";
import talentAltinMorina from "../imports/altinMorina.jpeg";
import talentArjanaBellaqa from "../imports/arjanaBellaqa.jpeg";
import talentFatjonKerceli from "../imports/fatjonKerceli.jpeg";
/* The rest of the talent-network faces. Filenames differ from how they were listed,
   so they are spelled out here rather than guessed at the call site:
     - Eda Nuka   -> edaNukaRrjeti.jpeg, NOT the EdaNuka.png already imported above as
       `suksesEdaNuka` (that one is her success-story portrait, a different crop).
     - Gjin Bardhi -> gjinBardhi.jpeg, likewise distinct from `suksesGjinBardhi`.
     - Resul Manxholli -> .jpg, while its neighbours are .jpeg. */
import talentEdaNuka from "../imports/edaNukaRrjeti.jpeg";
import talentNoraBekteshi from "../imports/noraBekteshi.png";
import talentFlamurHaxholli from "../imports/flamurHaxholli.jpeg";
import talentResulManxholli from "../imports/resulManxholliRrjeti.jpg";
import talentKaltrinaQerimi from "../imports/kaltrinaQerimi.jpeg";
import talentErnataKoliqi from "../imports/nataDita.jpeg";
import talentGjinBardhi from "../imports/gjinBardhi.jpeg";
import talentTritMeri from "../imports/tritMeri.jpeg";
/* Instructor portraits — /ligjërueit. See LIGJËRUEIT for which card each lands on.
   The `2` files are the small ones (~1MB); the plain .jpg originals are ~9MB each. */
import lektorLuani from "../imports/luani2.png";
import lektorNaimi from "../imports/naimi2.png";
import lektorGezimi from "../imports/gezimi2.png";
import lektorJoni from "../imports/joni2.png";
import lektorJehona from "../imports/jehona.png";
import lektorVetoni from "../imports/vetoni.png";
import lektorAzra from "../imports/azra.png";
import lektorDrenusha from "../imports/drenusha.png";
/* Filenames here are the ones actually on disk, which differ slightly from how these six
   were listed: engjulli / valton / rafet, not engjull / valtoni / rafeti. */
import lektorPegmatiti from "../imports/pegmatiti.png";
import lektorGili from "../imports/gili.png";
import lektorEngjulli from "../imports/engjulli.png";
import lektorValtoni from "../imports/valton.png";
import lektorArditi from "../imports/arditi.png";
import lektorRafeti from "../imports/rafet.png";
/* Newer instructor portraits, shared by TWO lists: TRAINERS (the /trajnime "Ligjëruesit
   tanë" strip) and LIGJËRUEIT (the /ligjërueit page). Alban, Ali and Hana appear on both,
   which is why these are one import each rather than a set per page.

   Delivered as Figma SVG exports — an 810x1012 wrapper around an embedded PNG — rather
   than the plain .png the older portraits use, and heavy with it: 23MB across the five.
   See the note on `lektorLuani` above; the same shrink was done there once already. */
import trajnerAlban from "../imports/albantrajner.png";
import trajnerAli from "../imports/alitrajner.png";
/* `ardititrajner.png` is on disk but no longer imported: the /trajnime card for Ardit
   Beqiri was pointed back at `lektorArditi` (arditi.png). Re-add this line and swap the
   `imgUrl` in TRAINERS to use the newer export instead. */
import trajnerFisnik from "../imports/fisniktrajner.png";
import trajnereHana from "../imports/hanatrajnere.png";
/* Elmaze Gashi, /ekipi. */
import ekipiElmaze from "../imports/eli.png";
/* Dinion Svirca, /ligjërueit. */
import lektorDinion from "../imports/dinionProfa.png";
/* Graduate portraits for the "Histori suksesi" carousel — see STUDENT_PHOTOS. Each is a
   finished 292x164 card: portrait on the brand purple, with the graduate's name, role and
   employer already set INTO the artwork. That matters downstream — the carousel must not
   print a name of its own over these or it would say it twice. The older lowercase files
   (eltonismaili / edanuka / erisuruqi / partin) were the first cut of this same set and
   are no longer imported anywhere. */
import suksesEltonIsmailii from "../imports/EltonIsmailii.png";
import suksesErisUruqi from "../imports/ErisUruqi.png";
import suksesPartinNallbani from "../imports/PartinNallbani.png";
import suksesEdaNuka from "../imports/EdaNuka.png";
import suksesArdiHyseni from "../imports/ArdiHyseni.png";
import suksesGjinBardhi from "../imports/GjinBardhi.png";
import suksesGjinMirdita from "../imports/GjinMirdita.png";
import suksesAgonKrasniqi from "../imports/AgonKrasniqi.png";
import suksesErnataKoliqi from "../imports/ErnataKoliqi.png";
/* Hero photo for /biznese/bursa. A 1279x1600 portrait dropped into a 16:10 landscape
   frame, so roughly two thirds of its height is cropped away — which slice survives is
   BURSA_HERO_IMG_POSITION, next to the component that uses it. */
import bursaHeroImg from "../imports/BursaImpaktit.jpeg";
/* Hero photo for /biznese/klasa — replaces the Unsplash placeholder the section used.
   Same full-bleed frame and KLASA_HERO_IMG_POSITION crop as before. */
import klasaMeQeraHero from "../imports/klasaMeQeraHero.jpeg";
/* Scholarship sponsors for /biznese/bursa — see BURSA_SPONSORS. All three arrived as .png
   despite being referred to as .svg. */
/* Room photos for the "Hapësirat tona" grid on /biznese/klasa — one per card, in the
   order the array lists them. Shot portrait (EXIF orientation 6) and delivered at
   4592x3448 / ~6MB each; downscaled to 1200px on the long edge with the rotation baked
   in, since the card renders them about 370px wide.

   All six were renamed .JPG -> .jpg: `vite/client` only declares the lowercase extensions,
   so the uppercase ones did not typecheck, and an uppercase extension is a trap on a
   case-sensitive deploy host besides. */
import klasaPortokalli from "../imports/klasaportokalli.jpg";
import klasaRoze from "../imports/klasaroze.jpg";
import klasaVerdhe from "../imports/klasaverdhe.jpg";
import klasaGjelber from "../imports/klasagjelber.jpg";
import klasaKuqe from "../imports/klasakuqe.jpg";
import klasaHapsira from "../imports/hapsira.jpg";
/* Gallery photos for the "Pamje nga hapësirat" grid further down the same page — six
   positions, left-to-right then top-to-bottom, so the import order IS the display order.
   Same treatment as the room photos above: delivered at 4592x3448 / ~5MB each, downscaled
   to 1200px on the long edge with any EXIF rotation baked in. Orientation is mixed here —
   1, 3 and 5 are portrait, 2, 4 and 6 landscape — which the grid handles, since each cell
   sets its own aspect ratio and crops with `object-cover`. Note `hapsira.jpg` above is a
   different photo entirely (the shared-space CARD), not part of this set. */
import hapsira1 from "../imports/hapsira1.jpg";
import hapsira2 from "../imports/hapsira2.jpg";
import hapsira3 from "../imports/hapsira3.jpg";
import hapsira4 from "../imports/hapsira4.jpg";
import hapsira5 from "../imports/hapsira5.jpg";
import hapsira6 from "../imports/hapsira6.jpg";
import sponsorHarrisia from "../imports/harrisia.png";
import sponsorDoni from "../imports/doni.png";
import sponsorCacttus from "../imports/cacttus.png";
/* Partner logos for the scrolling marquee — see PARTNER_LOGO_IMAGES. Numeric filenames
   are the export names as delivered; the readable label lives in the data array. */
import partner17 from "../imports/17.svg";
import partner18 from "../imports/18.svg";
import partner19 from "../imports/19.svg";
import partner20 from "../imports/20.svg";
import partner21 from "../imports/21.svg";
import partner22 from "../imports/22.svg";
import partner23 from "../imports/23.svg";
import partner24 from "../imports/24.svg";
import partner25 from "../imports/25.svg";
import partner26 from "../imports/26.svg";
import partner27 from "../imports/27.svg";
import partner28 from "../imports/28.svg";
import partner29 from "../imports/29.svg";
/* Four more employer logos. PNG rather than SVG because that is what was delivered; they
   were 4:5 portrait canvases like the rest and have been trimmed to their artwork. */
import partner51 from "../imports/51.png";
import partner53 from "../imports/53.png";
import partner54 from "../imports/54.png";
import partner55 from "../imports/55.png";
/* Project-partner logos for the /projektet hero grid — see HERO_PARTNERS. */
import heroPartner30 from "../imports/30.svg";
import heroPartner31 from "../imports/31.svg";
import heroPartner32 from "../imports/32.svg";
import heroPartner33 from "../imports/33.svg";
import heroPartner34 from "../imports/34.svg";
import heroPartner35 from "../imports/35.svg";
/* The two projects with no entry in HERO_PARTNERS — their funders never appeared in the
   /projektet hero grid, so these are the only files that carry their marks. Used by
   PROJEKTET_LIST so all eight dropdown rows can show a logo rather than six of eight. */
import projectSkillFactory from "../imports/skill factory.png";
import projectLuxDev from "../imports/luxdev.png";
/* Certification-body logos for the /trajnime strip — see PARTNER_LOGOS. */
import cert36 from "../imports/36.svg";
import cert37 from "../imports/37.svg";
import cert38 from "../imports/38.svg";
import cert39 from "../imports/39.svg";
import cert40 from "../imports/40.svg";
import cert41 from "../imports/41.svg";
import cert42 from "../imports/42.svg";
import cert43 from "../imports/43.svg";
import cert44 from "../imports/44.svg";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  useParams,
} from "react-router";
import DOMPurify from "dompurify";
import {
  getPublicForm,
  submitPublicForm,
  getPublicTrainings,
  getTraining,
  getTrainingFilters,
  getPublicPosts,
  getPublicPost,
  PublicApiError,
  type ApiErrorDetail,
  type PublicForm,
  type PublicFormField,
  type PublicFormFieldType,
  type PostCard as PostCardData,
  type PostDetail,
  type TrainingCard as TrainingCardData,
  type TrainingStatus,
  type TrainingCategory,
  type TrainingDetail,
  type TrainingFormat,
} from "../marketing/lib/public-api";
import {
  APPLICATION_FORM_SLUG,
  BUSINESS_FORM_SLUG,
  BUSINESS_REQUEST_TYPES,
  CLASS_BOOKING_FORM_SLUG,
  CLASS_BOOKING_ROOMS,
  CONTACT_FORM_SLUG,
  STUDY_PROGRAMME_VALUES,
} from "../marketing/lib/forms.config";

/* ─── Albanian labels for the catalogue taxonomy ───
   The API stores stable machine values; these are what a visitor reads. Renaming a
   category is a change here, never a data migration. */
const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  PROGRAMIM: "Programim",
  ADMINISTRIM: "Administrim",
  SIGURI_KIBERNETIKE: "Siguri Kibernetike",
  MARKETING_DIZAJN: "Marketing & Dizajn",
  MENAXHIM_PROJEKTEVE: "Menaxhim i Projekteve",
  AFTESI_TE_BUTA: "Aftësi të buta",
};

/* Lifecycle labels + the two badge palettes. Green reads as "open, you can still join",
   neutral grey as "closed" — the same green/grey pairing the rest of the site already
   uses for success and muted states, so this adds no new colours. */
const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  ACTIVE: "Aktive",
  COMPLETED: "Përfunduar",
};

const TRAINING_STATUS_STYLES: Record<TrainingStatus, { bg: string; fg: string }> = {
  ACTIVE: { bg: "#E6F6EF", fg: "#1E9E6A" },
  COMPLETED: { bg: "#F4F4F6", fg: "#71717D" },
};

/**
 * The card's status pill. Same shape as `MetaChip`, different palette.
 *
 * The lookup is guarded rather than destructured straight away: `status` arrives over the
 * network, so an older API that predates the field — or a value added server-side before
 * this file learns its label — hands us something outside the two keys below. Indexing a
 * `Record` still type-checks in that case, so the crash would only show up at runtime, and
 * it would take the whole catalogue down over one missing pill. No style, no badge; the
 * card's other rows still render.
 */
function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  const style = TRAINING_STATUS_STYLES[status];
  if (!style) return null;
  const { bg, fg } = style;

  return (
    <span
      className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {TRAINING_STATUS_LABELS[status]}
    </span>
  );
}

/* ─── Phone number rule ───
   A MIRROR of the API's `phoneSchema` (backend/src/schemas/common.schema.ts), never a
   replacement for it: this half only buys instant feedback, and anything that skips the
   browser is still stopped server-side. Kept here, once, so all four phone inputs on this
   site enforce the same thing — a copy per form is a copy that drifts. */
const PHONE_RULE = /^\+?[0-9]{5,}$/;
const PHONE_ERROR = "Numri lejon vetëm shifra, me një '+' opsional në fillim.";

/**
 * Drops what the API would reject, as it is typed. Spaces survive so "+383 44 123 456"
 * stays readable while being entered; the server strips them before storing.
 *
 * The `+` needs its own pass: it is legal only as the very first character, so a stray one
 * typed mid-number is removed rather than allowed to sit there and fail validation later.
 */
function sanitizePhone(value: string): string {
  const allowed = value.replace(/[^\d+\s]/g, "");
  const lead = allowed.startsWith("+") ? "+" : "";
  return lead + allowed.slice(lead.length).replace(/\+/g, "");
}

/** Judged on the stripped form, exactly as the server judges it. */
function isValidPhone(value: string): boolean {
  return PHONE_RULE.test(value.replace(/\s+/g, ""));
}

const TRAINING_FORMAT_LABELS: Record<TrainingFormat, string> = {
  KLASE: "Klasë",
  HIBRID: "Hibrid",
  ONLINE: "Online",
};

/**
 * `DD.MM.YYYY` — the Albanian convention.
 *
 * Built by hand rather than with `Intl.DateTimeFormat('sq-AL')`: browsers without
 * Albanian in their ICU data silently fall back to the default locale, which rendered
 * 15 April as `04/15/2026`. A date that reads as a different date depending on the
 * visitor's browser is worse than a hard-coded format.
 *
 * Read in UTC because start dates are stored as midnight UTC — using local getters
 * would show the previous day for anyone west of Greenwich.
 */
function formatTrainingDate(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${day}.${month}.${date.getUTCFullYear()}`;
}

/**
 * `5 shkurt 2026` — the longer form, for article bylines.
 *
 * Separate from `formatTrainingDate` rather than a flag on it: a training's date is a
 * scheduling fact that must stay compact inside a meta row, an article's is prose. Month
 * names are a literal table for the reason given above — `Intl` cannot be trusted to have
 * Albanian, and a byline that reads "February" on some browsers is worse than no byline.
 *
 * Read in UTC to match the rest of this file, so the displayed day never shifts by one
 * for a visitor west of Greenwich.
 */
const ALBANIAN_MONTHS = [
  "janar", "shkurt", "mars", "prill", "maj", "qershor",
  "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor",
];

function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return `${date.getUTCDate()} ${ALBANIAN_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Sanitise operator-authored HTML immediately before it is handed to
 * `dangerouslySetInnerHTML`.
 *
 * The body is ALREADY sanitised server-side on write (`sanitizeRichText` in
 * backend/src/lib/html.ts), so this is the second of two passes, and it is deliberate:
 *
 *  - Stored rows carry whatever the allowlist permitted the day they were saved. Widening
 *    that allowlist later cannot retroactively re-clean them; this pass runs against
 *    today's rules on every render.
 *  - This is the marketing origin. A stored payload that slipped through — via a direct
 *    DB edit, a restored backup, or a future endpoint that forgets to sanitise — must not
 *    become script execution on the public site.
 *
 * `ALLOWED_*` mirrors the server's list rather than being laxer, so the two passes cannot
 * disagree in the direction that matters.
 *
 * `ADD_URI_SAFE_ATTR` is not optional here, and the reason is unobvious: DOMPurify applies
 * `ALLOWED_URI_REGEXP` to EVERY attribute it does not consider URI-safe, not only to
 * `href`/`src`. Without this line the regexp is handed `_blank` and `noopener noreferrer`,
 * neither of which is a URI, so it silently strips `target` and `rel` from every link the
 * editor marked as opening in a new tab. Listing them exempts those two from the URL check
 * while `href` and `src` are still validated — verified against `javascript:` and `data:`
 * payloads, which remain stripped. Neither attribute is fetched or executed, so exempting
 * them costs nothing: `target` only names a browsing context.
 */
const ALLOWED_HTML_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
];

const ALLOWED_HTML_ATTR = [
  "href", "title", "target", "rel",
  "src", "alt", "width", "height", "loading",
  "class",
];

/**
 * Close DOMPurify's `data:` exemption for `<img>`.
 *
 * `ALLOWED_URI_REGEXP` does NOT cover it: DOMPurify keeps a separate DATA_URI_TAGS
 * allowance (img, video, audio, source, track) that lets a `data:` URL through whatever
 * the regexp says, and it never inspects the media type. Verified: a
 * `data:image/svg+xml;base64,…` src survived this pass before this hook existed.
 *
 * An `<img>` renders SVG in a non-scripting context, so that payload was inert rather
 * than an XSS — but nothing we author needs a data: URL at all. The editor inserts
 * uploaded http(s) URLs (Tiptap's Image extension runs with `allowBase64: false`) and
 * the API's own pass already restricts img to http/https. Dropping the attribute costs
 * nothing and removes the one place where the two passes disagreed.
 *
 * Registered at module scope: DOMPurify hooks are global and cumulative, so adding this
 * inside `renderSafeHtml` would stack a fresh copy on every render.
 */
DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if ((data.attrName === "src" || data.attrName === "href") && /^data:/i.test(data.attrValue)) {
    data.keepAttr = false;
  }
});

function renderSafeHtml(html: string): { __html: string } {
  return {
    __html: DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ALLOWED_HTML_TAGS,
      ALLOWED_ATTR: ALLOWED_HTML_ATTR,
      // Belt and braces against `javascript:` / `data:` payloads surviving in an href.
      ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):|^[/#]/i,
      ADD_URI_SAFE_ATTR: ["target", "rel"],
    }),
  };
}
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  X,
  Menu,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  Code,
  Briefcase,
  Users,
  BookOpen,
  Award,
  Laptop,
  Globe,
  ChevronLeft,
  Wifi,
  Monitor,
  Wind,
  Star,
  TrendingUp,
  Zap,
  Plus,
  Minus,
  FileText,
  UserCheck,
  MessageSquare,
  GraduationCap,
  BarChart,
  Projector,
  Building2,
  type LucideIcon,
} from "lucide-react";

/* ─── BRAND COLORS ─── */
const C = {
  /* primary brand purples (brief spec) */
  brand: "#823685",
  brandDark: "#6A2A6D",
  brandLight: "#F4EAF5",
  brandSoft: "#FAF6FB",
  secondary: "#91478d",

  /* palette kept from original */
  p50: "#F9F4FB",
  p100: "#F2E9F7",
  p200: "#E4CFEC",
  p300: "#D1AEE0",
  p400: "#AF73C9",
  p500: "#823685",
  p600: "#6A2A6D",
  p700: "#5D2C72",
  p800: "#452154",
  p900: "#2D1637",

  /* neutrals */
  n0: "#FFFFFF",
  n50: "#FAFAFB",
  n100: "#F4F4F6",
  n200: "#E6E6EA",
  n300: "#D2D2D9",
  n400: "#9E9EA9",
  n500: "#71717D",
  n600: "#52525C",
  n700: "#3F3F46",
  n800: "#27272C",
  n900: "#1A1A1A",

  /* semantic */
  cardBorder: "#E9DCEA",
  muted: "#5A5A5A",
  success: "#1E9E6A",
  /* Inline validation messages and error borders on light surfaces. */
  danger: "#D33A3A",
};

/* ─── GLOBAL STYLES ─── */
const globalStyle = `
  @keyframes marquee-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marquee-right {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  .marquee-left { animation: marquee-left 40s linear infinite; }
  .marquee-right { animation: marquee-right 40s linear infinite; }
  .marquee-wrap:hover .marquee-left,
  .marquee-wrap:hover .marquee-right { animation-play-state: paused; }

  /*
    Navbar hover underline.

    A ::after bar that is always in the DOM and always the full width of the label, but
    squashed to nothing along its left edge until hover. Animating \`transform\` is what
    makes it cheap: scale runs on the compositor, so the bar never forces the browser to
    re-measure the navbar. Animating \`width\` instead would relayout on every frame.

    Because the element merely un-squashes, it animates back out on the way off — the
    reverse of the same transition, not a disappearance.

    Insets match the link's own \`px-3\` (12px) so the bar tracks the text and does not
    run out under the padding. \`bottom\` sits it inside the \`py-2\`, under the label.
  */
  .nav-underline { position: relative; }
  .nav-underline::after {
    content: "";
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 4px;
    height: 2px;
    border-radius: 1px;
    background-color: #823685;
    transform: scaleX(0);
    transform-origin: left center;
    /*
      DURATION — this is the number to change if the sweep feels off. Higher is slower.
      Rough feel: 200ms reads as instant, 400ms as deliberate, 600ms+ starts to lag
      behind the pointer and feels unresponsive.

      TIMING — ease-out (Tailwind's own curve, so it matches every other transition on
      the site): fast at the start, settling at the end. That is what makes it read as
      smooth. An ease-in curve would be the wrong choice here — it starts slow, so the
      bar would seem to hesitate before answering the hover.
    */
    transition: transform 400ms cubic-bezier(0, 0, 0.2, 1);
  }
  .nav-underline:hover::after,
  .nav-underline:focus-visible::after { transform: scaleX(1); }

  /* Respect a reduced-motion preference: the underline still appears, it just does not
     travel. Removing the cue entirely would leave those users worse off, not calmer. */
  @media (prefers-reduced-motion: reduce) {
    .nav-underline::after { transition: none; }
  }
`;

/* ─── SHARED TYPES ─── */
type DropdownId = "studime" | "projektet" | "biznese" | "rreth" | null;

/* ══════════════════════════════════════════
   PART 1 — GLOBAL: BANNER + NAVBAR
══════════════════════════════════════════ */

/* 1.1 — TOP BANNER: deep brand purple #823685 */
function TopBanner({ onApplyClick }: { onApplyClick: () => void }) {
  return (
    /*
      WIDE SCREENS: the bar stays full-bleed, but its CONTENT is pulled in to the
      navbar's content edges so the message and the pill line up with the logo and
      the CTA directly below them. Past 1536px the bar is far wider than the 1200px
      page container, and without this the text sat against the left edge of the
      viewport with the button ~350px to the right of everything else on the page.

      Done with padding rather than a `max-w-[1200px] mx-auto` wrapper because the
      background must keep spanning the full width — constraining this element would
      shrink the purple bar itself. `calc(50% - 600px + 20px)` is the navbar's own
      geometry written out: half the viewport, minus half of the 1200px container,
      plus that container's own `px-5`.

      `2xl:` only. Below 1536px the existing `px-4 sm:px-7` is unchanged, so every
      narrower width — including the 375px overflow fix below — renders as before.
    */
    <div
      className="w-full flex items-center justify-between gap-2 px-4 sm:px-7 2xl:px-[calc(50%_-_600px_+_20px)] relative overflow-hidden"
      style={{ backgroundColor: C.brand, height: 40 }}
    >
      {/*
        A real flex row rather than centred text with an absolutely-positioned button,
        because the button used to be `hidden md:flex` and a phone got nothing to tap.

        `min-w-0` is what actually makes `truncate` work here. A flex item defaults to
        `min-width: auto`, which refuses to shrink below its own text, so without this the
        paragraph keeps its full width and pushes the button off the end of the bar. The
        message gives up characters; the call to action never gives up space.
      */}
      <p className="text-white text-xs sm:text-sm font-medium truncate min-w-0">
        Regjistrohu me <span className="font-bold">20%</span> zbritje
      </p>
      {/* A button, not a Link: it opens the popup instead of navigating — the same
          `onApplyClick` the navbar's "Apliko tani" and the hero button already use. */}
      <button
        type="button"
        onClick={onApplyClick}
        aria-label="Apliko tani"
        /*
          `whitespace-nowrap` is load-bearing. The label sits in a fixed 30px-tall pill,
          so if it is ever allowed to wrap — which it will on a device whose fallback font
          is wider than ours before the webfont loads — the second line spills out of the
          pill and reads as a cut-off button. This pins it to one line always.

          The bar is 40px tall, so the pill itself cannot BE 44px. The hit area is widened
          with an ::after overlay instead (30 + 2x9 = 48px). The inset is VERTICAL ONLY:
          an -inset-x would push 8px of invisible box past the pill on each side, which at
          the right edge of the screen counts as horizontal overflow for no benefit — the
          pill is already ~100px wide, far past the 44px minimum.
        */
        className="relative shrink-0 flex items-center gap-1 whitespace-nowrap text-white text-xs font-medium px-3 rounded-full transition-all hover:bg-white/20 after:absolute after:content-[''] after:-inset-y-[9px]"
        style={{ border: "1px solid rgba(255,255,255,0.5)", height: 30, minHeight: 30 }}
      >
        {/* Short label on the narrowest screens so the pill can never be squeezed at
            375px; the full wording returns from `sm` up. */}
        <span className="sm:hidden">Apliko</span>
        <span className="hidden sm:inline">Apliko tani</span>
        <ArrowRight size={12} className="shrink-0" />
      </button>
    </div>
  );
}

/* 1.2 — NAVBAR: Rreth Nesh moved BEFORE Kontakti */
function Navbar({
  showBanner,
  setMobileMenuOpen,
  onApplyClick,
}: {
  showBanner: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  onApplyClick: () => void;
}) {
  const [activeDropdown, setActiveDropdown] = useState<DropdownId>(null);
  const [sticky, setSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > (showBanner ? 40 : 0));
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showBanner]);

  /* Every nav link goes through this one string, so `nav-underline` reaches all seven —
     the six inside <nav> and Kontakti, which sits in its own group to the right. See the
     rule in `globalStyle`. */
  const navLinkClass =
    "nav-underline px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-purple-700";
  const navLinkStyle = { color: C.n700 };

  return (
    <div
      ref={navRef}
      className={`w-full z-40 transition-shadow duration-200 ${sticky ? "sticky top-0 shadow-md" : ""}`}
      style={{ backgroundColor: C.n0, borderBottom: `1px solid ${C.n200}` }}
    >
      <div
        className="max-w-[1200px] mx-auto px-5 flex items-center justify-between"
        style={{ height: 64 }}
      >
        {/* Logo */}
        {/*
          The true-vector lockup, replacing `logo-180px.png`. That raster was a 180x180
          SQUARE of the mark, forced to height:130 and then cropped back to 52px by an
          overflow-hidden box with -39px margins top and bottom, with mixBlendMode
          "multiply" knocking out its white background. Three hacks stacked to make a
          square icon behave like a wordmark, and it still rendered soft — 180px of source
          for a slot that needs 2x its display width.

          education-black.svg is the dark lockup for light surfaces (the navbar and the
          drawer are both white), 12 real <path> elements, no raster, no blend mode. It
          needs no crop, no negative margins and no overflow box: height alone sizes it,
          and `width`/`height` carry the viewBox ratio (710.096 x 199.759, ~3.55:1) so the
          browser reserves the correct box before load.
        */}
        <Link to="/" className="shrink-0 flex items-center">
          <img
            src="/brand/education-black.svg"
            width={710}
            height={200}
            alt="Cacttus Education"
            decoding="async"
            className="block"
            style={{ height: 36, width: "auto" }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {/* Studime profesionale */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("studime")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button className={navLinkClass} style={navLinkStyle}>
              Studime profesionale{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "studime" ? "rotate-180" : ""}`} />
            </button>
            {activeDropdown === "studime" && <DropdownStudime onClose={() => setActiveDropdown(null)} />}
          </div>

          <Link to="/trajnime" className={navLinkClass} style={navLinkStyle}>
            Trajnime profesionale
          </Link>

          {/* Projektet */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("projektet")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link to="/projektet" className={navLinkClass} style={navLinkStyle}>
              Projektet{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "projektet" ? "rotate-180" : ""}`} />
            </Link>
            {activeDropdown === "projektet" && <DropdownProjektet onClose={() => setActiveDropdown(null)} />}
          </div>

          {/* Për biznese */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("biznese")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <Link to="/biznese" className={navLinkClass} style={navLinkStyle}>
              Për biznese{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "biznese" ? "rotate-180" : ""}`} />
            </Link>
            {activeDropdown === "biznese" && <DropdownBiznese onClose={() => setActiveDropdown(null)} />}
          </div>

          <Link to="/lajme" className={navLinkClass} style={navLinkStyle}>
            Lajme
          </Link>

          {/* Rreth Nesh — BEFORE Kontakti */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("rreth")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {/*
              A Link, not a button: the label now navigates to /rreth-nesh while hovering
              still opens the dropdown, matching "Studime profesionale" and "Për biznese"
              above, which have behaved this way all along. The dropdown itself and its
              two entries are untouched.
            */}
            <Link to="/rreth-nesh" className={navLinkClass} style={navLinkStyle}>
              Rreth Nesh{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "rreth" ? "rotate-180" : ""}`} />
            </Link>
            {activeDropdown === "rreth" && <DropdownRreth onClose={() => setActiveDropdown(null)} />}
          </div>
        </nav>

        {/*
          Kontakti + Apliko tani, deliberately OUTSIDE the <nav> above and carrying their
          own divider. The six links to the left are "where do I read about you"; these
          two are "how do I reach you" — a different job, so they read as their own group
          rather than as the tail of a list of six.
        */}
        <div className="hidden lg:flex items-center gap-5 pl-6" style={{ borderLeft: `1px solid ${C.n200}` }}>
          <Link to="/kontakti" className={navLinkClass} style={navLinkStyle}>
            Kontakti
          </Link>
          {/* Link removed: this opens the popup, it no longer navigates. */}
          <PrimaryBtn onClick={onApplyClick}>Apliko tani</PrimaryBtn>
        </div>

        <button
          className="lg:hidden p-2 rounded-md"
          style={{ color: C.n700 }}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Hap menunë"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
}

/* ─── DROPDOWNS ─── */
function DropdownStudime({ onClose }: { onClose: () => void }) {
  const { pathname } = useLocation();
  return (
    <div
      className="absolute top-full left-0 mt-1 rounded-2xl shadow-2xl p-8 z-50"
      style={{ width: 720, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.brand, letterSpacing: "0.08em" }}>
        Studime Profesionale
      </p>
      <p className="text-sm mb-6" style={{ color: C.n500 }}>
        Cacttus Education ofron studime dyvjeçare të akredituara në fushën e teknologjisë.
      </p>
      <div className="flex flex-col gap-3">
        {[
          { to: "/programim", Icon: Code, title: "Zhvillues i Ueb-it dhe Aplikacioneve Mobile", sub: "Zhvillim uebi dhe aplikacionesh mobile me integrim të Inteligjencës Artificiale." },
          { to: "/siguria", Icon: Shield, title: "Siguria Kibernetike", sub: "Mbrojtje e rrjeteve dhe sistemeve, operacione kibernetike, siguri në cloud dhe testim." },
        ].map(({ to, Icon, title, sub }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            aria-current={pathname === to ? "page" : undefined}
            className="flex items-start gap-4 p-4 rounded-xl transition-all hover:shadow-md group"
            style={{
              border: `1px solid ${pathname === to ? C.brand : C.n200}`,
              backgroundColor: pathname === to ? C.brandSoft : "transparent",
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
              <Icon size={22} style={{ color: C.brand }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug" style={{ color: C.n900 }}>{title}</p>
              <p className="text-xs mt-1" style={{ color: C.n500 }}>{sub}</p>
            </div>
            <ArrowRight size={16} className="ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: C.brand }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

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
const PROJEKTET_LIST = [
  { name: "Skill Factory", path: "/projektet/skill-factory", icon: projectSkillFactory },
  { name: "Partneriteti për Impaktin në TIK", path: "/projektet/usaid", icon: heroPartner30 }, // HERO_PARTNERS "USAID"
  { name: "SDC", path: "/projektet/sdc", icon: heroPartner31 }, // HERO_PARTNERS "Helvetas" — the SDC project's implementer
  { name: "Gratë në Punë Online", path: "/projektet/wow", icon: heroPartner32 }, // HERO_PARTNERS "WOW"
  { name: "KODE", path: "/projektet/kode", icon: heroPartner33 }, // HERO_PARTNERS "KODE — Kosovo Digital Economy"
  { name: "Regional Challenge Fund (RCF)", path: "/projektet/rcf", icon: heroPartner34 }, // HERO_PARTNERS "Regional Challenge Fund"
  { name: "LuxDev Smart Mobility Project", path: "/projektet/luxdev", icon: projectLuxDev },
  { name: "Virtual Innovation Consortium (VIC)", path: "/projektet/vic", icon: heroPartner35 }, // HERO_PARTNERS "Virtual Innovation Consortium"
];

function DropdownProjektet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 rounded-2xl shadow-2xl py-2 z-50"
      style={{ width: 420, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      {PROJEKTET_LIST.map((p) => (
        <Link
          key={p.path}
          to={p.path}
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-purple-50 group"
          style={{ color: C.n700 }}
        >
          {/*
            Fixed-size round frame rather than a bare <img>: the source logos are wildly
            different aspect ratios (a wide USAID wordmark next to a square VIC glyph), so
            letting them size themselves would give every row a different visual weight.
            The frame is the constant, `object-contain` fits the mark inside it, and
            `shrink-0` stops the longer Albanian titles from squeezing it flat.
          */}
          <span
            className="shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center p-1.5"
            style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
          >
            {/* Decorative: the row's own text already names the project, so an alt here
                would just make screen readers say it twice. */}
            <img src={p.icon} alt="" aria-hidden="true" loading="lazy" className="max-w-full max-h-full object-contain" />
          </span>
          {p.name}
          <ArrowRight size={14} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.brand }} />
        </Link>
      ))}
    </div>
  );
}

function DropdownBiznese({ onClose }: { onClose: () => void }) {
  /* Marks the sub-page the visitor is already on, so the dropdown says where they are
     rather than only where they could go. Brand purple on the border and title. */
  const { pathname } = useLocation();
  return (
    <div
      className="absolute top-full left-0 mt-1 rounded-2xl shadow-2xl p-6 z-50"
      style={{ width: 660, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.brand, letterSpacing: "0.08em" }}>Për Biznese</p>
      <p className="text-sm mb-5" style={{ color: C.n500 }}>Ndihmojmë kompanitë të përgatiten për transformimin dixhital.</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: "Trajnime të personalizuara", desc: "Rikualifikoni punëtorët ekzistues për role dixhitale", path: "/biznese/trajnime" },
          { title: "Rrjeti i talentëve", desc: "Akses në portfoliot dhe CV e studentëve", path: "/biznese/talente" },
          { title: "Bursa e Impaktit", desc: "Bëhu Sponsor i Bursave të impaktit", path: "/biznese/bursa" },
          { title: "Klasët me qera", desc: "Klasat moderne të pajisura për qira", path: "/biznese/klasa" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            aria-current={pathname === item.path ? "page" : undefined}
            className="p-4 rounded-xl transition-all hover:shadow-md"
            style={{
              border: `1px solid ${pathname === item.path ? C.brand : C.n200}`,
              backgroundColor: pathname === item.path ? C.brandSoft : "transparent",
            }}
          >
            <p className="font-semibold text-sm" style={{ color: pathname === item.path ? C.brand : C.n900 }}>{item.title}</p>
            <p className="text-xs mt-1" style={{ color: C.n500 }}>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DropdownRreth({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute top-full right-0 mt-1 rounded-2xl shadow-2xl py-2 z-50"
      style={{ width: 240, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      {[["Ekipi", "/ekipi"], ["Ligjëruesit", "/ligjërueit"]].map(([label, path]) => (
        <Link
          key={path}
          to={path}
          onClick={onClose}
          className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-purple-50 group"
          style={{ color: C.n700 }}
        >
          {label}
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.brand }} />
        </Link>
      ))}
    </div>
  );
}

/* ─── MOBILE MENU — Rreth Nesh BEFORE Kontakti ─── */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  /*
    Every drawer sub-link already renders in brand purple, so "active = purple" would not
    distinguish anything. The current page is marked with WEIGHT and a filled left rule
    instead: same hue, unmistakably one row.
  */
  const { pathname } = useLocation();
  const subLink = (path: string) => ({
    className: `py-3 pl-4 text-sm block border-l-2 ${pathname === path ? "font-semibold" : ""}`,
    style: { color: pathname === path ? C.brandDark : C.brand, borderColor: pathname === path ? C.brand : C.p300 },
  });
  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    /*
      `overflow-hidden` is NOT cosmetic — it is the fix for a horizontal-scroll bug on iOS.

      The panel below parks itself off-canvas with `translate-x-full` when closed, which
      puts its right edge 384px (max-w-sm) past the right edge of the screen. This box is
      `fixed inset-0`, and desktop Chrome does not count overflow inside a fixed subtree
      toward document.scrollWidth — so every automated check here reported zero overflow
      while a real iPhone scrolled 384px to the right into empty space, with the banner and
      hamburger appearing cut off. iOS Safari DOES count it.

      Clipping at this wrapper kills the phantom scroll at its source. The open state is
      unaffected: at `translate-x-0` the panel sits fully inside these bounds, and it still
      slides in from the clipped edge exactly as before.
    */
    <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-sm flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ backgroundColor: C.n0 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.n200 }}>
          {/* Same vector lockup as the navbar — the drawer header is white too. Was the
              180px raster at 32px with mixBlendMode "multiply". */}
          <img src="/brand/education-black.svg" width={710} height={200} alt="Cacttus Education" decoding="async" className="block" style={{ height: 34, width: "auto" }} />
          <button onClick={onClose} aria-label="Mbyll menunë" className="p-3 -m-3"><X size={22} style={{ color: C.n700 }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <AccordionMobile label="Studime profesionale" id="studime" expanded={expanded} toggle={toggle}>
            <Link to="/programim" onClick={onClose} {...subLink("/programim")}>Zhvillues i Ueb-it dhe Aplikacioneve Mobile</Link>
            <Link to="/siguria" onClick={onClose} {...subLink("/siguria")}>Siguria Kibernetike</Link>
          </AccordionMobile>
          <Link to="/trajnime" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Trajnime profesionale</Link>
          <AccordionMobile label="Projektet" id="projektet" expanded={expanded} toggle={toggle} overviewPath="/projektet" onClose={onClose}>
            {PROJEKTET_LIST.map((p) => (
              <Link key={p.path} to={p.path} onClick={onClose} {...subLink(p.path)}>{p.name}</Link>
            ))}
          </AccordionMobile>
          <AccordionMobile label="Për biznese" id="biznese" expanded={expanded} toggle={toggle} overviewPath="/biznese" onClose={onClose}>
            {[["Trajnime të personalizuara", "/biznese/trajnime"], ["Rrjeti i talentëve", "/biznese/talente"], ["Bursa e Impaktit", "/biznese/bursa"], ["Klasët me qera", "/biznese/klasa"]].map(([name, path]) => (
              <Link key={path} to={path} onClick={onClose} {...subLink(path)}>{name}</Link>
            ))}
          </AccordionMobile>
          <Link to="/lajme" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Lajme</Link>
          {/* Rreth Nesh BEFORE Kontakti */}
          <AccordionMobile label="Rreth Nesh" id="rreth" expanded={expanded} toggle={toggle} overviewPath="/rreth-nesh" onClose={onClose}>
            <Link to="/ekipi" onClick={onClose} {...subLink("/ekipi")}>Ekipi</Link>
            <Link to="/ligjërueit" onClick={onClose} {...subLink("/ligjërueit")}>Ligjëruesit</Link>
          </AccordionMobile>
          <Link to="/kontakti" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Kontakti</Link>
        </div>
        <div className="p-5 border-t" style={{ borderColor: C.n200 }}>
          <Link to="/#apliko" onClick={onClose} className="block w-full">
            <PrimaryBtn className="w-full justify-center">Apliko tani</PrimaryBtn>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * A drawer section whose label toggles its sub-menu.
 *
 * `overviewPath` is how the section's OWN page stays reachable. Three of these headings
 * (Projektet, Për biznese, Rreth Nesh) name a real page, but the heading is a toggle, so
 * on a phone there was no way to reach /projektet, /biznese or /rreth-nesh at all — the
 * tap only expanded the list of children.
 *
 * The fix is a "Shiko të gjitha" row at the TOP of the expanded panel rather than making
 * the heading itself a link with a separate caret. A 44px row split into a link half and a
 * caret half is a mis-tap waiting to happen on a phone, and it would have changed this
 * component's contract for the one section (Studime profesionale) that has no page to
 * point at. An extra row costs nothing and reads unambiguously.
 */
function AccordionMobile({ label, id, expanded, toggle, overviewPath, onClose, children }: { label: string; id: string; expanded: string | null; toggle: (id: string) => void; overviewPath?: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <>
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium"
        style={{ color: C.n800 }}
        onClick={() => toggle(id)}
      >
        {label}
        <ChevronDown size={16} className={`transition-transform ${expanded === id ? "rotate-180" : ""}`} />
      </button>
      {expanded === id && (
        <div className="px-5 pb-2 flex flex-col gap-1">
          {overviewPath && (
            <Link
              to={overviewPath}
              onClick={onClose}
              className="py-3 pl-4 text-sm font-semibold block border-l-2"
              style={{ color: C.brandDark, borderColor: C.brand }}
            >
              Shiko të gjitha
            </Link>
          )}
          {children}
        </div>
      )}
    </>
  );
}

/* ─── FOOTER ─── */
/* ── FOOTER ──
   Four columns: identity, contact, navigation, social + CTA.

   Rendered ONCE from `Layout`, not from `PageWrapper`. It used to hang off PageWrapper
   behind a `withFooter` prop, and `ProgramPage` passed `withFooter={false}` — which is
   how /programim and /siguria ended up with no footer at all. A footer is chrome, same as
   the navbar, so it belongs with the navbar in the shell where no page can opt out. */

/**
 * TikTok, drawn here rather than imported.
 *
 * lucide-react (0.487) has no TikTok icon at all — its brand glyphs are legacy, already
 * flagged deprecated, and no new ones are being added. So this is an inline SVG built to
 * lucide's own conventions: a 24×24 viewBox, `fill="none"`, and a `currentColor` stroke at
 * width 2 with round caps and joins.
 *
 * Stroke rather than fill is the load-bearing detail. The usual TikTok mark is a solid
 * shape, and a solid glyph sitting beside four outline ones reads as heavier and darker
 * even when the colour value is character-for-character identical. Matching the drawing
 * style is what makes it match the colour.
 *
 * Because it inherits `currentColor` exactly as a lucide icon does, the `style={{ color }}`
 * already on the row applies to it unchanged — no per-icon colour anywhere.
 */
function TikTokIcon({ size = 24, ...rest }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

/**
 * The real Cacttus Education profiles, in ONE place.
 *
 * Both social rows on the site (the footer and /kontakti's "Na ndiq") read from here, so
 * a profile URL is corrected once rather than in two files that drift apart.
 */
const SOCIAL_URLS = {
  facebook: "https://www.facebook.com/cacttusedu",
  instagram: "https://www.instagram.com/cacttuseducation/",
  linkedin: "https://www.linkedin.com/school/cacttusedu/posts/?feedView=all",
  tiktok: "https://www.tiktok.com/@cacttuseducation",
} as const;

type SocialLink = { Icon: React.ElementType; label: string; href: string };

const FOOTER_SOCIALS: readonly SocialLink[] = [
  { Icon: Facebook, label: "Facebook", href: SOCIAL_URLS.facebook },
  { Icon: TikTokIcon, label: "TikTok", href: SOCIAL_URLS.tiktok },
  { Icon: Instagram, label: "Instagram", href: SOCIAL_URLS.instagram },
  { Icon: Linkedin, label: "LinkedIn", href: SOCIAL_URLS.linkedin },
];

/**
 * The same four profiles for /kontakti's "Na ndiq" row.
 *
 * Separate array only because that row renders a different shape of control; the ORDER
 * matches the footer so the two rows read alike. It carries TikTok, not Twitter — the
 * row used to show a Twitter glyph, and Cacttus has no Twitter profile for it to open.
 */
const CONTACT_SOCIALS: readonly SocialLink[] = [
  { Icon: Facebook, label: "Facebook", href: SOCIAL_URLS.facebook },
  { Icon: Instagram, label: "Instagram", href: SOCIAL_URLS.instagram },
  { Icon: Linkedin, label: "LinkedIn", href: SOCIAL_URLS.linkedin },
  { Icon: TikTokIcon, label: "TikTok", href: SOCIAL_URLS.tiktok },
];

const FOOTER_LINKS: readonly (readonly [string, string])[] = [
  ["Rreth nesh", "/rreth-nesh"],
  ["Projektet", "/projektet"],
  ["Studime Profesionale", "/programim"],
  ["Trajnime profesionale", "/trajnime"],
  ["Biznese", "/biznese"],
];

function Footer({ onApplyClick }: { onApplyClick?: () => void }) {
  return (
    <footer style={{ backgroundColor: C.p800 }} className="pt-20 pb-8">
      <div className="max-w-[1200px] mx-auto px-5">
        {/*
          `1.4fr` on the first track: the tagline is prose and needs more room than three
          columns of short lines, which would otherwise all be given an equal quarter and
          leave the paragraph wrapping every four words.
        */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr] gap-10 lg:gap-12 pb-12 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          {/* 1 — identity */}
          <div>
            {/*
              The white lockup, straight onto the purple with no patch behind it.

              THIS USES education-white.svg, NOT logowhitenobgCE.svg, and the difference
              is not cosmetic. Despite its name, `logowhitenobgCE.svg` has no transparency
              of its own: it is a single 709x251 PNG that is 100% OPAQUE with solid black
              corners (verified by rasterising it), turned white and see-through only by an
              feColorMatrix + <mask> chain at render time. Engines that skip that chain —
              older Safari, Android WebView, some in-app browsers — paint the raw bitmap,
              which is exactly the "white logo in a black box" that was reported on a phone.

              education-white.svg is true vector: 12 <path> elements filled #ffffff, no
              rasters, no filters, no masks. There is nothing in it that can fail to a
              black rectangle. It is the same lockup the dashboard sidebar uses.

              `width`/`height` are the viewBox numbers (710.096 x 199.759, ~3.55:1) so the
              browser reserves the right box before load — no layout shift — and only the
              height is constrained, which makes stretching impossible.
            */}
            <img
              src="/brand/education-white.svg"
              width={710}
              height={200}
              alt="Cacttus Education"
              decoding="async"
              className="block mb-5"
              style={{ height: 38, width: "auto" }}
            />
            <p className="text-sm leading-relaxed max-w-[34ch]" style={{ color: "rgba(255,255,255,0.65)" }}>
              Cacttus Education është lider në Kosovë në ofrimin e edukimit profesional në
              fushën e teknologjisë informative.
            </p>
          </div>

          {/* 2 — contact */}
          <div>
            <p
              className="text-xs font-semibold text-white mb-4 uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Kontakti
            </p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="text-white/85">Cacttus Education LLC</span>
              <span className="leading-relaxed">
                Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4, 10000 Prishtinë, Kosovë
              </span>
              {/* A tel: link, not plain text — on a phone this is the difference between
                  reading the number and calling it. */}
              <a
                href="tel:+38338600237"
                className="py-3 lg:py-0 transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Tel: +383 (0)38 600 237
              </a>
            </div>
          </div>

          {/* 3 — navigation */}
          <div>
            <p
              className="text-xs font-semibold text-white mb-4 uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Navigimi
            </p>
            <nav className="flex flex-col gap-2.5">
              {FOOTER_LINKS.map(([label, path]) => (
                <Link
                  key={path}
                  to={path}
                  className="text-sm py-3 lg:py-0 transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 4 — social + CTA */}
          <div>
            <p
              className="text-xs font-semibold text-white mb-4 uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Rrjetet Sociale
            </p>
            <div className="flex gap-3 mb-6">
              {FOOTER_SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Icon size={18} style={{ color: "rgba(255,255,255,0.7)" }} aria-hidden="true" />
                </a>
              ))}
            </div>

            {/*
              Outline pill rather than the site's filled PrimaryBtn: on this dark panel a
              solid brand-purple button would nearly disappear, the same reason the apply
              band's button is white rather than purple.
            */}
            <button
              type="button"
              onClick={onApplyClick}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-semibold uppercase transition-colors duration-200"
              style={{
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.5)",
                letterSpacing: "0.08em",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.color = C.p900;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#fff";
              }}
            >
              Apliko tani
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Cacttus Education 2026. Të gjitha drejtat e rezervuara.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Ndërtuar me ♥ në Prishtinë
            </p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Kthehu në krye"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <ArrowUp size={16} style={{ color: "rgba(255,255,255,0.75)" }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════
   SHARED UI PRIMITIVES
══════════════════════════════════════════ */
function PrimaryBtn({ children, className = "", onClick, type = "button" }: { children: React.ReactNode; className?: string; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${className}`}
      style={{ backgroundColor: C.brand }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.brandDark)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.brand)}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${className}`}
      style={{ color: C.brand, border: `1.5px solid ${C.brand}`, backgroundColor: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.brandLight; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    /*
      `py-2 -my-2` is a TAP TARGET, not spacing. Measured on a 375px phone this control was
      20px tall — well under the ~44px a fingertip needs — because it is bare text plus a
      chevron with no padding of its own.

      The padding grows the clickable box by 8px above and below; the equal negative margin
      takes those same 16px back out of the layout, so every card and row this sits in keeps
      the exact geometry it had. Bigger to touch, identical to look at.
    */
    <button onClick={onClick} className={`inline-flex items-center gap-1 py-2 -my-2 text-sm font-semibold transition-colors group ${className}`} style={{ color: C.brand }}>
      {children}
      <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.brand, letterSpacing: "0.08em" }}>{children}</p>;
}

/**
 * The four headline numbers, in ONE place.
 *
 * These used to be inline markup inside the homepage hero. They are now a component
 * because the trainings catalogue and the About page show the same four figures, and
 * three hand-copied sets of numbers are three sets that drift the first time one of them
 * is updated. Editing `HERO_STATS` below changes every page at once.
 */
const HERO_STATS: readonly (readonly [string, string])[] = [
  ["1,000+", "Studentë të diplomuar"],
  ["88%", "Studentë të punësuar"],
  ["120+", "Bursa të ofruara"],
  ["40+", "Partnerë nga industria"],
];

function HeroStats({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-7 pt-6 ${className}`}
      style={{ borderTop: `1px solid ${C.n200}` }}
    >
      {HERO_STATS.map(([num, label]) => (
        <div key={label}>
          <p className="text-2xl font-bold" style={{ color: C.brand }}>{num}</p>
          <p className="text-sm mt-0.5" style={{ color: C.n500 }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: C.brandLight, color: C.brandDark }}>
      {children}
    </span>
  );
}

function Breadcrumb({ items }: { items: { label: string; path?: string }[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-6 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span style={{ color: C.n400 }}>/</span>}
          {item.path ? (
            <Link to={item.path} className="hover:underline transition-colors" style={{ color: C.brand }}>{item.label}</Link>
          ) : (
            <span style={{ color: C.n500 }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function FormField({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: C.n800, height: 52 }}
        onFocus={(e) => (e.target.style.borderColor = C.brand)}
        onBlur={(e) => (e.target.style.borderColor = C.n300)}
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none"
        style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: value ? C.n800 : C.n400, height: 52 }}
        onFocus={(e) => (e.target.style.borderColor = C.brand)}
        onBlur={(e) => (e.target.style.borderColor = C.n300)}
      >
        <option value="" disabled>Zgjidh...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/**
 * Scroll-to-top on mount, and nothing else.
 *
 * It used to render the footer too, behind a `withFooter` prop — which meant a page could
 * silently ship without one, and `ProgramPage` did exactly that. The footer now lives in
 * `Layout` beside the navbar, so this is purely the "new page, start at the top" helper
 * its name suggests.
 */
function PageWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return <>{children}</>;
}

/* ══════════════════════════════════════════
   POPUP FORM — controlled by Layout

   Layout owns the open/closed state, because the banner and Navbar buttons need
   to open this too and they are siblings of it, not children.
   Fully static: nothing is fetched, nothing is submitted anywhere.
══════════════════════════════════════════ */

const POPUP_DREJTIMET = [
  "Zhvillim i Ueb dhe Aplikacioneve Mobile",
  "Siguri Kibernetike",
];

/**
 * The popup's dropdown wording → the `programi` option VALUES the API accepts.
 *
 * These two lists read almost the same but are NOT identical ("Ueb" vs "Ueb-it",
 * "Siguri" vs "Siguria"), and a select answer is validated against `option.value`
 * exactly, so sending the visible label straight through would 400. The visible strings
 * above are Ernata's copy and stay untouched; this table is the only thing that moves if
 * either side is reworded.
 */
const POPUP_PROGRAMME_VALUES: Record<string, string> = {
  "Zhvillim i Ueb dhe Aplikacioneve Mobile": STUDY_PROGRAMME_VALUES.ZHVAM,
  "Siguri Kibernetike": STUDY_PROGRAMME_VALUES.CYBER,
};

/* ─── Motion timings. POPUP_EXIT_MS also gates the delayed unmount below. ─── */
const POPUP_ENTER_MS = 400;        // the card arriving
const POPUP_EXIT_MS = 180;         // the card leaving
const POPUP_ROW_MS = 280;          // one staggered row
const POPUP_ROW_STAGGER_MS = 50;   // gap between consecutive rows
const POPUP_ROW_START_MS = 100;    // rows begin while the card is still settling
const POPUP_REDUCED_MS = 150;      // reduced motion: one plain quick fade
/* Floor under the open transition — see the reveal effect for why rAF alone is not
   enough. Comfortably longer than two frames on a slow device, short enough that a
   real user never waits on it. */
const POPUP_REVEAL_FALLBACK_MS = 120;

/* The 1.56 overshoots past the final value before easing back to it, so the card
   grows a touch past full size and settles. Last row lands at 100+8*50+280=780ms. */
const POPUP_ENTER_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const POPUP_ROW_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function ScrollPopupForm({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  /* `mounted` = present in the DOM. `visible` = in its open visual state.
     `entered` stays true through the exit, so rows leave with the card, not before it. */
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emri, setEmri] = useState("");
  const [mbiemri, setMbiemri] = useState("");
  const [drejtimi, setDrejtimi] = useState("");
  const [email, setEmail] = useState("");
  const [telefoni, setTelefoni] = useState("");

  /* A handle on the card element, so we can focus its first input on open. */
  const cardRef = useRef<HTMLDivElement>(null);

  /* ─── Mount first, animate second; on the way out, animate first, unmount second ─── */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);                     // in the DOM, still in its closed look

      const reveal = () => {
        setVisible(true);
        setEntered(true);                                  // starts the row stagger
      };

      let second = 0;
      const first = requestAnimationFrame(() => {          // let the closed look paint once
        second = requestAnimationFrame(reveal);            // now flip: browser animates
      });

      /*
        The rAF pair is an OPTIMISATION, never the only way out — and that distinction is
        load-bearing here. A hidden tab (backgrounded, minimised, another window in front)
        is issued no frames at all by the browser, so neither callback ever runs. `mounted`
        would stay true with `visible` stuck false: a full-screen `z-[60]` overlay in the
        DOM at opacity 0, holding `body { overflow: hidden }`, swallowing every click and
        every attempt to focus a field ANYWHERE on the site — and surviving route changes,
        because this component lives in the app shell. The page looks alive and is
        completely inert. A timer is not throttled to a standstill the way rAF is, so it
        is the floor: whichever fires first reveals, the loser is cancelled, and calling
        `reveal` twice is a no-op because both setters write the value they already hold.
      */
      const fallback = window.setTimeout(reveal, POPUP_REVEAL_FALLBACK_MS);

      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
        window.clearTimeout(fallback);
      };
    }
    setVisible(false);                      // play the exit transition...
    const timer = window.setTimeout(() => {
      setMounted(false);                    // ...and only then leave the DOM
      setEntered(false);                    // rearm the stagger for the next open
    }, POPUP_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  /* An inline style cannot hold a media query, so the preference is read in JS. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Escape closes. Kept separate because it depends on the parent's callback. */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* Scroll lock is its own effect: if it re-ran it would capture "hidden" as the
     value to restore, and the page would stay frozen forever. */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  /* Focus waits on `mounted` — the card does not exist in the DOM before that. */
  useEffect(() => {
    if (!mounted) return;
    cardRef.current?.querySelector("input")?.focus();
  }, [mounted]);

  /* Reopening should ask again, not still be showing the thank-you screen. */
  useEffect(() => {
    if (isOpen) { setSent(false); setError(""); }
  }, [isOpen]);

  /**
   * Sends the lead to the SAME application form the "Apliko tani" band posts to
   * (APPLICATION_FORM_SLUG), so the popup is a second door onto one path rather than a
   * parallel one — an admin sees both in a single list.
   *
   * `sent` flips only after the POST resolves. A rejection leaves the card open with
   * every value still in it, so nothing has to be retyped.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();                     // stop the browser's default page reload
    // The button stays enabled, so a second Enter before the first POST settles would
    // otherwise send the lead twice.
    if (isSubmitting) return;

    if (!emri.trim() || !mbiemri.trim() || !drejtimi) {
      setError("Ju lutem plotësoni fushat e detyrueshme.");
      return;
    }
    // Email and phone are REQUIRED by the API — they become real Submission columns —
    // even though these two labels carry no asterisk. Checked here so the visitor gets an
    // Albanian sentence instead of a 400 from the server.
    if (!email.trim() || !telefoni.trim()) {
      setError("Email dhe numri i telefonit janë të detyrueshëm.");
      return;
    }
    if (!isValidPhone(telefoni)) {
      setError(PHONE_ERROR);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(APPLICATION_FORM_SLUG, {
        // One `name` column server-side, so the two inputs are joined for it.
        name: `${emri.trim()} ${mbiemri.trim()}`,
        email: email.trim(),
        phone: telefoni.trim(),
        // Mapped, not passed through: the dropdown's wording is not the option value.
        data: { programi: POPUP_PROGRAMME_VALUES[drejtimi] ?? drejtimi },
      });
      setSent(true);
    } catch (cause: unknown) {
      if (cause instanceof PublicApiError) {
        setError(
          cause.isValidation
            ? "Disa fusha nuk janë të vlefshme. Kontrollo të dhënat dhe provo përsëri."
            : cause.message,
        );
      } else {
        setError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;                // fully closed = nothing in the DOM

  /* Reduced motion: no travel, no scaling, no blur, no stagger — just a fade. */
  const enterMs = reduceMotion ? POPUP_REDUCED_MS : POPUP_ENTER_MS;
  const exitMs = reduceMotion ? POPUP_REDUCED_MS : POPUP_EXIT_MS;
  const blur = visible && !reduceMotion ? "blur(6px)" : "blur(0px)";

  const backdropStyle: React.CSSProperties = {
    transitionProperty: "opacity, backdrop-filter",
    transitionDuration: `${visible ? enterMs : exitMs}ms`,
    transitionTimingFunction: visible ? "ease-out" : "ease-in",
    backdropFilter: blur,                   // the one non-compositor property we animate
    WebkitBackdropFilter: blur,             // Safari still wants the prefix
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.n0,
    transitionProperty: "opacity, transform, scale, translate",
    transitionDuration: `${visible ? enterMs : exitMs}ms`,
    transitionTimingFunction: visible && !reduceMotion ? POPUP_ENTER_EASE : visible ? "ease-out" : "ease-in",
  };

  /* Two different resting looks: far away before arriving, close by when leaving. */
  const cardRest = reduceMotion
    ? "opacity-0"
    : entered
      ? "opacity-0 scale-[0.96] translate-y-2"
      : "opacity-0 scale-[0.9] translate-y-7";

  /* One formula instead of nine hand-written delays: row i waits 50ms longer than row i-1. */
  const rowStyle = (i: number): React.CSSProperties => ({
    transitionProperty: "opacity, transform, translate",
    transitionDuration: `${reduceMotion ? POPUP_REDUCED_MS : POPUP_ROW_MS}ms`,
    transitionTimingFunction: POPUP_ROW_EASE,
    transitionDelay: entered && !reduceMotion ? `${POPUP_ROW_START_MS + i * POPUP_ROW_STAGGER_MS}ms` : "0ms",
  });
  const rowClass = entered ? "opacity-100 translate-y-0" : `opacity-0 ${reduceMotion ? "" : "translate-y-3"}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      {/* Backdrop — sits behind the card and closes on click. */}
      <div
        className={`absolute inset-0 bg-black/50 ${visible ? "opacity-100" : "opacity-0"}`}
        style={backdropStyle}
        onClick={onClose}
      />

      <div
        ref={cardRef}
        className={`relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 shadow-2xl ${visible ? "opacity-100 scale-100 translate-y-0" : cardRest}`}
        /* Only compositor-friendly properties — never width/height/top/left. */
        style={cardStyle}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Mbyll"
          className="absolute right-4 top-4 transition-colors hover:opacity-70"
          style={{ color: C.n500 }}
        >
          <X size={20} />
        </button>

        {sent ? (
          /* Thank-you state: same card, different contents. */
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: C.brandLight, width: 56, height: 56 }}>
              <Check size={28} style={{ color: C.brand }} />
            </div>
            <h2 id="popup-title" className="text-xl font-bold mb-2" style={{ color: C.n900 }}>Faleminderit!</h2>
            <p className="text-sm mb-6" style={{ color: C.n600 }}>Aplikimi juaj u regjistrua. Do t'ju kontaktojmë së shpejti.</p>
            <PrimaryBtn onClick={onClose}>Mbyll</PrimaryBtn>
          </div>
        ) : (
          <>
            {/*
              Rows 0-8: same classes, only the delay inside rowStyle(i) differs. Row 0 was
              an "Apliko tani" overline; it is gone, and the remaining indices are left
              alone rather than shifted down — they only feed the stagger delay, so the
              entrance now begins one 50ms step later and nothing else changes.
            */}
            <h2 id="popup-title" className={`text-xl font-bold mb-1 ${rowClass}`} style={{ color: C.n900, ...rowStyle(1) }}>Fillo rrugëtimin tënd</h2>
            <p className={`text-sm mb-5 ${rowClass}`} style={{ color: C.n600, ...rowStyle(2) }}>Plotëso të dhënat dhe ekipi ynë të kontakton.</p>

            {/* noValidate: we run our own Albanian validation instead of the browser's. */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <div className={rowClass} style={rowStyle(3)}>
                <FormField label="Emri *" value={emri} onChange={setEmri} placeholder="Emri juaj" />
              </div>
              <div className={rowClass} style={rowStyle(4)}>
                <FormField label="Mbiemri *" value={mbiemri} onChange={setMbiemri} placeholder="Mbiemri juaj" />
              </div>

              {/* Own <select>: shared FormSelect hard-codes a different placeholder. */}
              <div className={rowClass} style={rowStyle(5)}>
                <label htmlFor="popup-drejtimi" className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>Drejtimi *</label>
                <select
                  id="popup-drejtimi"
                  value={drejtimi}
                  onChange={(e) => setDrejtimi(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none"
                  style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: drejtimi ? C.n800 : C.n400, height: 52 }}
                  onFocus={(e) => (e.target.style.borderColor = C.brand)}
                  onBlur={(e) => (e.target.style.borderColor = C.n300)}
                >
                  <option value="" disabled>Zgjedh drejtimin</option>
                  {POPUP_DREJTIMET.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className={rowClass} style={rowStyle(6)}>
                <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="email@shembull.com" />
              </div>
              <div className={rowClass} style={rowStyle(7)}>
                <FormField label="Numri i telefonit" type="tel" value={telefoni} onChange={(v) => setTelefoni(sanitizePhone(v))} placeholder="+383 4X XXX XXX" />
              </div>

              {/* Renders only when `error` is a non-empty string. Not staggered:
                  it appears on submit, long after the entrance has finished. */}
              {error && <p className="text-sm" style={{ color: C.danger }}>{error}</p>}

              <div className={rowClass} style={rowStyle(8)}>
                <PrimaryBtn type="submit" className="w-full justify-center mt-1">{isSubmitting ? "Duke dërguar…" : "Apliko"}</PrimaryBtn>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   2.3 / 3.3 — HORIZONTAL APPLICATION BAND
   (shared component, pixel-identical on all pages)

   The fields are NOT hard-coded: they are fetched from
   `/api/public/forms/:slug` so an admin can add or reword a question in the
   dashboard without a redeploy. Only `name` / `email` / `phone` are fixed —
   the API promotes those three to real columns and always requires them, and
   they are reserved names a form field may not use.

   To point the band at a different form, edit APPLICATION_FORM_SLUG in
   `src/marketing/lib/forms.config.ts`.
══════════════════════════════════════════ */

/** Answer values as held in local state, before being shaped into the API payload. */
type AnswerValue = string | string[] | boolean;

const EMPTY_CONTACT = { name: "", email: "", phone: "" };

/** Field types that render as a plain <input>, with the HTML type to use. */
const TEXT_INPUT_TYPES: Partial<Record<PublicFormFieldType, string>> = {
  text: "text",
  email: "email",
  phone: "tel",
  number: "number",
  date: "date",
};

/** The blank answer for a field, used both on first render and after a successful send. */
function emptyAnswer(field: PublicFormField, preselected: string): AnswerValue {
  if (field.type === "checkbox") return false;
  if (field.type === "multiselect") return [];

  // Carry the programme the visitor arrived from into the first matching choice
  // field, so /programim pre-selects "Zhvillues i Ueb-it..." exactly as before.
  if (preselected && (field.type === "select" || field.type === "radio")) {
    const match = field.options.find(
      (option) =>
        option.value.toLowerCase() === preselected.toLowerCase() ||
        option.label.toLowerCase() === preselected.toLowerCase(),
    );
    if (match) return match.value;
  }

  return "";
}

function blankAnswers(
  fields: readonly PublicFormField[],
  preselected: string,
): Record<string, AnswerValue> {
  return Object.fromEntries(fields.map((field) => [field.name, emptyAnswer(field, preselected)]));
}

function isBlank(value: AnswerValue): boolean {
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return value === false;
}

/**
 * Server-reported field errors, keyed for lookup by input.
 *
 * The API speaks two dialects: body-schema failures arrive as `body.email` (see the
 * validate middleware), answer failures as the bare field name. Stripping the prefix
 * lets one lookup serve both.
 */
function indexErrorDetails(details: readonly ApiErrorDetail[]): Record<string, string> {
  const byField: Record<string, string> = {};

  for (const detail of details) {
    if (!detail.field) continue;
    byField[detail.field.replace(/^body\./, "")] = detail.message;
  }

  return byField;
}

/**
 * Label + help text + error wrapper for one input.
 *
 * Deliberately declared at module scope, NOT inside the band. A component defined
 * inside another component gets a new function identity on every render, which makes
 * React unmount and remount its whole subtree — the visible symptom being an input
 * that loses focus after every single keystroke.
 */
function ApplyFieldShell({
  name,
  label,
  required,
  helpText,
  error,
  wide = false,
  children,
}: {
  name: string;
  label: string;
  required: boolean;
  helpText?: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "md:col-span-2 xl:col-span-4" : ""}>
      <label htmlFor={`apliko-${name}`} className="block text-xs font-medium mb-1.5 text-white/85">
        {label}
        {required && <span className="text-white/60"> *</span>}
      </label>
      {children}
      {helpText && <p className="text-white/50 text-xs mt-1">{helpText}</p>}
      {error && (
        <p className="text-xs mt-1 font-medium" style={{ color: "#FFD9D9" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The same wrapper for `PublicApplicationForm` — the light card on a training's detail
 * page, rather than the band's dark gradient.
 *
 * At module scope for exactly the reason spelled out on `ApplyFieldShell` above, and it
 * takes `error` as a PROP for the same reason: reading `fieldErrors` from an enclosing
 * scope is what forces a component to be declared inside its parent in the first place.
 */
function PublicFormFieldShell({
  name,
  label,
  required,
  helpText,
  error,
  children,
}: {
  name: string;
  label: string;
  required: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="block text-sm font-medium mb-1.5" style={{ color: C.n700 }}>
        {label}
        {required && <span style={{ color: C.brand }}> *</span>}
      </label>
      {children}
      {helpText && <p className="text-xs mt-1" style={{ color: C.n500 }}>{helpText}</p>}
      {error && (
        <p className="text-xs mt-1 font-medium" style={{ color: C.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}

function HorizontalApplicationBand({ preselected = "" }: { preselected?: string }) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  /** Bumped to re-run the fetch when the visitor presses "Provo përsëri". */
  const [reloadKey, setReloadKey] = useState(0);

  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  /** Anti-spam honeypot: hidden from humans, irresistible to bots. */
  const [website, setWebsite] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Ignore a resolution that lands after unmount or after a newer fetch started.
    let active = true;
    setIsLoading(true);
    setLoadError("");

    getPublicForm(APPLICATION_FORM_SLUG)
      .then((loaded) => {
        if (!active) return;
        setForm(loaded);
        setAnswers(blankAnswers(loaded.fields, preselected));
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof PublicApiError && error.isNotFound
            ? "Formulari i aplikimit nuk është aktiv për momentin."
            : "Formulari nuk mund të ngarkohet për momentin.";
        setLoadError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [preselected, reloadKey]);

  const setAnswer = (name: string, value: AnswerValue) =>
    setAnswers((previous) => ({ ...previous, [name]: value }));

  const toggleMultiselect = (name: string, optionValue: string, checked: boolean) =>
    setAnswers((previous) => {
      const current = Array.isArray(previous[name]) ? (previous[name] as string[]) : [];
      return {
        ...previous,
        [name]: checked
          ? [...current, optionValue]
          : current.filter((value) => value !== optionValue),
      };
    });

  /**
   * Client-side required checks exist for fast feedback only — the server re-validates
   * every answer against the same field definitions and is the source of truth.
   */
  function findMissingRequired(): Record<string, string> {
    const missing: Record<string, string> = {};

    if (!contact.name.trim()) missing.name = "Emri është i detyrueshëm.";
    if (!contact.email.trim()) missing.email = "Email-i është i detyrueshëm.";
    if (!contact.phone.trim()) missing.phone = "Numri i telefonit është i detyrueshëm.";
    else if (!isValidPhone(contact.phone)) missing.phone = PHONE_ERROR;

    for (const field of form?.fields ?? []) {
      if (field.required && isBlank(answers[field.name] ?? "")) {
        missing[field.name] = `${field.label} është i detyrueshëm.`;
      } else if (field.type === "phone") {
        const answer = answers[field.name];
        if (typeof answer === "string" && answer.trim() && !isValidPhone(answer)) {
          missing[field.name] = PHONE_ERROR;
        }
      }
    }

    return missing;
  }

  /** Drop blanks so an untouched optional field is absent rather than an empty string. */
  function buildData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    for (const field of form?.fields ?? []) {
      const value = answers[field.name];
      if (value === undefined || isBlank(value)) continue;
      data[field.name] = value;
    }

    return data;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || isSubmitting) return;

    const missing = findMissingRequired();

    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      setSubmitError("Ju lutemi plotësoni fushat e detyrueshme.");
      return;
    }

    setFieldErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(form.slug, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data: buildData(),
        website,
      });

      setContact(EMPTY_CONTACT);
      setAnswers(blankAnswers(form.fields, preselected));
      setWebsite("");
      setSubmitted(true);
    } catch (error: unknown) {
      if (error instanceof PublicApiError) {
        setFieldErrors(indexErrorDetails(error.details));
        setSubmitError(
          error.isValidation
            ? "Disa përgjigje nuk janë të vlefshme. Kontrollo fushat e shënuara."
            : error.message,
        );
      } else {
        setSubmitError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 52,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.3)",
    backgroundColor: "#fff",
    color: C.n900,
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  const errorStyle: React.CSSProperties = { border: "1.5px solid #FFD9D9" };

  function renderField(field: PublicFormField) {
    const id = `apliko-${field.name}`;
    const invalid = Boolean(fieldErrors[field.name]);
    const style = invalid ? { ...inputStyle, ...errorStyle } : inputStyle;
    const value = answers[field.name];

    if (field.type === "checkbox") {
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <label
            htmlFor={id}
            className="inline-flex items-center gap-2.5 text-sm text-white cursor-pointer"
          >
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(e) => setAnswer(field.name, e.target.checked)}
              className="w-4 h-4 rounded accent-white"
            />
            <span className="text-white/85">{field.placeholder || "Po"}</span>
          </label>
        </ApplyFieldShell>
      );
    }

    if (field.type === "multiselect") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {field.options.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 text-sm text-white/85 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={(e) => toggleMultiselect(field.name, option.value, e.target.checked)}
                  className="w-4 h-4 rounded accent-white"
                />
                {option.label}
              </label>
            ))}
          </div>
        </ApplyFieldShell>
      );
    }

    if (field.type === "radio") {
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {field.options.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 text-sm text-white/85 cursor-pointer"
              >
                <input
                  type="radio"
                  name={id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => setAnswer(field.name, e.target.value)}
                  className="w-4 h-4 accent-white"
                />
                {option.label}
              </label>
            ))}
          </div>
        </ApplyFieldShell>
      );
    }

    if (field.type === "select") {
      const selected = typeof value === "string" ? value : "";
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
        >
          <select
            id={id}
            value={selected}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            style={{ ...style, color: selected ? C.n900 : "#999", appearance: "none" }}
          >
            <option value="">{field.placeholder || "Zgjidh..."}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </ApplyFieldShell>
      );
    }

    if (field.type === "textarea") {
      return (
        <ApplyFieldShell
          key={field.name}
          name={field.name}
          label={field.label}
          required={field.required}
          helpText={field.helpText}
          error={fieldErrors[field.name]}
          wide
        >
          <textarea
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            style={{ ...style, height: "auto", padding: "14px 16px", resize: "vertical" }}
          />
        </ApplyFieldShell>
      );
    }

    return (
      <ApplyFieldShell
        key={field.name}
        name={field.name}
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        error={fieldErrors[field.name]}
      >
        <input
          id={id}
          type={TEXT_INPUT_TYPES[field.type] ?? "text"}
          value={typeof value === "string" ? value : ""}
          // An admin-defined `phone` question is validated server-side by the very same
          // rule as the built-in contact number, so it gets the same typing guard.
          onChange={(e) =>
            setAnswer(
              field.name,
              field.type === "phone" ? sanitizePhone(e.target.value) : e.target.value,
            )
          }
          placeholder={field.placeholder}
          style={style}
        />
      </ApplyFieldShell>
    );
  }

  function renderContactField(
    name: "name" | "email" | "phone",
    label: string,
    type: string,
    placeholder: string,
  ) {
    const invalid = Boolean(fieldErrors[name]);
    return (
      <ApplyFieldShell name={name} label={label} required error={fieldErrors[name]}>
        <input
          id={`apliko-${name}`}
          type={type}
          value={contact[name]}
          onChange={(e) =>
            setContact({
              ...contact,
              [name]: name === "phone" ? sanitizePhone(e.target.value) : e.target.value,
            })
          }
          placeholder={placeholder}
          autoComplete={name === "name" ? "name" : name === "email" ? "email" : "tel"}
          style={invalid ? { ...inputStyle, ...errorStyle } : inputStyle}
        />
      </ApplyFieldShell>
    );
  }

  const sortedFields = [...(form?.fields ?? [])].sort((a, b) => a.order - b.order);

  return (
    <section id="apliko" className="py-16">
      <div className="max-w-[1400px] mx-auto px-5">
        <div
          className="rounded-3xl px-10 md:px-16 py-14"
          style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20"><Check size={28} className="text-white" /></div>
              <h3 className="text-2xl font-bold text-white">Faleminderit! Aplikimi u dërgua.</h3>
              <p className="text-white/70">Do të të kontaktojmë brenda 48 orëve.</p>
              <button onClick={() => setSubmitted(false)} className="mt-2 px-6 py-2 rounded-full text-sm font-semibold text-white" style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}>Mbyll</button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
              {/* Left */}
              <div className="lg:w-[32%] shrink-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                  {form?.title || "Fillo rrugëtimin tënd sot"}
                </h2>
                <p className="text-white/70 text-sm">Apliko tani dhe stafi ynë do të të kontaktojë brenda 48 orëve.</p>
              </div>

              {/* Right — inputs, rendered from the form configured in the dashboard */}
              <div className="flex-1 w-full">
                {isLoading && (
                  <div className="flex flex-col gap-3" aria-live="polite">
                    <p className="text-white/70 text-sm">Duke ngarkuar formularin...</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl bg-white/20 animate-pulse" style={{ height: 52 }} />
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading && loadError && (
                  <div className="flex flex-col items-start gap-3" role="alert">
                    <p className="text-white font-medium">{loadError}</p>
                    <p className="text-white/60 text-sm">
                      Na kontakto në <span className="font-medium text-white/80">+383 (0)38 600 237</span> ose provo përsëri.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReloadKey((key) => key + 1)}
                      className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-all hover:bg-white/10"
                      style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}
                    >
                      Provo përsëri
                    </button>
                  </div>
                )}

                {!isLoading && !loadError && form && (
                  <form onSubmit={handleSubmit} noValidate>
                    {/*
                      The submit button is a CELL of this grid, not a row beneath it, so it
                      lands beside Telefoni on a wide screen and wraps with the fields on a
                      narrow one — one set of breakpoints governs the whole row.

                      `items-start` and the spacer above the button are what line it up.
                      Every field cell is label-then-input; the button has no label, so
                      without a stand-in for one it would ride up to the labels' line. A
                      spacer with the label's exact box (`text-xs` + `mb-1.5`) reserves that
                      height, which is steadier than bottom-aligning the row: a validation
                      message appearing under one field grows that cell, and an `items-end`
                      button would slide down with it.
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start mb-3">
                      {renderContactField("name", "Emri dhe mbiemri", "text", "Emri dhe mbiemri")}
                      {renderContactField("email", "Email", "email", "Email-i juaj")}
                      {renderContactField("phone", "Telefoni", "tel", "Numri i telefonit")}
                      {sortedFields.map(renderField)}

                      <div className="flex flex-col">
                        <span aria-hidden="true" className="hidden md:block text-xs font-medium mb-1.5 invisible">
                          &nbsp;
                        </span>
                        {/*
                          On hover the button dissolves INTO the panel it sits on: white
                          fill → the panel's own brand purple, purple label → white. The
                          border is what keeps it from disappearing altogether at that
                          point — without it the shape would simply stop existing against
                          an identical background. 300ms so it reads as a blend rather
                          than a flick, and `brightness-110` is gone: brightening a colour
                          that is mid-transition fights the transition.
                        */}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-8 font-semibold text-sm rounded-xl transition-colors duration-300 ease-out active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
                          style={{
                            height: 52,
                            backgroundColor: "#fff",
                            color: C.brand,
                            border: "1.5px solid #fff",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = C.brand;
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff";
                            e.currentTarget.style.color = C.brand;
                          }}
                        >
                          {isSubmitting ? "Duke dërguar..." : "Apliko këtu"}
                        </button>
                      </div>
                    </div>

                    {/* Honeypot: off-screen, not tabbable, invisible to assistive tech. */}
                    <input
                      type="text"
                      name="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                    />

                    {submitError && (
                      <p className="text-sm font-medium mb-3" style={{ color: "#FFD9D9" }} role="alert">
                        {submitError}
                      </p>
                    )}

                    {/*
                      Left on its own line now that the button has moved up into the grid.
                      Trying to keep it beside the button would put a paragraph of text in
                      a quarter-width cell; full width under the row reads far better and
                      needs no breakpoint of its own.
                    */}
                    <p className="text-white/50 text-xs">
                      Duke dërguar formularin, pranon kushtet e privatësisë. Do të kontaktohesh brenda 48 orëve.
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   PUBLIC APPLICATION FORM (light card)

   Used by the training detail page and by /forma/:slug. Fetches its own field
   definitions from the slug it is given, so a caller only has to know WHICH form.

   RELATIONSHIP TO `HorizontalApplicationBand`: both render the same dynamic field
   contract, but they are not one component with two skins. The band is a four-column
   strip inside a purple gradient on the home page; this is a single-column card on a
   white page. Merging them would mean a component whose every rule is conditional on a
   variant flag, which is harder to read than two focused ones.
══════════════════════════════════════════ */
function PublicApplicationForm({
  slug,
  trainingId,
  title,
}: {
  slug: string;
  /** Provenance, set only by a training's detail page. */
  trainingId?: string;
  title?: string;
}) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [website, setWebsite] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");

    getPublicForm(slug)
      .then((loaded) => {
        if (!active) return;
        setForm(loaded);
        setAnswers(blankAnswers(loaded.fields, ""));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof PublicApiError && error.isNotFound
            ? "Kjo formë nuk është aktive për momentin."
            : "Forma nuk mund të ngarkohet për momentin.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, reloadKey]);

  const setAnswer = (name: string, value: AnswerValue) =>
    setAnswers((previous) => ({ ...previous, [name]: value }));

  const toggleMultiselect = (name: string, optionValue: string, checked: boolean) =>
    setAnswers((previous) => {
      const current = Array.isArray(previous[name]) ? (previous[name] as string[]) : [];
      return {
        ...previous,
        [name]: checked
          ? [...current, optionValue]
          : current.filter((value) => value !== optionValue),
      };
    });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || isSubmitting) return;

    const missing: Record<string, string> = {};
    if (!contact.name.trim()) missing.name = "Emri është i detyrueshëm.";
    if (!contact.email.trim()) missing.email = "Email-i është i detyrueshëm.";
    if (!contact.phone.trim()) missing.phone = "Numri i telefonit është i detyrueshëm.";
    else if (!isValidPhone(contact.phone)) missing.phone = PHONE_ERROR;
    for (const field of form.fields) {
      if (field.required && isBlank(answers[field.name] ?? "")) {
        missing[field.name] = `${field.label} është i detyrueshëm.`;
      } else if (field.type === "phone") {
        const answer = answers[field.name];
        if (typeof answer === "string" && answer.trim() && !isValidPhone(answer)) {
          missing[field.name] = PHONE_ERROR;
        }
      }
    }

    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      setSubmitError("Ju lutemi plotësoni fushat e detyrueshme.");
      return;
    }

    const data: Record<string, unknown> = {};
    for (const field of form.fields) {
      const value = answers[field.name];
      if (value === undefined || isBlank(value)) continue;
      data[field.name] = value;
    }

    setFieldErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(form.slug, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data,
        website,
        // Omitted entirely when absent, so /forma/:slug keeps the original contract.
        ...(trainingId ? { trainingId } : {}),
      });

      setContact(EMPTY_CONTACT);
      setAnswers(blankAnswers(form.fields, ""));
      setWebsite("");
      setSubmitted(true);
    } catch (error: unknown) {
      if (error instanceof PublicApiError) {
        setFieldErrors(indexErrorDetails(error.details));
        setSubmitError(
          error.isValidation
            ? "Disa përgjigje nuk janë të vlefshme. Kontrollo fushat e shënuara."
            : error.message,
        );
      } else {
        setSubmitError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 52,
    borderRadius: 12,
    border: `1px solid ${C.n300}`,
    backgroundColor: C.n0,
    color: C.n900,
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
  };
  const errorBorder: React.CSSProperties = { border: `1.5px solid ${C.danger}` };

  function renderField(field: PublicFormField) {
    const id = `f-${field.name}`;
    const value = answers[field.name];
    const style = fieldErrors[field.name] ? { ...inputStyle, ...errorBorder } : inputStyle;
    const shell = {
      name: field.name,
      label: field.label,
      required: field.required,
      helpText: field.helpText,
      error: fieldErrors[field.name],
    };

    if (field.type === "checkbox") {
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <label htmlFor={id} className="inline-flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: C.n700 }}>
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(e) => setAnswer(field.name, e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: C.brand }}
            />
            {field.placeholder || "Po"}
          </label>
        </PublicFormFieldShell>
      );
    }

    if (field.type === "multiselect" || field.type === "radio") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {field.options.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ color: C.n700 }}>
                <input
                  type={field.type === "radio" ? "radio" : "checkbox"}
                  name={id}
                  /* Carried on the element, not just in the closure: without it the
                     rendered DOM has no value, which breaks native form semantics and
                     any assistive tech or test that selects an option by value. */
                  value={option.value}
                  checked={field.type === "radio" ? value === option.value : selected.includes(option.value)}
                  onChange={(e) =>
                    field.type === "radio"
                      ? setAnswer(field.name, option.value)
                      : toggleMultiselect(field.name, option.value, e.target.checked)
                  }
                  className="w-4 h-4"
                  style={{ accentColor: C.brand }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </PublicFormFieldShell>
      );
    }

    if (field.type === "select") {
      const selected = typeof value === "string" ? value : "";
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <select
            id={id}
            value={selected}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            style={{ ...style, color: selected ? C.n900 : C.n400 }}
          >
            <option value="">{field.placeholder || "Zgjidh..."}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </PublicFormFieldShell>
      );
    }

    if (field.type === "textarea") {
      return (
        <PublicFormFieldShell key={field.name} {...shell}>
          <textarea
            id={id}
            rows={5}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            placeholder={field.placeholder}
            style={{ ...style, height: "auto", padding: "14px 16px", resize: "vertical" }}
          />
        </PublicFormFieldShell>
      );
    }

    return (
      <PublicFormFieldShell key={field.name} {...shell}>
        <input
          id={id}
          type={TEXT_INPUT_TYPES[field.type] ?? "text"}
          value={typeof value === "string" ? value : ""}
          // An admin-defined `phone` question is validated server-side by the very same
          // rule as the built-in contact number, so it gets the same typing guard.
          onChange={(e) =>
            setAnswer(
              field.name,
              field.type === "phone" ? sanitizePhone(e.target.value) : e.target.value,
            )
          }
          placeholder={field.placeholder}
          style={style}
        />
      </PublicFormFieldShell>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl p-8" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }} aria-live="polite">
        <p className="text-sm" style={{ color: C.n500 }}>Duke ngarkuar formularin...</p>
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ height: 52, backgroundColor: C.n100 }} />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="rounded-2xl p-8" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }} role="alert">
        <p className="font-medium mb-1" style={{ color: C.n900 }}>{loadError}</p>
        <p className="text-sm mb-4" style={{ color: C.n500 }}>
          Na kontakto në +383 (0)38 600 237 ose provo përsëri.
        </p>
        <SecondaryBtn onClick={() => setReloadKey((k) => k + 1)}>Provo përsëri</SecondaryBtn>
      </div>
    );
  }

  /*
    TERMINAL by design — there is deliberately no way back to a blank form from here.
    A "send another" button on a success screen invites the same person to apply twice,
    and every accidental double-tap lands in the dashboard inbox as a lead an operator
    then has to recognise as a duplicate and dismiss. Someone who genuinely needs to
    apply a second time can reload the page; that is a deliberate act, not a stray click.
  */
  if (submitted) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center text-center gap-3" style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.brandSoft }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brand }}>
          <Check size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-bold" style={{ color: C.n900 }}>Faleminderit! Aplikimi u dërgua.</h3>
        <p className="text-sm" style={{ color: C.muted }}>Do të të kontaktojmë brenda 48 orëve.</p>
      </div>
    );
  }

  const sorted = [...form.fields].sort((a, b) => a.order - b.order);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl p-6 md:p-8"
      style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}
    >
      <h3 className="text-xl font-bold mb-1" style={{ color: C.n900 }}>{title ?? form.title}</h3>
      <p className="text-sm mb-6" style={{ color: C.n500 }}>
        Plotëso të dhënat dhe stafi ynë do të të kontaktojë brenda 48 orëve.
      </p>

      <div className="flex flex-col gap-4">
        <PublicFormFieldShell name="name" label="Emri dhe mbiemri" required error={fieldErrors.name}>
          <input
            id="f-name"
            type="text"
            autoComplete="name"
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            style={fieldErrors.name ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFormFieldShell>
        <PublicFormFieldShell name="email" label="Email" required error={fieldErrors.email}>
          <input
            id="f-email"
            type="email"
            autoComplete="email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            style={fieldErrors.email ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFormFieldShell>
        <PublicFormFieldShell name="phone" label="Numri i telefonit" required error={fieldErrors.phone}>
          <input
            id="f-phone"
            type="tel"
            autoComplete="tel"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: sanitizePhone(e.target.value) })}
            style={fieldErrors.phone ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFormFieldShell>

        {sorted.map(renderField)}
      </div>

      {/* Honeypot: off-screen, not tabbable, hidden from assistive tech. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      {submitError && (
        <p className="text-sm font-medium mt-4" style={{ color: C.danger }} role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-6">
        <PrimaryBtn type="submit" className={isSubmitting ? "opacity-70" : ""}>
          {isSubmitting ? "Duke dërguar..." : "Dërgo aplikimin"}
        </PrimaryBtn>
        <p className="text-xs mt-3" style={{ color: C.n400 }}>
          Duke dërguar formularin, pranon kushtet e privatësisë.
        </p>
      </div>
    </form>
  );
}

/* ── ROTATING HEADLINE ── */
function RotatingWord({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => (i + 1) % words.length); setVisible(true); }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, [words]);

  /* md+: text-[0.78em] shrinks the phrase enough that the longest one ("siguri
     kibernetike.") fits the column, nowrap guarantees one line, and min-h
     1.25em reserves exactly that one line so nothing below can shift.
     Below md the column is too narrow for one line, so it may wrap and min-h
     2.5em reserves two. All em-based, so both breakpoints stay in sync.
     align-top makes the reserved height independent of baseline alignment. */
  return (
    <span
      className="inline-block align-top transition-all duration-300 min-h-[2.5em] md:min-h-[1.25em] md:whitespace-nowrap md:text-[0.90em]"
      style={{ color: C.brand, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)", minWidth: 280 }}
    >
      {words[idx]}
    </span>
  );
}

/* ── SUCCESS CAROUSEL ── */
interface StudentPhoto {
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

const STUDENT_PHOTOS: readonly StudentPhoto[] = [
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

function SuccessCarousel() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % STUDENT_PHOTOS.length), 3500);
    return () => clearInterval(t);
  }, []);
  const visible = [0, 1, 2].map((i) => STUDENT_PHOTOS[(current + i) % STUDENT_PHOTOS.length]);
  return (
    <div className="relative">
      <div className="flex gap-6">
        {visible.map((photo, i) => (
          /* `relative` is the only change to the frame itself — the caption below is
             positioned against it. Rounding, aspect and sizing are untouched, so a card
             that carries its own name and a plain photo that gets a drawn one are the
             same shape on the page. */
          <div key={i} className="relative flex-1 rounded-2xl overflow-hidden aspect-[16/9]" style={{ backgroundColor: C.n100 }}>
            {/* The name is the alt text on every slide, including the cards that show it
                in the artwork: a screen reader cannot read text baked into a PNG, so
                without this the whole carousel announces as nine unlabelled images. */}
            <img src={photo.src} alt={photo.name} className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: photo.imgPosition }} />
            {/* Drawn ONLY for plain photographs. Every card in the current set already has
                its name set into the graphic, so this branch renders nothing today — it is
                here so that dropping in an unbranded photo later still gets a label, and
                so nobody is tempted to add a blanket overlay that would double the name on
                the eight cards that already carry one. The gradient is what keeps the text
                readable over an unknown photo. */}
            {!photo.nameInImage && (
              <div
                className="absolute inset-x-0 bottom-0 px-4 pt-8 pb-3"
                style={{ background: "linear-gradient(to top, rgba(17,17,19,0.75), rgba(17,17,19,0))" }}
              >
                <p className="text-sm font-semibold leading-snug" style={{ color: C.n0 }}>{photo.name}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setCurrent((c) => (c - 1 + STUDENT_PHOTOS.length) % STUDENT_PHOTOS.length)} className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md" style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}>
          <ChevronLeft size={20} style={{ color: C.n700 }} />
        </button>
        <div className="flex gap-2">
          {STUDENT_PHOTOS.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)} aria-label={`Shko te fotoja ${i + 1}`} className="relative after:absolute after:content-[''] after:-inset-[18px] transition-all rounded-full" style={{ width: i === current ? 24 : 8, height: 8, backgroundColor: i === current ? C.brand : C.n300 }} />
          ))}
        </div>
        <button onClick={() => setCurrent((c) => (c + 1) % STUDENT_PHOTOS.length)} className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md" style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}>
          <ChevronRight size={20} style={{ color: C.n700 }} />
        </button>
      </div>
    </div>
  );
}

/* ── TRAINING CARD ── */

/* ── ARTICLE CARD ── */
/**
 * A card in the /lajme grid.
 *
 * A real `<Link>` rather than a `div` with an onClick, which is what this was while the
 * feed was mock data: the card is a navigation, so it must be middle-clickable,
 * keyboard-reachable and readable by a screen reader as a link.
 *
 * There is no category chip because `Post` has no category column — see the note on
 * PageLajme. Showing an invented one would be the card lying about the data.
 */
function ArticleCard({ post }: { post: PostCardData }) {
  return (
    <Link
      to={`/lajme/${post.slug}`}
      className="block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group"
      style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}
    >
      <div className="aspect-[16/9] overflow-hidden" style={{ backgroundColor: C.n100 }}>
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: C.brandSoft }} />
        )}
      </div>
      <div className="p-5">
        <h4 className="text-sm font-semibold mb-2 leading-snug line-clamp-2" style={{ color: C.n900 }}>{post.title}</h4>
        {post.excerpt && (
          <p className="text-xs mb-3 leading-relaxed line-clamp-3" style={{ color: C.muted }}>{post.excerpt}</p>
        )}
        <p className="text-xs" style={{ color: C.n400 }}>{formatPostDate(post.createdAt)}</p>
      </div>
    </Link>
  );
}

/* ── PERSON CARD ── */
function PersonCard({
  person,
  nameOnly = false,
  imgPosition = "center 50%",
}: {
  person: { name: string; role: string; city: string; imgUrl?: string };
  /**
   * Photo + name only: no role line, no city pill, no LinkedIn button, and a slightly
   * shorter portrait so the card does not carry the whitespace those three used to fill.
   *
   * A flag rather than a second component, and OFF by default, because this card is
   * shared: /ekipi opts in, /ligjërueit does not and keeps its role and city exactly as
   * they are. Editing the markup directly would have silently stripped that page too.
   */
  nameOnly?: boolean;
  /**
   * Which slice of the portrait survives the crop. Second number is vertical — raise it to
   * push the image DOWN. Worth reaching for here more than anywhere else on the site: this
   * frame is a tall 4:5 (or 6:7) and headroom varies wildly between photos, so a face that
   * sits high in one shot and low in another cannot both be right at the default centre.
   */
  imgPosition?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}>
      <div className={`${nameOnly ? "aspect-[6/7]" : "aspect-[4/5]"} overflow-hidden`} style={{ backgroundColor: C.n100 }}>
        {person.imgUrl ? <img src={person.imgUrl} alt={person.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: imgPosition }} /> : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: C.brandSoft }}><Users size={36} style={{ color: C.p300 }} /></div>}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-sm" style={{ color: C.n900 }}>{person.name}</h4>
        {/*
          Not rendered at all when `nameOnly` — not hidden with CSS. A `display: none`
          role would still be in the DOM for a screen reader to read out and for a
          "find on page" to match, which is not "removed", it is just invisible.
        */}
        {!nameOnly && (
          <>
            <p className="text-xs mt-0.5 mb-3" style={{ color: C.n500 }}>{person.role}</p>
            {/* The LinkedIn button that used to sit opposite the city chip is gone: it had
                no href and no onClick on any card, so it was a control that looked
                interactive and did nothing. The chip now owns the row on its own. */}
            <div className="flex items-center">
              <MetaChip>{person.city}</MetaChip>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
const HERO_PARTNERS: readonly { name: string; src: string | null }[] = [
  { name: "USAID", src: heroPartner30 },
  { name: "Helvetas", src: heroPartner31 },
  { name: "WOW", src: heroPartner32 },
  { name: "KODE — Kosovo Digital Economy", src: heroPartner33 },
  { name: "Regional Challenge Fund", src: heroPartner34 },
  { name: "Virtual Innovation Consortium", src: heroPartner35 },
];

function PartnerLogoGrid() {
  return (
    /*
      Three across on anything but a phone, so six logos land as two clean rows. The
      column track this sits in is a fixed 520px, so dropping from four columns to three
      is what makes each card bigger — the freed width is divided among fewer cards
      rather than left as empty gap. Two across below `sm`, where three would leave each
      card too narrow for a wordmark.
    */
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {HERO_PARTNERS.map(({ name, src }) => (
        <div
          key={name}
          /*
            White cards on the hero's own `brandSoft`, not on the reference's dark purple
            panel: dropping a saturated block into this hero would fight the section it
            sits in. Same white-card-on-tinted-background pairing the rest of the site
            uses, so the grid reads as part of the page rather than pasted onto it.

            Logos sit at full colour and opacity, and hover is a scale-up and nothing
            else — no lift, no shadow — matching the marquee cards elsewhere on the site.
          */
          className="aspect-[3/2] rounded-xl flex items-center justify-center p-3 transition-transform duration-200 hover:scale-105"
          style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
        >
          {src ? (
            <img src={src} alt={name} loading="lazy" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs font-semibold text-center leading-tight" style={{ color: C.n400 }}>
              {name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── PROJECT CARD ── */
function ProjectCard({ project, to }: { project: { title: string; partner: string; desc: string }; to: string }) {
  const navigate = useNavigate();
  /*
    No partner badge. It used to sit above the title as a `brandLight` pill; removing the
    element rather than hiding it is what lets the title rise into the space — the card is
    a flex column with `gap-4`, so a hidden-but-present child would still cost one gap.
    `project.partner` is still carried in the data and still shown on the detail page.
  */
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }} onClick={() => navigate(to)}>
      <h4 className="text-base font-semibold leading-snug" style={{ color: C.n900 }}>{project.title}</h4>
      <p className="text-sm flex-1 line-clamp-2" style={{ color: C.n500 }}>{project.desc}</p>
      <GhostBtn>Shiko projektin</GhostBtn>
    </div>
  );
}

/* ══════════════════════════════════════════
   PART 2 — HOME PAGE
══════════════════════════════════════════ */
function PageBallina() {
  const openApplyPopup = useApplyPopup();

  return (
    <PageWrapper>
      {/* Hero */}
      {/* overflow-hidden lets the photo bleed past the bottom edge and be cropped
          there, instead of spilling over the section below it. */}
      <section className="overflow-hidden" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1250px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[40fr_60fr] items-stretch" style={{ minHeight: 700 }}>

            {/* Left — flex column: spacer → text block → stats */}
            <div className="flex flex-col pb-12">
              {/* Top spacer: pushes text slightly above center */}
              <div style={{ flex: "0 0 16%" }} />

              {/* Text block: chips + headline + body + buttons */}
              <div>
               
                <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-5" style={{ color: C.n900, letterSpacing: "-0.015em" }}>
                Fillo karrierën tënde në<br />
                  <RotatingWord words={["programim.", "siguri kibernetike.", "teknologji."]} />
                </h1>
                <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: C.muted }}>
                  Institucion i arsimit të lartë profesional që ofron studime dyvjeçare të akredituara dhe të licencuara, me mësim praktik dhe ligjërues me përvojë nga industria.
                </p>
                <div className="flex flex-wrap gap-5">
                  {/* Was a <Link to="/#apliko">, which jumped to an anchor that does not
                      exist on this page. Now the same popup the navbar opens. */}
                  <PrimaryBtn onClick={openApplyPopup}>Apliko tani</PrimaryBtn>
                  <SecondaryBtn onClick={() => scrollToSection(BALLINA_PROGRAMS_ID)}>Shiko programet</SecondaryBtn>
                </div>
              </div>

              {/* Stats directly below buttons */}
              <div className="mt-8">
                <HeroStats />
              </div>
            </div>

            {/* Right — image pulled back within section, slightly smaller */}
            
              <div
  className="self-stretch hidden lg:flex items-end justify-end"
  style={{ paddingLeft: 5, marginRight: "-12vw" }} /* Bleeds past the grid on the right */
>
  <img
    src={heroGraduates}
    alt="Studentë të diplomuar nga Cacttus Education"
    className="select-none pointer-events-none"
    style={{
      height: "auto",
      width: "160%", /* Landscape 908x611 — wider than the old portrait asset */
      maxHeight: 700,
      objectFit: "contain",
      display: "block", /* No drop-shadow: reads as one flat cut-out photo */
      marginBottom: -28, /* Stands on the section floor, cropped slightly below it */
    }}

/>
            </div>

          </div>
        </div>
      </section>

      {/* 2.1 — REDESIGNED STUDIME PROFESIONALE SECTION */}
      <StudimeProfesionaleSection />

      {/* Trajnime promo — 2.2 adds 4th box */}
      <TrajnimePromoSection />

      {/* Success stories carousel — unchanged */}
      <section className="py-24" style={{ backgroundColor: C.n50 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Histori suksesi</h2>
            <p className="text-lg" style={{ color: C.n500 }}>Studentët tanë, sot në industri.</p>
          </div>
          <SuccessCarousel />
        </div>
      </section>

      {/* 2.3 — HORIZONTAL APPLICATION BAND */}
      <HorizontalApplicationBand />
    </PageWrapper>
  );
}

/* 2.1 — Studime Profesionale section — three-band layout */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
const STUDIME_SECTION_IMG_POSITION = "center 50%";

function StudimeProfesionaleSection() {
  const navigate = useNavigate();

  return (
    /* `id` + `scroll-mt-28` make this the landing spot for the hero's "Shiko programet".
       The margin is what stops the sticky navbar covering this section's own top edge. */
    <section id={BALLINA_PROGRAMS_ID} className="py-24 scroll-mt-28" style={{ backgroundColor: C.n0, borderTop: `1px solid ${C.n200}` }}>
      <div className="max-w-[1200px] mx-auto px-5">

        {/* ── BAND 1: framed photo left · intro text right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">

          {/* Left — framed photo with blob + badge */}
          <div className="relative flex items-center justify-center">
            {/*
              The decorative blurred blob that used to sit here is gone. It was a 340px
              pale-purple ellipse with `blur(2px)`, absolutely positioned at top:10%/left:2%
              BEHIND the photo frame. Because the frame shrinks with the column but the blob
              did not shrink with it, on a phone the blob ended ~76px below the frame and
              bled into the heading underneath — the "broken shadow" that was reported.
              Depth now comes from the frame's own contained shadow instead.
            */}
{/* Photo frame */}
            <div
              className="relative z-10 overflow-hidden"
              style={{
                borderRadius: 28,
                border: `1.5px solid ${C.cardBorder}`,
                /* Contained: a short, tight drop shadow that stays under the card
                   instead of a 60px purple bloom that halos past its edges. */
                boxShadow: "0 6px 18px rgba(45,22,55,0.10), 0 2px 6px rgba(45,22,55,0.06)",
                maxWidth: 500,
                width: "100%",
                aspectRatio: "4/3",
              }}
            >
              <img
                src={studimePhoto}
                alt="Studentë në klasë"
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ objectPosition: STUDIME_SECTION_IMG_POSITION }}
              />
            </div>

            {/* Badge — top-right corner of frame, rotated slightly */}
            <div
              className="absolute z-20 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg"
              style={{
                top: "6%",
                right: "4%",
                border: `1px solid ${C.cardBorder}`,
                transform: "rotate(4deg)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
              }}
            >
              <GraduationCap size={15} style={{ color: C.brand }} />
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: C.n800 }}>Dy vite / diplomë</span>
            </div>
          </div>

          {/* Right — eyebrow + headline + supporting line + link */}
          <div>
            <Overline>STUDIME PROFESIONALE</Overline>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-snug" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
              Dy vite. Dy programe.<br />Karrierë e garantuar.
            </h2>
            <p className="text-base mb-8" style={{ color: C.muted }}>
              Zgjidh Programim ose Siguri Kibernetike dhe ndërto aftësi profesionale përmes mësimit praktik, projekteve reale dhe ligjëruesve që punojnë në industri. 
                
              Programet të përgatisin për certifikime ndërkombëtare dhe karrierë në tregun vendor e ndërkombëtar, duke përfshirë mundësitë për punë remote dhe freelance.
            </p>
          </div>
        </div>

        {/* ── BAND 2: two program cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {[
            {
              to: "/programim",
              Icon: Code,
              iconBg: C.brandLight,
              iconColor: C.brand,
              title: "Zhvillim i Ueb-it dhe Aplikacioneve Mobile",
              desc: "Ktheji idetë në produkte digjitale. Programi të përgatit me njohuri praktike për zhvillimin e faqeve ueb, aplikacioneve mobile dhe integrimin e Inteligjencës Artificiale (AI).",
              meta: ["2 vite · 4 semestra", "Diplomë profesionale", "Akredituar nga MASHT"],
            },
            {
              to: "/siguria",
              Icon: Shield,
              iconBg: C.brandLight,
              iconColor: C.brand,
              title: "Siguri Kibernetike",
              desc: "Hyr në botën e mbrojtjes digjitale. Programi të përgatit për mbrojtjen e sistemeve dhe rrjeteve, analizimin e rreziqeve dhe përdorimin e AI-së në identifikimin e kërcënimeve kibernetike.",
              meta: ["2 vite · 4 semestra", "Diplomë profesionale", "Akredituar nga MASHT"],
            },
          ].map(({ to, Icon, iconBg, iconColor, title, desc, meta }) => (
            <div
              key={to}
              onClick={() => navigate(to)}
              className="cursor-pointer group rounded-2xl p-8 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                  <Icon size={22} style={{ color: iconColor }} />
                </div>
                <h3 className="text-lg font-bold leading-snug pt-1" style={{ color: C.n900 }}>{title}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2" style={{ borderTop: `1px solid ${C.n100}` }}>
                {meta.map((m) => (
                  <span key={m} className="text-xs" style={{ color: C.n500 }}>{m}</span>
                ))}
              </div>
              {/*
                The site's own SecondaryBtn rather than a bespoke link: same pill shape,
                padding, brand outline and hover lift as "Shiko programet" on the
                homepage. The whole card is already clickable, so this needs no onClick —
                the click bubbles up to the card's navigate().
              */}
              <div className="mt-auto pt-1">
                <SecondaryBtn>
                  Mëso më shumë
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </SecondaryBtn>
              </div>
            </div>
          ))}
        </div>

        {/* ── BAND 3: four feature chip-cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Award,    label: "20+ vite",         sub: "Përvojë në edukim profesional",    bg: C.brandLight,  color: C.brand },
            { icon: Laptop,   label: "Diplomë e Akredituar",          sub: "120 kredi",        bg: C.brandLight,     color: C.brand },
            { icon: Users,    label: "Mësim Praktik", sub: "Projekte reale, mësim praktik", bg: C.brandLight,     color: C.brand },
            { icon: Briefcase,label: "Mbështetje Karriere",     sub: "Mundësi reale punësimi",  bg: C.brandLight,     color: C.brand },
          ].map(({ icon: Icon, label, sub, bg, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl"
              style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight" style={{ color: C.n900 }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: C.n400 }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* 2.2 — Trajnime promo, live from the catalogue API */

/*
  A home card carries an ICON; the API carries no such field, and `category` is the only
  thing on the payload that could reasonably pick one. Hence this map. Every icon in it is
  already imported for use elsewhere in the file, so naming them here costs no bundle.

  Read through `?? BookOpen` at the call site rather than indexed straight — `category`
  arrives over the network, so a category added server-side before this file learns its
  icon would hand us `undefined`, and React throws on rendering that as a component,
  taking the whole band down over a missing 18px glyph. Same guard `TrainingStatusBadge`
  applies to an unknown status.
*/
const TRAINING_CATEGORY_ICONS: Record<TrainingCategory, LucideIcon> = {
  PROGRAMIM: Code,
  ADMINISTRIM: Monitor,
  SIGURI_KIBERNETIKE: Shield,
  MARKETING_DIZAJN: Laptop,
  MENAXHIM_PROJEKTEVE: Briefcase,
  AFTESI_TE_BUTA: Users,
};

/*
  How many cards the band shows. The API already returns the operator's OWN ordering
  (`order` asc, then newest first — see listPublicTrainings), so slicing the front off
  that list means the four shown are the four the dashboard was told to put first. This
  deliberately does not re-sort: sorting here would silently override an ordering an
  admin set by hand.
*/
const HOME_TRAININGS_LIMIT = 4;

/* Shared by the real card and its loading placeholder, so the two can never drift out of
   the same box. */
const HOME_TRAINING_CARD_STYLE = {
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
} as const;

const HOME_SKELETON_BAR = { backgroundColor: "rgba(255,255,255,0.10)" } as const;

function TrajnimePromoSection() {
  const [trainings, setTrainings] = useState<readonly TrainingCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);

  /*
    The same fetch shape /trajnime uses, minus the filters call — this band has no chips
    to derive. The `active` flag is what makes it safe: a visitor who clicks away mid
    request unmounts this component, and without the guard the `.then` would still write
    state into it.

    `status: "ACTIVE"` narrows SERVER-side, so a finished training never travels to the
    landing page at all. That is the split: the home band is a short "you can still join
    this" list, while /trajnime stays the full catalogue and badges COMPLETED rather than
    hiding it.
  */
  useEffect(() => {
    let active = true;

    getPublicTrainings({ status: "ACTIVE" })
      .then((items) => {
        if (active) setTrainings(items.slice(0, HOME_TRAININGS_LIMIT));
      })
      .catch(() => {
        // No error message and no retry button, unlike the catalogue. This is a promo
        // band on the landing page: a visitor who cannot see it has lost a shortcut, not
        // the content, and "Shiko të gjitha trajnimet" below still works. Shouting about
        // a backend fault on the front page would cost more than it explains.
        if (active) setHasFailed(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  /* Nothing to show and nothing still coming means the grid is dropped entirely — the
     heading, the paragraph and the button stay. A grid of empty boxes reads as broken;
     a section with no grid just reads as a section. */
  const showGrid = isLoading || (!hasFailed && trainings.length > 0);

  return (
    <section className="py-24" style={{ backgroundColor: C.p900 }}>
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="mb-10">
          <Overline>TRAJNIME PROFESIONALE</Overline>
          <h2 className="text-4xl font-bold mb-3 text-white" style={{ letterSpacing: "-0.01em" }}>
            Trajnime profesionale për karrierën që synoni!
          </h2>
          <p className="text-lg max-w-x2" style={{ color: "rgba(255,255,255,0.65)" }}>
            Zhvilloni aftësitë që kërkon tregu i punës përmes kurrikulave bashkëkohore, mësimit praktik dhe instruktorëve me përvojë nga industria.
          Zgjidhni trajnime intensive në programim, siguri kibernetike, dizajn dhe menaxhim projektesh, online, në klasë ose në format hibrid.
          </p>
        </div>

        {/* 4-column grid (2×2 tablet, 1col mobile). Fewer than four live trainings simply
            fills fewer tracks — the grid is not padded out with empties. */}
        {showGrid && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {isLoading
              ? /* Placeholders, not a spinner: the band keeps its height while the request
                   is in flight, so the page below does not jump when cards land.
                   `aria-hidden` because there is nothing here to read out yet. */
                Array.from({ length: HOME_TRAININGS_LIMIT }, (_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="p-5 rounded-2xl flex flex-col gap-3 animate-pulse"
                    style={HOME_TRAINING_CARD_STYLE}
                  >
                    <div className="w-10 h-10 rounded-xl" style={HOME_SKELETON_BAR} />
                    <div>
                      <div className="h-3.5 rounded w-2/3" style={HOME_SKELETON_BAR} />
                      <div className="h-3 rounded w-full mt-2" style={HOME_SKELETON_BAR} />
                    </div>
                    <div className="h-3 rounded w-1/2 mt-auto" style={HOME_SKELETON_BAR} />
                    <div className="h-3 rounded w-1/3" style={HOME_SKELETON_BAR} />
                  </div>
                ))
              : trainings.map((t) => {
                  const Icon = TRAINING_CATEGORY_ICONS[t.category] ?? BookOpen;

                  /* The slot the hard-coded version filled with a marketing sentence. A
                     card payload carries no description — that field lives on the DETAIL
                     endpoint, and fetching it would mean four extra round-trips on the
                     landing page for one line of text. So the line shows two facts the
                     card already has, with the same "—" the catalogue card uses for an
                     unset field. */
                  /* Joined from the parts that EXIST: an online training has no city, and
                     "Enes Sermaxhaj · —" reads as missing data rather than as a training
                     that simply has no location. The format is already on the meta line. */
                  const desc = [t.instructor, t.city].filter(Boolean).join(" · ") || "—";
                  const meta = `${t.hours === null ? "—" : t.hours} orë · ${TRAINING_FORMAT_LABELS[t.format]}`;

                  return (
                    <div
                      key={t.slug}
                      className="p-5 rounded-2xl flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-lg"
                      style={HOME_TRAINING_CARD_STYLE}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.brand }}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{t.title}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</p>
                      </div>
                      <p className="text-xs mt-auto" style={{ color: "rgba(255,255,255,0.4)" }}>{meta}</p>
                      {/* `applyUrl` comes from the API rather than being built here, so the
                          /trajnime/:slug path shape stays owned by one side. Until now this
                          button had no onClick and navigated nowhere. */}
                      <Link to={t.applyUrl}>
                        <GhostBtn className="text-white/70 hover:text-white">Shiko trajnimin</GhostBtn>
                      </Link>
                    </div>
                  );
                })}
          </div>
        )}

        <Link to="/trajnime"><PrimaryBtn>Shiko të gjitha trajnimet</PrimaryBtn></Link>
      </div>
    </section>
  );
}

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
type MarqueeLogo = string | { name: string; src: string };

/* Order is deliberate and matches the delivered file numbering — keep 36 first, 44 last. */
const PARTNER_LOGOS: readonly MarqueeLogo[] = [
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
   │ 2. `import partnerX from "../imports/<file>";` at the top of this file.     │
   │ 3. Append `{ name: "Company", src: partnerX }` below.                       │
   │ Both marquee rows are built from this array's length, so nothing else needs │
   │ touching — the loop stays seamless at any count.                            │
   └─────────────────────────────────────────────────────────────────────────────┘

   `name` is what screen readers announce, since the artwork itself carries no text they
   can reach. The delivered files were 4:5 portrait canvases with the logo floating in the
   middle and 70-85% of the height empty, which renders unreadably small in a 180x90 card;
   each file's root viewBox was tightened onto its own artwork so `object-contain` has a
   box worth fitting. The embedded artwork is untouched. */
const PARTNER_LOGO_IMAGES: readonly MarqueeLogo[] = [
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
const TESTIMONIALS: readonly { quote: string; name: string; role: string; stars: number }[] = [
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

/**
 * The reviews as a carousel.
 *
 * Driven by `embla-carousel-react`, which the project already depends on — it is what
 * `components/ui/carousel.tsx` wraps, though that shadcn wrapper is imported nowhere and
 * its default button styling is not this site's. So the hook is used directly and the
 * controls below are the ones `SuccessCarousel` already puts on the homepage: the same
 * 44px round arrows and the same dot that stretches when active. New library: none.
 *
 * Embla rather than the index-counter `SuccessCarousel` uses, because five reviews want
 * dragging: embla gives touch-swipe and trackpad scroll for free, and a counter cannot.
 */
function TestimonialsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true, containScroll: "trimSnaps" });
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => setSelected(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi]);

  return (
    <section className="py-20" style={{ backgroundColor: C.n0 }}>
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Çfarë thonë pjesëmarrësit</h2>
        <p className="text-lg mb-10" style={{ color: C.n500 }}>
          Përvoja të vërteta nga njerëz që kanë përfunduar trajnimet tona.
        </p>

        {/*
          `overflow-hidden` on the viewport and a flex track inside is embla's required
          shape — it moves the track, and the viewport is what crops it. The negative
          `-ml-5` plus `pl-5` on each slide is the standard way to gap slides without the
          first one starting indented.
        */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                /* `basis-*` is what decides how many are on screen; `min-w-0` stops a long
                   quote from forcing a slide wider than its share. */
                className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3 pl-5"
              >
                <figure
                  className="h-full rounded-2xl p-6 flex flex-col gap-4"
                  style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.brandSoft }}
                >
                  {/*
                    The rating is spelled out for screen readers rather than left as five
                    decorative glyphs; the stars themselves are then hidden from them.
                  */}
                  <div className="flex gap-0.5" role="img" aria-label={`${t.stars} nga 5 yje`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={16}
                        aria-hidden="true"
                        style={{ color: i <= t.stars ? C.brand : C.n300 }}
                        fill={i <= t.stars ? C.brand : "none"}
                      />
                    ))}
                  </div>
                  <blockquote className="text-sm leading-relaxed grow" style={{ color: C.n700 }}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption>
                    <p className="text-sm font-semibold" style={{ color: C.n900 }}>{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.n500 }}>{t.role}</p>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>

        {/* Controls, styled exactly as SuccessCarousel's on the homepage. */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Dëshmia e mëparshme"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md"
            style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}
          >
            <ChevronLeft size={20} style={{ color: C.n700 }} />
          </button>

          {/* Dots come from embla's snap list, not from TESTIMONIALS.length: at three
              slides per view the last snaps stop short, so the counts differ. */}
          <div className="flex gap-2">
            {Array.from({ length: snapCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Shko te dëshmia ${i + 1}`}
                className="relative after:absolute after:content-[''] after:-inset-[18px] transition-all rounded-full"
                style={{ width: i === selected ? 24 : 8, height: 8, backgroundColor: i === selected ? C.brand : C.n300 }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Dëshmia tjetër"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md"
            style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}
          >
            <ChevronRight size={20} style={{ color: C.n700 }} />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * The endlessly scrolling band of partner logos.
 *
 * Not a carousel: there are no slides, no snap points and nothing to navigate, so embla
 * would be the wrong tool. It is one long flex row translated from 0 to -50% on a linear
 * loop. Both halves of that row hold the same logos in the same order, so the instant the
 * animation snaps back to 0 the pixels are identical and the seam is invisible — which is
 * why each row below is built by duplicating the set rather than listing it once.
 *
 * `rows` and `logos` both default to what every existing caller was already getting, so
 * adding them changed no page that does not pass them.
 */
function InfiniteLogoMarquee({
  logos = PARTNER_LOGOS,
  rows = 2,
}: {
  logos?: readonly MarqueeLogo[];
  /** 1 keeps only the leftward row — for sections where two bands are too heavy. */
  rows?: 1 | 2;
}) {
  const row1 = [...logos, ...logos];
  /* Row 2 is the same set rotated five along, so the two bands never show the same logo
     at the same x. Rotating still leaves two identical halves, so the loop stays seamless
     at any list length. */
  const row2 = [...logos.slice(5), ...logos, ...logos.slice(0, 5)];

  return (
    /*
      `py-1 -my-1` is headroom, not spacing: the rows sit flush against this box and it
      has to clip horizontally, so a card scaling up on hover would lose 2.25px off the
      top or bottom edge. The padding gives it room and the matching negative margin
      cancels it again, leaving the section's own layout exactly where it was.
    */
    <div className="marquee-wrap overflow-hidden relative py-1 -my-1">
      {/* Fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${C.n0}, transparent)` }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${C.n0}, transparent)` }} />

      {/* Row 1 — left */}
      <div className={`flex ${rows === 2 ? "mb-4" : ""}`}>
        <div className="marquee-left flex gap-4 shrink-0">
          {row1.map((logo, i) => (
            <LogoCard key={`r1-${i}`} logo={logo} />
          ))}
        </div>
      </div>

      {/* Row 2 — right */}
      {rows === 2 && (
        <div className="flex">
          <div className="marquee-right flex gap-4 shrink-0">
            {row2.map((logo, i) => (
              <LogoCard key={`r2-${i}`} logo={logo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LogoCard({ logo }: { logo: MarqueeLogo }) {
  const name = typeof logo === "string" ? logo : logo.name;
  const src = typeof logo === "string" ? null : logo.src;

  return (
    /*
      Logos sit at their own colour and opacity at rest — no grayscale, no dimming. The
      partners are the point of the section, so there is nothing to gain by hiding them
      until the pointer happens to land on one, and on touch there is no hover at all.

      Hover is a scale-up and nothing else: no lift, no shadow. `transition-transform`
      rather than `transition-all` so only the scale animates.
    */
    <div
      className="shrink-0 flex items-center justify-center rounded-xl transition-transform duration-200 hover:scale-105 cursor-default"
      style={{ width: 180, height: 90, border: `1px solid #EEE8EF`, backgroundColor: C.n0 }}
    >
      {src ? (
        /* `contain` inside a padded box: logos differ in aspect from 1:1 to 5:1, and this
           is what keeps the tall ones and the wide ones optically the same weight. */
        <img src={src} alt={name} loading="lazy" className="max-w-full max-h-full object-contain p-4" />
      ) : (
        <span className="text-xs font-semibold tracking-wide" style={{ color: C.n600 }}>{name}</span>
      )}
    </div>
  );
}

/* 3.1 — INTERACTIVE SEMESTER TABS */

/**
 * One course: [name, ECVET credits, contact hours].
 *
 * The credit figure is part of the DATA now. It used to be a literal `6 ECTS` inside the
 * row markup, which meant every course on every semester of both programmes claimed six
 * credits regardless of its real weight — the same shape of bug the "Çfarë do të mësosh"
 * descriptions had. The semester total in the panel header is summed from these rather
 * than hardcoded, so editing a course's credits keeps the badge honest by itself.
 */
type SemesterModule = readonly [name: string, ecvet: number, hours: number];
type Semester = { readonly sem: string; readonly modules: readonly SemesterModule[] };

/* ── /programim curriculum — EDIT COURSES HERE ── */
const SEM_PROGRAMIM: readonly Semester[] = [
  {
    sem: "Semestri 1",
    modules: [
      ["Gjuhë angleze për TI", 4, 80],
      ["Bazat e Ueb-it", 4, 80],
      ["Matematikë për shkencat kompjuterike", 6, 120],
      ["Bazat e TIK", 8, 160],
      ["Hyrje në programim", 8, 160],
    ],
  },
  {
    sem: "Semestri 2",
    modules: [
      ["Algoritmet dhe strukturat e të dhënave", 6, 120],
      ["Dizajnimi dhe zhvillimi i bazave të të dhënave", 8, 160],
      ["Programimi i Ueb-it interaktiv", 4, 80],
      ["Programimi i orientuar në objekte", 8, 160],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 3",
    modules: [
      ["Inxhinieria softuerike", 6, 120],
      ["Zhvillimi i Ueb-it", 7, 140],
      ["Zhvillimi i aplikacioneve mobile", 7, 140],
      ["Dizajni i ndërfaqes së përdoruesit dhe përdorshmëria", 6, 120],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 4",
    modules: [
      ["Zhvillimi i avancuar i Ueb-it", 7, 140],
      ["Zhvillimi i avancuar i aplikacioneve mobile", 7, 140],
      ["Hyrje në siguri kibernetike", 6, 120],
      ["Analiza dhe vizualizimi i të dhënave", 6, 120],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
];

/* ── /siguria curriculum — EDIT COURSES HERE ──
   Note the totals are NOT all 30: semester 3 sums to 29 and semester 4 to 31. That is
   the real programme, not a typo — and it is exactly why the panel badge is summed from
   these rows rather than printing a fixed "30". */
const SEM_SIGURIA: readonly Semester[] = [
  {
    sem: "Semestri 1",
    modules: [
      ["Gjuhë angleze për TI", 4, 80],
      ["Matematikë për shkencat kompjuterike", 6, 120],
      ["Bazat e TIK", 8, 160],
      ["Rrjetat Kompjuterike 1", 6, 120],
      ["Hyrje në programim", 6, 120],
    ],
  },
  {
    sem: "Semestri 2",
    modules: [
      ["Rrjetat Kompjuterike 2", 6, 120],
      ["Linux 1", 7, 140],
      ["Teknologjitë Cloud", 7, 140],
      ["Gjuhë skriptuese", 6, 120],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 3",
    modules: [
      ["Rrjetat Kompjuterike 3", 6, 120],
      ["Linux 2", 6, 120],
      ["Administrimi i bazave të të dhënave", 6, 120],
      ["Siguria e Informacionit", 7, 140],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 4",
    modules: [
      ["Virtualizimi", 6, 120],
      ["Siguria Kibernetike", 7, 140],
      ["Operacionet Kibernetike / Cyber Operations", 7, 140],
      ["Testimi i Sigurisë / Penetration Testing", 7, 140],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
];

function SemesterTabs({ semesters }: { semesters: typeof SEM_PROGRAMIM }) {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState(true);

  const select = (i: number) => {
    if (i === active) return;
    setFade(false);
    setTimeout(() => { setActive(i); setFade(true); }, 180);
  };

  const handleKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); }
    if (e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % semesters.length); }
    if (e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + semesters.length) % semesters.length); }
  };

  return (
    <div>
      {/* Progress rail + circles */}
      <div className="relative flex items-center justify-between mb-10 px-4">
        {/* Connector line background */}
        <div className="absolute left-8 right-8 top-4 h-0.5" style={{ backgroundColor: C.n200 }} />
        {/*
          Filled portion, measured against the RAIL SPAN rather than the whole container.

          This used to set `left: 32px`, `width: <pct>%` and `right: <pct>%` all at once.
          An absolutely positioned box cannot honour all three — CSS drops `right` — so the
          width was a percentage of the FULL container while the box already started 32px
          in. At the last step that resolves to `left: 32px` + `width: 100%`, i.e. 32px
          wider than its own container, which pushed roughly 12px past the viewport on a
          phone and produced the horizontal scroll. It also overshot the final circle by
          32px at every width, desktop included.

          The fix is to stop sizing this box at all. It now spans `left-8 right-8` — exactly
          the grey rail behind it — and the progress is drawn with `scaleX()` from
          `origin-left`. A scale can only ever shrink the box, so the fill is incapable of
          leaving the rail no matter how many steps there are or how narrow the screen is.

          It also has to be a transform rather than an animated width: `transition-all` on
          `width` could not interpolate between the two `calc()` expressions this used to
          produce, so the bar silently stayed at 0 and no progress was drawn at all
          (measured — setting the same value with `transition: none` rendered it correctly).
          Transforms interpolate on the compositor and have no such problem.
        */}
        <div
          className="absolute left-8 right-8 top-4 h-0.5 origin-left transition-transform duration-300"
          style={{ backgroundColor: C.brand, transform: `scaleX(${active / (semesters.length - 1)})` }}
        />

        {semesters.map((s, i) => (
          <div key={i} className="relative flex flex-col items-center gap-2 z-10">
            <button
              onClick={() => select(i)}
              onKeyDown={(e) => handleKey(e, i)}
              tabIndex={0}
              aria-label={s.sem}
              aria-pressed={i === active}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 focus:outline-none cursor-pointer"
              style={{
                backgroundColor: i === active ? C.brand : C.n0,
                color: i === active ? "#fff" : C.brand,
                border: i === active ? `2px solid ${C.brand}` : `2px solid #E4D3E6`,
                transform: i === active ? "scale(1.18)" : "scale(1)",
                boxShadow: i === active ? `0 0 0 4px rgba(130,54,133,0.18)` : "none",
              }}
            >
              {i + 1}
            </button>
            <span className="text-[11px] sm:text-xs font-medium whitespace-nowrap" style={{ color: i === active ? C.brand : C.n500 }}>
              {s.sem}
            </span>
          </div>
        ))}
      </div>

      {/* Curriculum panel */}
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{ border: `1px solid ${C.cardBorder}`, opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(8px)" }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: C.brandLight, borderBottom: `1px solid ${C.cardBorder}` }}>
          <span className="font-semibold" style={{ color: C.brandDark }}>{semesters[active].sem}</span>
          {/* Summed, not hardcoded: change a course's credits and this follows. */}
          <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: C.brand, color: "#fff" }}>
            {semesters[active].modules.reduce((total, [, ecvet]) => total + ecvet, 0)} ECVET
          </span>
        </div>

        {/* Module rows */}
        {semesters[active].modules.map(([name, ecvet, hours], i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-3.5 text-sm"
            style={{
              borderBottom: i < semesters[active].modules.length - 1 ? `1px solid ${C.n100}` : "none",
              backgroundColor: i % 2 === 0 ? C.n0 : "#FAF5FB",
            }}
          >
            <span className="font-medium" style={{ color: C.n800 }}>{name}</span>
            <span className="text-xs shrink-0 ml-4" style={{ color: C.n400 }}>{ecvet} ECVET · {hours} orë</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── PROGRAM PAGE TEMPLATE ── */
function ProgramPage({
  title, breadcrumbEnd, heroParagraph, whatCards, semesters, roles, preselected, imgUrl,
  planUrl,
  imgPosition = "center 20%",
}: {
  title: string; breadcrumbEnd: string; heroParagraph: string;
  /**
   * `description` is REQUIRED, not optional, and that is the point of this change: the
   * paragraph used to be a literal in the JSX below, so all six cards rendered the same
   * sentence no matter what their title said. Making it part of each card's data means a
   * card cannot be added without one — TypeScript refuses the object.
   */
  whatCards: { title: string; icon: React.ElementType; description: string }[];
  semesters: typeof SEM_PROGRAMIM; roles: string[]; preselected: string; imgUrl: string; to: string;
  /**
   * Absolute path to THIS programme's curriculum PDF, served from `public/`.
   *
   * Required, not optional, and that is deliberate: /programim and /siguria share this
   * one component, so a default here would silently hand both pages the same PDF — the
   * exact bug that a "Shkarko planprogramin" button most needs to not have. With no
   * default, TypeScript refuses a new programme page that forgets its own file.
   *
   * A PLAIN STRING, never an `import`. Vite copies `public/` through verbatim, so the
   * path stays `/pdfs/....pdf` in dev and in the build and the file can be replaced
   * without a rebuild. Importing it instead would inline it into the bundle graph and
   * rewrite the name with a content hash, so dropping in a new PDF would mean rebuilding.
   */
  planUrl: string;
  /**
   * Which part of the hero photo the frame keeps — any CSS `object-position` value.
   *
   * The SECOND number is the one that matters: it is the vertical anchor, and RAISING it
   * pushes the image DOWN inside the frame (more of the photo's lower half shows).
   * `center 20%` keeps the top fifth; `center 75%` keeps the lower three quarters.
   *
   * The default is `center 20%` because that is exactly what was hardcoded here before
   * this prop existed — so /siguria, which does not pass it, renders byte for byte as it
   * did. A page only opts into a different crop by saying so.
   */
  imgPosition?: string;
}) {
  const openApplyPopup = useApplyPopup();

  return (
    <PageWrapper>
      {/* Hero */}
      {/*
        `md:py-14`, down from `md:py-24` in two steps. Nothing in this row is taller than
        the text column any more, so the section's height is simply breadcrumb + text +
        padding — and trimming the padding is what makes it stop just below the buttons
        instead of trailing empty brandSoft underneath them.
      */}
      <section className="py-12 md:py-14" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Studime profesionale" }, { label: breadcrumbEnd }]} />
          {/*
            `items-start`, not `items-center`. The two columns are wildly different
            heights — the portrait is locked to 4:5 and runs ~695px, the text runs maybe
            420px — and centring the short one against the tall one is what left the
            title floating halfway down the hero with dead space above it.

            It stays because it is the ZERO POINT the offset below is measured from:
            with it, the text box begins exactly at the top of the row, so the padding
            reads as plain "distance from the top". Dropping it would leave the default
            `stretch`, which sizes the box to the full 695px of the image — the text
            would still start at the top, but the box would be a lie, and any background
            or border added to it later would suddenly render 695px tall.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/*
              No top offset. The tuning knob that lived here (`pt-[150px]`) was dialled in
              while the image was a 695px portrait and the text needed pushing down to
              meet it; the image is landscape now, so the same padding only opened a gap
              under the breadcrumb. `items-start` on the grid already lands the title at
              the top of the row, which is where it belongs.
            */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>{title}</h1>
              <p className="text-lg leading-relaxed mb-6" style={{ color: C.muted }}>{heroParagraph}</p>
              <div className="flex flex-wrap gap-4 mb-8">
                {["2 vite ", "4 semestra", "120 ECVET", "Akredituar nga MASHT"].map((c) => <MetaChip key={c}>{c}</MetaChip>)}
              </div>
              <div className="flex flex-wrap gap-3">
                {/* One button, both programme pages: /programim and /siguria are the same
                    ProgramPage with different props, so this covers each of them. */}
                <PrimaryBtn onClick={openApplyPopup}>Apliko tani</PrimaryBtn>
                {/*
                  An anchor wrapping the button, matching how `<Link><PrimaryBtn>` is done
                  everywhere else in this file — the button's own styling is untouched.

                  An anchor rather than `onClick={() => window.open(...)}` because this IS a
                  navigation: middle-click, ctrl-click, "open in new tab" and "copy link
                  address" all work on a real href and all silently do nothing on a button.

                  `rel="noopener noreferrer"` goes with every `target="_blank"`: without
                  `noopener` the opened tab gets a `window.opener` handle back into this one
                  and can navigate it somewhere else.
                */}
                <a href={planUrl} target="_blank" rel="noopener noreferrer">
                  <SecondaryBtn>Shkarko planprogramin</SecondaryBtn>
                </a>
              </div>
            </div>
            {/*
              A landscape frame, and — the part that actually fixes the "zoomed in" look —
              a crop anchored near the TOP of the source rather than its centre.

              These sources are tall portraits (programim.jpg is 5285×6606). Squeezing one into
              a landscape box means throwing away most of its height, and `object-cover`
              defaults to keeping the middle: on a photo of a person that is the chin and
              chest, blown up, which reads as a mistake. Which slice is kept is now the
              `imgPosition` prop rather than a fixed class, because the right answer
              depends on the photo: a portrait wants the top, a room full of people at
              desks wants the bottom.

              Inline style, not a Tailwind class. Tailwind generates its CSS by scanning
              the source for complete class names, so `object-[${imgPosition}]` would
              match nothing at build time and silently produce no rule — an arbitrary
              value has to be literal in the file. A prop can only reach the element
              through `style`.

              SIZE: `16/10` rather than `16/9`, and on the widest screens the frame is
              deliberately allowed to grow past its grid track. `2xl:w-[118%]` overflows
              the 556px column to about 656px, bleeding roughly 100px into the page's right
              gutter — which at 1536px and up is ~148px wide, so it stays comfortably
              inside the viewport and cannot introduce a horizontal scrollbar. Below 2xl
              the gutter is too narrow to borrow from, so the frame stays in its track.

              The old `max-h-[360px]` cap is gone: it existed to keep the frame shorter
              than the text column, and it would now clamp the taller ratio and silently
              break it.
            */}
            <div
              className="aspect-[4/3] sm:aspect-[16/10] 2xl:w-[118%] rounded-3xl overflow-hidden"
              style={{ backgroundColor: C.brandLight }}
            >
              <img
                src={imgUrl}
                alt={title}
                className="w-full h-full object-cover"
                style={{ objectPosition: imgPosition }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* What you learn */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-10" style={{ color: C.n900 }}>Çfarë do të mësosh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {whatCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="p-6 rounded-2xl" style={{ border: `1px solid ${C.cardBorder}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: C.brandLight }}>
                    <Icon size={20} style={{ color: C.brand }} />
                  </div>
                  <h4 className="font-semibold mb-2" style={{ color: C.n900 }}>{card.title}</h4>
                  <p className="text-sm" style={{ color: C.n500 }}>{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3.1 — INTERACTIVE SEMESTER TABS */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Planprogrami mësimor</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Katër semestra me mësim praktik, nga njohuritë bazë deri te aftësitë profesionale që kërkon tregu i punës.</p>
          <SemesterTabs semesters={semesters} />
        </div>
      </section>

      {/* 3.2 — INFINITE LOGO MARQUEE */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Ku punojnë të diplomuarit tanë?</h2>
          <p className="text-base mb-8" style={{ color: C.n500 }}>Zbuloni pozitat profesionale dhe kompanitë ku të diplomuarit tanë punojnë dhe zhvillojnë karrierën e tyre në teknologji.</p>
          {/*
            Already a flex-wrap row — the ragged look was never the container, it was chip
            WIDTH. At 375px the usable row is ~347px while these chips measure 135-180px
            each, so only one fitted per line and every row left a hole on the right.
            Tightening padding and type on small screens lands two per row and the block
            reads as a deliberate cluster again. `sm:` restores the exact desktop chip.
          */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-10">
            {roles.map((r) => <span key={r} className="px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm rounded-full font-medium" style={{ backgroundColor: C.brandLight, color: C.brandDark }}>{r}</span>)}
          </div>
          <InfiniteLogoMarquee logos={PARTNER_LOGO_IMAGES} />
        </div>
      </section>

      {/* 3.3 — HORIZONTAL FORM instead of full ApplicationForm */}
      <HorizontalApplicationBand preselected={preselected} />
    </PageWrapper>
  );
}

function PageProgramim() {
  return (
    <ProgramPage
      title="Zhvillim i Ueb-it dhe Aplikacioneve Mobile"
      breadcrumbEnd="Zhvillim i Ueb-it dhe Aplikacioneve Mobile"
      heroParagraph="Programi të përgatit me njohuri praktike për zhvillimin e uebfaqeve, aplikacioneve mobile dhe integrimin e Inteligjencës Artificiale (AI). Përmes mësimit praktik dhe projekteve reale, do të mësosh krijimin e ndërfaqeve moderne, menaxhimin e bazave të të dhënave dhe zhvillimin e produkteve digjitale funksionale."
      /* ── "Çfarë do të mësosh" cards — EDIT THE `description` STRINGS HERE ── */
      whatCards={[
        {
          title: "Bazat e programimit",
          icon: Code,
          description: "Mëso logjikën programuese, algoritmet, strukturat e të dhënave dhe programimin e orientuar në objekte.",
        },
        {
          title: "Zhvillim front-end",
          icon: Laptop,
          description: "Krijo ndërfaqe moderne dhe interaktive për ueb duke përdorur JavaScript, TypeScript, React dhe Vue.js.",
        },
        {
          title: "Zhvillim back-end",
          icon: Globe,
          description: "Ndërto aplikacione funksionale, sisteme të sigurta dhe REST API të integruara me shërbime të jashtme.",
        },
        {
          title: "Aplikacione mobile",
          icon: Briefcase,
          description: "Zhvillo aplikacione moderne për pajisje mobile, me integrim të API-ve, cloud-it dhe funksioneve të AI-së.",
        },
        {
          title: "Bazat e të dhënave",
          icon: BookOpen,
          description: "Mëso të dizajnosh, organizosh dhe menaxhosh baza të të dhënave për aplikacione ueb dhe mobile.",
        },
        {
          title: "Intelegjencë Artificiale",
          icon: Users,
          description: "Përdor AI-në për kodim, debugging, testim dhe integro funksione inteligjente në projektet e tua.",
        },
      ]}
      semesters={SEM_PROGRAMIM}
      roles={["Full-Stack Developer", "Mobile App Developer", "QA / Software Tester", "UI/UX Designer", "Software Developer", "Junior AI Developer"]}
      preselected="Zhvillim i Ueb-it dhe Aplikacioneve Mobile"
      /*
        Bundled asset rather than the stock photo this used to point at. `ProgramPage`
        takes the hero image as a prop, so swapping it here changes this page only —
        /siguria still passes its own URL and is untouched.
      */
      imgUrl={programimHero}
      /* ── HERO IMAGE VERTICAL CROP — TUNE THE SECOND NUMBER ──
         Higher % pushes the photo DOWN in the frame (shows more of its lower half);
         lower % pulls it UP. Reset to 50% for the new photo: the old 75% was dialled in
         against a different picture and means nothing to this one. */
      imgPosition="center 60%"
      /* Drop the real file at cacttus-edu-front/public/pdfs/ under exactly this name. */
      planUrl="/pdfs/plani-zhvillim-web-aplikacione-mobile.pdf"
      to="/programim"
    />
  );
}

function PageSiguria() {
  return (
    <ProgramPage
      title="Siguria Kibernetike"
      breadcrumbEnd="Siguria Kibernetike"
      heroParagraph="Programi të përgatit me njohuri praktike për mbrojtjen e rrjeteve, sistemeve, të dhënave dhe infrastrukturës cloud nga kërcënimet kibernetike. Përmes ushtrimeve laboratorike, skenarëve realë dhe mjeteve profesionale, do të mësosh të identifikosh cenueshmëritë, të analizosh log-et dhe trafikun, të reagosh ndaj incidenteve dhe të realizosh testime të sigurisë."
      /* ── "Çfarë do të mësosh" cards — EDIT THE `description` STRINGS HERE ── */
      whatCards={[
        {
          title: "Rrjeta dhe sisteme",
          icon: Globe,
          description: "Mëso të instalosh, konfigurosh, administrosh dhe mbrosh rrjetet kompjuterike.",
        },
        {
          title: "Linux dhe administrim sistemesh",
          icon: Shield,
          description: "Zhvillo aftësi praktike në përdorimin e Linux-it, administrimin e serverëve dhe automatizimin përmes skriptimit.",
        },
        {
          title: "Cloud dhe virtualizim",
          icon: Code,
          description: "Mëso të krijosh, menaxhosh dhe sigurosh infrastrukturën virtuale dhe shërbimet në cloud.",
        },
        {
          title: "Siguria e informacionit",
          icon: BookOpen,
          description: "Kupto parimet e mbrojtjes së të dhënave, menaxhimit të qasjes dhe zvogëlimit të rreziqeve të sigurisë.",
        },
        {
          title: "Operacionet kibernetike",
          icon: Laptop,
          description: "Mëso të monitorosh sistemet, të identifikosh kërcënimet dhe të reagosh ndaj incidenteve kibernetike.",
        },
        {
          title: "Testimi i sigurisë",
          icon: Award,
          description: "Identifiko cenueshmëritë, vlerëso sigurinë e sistemeve dhe realizo testime praktike të depërtimit.",
        },
      ]}
      semesters={SEM_SIGURIA}
      roles={["Cybersecurity Analyst", "SOC Analyst", "Network Administrator", "Penetration Tester", "Cloud Security Specialist", "Information Security Specialist"]}
      preselected="Siguria Kibernetike"
      imgUrl={cyberHero}
      /* ── HERO IMAGE VERTICAL CROP — TUNE THE SECOND NUMBER ──
         Same knob as /programim above: higher % pushes the photo DOWN, lower % pulls it UP.
         Passed explicitly rather than left to `ProgramPage`'s default, which is 20% — this
         page used to inherit that silently, so the value had to be stated to reach 50%. */
      imgPosition="center 55%"
      /* Drop the real file at cacttus-edu-front/public/pdfs/ under exactly this name. */
      planUrl="/pdfs/plani-siguria-kibernetike.pdf"
      to="/siguria"
    />
  );
}

/* ══════════════════════════════════════════
   PART 4 — TRAJNIME PAGE (filter labels)
══════════════════════════════════════════ */
const TRAINERS = [
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

/* 4.1 — Filter chips with labels */
function FilterRow({ label, options, active, onSelect }: { label: string; options: string[]; active: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <span className="text-sm font-semibold shrink-0" style={{ color: C.n900, fontSize: 15 }}>{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-0.5 flex-wrap md:flex-nowrap">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onSelect(o)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: active === o ? C.brand : C.n100,
              color: active === o ? "#fff" : C.n700,
              border: active === o ? `1px solid ${C.brand}` : `1px solid ${C.n200}`,
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   4 — TRAJNIME: catalogue grid (live data)

   The card list, the category chips and the city chips all come from the API. The
   previous version hard-coded 14 trainings and two chip lists in this file, which meant
   publishing a training was a code change. Chips are DERIVED from what is actually on
   live cards, so a filter can never lead to an empty grid.
══════════════════════════════════════════ */
function TrainingCard({ training }: { training: TrainingCardData }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}
    >
      {/* Category left, status right — the badge sits beside the tag rather than being
          absolutely positioned, so it can never overlap a long category label. */}
      <div className="flex items-start justify-between gap-2">
        <MetaChip>{TRAINING_CATEGORY_LABELS[training.category]}</MetaChip>
        <TrainingStatusBadge status={training.status} />
      </div>
      <h4 className="text-base font-semibold leading-snug" style={{ color: C.n900 }}>{training.title}</h4>
      <div className="flex flex-col gap-2 flex-1">
        {/*
          "Qyteti" is CONDITIONAL, not defaulted to an em dash. An online training has no
          city — that is what `format` says — so printing "Qyteti: —" invents a field the
          training does not have. The row is omitted entirely instead. `format` is
          unaffected and still renders one line above, which is where Klasë / Hibrid /
          Online is expressed.
        */}
        {([
          ["Fillimi", formatTrainingDate(training.startDate)],
          ["Formati", TRAINING_FORMAT_LABELS[training.format]],
          ["Orët", training.hours === null ? "—" : `${training.hours} orë`],
          ["Ligjëruesi", training.instructor || "—"],
          ...(training.city ? [["Qyteti", training.city] as const] : []),
        ] as readonly (readonly [string, string])[]).map(([label, val]) => (
          <div key={label} className="flex items-center justify-between text-sm gap-2">
            <span style={{ color: C.n500 }}>{label}</span>
            <span className="font-medium text-right" style={{ color: C.n700 }}>{val}</span>
          </div>
        ))}
      </div>
      {/* Navigates to the DETAIL page — not a modal, and not the form directly. */}
      <Link to={training.applyUrl}>
        <PrimaryBtn className="text-sm px-5 py-2.5 w-full justify-center">Apliko</PrimaryBtn>
      </Link>
    </div>
  );
}

const ALL_FILTER = "Të gjitha";

/**
 * Fold a city name for COMPARISON only: trim, lowercase, drop diacritics.
 *
 * The chips are built from the distinct `city` values on the trainings, so one record
 * typed "Prishtine" and another "Prishtinë" produced two chips for one city — which is
 * exactly what happened in production. The data itself has been normalised, and that is
 * the real fix; this is the guard that stops the next stray entry from doing it again.
 */
function cityKey(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Collapse spelling variants of one city down to a single chip.
 *
 * Keeps the ACCENTED spelling when both exist: after `normalize("NFD")` an accented
 * letter is two code points to the plain letter's one, so the longer decomposition is
 * the one carrying the diacritics — "Prishtinë" wins over "Prishtine" rather than the
 * chip label depending on which record happened to be created first.
 */
function dedupeCities(values: readonly (string | null | undefined)[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of values) {
    // A training with no city (an online one) contributes no chip at all.
    const value = (raw ?? "").trim();
    if (!value) continue;
    const key = cityKey(value);
    const kept = byKey.get(key);
    if (!kept || value.normalize("NFD").length > kept.normalize("NFD").length) byKey.set(key, value);
  }
  return [...byKey.values()];
}

function PageTrajnime() {
  const [trainings, setTrainings] = useState<readonly TrainingCardData[]>([]);
  const [categories, setCategories] = useState<readonly TrainingCategory[]>([]);
  const [cities, setCities] = useState<readonly string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /*
    ONE state for the "Trajnimet:" row, which now mixes two different kinds of filter —
    lifecycle ("Aktive") and category ("Programim") — in a single group. Holding the
    chosen LABEL rather than a {kind, value} pair is what keeps `FilterRow` unchanged:
    it already speaks in labels, and one row that can only have one answer is exactly
    what one string models. `city` stays separate because it is still its own row.
  */
  const [sel, setSel] = useState(ALL_FILTER);
  const [city, setCity] = useState(ALL_FILTER);
  const [format, setFormat] = useState(ALL_FILTER);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");

    // The chips describe the WHOLE catalogue, so they are fetched unfiltered alongside
    // the (unfiltered) grid; narrowing happens client-side from here on, which keeps a
    // chip click instant instead of a round-trip each time.
    Promise.all([getPublicTrainings(), getTrainingFilters()])
      .then(([items, filters]) => {
        if (!active) return;
        setTrainings(items);
        setCategories(filters.categories);
        setCities(filters.cities);
      })
      .catch(() => {
        if (active) setLoadError("Trajnimet nuk mund të ngarkohen për momentin.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  /*
    Which status a label names, or undefined when it names something else. This is the
    one place the merged row's ambiguity is resolved: a status label wins over a category
    label of the same text, so if a category is ever renamed "Aktive" the row degrades to
    filtering by status rather than doing both or neither.
  */
  const statusForLabel = (label: string): TrainingStatus | undefined =>
    (Object.keys(TRAINING_STATUS_LABELS) as TrainingStatus[]).find(
      (value) => TRAINING_STATUS_LABELS[value] === label,
    );

  /* The two rows still AND together — picking Prishtinë then Përfunduar narrows to both.
     Within the merged row only one pill can be active, so there is nothing to combine
     there: a training either matches the one thing selected or it does not. */
  const filtered = trainings.filter((t) => {
    if (city !== ALL_FILTER && cityKey(t.city ?? "") !== cityKey(city)) {
      return false;
    }
    if (format !== ALL_FILTER && TRAINING_FORMAT_LABELS[t.format] !== format) {
      return false;
    }
    if (sel === ALL_FILTER) {
      return true;
    }

    const status = statusForLabel(sel);
    return status === undefined
      ? TRAINING_CATEGORY_LABELS[t.category] === sel
      : t.status === status;
  });

  /*
    Order is fixed by the spread, not by sorting: "Të gjitha", then lifecycle, then the
    categories the API reported. Both middle groups are derived from what is actually on
    the cards — a chip that could only ever empty the grid is a dead end, so a
    "Përfunduar" pill appears only once some training is.
  */
  const selOptions = [
    ALL_FILTER,
    ...(["ACTIVE", "COMPLETED"] as const)
      .filter((value) => trainings.some((t) => t.status === value))
      .map((value) => TRAINING_STATUS_LABELS[value]),
    ...categories.map((c) => TRAINING_CATEGORY_LABELS[c]),
  ];
  const cityOptions = [ALL_FILTER, ...dedupeCities(cities)];
  /*
    Derived from the loaded trainings, not from /trainings/filters — that endpoint returns
    only categories and cities, and adding formats to it would be a backend change for
    something the client already holds. Listing only the formats actually present keeps a
    chip from being a dead end, the same rule the status pills follow above.
  */
  const formatOptions = [
    ALL_FILTER,
    ...(["KLASE", "HIBRID", "ONLINE"] as const)
      .filter((value) => trainings.some((t) => t.format === value))
      .map((value) => TRAINING_FORMAT_LABELS[value]),
  ];

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Trajnime profesionale</h1>
          <p className="text-lg mb-6 max-w-2xl" style={{ color: C.muted }}>
            Trajnime të shkurtra dhe intensive, të dizajnuara me kompanitë e teknologjisë. Zgjidh formatin që të përshtatet: online, në klasë ose hibrid — dhe merr certifikatë në përfundim.
          </p>
          {/*
            The same four figures the homepage hero shows, from the same `HeroStats`.
            They replace three chips that counted the catalogue ("3 trajnime", "2
            kategori") — numbers that shrank every time a training was unpublished and
            made the page look emptier the moment it was.
          */}
          <HeroStats className="mt-2" />
        </div>
      </section>

      {/*
        Chips stay hidden while loading rather than rendering empty and then jumping.

        A normal block in the flow, NOT pinned. It used to carry `sticky top-[76px] z-30`,
        which parked it under the navbar for the whole scroll — so it floated over the
        cards and was still there beside the footer. `z-30` went with it: a z-index does
        nothing on a static element, and it only existed to stack the bar over the
        content it was floating above.
      */}
      {!isLoading && !loadError && trainings.length > 0 && (
        <div className="py-4" style={{ backgroundColor: C.n0, borderBottom: `1px solid ${C.n200}` }}>
          <div className="max-w-[1200px] mx-auto px-5 flex flex-col gap-5">
            <FilterRow label="Trajnimet:" options={selOptions} active={sel} onSelect={setSel} />
            {cityOptions.length > 1 && (
              <FilterRow label="Qyteti:" options={cityOptions} active={city} onSelect={setCity} />
            )}
            {/* Its own guard, not the city one: an all-online catalogue has no city chips
                but still has formats worth filtering by. */}
            {formatOptions.length > 1 && (
              <FilterRow label="Formati:" options={formatOptions} active={format} onSelect={setFormat} />
            )}
          </div>
        </div>
      )}

      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-live="polite">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl animate-pulse" style={{ height: 300, backgroundColor: C.n100 }} />
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center py-20 gap-4" role="alert">
              <p className="text-lg" style={{ color: C.n700 }}>{loadError}</p>
              <SecondaryBtn onClick={() => setReloadKey((k) => k + 1)}>Provo përsëri</SecondaryBtn>
            </div>
          ) : trainings.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <p className="text-lg" style={{ color: C.n700 }}>Ende nuk ka trajnime të publikuara</p>
              <p className="text-sm" style={{ color: C.n500 }}>Kthehu së shpejti — po përgatisim grupin e radhës.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <p className="text-lg" style={{ color: C.n500 }}>Nuk ka trajnime të disponueshme për filtrat e zgjedhur</p>
              <SecondaryBtn onClick={() => { setSel(ALL_FILTER); setCity(ALL_FILTER); setFormat(ALL_FILTER); }}>Pastro filtrat</SecondaryBtn>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => <TrainingCard key={t.slug} training={t} />)}
            </div>
          )}
        </div>
      </section>

      {/*
        Partner logos. `InfiniteLogoMarquee` is the same component the programme pages and
        the /biznese section use — the marquee and the scroll timing live inside it, so
        this is a reuse rather than a second implementation.

        One row here, not the default two: nine certification bodies are not enough to
        fill a second band without visibly repeating. The set is `PARTNER_LOGOS`, taken as
        the component's default — these are the bodies the trainings certify against, a
        different list from the employer logos the programme pages show.
      */}
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-2xl font-bold text-center mb-10" style={{ color: C.n900 }}>
            Partneret tanë
          </p>
          <InfiniteLogoMarquee rows={1} />
        </div>
      </section>

      {/*
        Editorial content, not catalogue data. Kept exactly as it was: these are the
        school's lecturers as a marketing statement, unrelated to which trainings happen
        to be published this month, so it is deliberately NOT driven by the API.
      */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Ligjëruesit tanë</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Profesionistë aktivë në industri që ligjërojnë atë që punojnë çdo ditë.</p>
          {/*
            Four tracks, down from six. The track count was sized for a six-person list; at
            six columns four cards left two empty cells and each portrait rendered about
            180px wide. Four tracks share the same 1160px row between four cards instead,
            which is what makes each one roughly 270px — the cards got bigger by taking the
            space the removed two were holding, not by being scaled up.

            `gap-6` and the larger type follow the same logic: the spacing and labels were
            in proportion to a 180px card and would look undersized against a 270px one.

            This markup is local to /trajnime. The /ligjërueit grid renders `PersonCard`,
            a different component entirely, so nothing here reaches it.
          */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRAINERS.map((t) => (
              <div key={t.name} className="flex flex-col items-center text-center">
                <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: C.n100 }}>
                  <img src={t.imgUrl} alt={t.name} className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: t.imgPosition }} />
                </div>
                <p className="text-base font-semibold" style={{ color: C.n900 }}>{t.name}</p>
                <p className="text-sm mt-0.5" style={{ color: C.n500 }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   4.2 — TRAJNIME: the detail page, /trajnime/:slug

   EXACTLY five sections, and every optional one disappears when empty:
   hero · përshkrimi · Pikat e Forta · planprogrami (PDF) · forma e aplikimit.
   Nothing else — no deadline/seats boxes, no topic list, no testimonials, no trainer
   bio (the instructor is a line in the hero meta and nothing more).
══════════════════════════════════════════ */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
const TRAJNIMI_INSTRUCTOR_IMG_POSITION = "center 50%";

function PageTrajnimiDetal() {
  const { slug } = useParams<{ slug: string }>();
  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setIsLoading(true);
    setNotFound(false);
    setLoadError("");

    getTraining(slug)
      .then((data) => {
        if (active) setTraining(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof PublicApiError && error.isNotFound) {
          setNotFound(true);
        } else {
          setLoadError("Trajnimi nuk mund të ngarkohet për momentin.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <PageWrapper>
        <section className="py-24" aria-live="polite">
          <div className="max-w-[900px] mx-auto px-5 flex flex-col gap-4">
            <div className="rounded-xl animate-pulse" style={{ height: 44, width: "60%", backgroundColor: C.n100 }} />
            <div className="rounded-xl animate-pulse" style={{ height: 120, backgroundColor: C.n100 }} />
          </div>
        </section>
      </PageWrapper>
    );
  }

  if (notFound || loadError || !training) {
    return (
      <PageWrapper>
        <section className="py-24">
          <div className="max-w-[900px] mx-auto px-5 text-center flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold" style={{ color: C.n900 }}>
              {notFound ? "Ky trajnim nuk u gjet" : loadError}
            </h1>
            <p style={{ color: C.n500 }}>
              {notFound ? "Ndoshta ka përfunduar ose linku është i vjetër." : "Provo përsëri pas pak."}
            </p>
            <Link to="/trajnime"><PrimaryBtn>Shiko të gjitha trajnimet</PrimaryBtn></Link>
          </div>
        </section>
      </PageWrapper>
    );
  }

  /* "Qyteti" is dropped rather than em-dashed when the training has no city — see the
     card for the reasoning. "Formati" above it always renders. */
  const meta: readonly (readonly [string, string])[] = [
    ["Fillimi", formatTrainingDate(training.startDate)],
    ["Formati", TRAINING_FORMAT_LABELS[training.format]],
    ["Orët", training.hours === null ? "—" : `${training.hours} orë`],
    ["Ligjëruesi", training.instructor || "—"],
    ...(training.city ? [["Qyteti", training.city] as const] : []),
    ["Çmimi", training.price === null ? "—" : `${training.price} €`],
  ];

  return (
    <PageWrapper>
      {/* ── Hero ── */}
      <section className="py-14 md:py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Trajnime", path: "/trajnime" }, { label: training.title }]} />
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase"
              style={{ backgroundColor: C.brand, color: "#fff", letterSpacing: "0.06em" }}
            >
              Training
            </span>
            <MetaChip>{TRAINING_CATEGORY_LABELS[training.category]}</MetaChip>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 max-w-3xl" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
            {training.title}
          </h1>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {meta.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs uppercase mb-0.5" style={{ color: C.n500, letterSpacing: "0.06em" }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: C.n900 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1100px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-start">
          <div className="flex flex-col gap-12 min-w-0">
            {/* ── Description — free text, admin-authored ── */}
            {training.description && (
              <div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: C.n900 }}>Çfarë do të mësosh</h2>
                {/*
                  Rendered as TEXT, split on blank lines. Never dangerouslySetInnerHTML:
                  this is operator-authored content on the more exposed of the two
                  frontends, and an admin account must not be able to inject script into
                  a public page.
                */}
                <div className="flex flex-col gap-4">
                  {training.description.split(/\n\s*\n/).map((paragraph, index) => (
                    <p key={index} className="text-base leading-relaxed whitespace-pre-line" style={{ color: C.muted }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* ── Pikat e Forta — checkmark card grid, not a bullet list ── */}
            {training.strengths.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-5" style={{ color: C.n900 }}>Pikat e Forta</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {training.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl p-4 transition-all hover:shadow-md"
                      style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.brandSoft }}
                    >
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: C.brand }}
                      >
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </span>
                      <p className="text-sm leading-snug font-medium" style={{ color: C.n800 }}>{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Syllabus PDF ── */}
            {training.syllabusPdf && (
              <div
                className="rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
                style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n50 }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.brandLight }}>
                    <FileText size={22} style={{ color: C.brand }} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: C.n900 }}>Planprogrami i trajnimit</p>
                    <p className="text-sm" style={{ color: C.n500 }}>PDF · përmbajtja e plotë e modulit</p>
                  </div>
                </div>
                <a href={training.syllabusPdf} target="_blank" rel="noopener noreferrer">
                  <SecondaryBtn>Shkarko planprogramin</SecondaryBtn>
                </a>
              </div>
            )}

          {/*
            ── Ligjëruesi — portrait left, short bio right ──

            Rendered only when there is something beyond the bare name to show: the name
            alone already appears in the hero's meta row, so a block repeating it with an
            empty space beside it would be worse than no block. Photo and bio are
            independently optional, hence the two inner guards rather than one.

            The photo/bio split is driven by the CONTAINER (`@sm`), not the viewport: this
            column is ~440px wide on a desktop that is far past any viewport breakpoint,
            so a plain `sm:flex-row` would sit the two side by side and leave the bio a
            sliver. Container queries ask the only question that matters here — is there
            room in THIS column — so the block stacks when it is narrow and splits when
            it is not, on any screen.
          */}
          {(training.instructorPhoto || training.instructorBio) && (
            <div className="@container">
              <h2 className="text-2xl font-bold mb-5" style={{ color: C.n900 }}>Ligjëruesi</h2>
              <div
                className="rounded-2xl p-6 flex flex-col @sm:flex-row items-start gap-6"
                style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.brandSoft }}
              >
                {training.instructorPhoto && (
                  <img
                    src={training.instructorPhoto}
                    alt={training.instructor ?? "Ligjëruesi i trajnimit"}
                    loading="lazy"
                    className="shrink-0 w-28 h-28 rounded-2xl object-cover"
                    style={{ border: `1px solid ${C.cardBorder}`, objectPosition: TRAJNIMI_INSTRUCTOR_IMG_POSITION }}
                  />
                )}
                <div className="min-w-0 flex flex-col gap-2">
                  {training.instructor && (
                    <p className="text-lg font-bold" style={{ color: C.n900 }}>{training.instructor}</p>
                  )}
                  {training.instructorBio && (
                    <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: C.muted }}>
                      {training.instructorBio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          </div>

          {/*
            ── Right column: the apply form, then the job roles ──

            Not pinned. `lg:sticky lg:top-24` used to live here and kept the form in the
            viewport for the whole scroll. The trainer block briefly shared this column
            and now lives under the syllabus in the wide left column, where it has the
            room to run photo-beside-bio at full width.

            `flex flex-col gap-10` mirrors the left column's own stacking, so the two
            blocks below are spaced by the container rather than by margins hung off
            whichever one happens to render.
          */}
          <div className="flex flex-col gap-10">
            <div id="apliko">
              {training.form ? (
                <PublicApplicationForm
                  slug={training.form.slug}
                  trainingId={training.id}
                  title="Apliko për këtë trajnim"
                />
              ) : (
                /*
                  The linked form was renamed or switched off. The rest of the page is
                  still worth reading, so this degrades instead of 404ing — the read half
                  of the formSlug contract documented in schema.prisma.
                */
                <div className="rounded-2xl p-8" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n50 }}>
                  <p className="font-semibold mb-1" style={{ color: C.n900 }}>Aplikimi online nuk është i hapur</p>
                  <p className="text-sm" style={{ color: C.n500 }}>
                    Na kontakto në +383 (0)38 600 237 për t&apos;u regjistruar në këtë trajnim.
                  </p>
                </div>
              )}
            </div>

            {/*
              ── Rolet e punës — admin-authored, one pill each ──

              Under the apply form, not above it: the form is why this column exists and
              must stay the first thing in view, while this block is the argument for
              filling it in — read on the way back up, not before.

              Guarded on length, so a training with no roles set renders nothing at all
              rather than an empty heading. Pills, not a bullet list: these are short
              labels of the same weight with no order between them, which is the shape a
              wrapping row of chips expresses and a vertical list does not. The style is
              lifted verbatim from the role chips on the programme pages, so this
              introduces no new visual vocabulary — and it needed no narrowing to sit in
              this 420px column, because `flex-wrap` was already doing the work: the row
              simply breaks over more lines here than it did in the wide column.
            */}
            {training.jobRoles.length > 0 && (
              <div>
                <h2 className="text-2x1 font-bold mb-5" style={{ color: C.n900 }}>Rolet e punës që mund t&apos;i fitosh</h2>
                <p className="text-base mb-5" style={{ color: C.muted }}>
                  Pozitat për të cilat ky trajnim të përgatit.
                </p>
                {/*
                  Tags, not pills — and the difference is the whole redesign.

                  A wrapping FLOW is kept rather than switching to a stacked list: at four
                  short roles the old row was 36px tall, and a one-per-line list would be
                  four times that in a column that is already the page's densest. So the
                  footprint stays, and the polish comes from the chip itself:

                  - `rounded-xl`, not `rounded-full`. A capsule reads as a status pill,
                    something the system assigned; a softened rectangle reads as a card,
                    something authored. Same pixels, different meaning.
                  - A brand-purple icon gives each entry an anchor and says "job" before
                    the text is read. It costs no height — the glyph is shorter than the
                    line box it sits in.
                  - White fill on the page's white column, held together by a hairline
                    border, so the group reads as a set of small objects rather than a
                    block of colour. The purple then lands only where it means something.
                  - Colour and a lifted border arrive on hover, which is where "designed"
                    usually lives: the resting state stays quiet on a busy page.
                */}
                <ul className="flex flex-wrap gap-2">
                  {training.jobRoles.map((role) => (
                    <li
                      key={role}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.brandSoft;
                        e.currentTarget.style.borderColor = C.p300;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.n0;
                        e.currentTarget.style.borderColor = C.cardBorder;
                      }}
                    >
                      <Briefcase size={13} strokeWidth={2.25} className="shrink-0" style={{ color: C.brand }} aria-hidden="true" />
                      <span className="text-sm font-medium leading-none" style={{ color: C.n800 }}>{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   4.3 — /forma/:slug — social-media intake

   A form link shared on Instagram or Facebook lands here. Deliberately BARE: one
   heading, one form, nothing else. No sidebar, no categories, no recent posts, no
   cross-sell — every extra element on this page is another way to lose someone who
   arrived ready to apply.
══════════════════════════════════════════ */
function PageForma() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <PageWrapper>
        <section className="py-24 text-center">
          <p style={{ color: C.n500 }}>Formë e panjohur.</p>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="py-14 md:py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[720px] mx-auto px-5 text-center">
          <Overline>Aplikim</Overline>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
            Plotëso aplikimin
          </h1>
          <p className="text-base mt-3" style={{ color: C.muted }}>
            Merr vetëm një minutë. Stafi ynë të kontakton brenda 48 orëve.
          </p>
        </div>
      </section>

      <section className="py-12" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[720px] mx-auto px-5">
          <PublicApplicationForm slug={slug} />
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   PËR BIZNESE HUB — unchanged
══════════════════════════════════════════ */

/*
  ── HERO IMAGE NUDGE — TUNE THESE TWO NUMBERS ──

  `y` moves the artwork DOWN as it grows and UP as it shrinks; `x` moves it RIGHT as it
  grows and LEFT as it shrinks. Negative values are fine ("-20px"). The two current
  values are exactly what was hardcoded on the <img> before this constant existed, so
  lifting them here changed nothing on screen.

  WHY NOT `objectPosition`, the knob /programim, /siguria and Bursa use:
  that one only does something when a frame CROPS a photo — it picks which slice of an
  oversized image survives inside a fixed box. Those heroes are `w-full h-full
  object-cover` inside such a box, so they have a crop to aim. THIS hero is a
  transparent cutout of four people, sized `w-auto` against a max height: the box is
  the artwork's own 1:1 shape, nothing is cropped, and `object-fit` is left at its
  `fill` default. Setting `objectPosition` here is inert — the browser reports
  `50% 50%` on this element today and moving it changes not one pixel. Offsetting the
  whole element is the only thing that can move this image, which is why the original
  markup reached for `translate-*` and not `object-*`.

  It is a {x, y} pair rather than an `object-position`-style string on purpose: the two
  are not interchangeable, and a name like BIZNESE_HERO_IMG_POSITION would invite
  someone to write "center 50%" in here, which is not a length and would silently do
  nothing.

  Applied through the standalone CSS `translate` property, which is what the Tailwind v4
  `translate-*` utilities this replaces compile to — NOT `transform`. Both exist
  independently, so a `transform` set elsewhere on this element would still compose
  rather than fight with this.
*/
const BIZNESE_HERO_IMG_OFFSET = { x: "95px", y: "-65px" };

/*
  ── HERO IMAGE SIZE — TUNE THIS ONE NUMBER ──

  The artwork is square (500x500 source), so this height sets the width to match and the
  figures scale as one. Raise it to grow them, lower it to shrink them.

  Set as an inline style rather than Tailwind's `max-h-[...]`: Tailwind scans the SOURCE
  for complete class names, so a value built from a constant would never make it into the
  stylesheet. The same reason `imgPosition` elsewhere in this file is a style and not an
  `object-[...]` class.

  TWO THINGS MOVE WHEN THIS GROWS, both intentional:

  1. The column beside the text is a fixed 480px track (`lg:grid-cols-[1fr_480px]`).
     Past 480 the square image is WIDER than its track and spills evenly on both sides.
     That is fine and is what the reference shows — the 40px grid gap plus the page margin
     absorb it, and BIZNESE_HERO_IMG_OFFSET.x nudges it clear of the text. Do not widen
     the track to "fix" this: that would re-flow the text column.

  2. The row is as tall as its tallest child, and this image has been the taller one since
     it passed ~300px. So raising this raises the hero band with it. There is no way to
     enlarge the artwork in place without that — the section has no fixed height to grow
     into.
*/
/* The `min()` is a GUARD, not decoration. Tune the 560px; leave the 38vw alone.

   Past the 480px track this image spills to both sides, and the right-hand spill has
   nothing to spill INTO once the 1200px container stops centring — measured, a flat
   560px put the right edge 30px beyond a 1024px viewport and 30px beyond a 1280px one,
   which is a horizontal scrollbar on the whole page. 38vw makes the artwork step down on
   those widths instead of overflowing, and is slack enough that anything >=1500px gets
   the full 560. Raise 560 as far as you like; the guard keeps narrow screens honest. */
const BIZNESE_HERO_IMG_HEIGHT = "min(500px, 35vw)";

/*
  ── HERO IMAGE SCALE — TUNE THIS ONE NUMBER ──

  1 = the size the layout reserves (BIZNESE_HERO_IMG_HEIGHT above). Anything higher blows
  the artwork up past that WITHOUT the page noticing: `transform` is painted after layout
  is already decided, so the row, the section, the text column and the button all keep the
  exact geometry they had at scale 1. That is the whole reason this is a transform and not
  a bigger height — height feeds back into the row and drags the section taller with it,
  which is what happened the last two times.

  1.45 renders the ~500px box at roughly 725px on screen.

  The trade is that the overflow has to go somewhere, and `overflow-x: clip` on the section
  is where. Raise this far enough and the figures start losing their sides and their feet
  at the section's edges. If you want them BIGGER AND WHOLE, that is the other knob:
  raise BIZNESE_HERO_IMG_HEIGHT instead and accept a taller hero band.

  `transformOrigin: "center top"` anchors the growth at the top edge, so the heads stay put
  and the extra height goes downward, out through the bottom of the band. Growing from the
  centre instead sent 100+px up behind the navbar and decapitated them.
*/
const BIZNESE_HERO_IMG_SCALE = 1.30;

function PageBiznese() {
  const navigate = useNavigate();
  const BUSINESS_OFFERINGS = [
    { title: "Trajnime të personalizuara", desc: "Investoni në aftësitë, zhvillimin dhe të ardhmen e ekipit tuaj!", icon: Briefcase, path: "/biznese/trajnime" },
    { title: "Rrjeti i talentëve", desc: "Akses në portfoliot dhe CV e studentëve", icon: Users, path: "/biznese/talente" },
    { title: "Bursa e Impaktit", desc: "Bëhu Sponsor i Bursave të impaktit", icon: Award, path: "/biznese/bursa" },
    { title: "Klasët me qera", desc: "Klasat moderne të pajisura për qira", icon: BookOpen, path: "/biznese/klasa" },
  ];
  return (
    <PageWrapper>
      {/*
        `py-12 md:py-16`, down from `py-16 md:py-24`. That is 32px off each end — the
        smaller half of the height problem; see the note on the illustration for the
        larger half.
      */}
      {/*
        `overflow-x: clip` is what lets BIZNESE_HERO_IMG_SCALE exist. The scaled artwork is
        wider than its 480px track and, on a 1280px screen, wider than the viewport — which
        without this is a horizontal scrollbar on the whole page.

        `clip` rather than `hidden` on purpose: `hidden` turns the section into a scroll
        container, which would also force `overflow-y` to `auto` and break `position:
        sticky` for anything inside. `clip` just clips.

        BOTH axes. Clipping only X let the scaled figures run 225px out of the bottom of
        the band and sit on top of the cards in the next section — measured, their visual
        box ended at 958 while the section ended at 733. Clipping Y crops them cleanly at
        the band's own edge instead, which is why the growth is anchored at the TOP: the
        crop lands on legs, never on faces.
      */}
      <section className="py-12 md:py-16" style={{ backgroundColor: C.brandSoft, overflow: "clip" }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            `items-center`, NOT `items-end`.

            This row was briefly bottom-aligned, to stand the figures on the same line as
            the "Na kontakto" button. It did that — but bottom-aligning a row aligns BOTH
            columns, and the text is far shorter than the illustration (~186px against
            380px). So the text got shoved ~194px down the row and the title ended up
            sitting well below where it had always been, with an unexplained gap under the
            navbar. The alignment was doing something nobody asked for to the column that
            was already correct.

            Centring balances the two against each other instead: the text sits level with
            the middle of the illustration, and neither column is dragged to the other's
            extreme.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Për biznese</h1>
              <p className="text-lg mb-5" style={{ color: C.muted }}>Cacttus Education mbështet bizneset dhe organizatat në zhvillimin e kapaciteteve profesionale dhe përmbushjen e nevojave të tyre për talente të kualifikuara. Ofrojmë trajnime të personalizuara për avancimin e stafit, qasje në rrjetin e studentëve dhe të diplomuarve tanë, mundësi për financimin e bursave me impakt, si dhe klasa moderne me qira për trajnime, takime dhe aktivitete profesionale.</p>
              <Link to="/kontakti"><PrimaryBtn>Na kontakto</PrimaryBtn></Link>
            </div>

            {/*
              A free-standing cutout: no wrapper background, no border, no rounding. The
              SVG already carries its own transparency, and anything behind it would turn
              a cutout into a framed picture.

              Sized by HEIGHT, not width — see BIZNESE_HERO_IMG_HEIGHT above, which
              is the one number to tune. Height drives it because the artwork is square
              while the space beside the text is landscape: pinning the width would leave
              the figures small in a wide track.

              THE HEIGHT FIX: the source had 28.7% of its canvas as empty transparent
              space above the figures' heads (measured: content began at y=387 of 1350).
              An `<img>` is sized by its canvas, not by what is drawn on it, so the box was
              ~120px taller than anything visible — and because the row is bottom-aligned,
              that invisible band sat between the navbar and the title and read as a gap
              nobody could account for. The asset in `imports/` is now cropped to the
              figures' own bounding box, so its height and what you can see are the same
              number. The figures themselves are untouched.

              `hidden lg:flex`: below the two-column breakpoint this would stack under the
              button and shove the cards off screen, and it is decoration — hence the empty
              `alt` and `aria-hidden`, so a screen reader skips it rather than announcing
              a filename.
            */}
            <div className="hidden lg:flex justify-center">
              <img
                src={bizneseHero}
                alt=""
                aria-hidden="true"
                className="w-auto select-none pointer-events-none"
                style={{
                  height: BIZNESE_HERO_IMG_HEIGHT,
                  /* Tailwind's preflight sets `img { max-width: 100% }`, which pinned this
                     to its 480px track and silently capped the height constant above at
                     480 no matter what it said. Released HERE, on the image, so the track
                     itself is untouched. */
                  maxWidth: "none",
                  translate: `${BIZNESE_HERO_IMG_OFFSET.x} ${BIZNESE_HERO_IMG_OFFSET.y}`,
                  /* `translate` and `transform` are SEPARATE CSS properties, not two names
                     for one thing — so the offset above and this scale compose instead of
                     overwriting each other, and either can be tuned without touching the
                     other. */
                  transform: `scale(${BIZNESE_HERO_IMG_SCALE})`,
                  transformOrigin: "center top",
                }}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BUSINESS_OFFERINGS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="p-8 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" style={{ border: `1px solid ${C.n200}` }} onClick={() => navigate(b.path)}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: C.brandLight }}>
                    <Icon size={26} style={{ color: C.brand }} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2" style={{ color: C.n900 }}>{b.title}</h4>
                  <p className="text-sm mb-4" style={{ color: C.muted }}>{b.desc}</p>
                  <GhostBtn>Mëso më shumë</GhostBtn>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Partner logos, directly above the closing CTA — the same placement the other
          /biznese pages use, so the section order reads the same across the group. */}
      
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   PART 5 — CUSTOM BIZNESE SUBPAGES
══════════════════════════════════════════ */

/* ── 5.1 TRAJNIME TË PERSONALIZUARA ── */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
/**
 * Submit state and POST for the /biznese lead boxes.
 *
 * The three boxes ask for different things but do the same job, so the transport,
 * validation and error wording live here once. `requestType` is the ONLY thing that
 * differs at the API level: it becomes `tipi_kerkeses`, which is how the inbox tells a
 * trainings enquiry from a partnership one from a room booking.
 *
 * `extra` holds that page's optional answers. Empty ones are sent as-is and dropped
 * server-side (an unanswered optional field is simply absent from the stored data), so a
 * caller does not have to prune them.
 */
function useBusinessLead(requestType: string) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(
    contact: { name: string; email: string; phone: string },
    extra: Record<string, string>,
  ) {
    // The buttons stay enabled, so a double click would otherwise send the lead twice.
    if (isSubmitting) return;

    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setError("Ju lutemi plotësoni emrin, email-in dhe numrin e telefonit.");
      return;
    }
    if (!isValidPhone(contact.phone)) {
      setError(PHONE_ERROR);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(BUSINESS_FORM_SLUG, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data: { tipi_kerkeses: requestType, ...extra },
      });
      setSent(true);
    } catch (cause: unknown) {
      if (cause instanceof PublicApiError) {
        setError(
          cause.isValidation
            ? "Disa fusha nuk janë të vlefshme. Kontrollo të dhënat dhe provo përsëri."
            : cause.message,
        );
      } else {
        setError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { sent, error, isSubmitting, submit };
}

/**
 * Submit state and POST for the /biznese/klasa room booking band.
 *
 * A sibling of `useBusinessLead` rather than a parameter on it: this posts to a different
 * form (CLASS_BOOKING_FORM_SLUG) with a different answer shape, and folding both into one
 * hook would mean every caller passing a slug plus a field map to satisfy the other one.
 *
 * `klasa` is REQUIRED by the form, so it is validated here too — the visitor gets an
 * Albanian sentence instead of a 400 from the server.
 */
function useClassBooking() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(
    contact: { name: string; email: string; phone: string },
    answers: { klasa: string; data_deshiruar: string; nr_personave: string; shenime: string },
  ) {
    if (isSubmitting) return;

    if (!answers.klasa) {
      setError("Ju lutemi zgjidhni klasën që doni të rezervoni.");
      return;
    }
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setError("Ju lutemi plotësoni emrin, email-in dhe numrin e telefonit.");
      return;
    }
    if (!isValidPhone(contact.phone)) {
      setError(PHONE_ERROR);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(CLASS_BOOKING_FORM_SLUG, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        data: answers,
      });
      setSent(true);
    } catch (cause: unknown) {
      if (cause instanceof PublicApiError) {
        setError(
          cause.isValidation
            ? "Disa fusha nuk janë të vlefshme. Kontrollo të dhënat dhe provo përsëri."
            : cause.message,
        );
      } else {
        setError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { sent, error, isSubmitting, submit };
}

/** Anchor for the room cards' "Rezervo" buttons to scroll to. */
const KLASA_BOOKING_ID = "rezervo-klasen";

const BIZNESE_TRAJNIME_IMG_POSITION = "center 50%";

function PageBizneseTrajnime() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const lead = useBusinessLead(BUSINESS_REQUEST_TYPES.TRAININGS);
  const [biz, setBiz] = useState({ kompania: "", personi: "", email: "", telefoni: "" });
  const faqs = [
    ["Sa zgjat një trajnim i personalizuar?", "Kohëzgjatja përcaktohet sipas temës, nivelit të pjesëmarrësve dhe objektivave të kompanisë."],
    ["Si mund të kërkojmë një ofertë?", "Na kontaktoni duke përshkruar nevojat, fushën e trajnimit dhe numrin e pjesëmarrësve. Ekipi ynë do t’ju propozojë zgjidhjen dhe ofertën përkatëse."],
    ["Si përcaktohet çmimi i trajnimit?", "Çmimi varet nga përmbajtja, kohëzgjatja, formati dhe numri i pjesëmarrësve. Pas analizës së kërkesës, kompania pranon një ofertë të personalizuar."],
    ["A pajisen pjesëmarrësit me certifikatë pas përfundimit të trajnimit?", "Po, çdo pjesëmarrës merr certifikatë të njohur nga Cacttus Education pas përfundimit me sukses."],
    ["A ruhet konfidencialiteti i të dhënave të kompanisë?", "Po. Informacionet dhe rastet e brendshme të përdorura gjatë trajnimit trajtohen sipas kushteve të dakorduara me kompaninë."],
  ];

  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — split layout, left text right photo */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Trajnime të personalizuara" }]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>           
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
                Investoni në aftësitë, zhvillimin dhe të ardhmen e ekipit tuaj!
              </h1>
              <p className="text-lg mb-8" style={{ color: C.muted }}>
                Programe trajnimi të personalizuara sipas nevojave të biznesit tuaj, nga analiza dhe zhvillimi i aftësive deri te vlerësimi dhe certifikimi i stafit.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/kontakti"><PrimaryBtn>Na kontaktoni</PrimaryBtn></Link>
              </div>
            </div>
            <div className="aspect-[5/3] rounded-[20px] overflow-hidden" style={{ backgroundColor: C.n100 }}>
              <img src={trajnimePersonalizuara} alt="Trajnim i personalizuar" className="w-full h-full object-cover" style={{ objectPosition: BIZNESE_TRAJNIME_IMG_POSITION }} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. The problem — 3 columns */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: C.n900 }}>Qasje e personalizuar për zhvillimin e ekipit tuaj</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Trajnime të personalizuara", desc: "Programe të përshtatura sipas nevojave, objektivave dhe roleve specifike të ekipit tuaj." },
              { icon: Users, title: "Ekspertë nga industria", desc: "Trajnime praktike të udhëhequra nga profesionistë me përvojë në fushat përkatëse." },
              { icon: Monitor , title: "Formate fleksibile", desc: "Trajnime në klasë, online ose në format hibrid, të organizuara sipas orarit të biznesit tuaj." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={22} style={{ color: C.brand }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ color: C.n900 }}>{title}</h4>
                <p className="text-sm" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Comparison — hire vs reskill */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[900px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: C.n900 }}>Pse të rikualifikoni në vend që të punësoni?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-2xl" style={{ backgroundColor: C.n50, border: `1px solid ${C.n200}` }}>
              <h4 className="font-semibold mb-5 text-lg" style={{ color: C.n700 }}>Punësim i ri</h4>
              {["Kosto rekrutimi 6,000–12,000€", "Kohë pritjeje 2–4 muaj", "Rreziku i papërshtatshmërisë kulturore", "Ndikimi i ulët i organizatës"].map((d) => (
                <div key={d} className="flex items-center gap-3 mb-3 text-sm" style={{ color: C.n600 }}>
                  <span style={{ color: C.n400 }}>—</span> {d}
                </div>
              ))}
            </div>
            <div className="p-7 rounded-2xl relative" style={{ backgroundColor: C.brand, border: `2px solid ${C.brand}`, boxShadow: "0 8px 32px rgba(130,54,133,0.25)" }}>
              <span className="absolute -top-3 right-6 text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: C.brandDark }}>E rekomanduar</span>
              <h4 className="font-semibold mb-5 text-lg text-white">Rikualifikim i brendshëm</h4>
              {["Kosto 3–5× më e ulët", "Rezultate brenda 6–8 javësh", "Staf i motivuar dhe besnik", "Njohuri të thella të proceseve tuaja"].map((d) => (
                <div key={d} className="flex items-center gap-3 mb-3 text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
                  <Check size={14} className="shrink-0" /> {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. How it works — 4 steps */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Si funksionon?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { n: 1, title: "Analiza e nevojave", desc: "Vlerësojmë aftësitë ekzistuese dhe identifikojmë nevojat për zhvillim." },
              { n: 2, title: "Dizajnimi i programit", desc: "Hartojmë një program të personalizuar sipas objektivave të kompanisë." },
              { n: 3, title: "Realizimi i trajnimit", desc: "Ekspertët tanë zhvillojnë trajnimin në klasë, online ose në ambientet tuaja." },
              { n: 4, title: "Vlerësimi dhe certifikimi", desc: "Vlerësojmë rezultatet dhe certifikojmë pjesëmarrësit pas përfundimit." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="p-6 rounded-2xl relative" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="text-7xl font-black absolute top-4 right-4 leading-none select-none" style={{ color: C.brandLight }}>0{n}</div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white mb-4 relative z-10" style={{ backgroundColor: C.brand }}>{n}</div>
                <h4 className="font-semibold mb-2 relative z-10" style={{ color: C.n900 }}>{title}</h4>
                <p className="text-sm relative z-10" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Topics grid */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Çfarë mund të trajnojmë?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Code, topic: "Programim", desc: "Zhvillim full stack ueb dhe mobile" },
              { icon: BarChart, topic: "Administrim", desc: "Sisteme, rrjete dhe baza të të dhënave" },
              { icon: Shield, topic: "Siguri kibernetike", desc: "Mbrojtje, monitorim dhe reagim ndaj incidenteve" },
              { icon: Globe, topic: "Marketing dhe dizajn", desc: "Marketing digjital, dizajn grafik dhe UI/UX" },
              { icon: Laptop, topic: "Menaxhim i projekteve", desc: "Planifikim, Agile dhe Scrum" },
              { icon: Users, topic: "Shkathtësi të buta", desc: "Komunikim, udhëheqje dhe punë ekipore" },
            ].map(({ icon: Icon, topic, desc }) => (
              <div key={topic} className="flex items-start gap-4 p-5 rounded-xl" style={{ border: `1px solid ${C.cardBorder}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={18} style={{ color: C.brand }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.n900 }}>{topic}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Stats band */}
      <section className="py-16" style={{ backgroundColor: C.brand }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[["65+", "Kompani të trajnuara"], ["800+", "Punonjës të rikualifikuar"], ["50+", "Ligjërues dhe ekspertë"], ["23 vite", "Përvojë trajnimi"]].map(([num, label]) => (
              <div key={label}>
                <p className="text-4xl font-bold text-white mb-1">{num}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[720px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: C.n900 }}>Pyetje të shpeshta</h2>
          <div className="flex flex-col divide-y" style={{ borderTop: `1px solid ${C.n200}`, borderBottom: `1px solid ${C.n200}` }}>
            {faqs.map(([q, a], i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium pr-4" style={{ color: C.n900 }}>{q}</span>
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brandLight }}>
                    {openFaq === i ? <Minus size={13} style={{ color: C.brand }} /> : <Plus size={13} style={{ color: C.brand }} />}
                  </span>
                </button>
                {openFaq === i && <p className="pb-5 text-sm leading-relaxed" style={{ color: C.muted }}>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Contact form band */}
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="rounded-3xl px-8 md:px-12 py-12" style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}>
            <h2 className="text-2xl font-bold text-white mb-2">Keni nevojë për trajnime të personalizuara?</h2>
            <p className="text-white/70 text-sm mb-8">Na kontaktoni dhe do t'ju ofrojmë një propozim brenda 48 orëve.</p>
            {lead.sent ? (
              <p className="text-white text-sm font-semibold">Faleminderit! Kërkesa u dërgua — do t'ju kontaktojmë brenda 48 orëve.</p>
            ) : (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {([
                { ph: "Emri i kompanisë", key: "kompania" },
                { ph: "Personi kontaktues", key: "personi" },
                { ph: "Email", key: "email" },
                { ph: "Telefoni", key: "telefoni" },
              ] as const).map(({ ph, key }) => (
                <input key={ph} type="text" placeholder={ph} value={biz[key]} onChange={(e) => setBiz({ ...biz, [key]: key === "telefoni" ? sanitizePhone(e.target.value) : e.target.value })} className="px-4 text-sm rounded-xl" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
              ))}
              <button onClick={() => lead.submit({ name: biz.personi, email: biz.email, phone: biz.telefoni }, { kompania: biz.kompania })} className="h-[52px] px-6 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 whitespace-nowrap" style={{ backgroundColor: "#fff", color: C.brand }}>
                {lead.isSubmitting ? "Duke dërguar…" : "Kontaktoni ne"}
              </button>
            </div>
                {lead.error && <p className="text-white text-sm mt-3">{lead.error}</p>}
              </>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

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
type TalentPerson = {
  readonly name: string;
  readonly role: string;
  readonly photo: string | null;
  readonly imgPosition: string;
  readonly cvUrl: string | null;
};

const TALENT_PEOPLE = {
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
const TALENT_CATEGORIES = [
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

/*
  One person's card. Same frame as the sample card it replaces — same padding, radius,
  shadow, border, the same 64px circle and the same divider under the header.

  What is GONE, deleted rather than hidden: the five-star row with "4.9", the tech tag
  pills, and the small outlined "CV" button. Their space is not left empty — the header's
  own `pb-5` and the divider now carry the rhythm, and the purple button spans the full
  width the two buttons used to share. Three elements out, nothing floating.

  `h-full` matters inside the carousel: every card sits in the same flex row, so the row is
  as tall as the tallest of them and each card stretches to match. Without it, moving from
  a one-line role to a three-line one would change the card's height mid-slide.
*/
/*
  ─── Talent card: NO shadow, by decision ───

  Two shadow attempts were rejected on this card — Tailwind's `shadow-2xl` (one hard
  offset, reads as a dark smear) and a layered purple-tinted elevation (too heavy against
  the tinted panel it sits on). The card now casts nothing at all.

  What separates it from the panel instead is cheaper and cleaner, and is what most
  restrained "premium" UI actually leans on:

    · a real 1px border in a brand tint, not a grey hairline
    · white card on a tinted panel — the contrast IS the separation
    · generous internal padding, so the content is not crowding its own edges
    · one 3px brand accent along the top edge

  Nothing here should reintroduce `boxShadow` on the card surface. The only shadow left
  anywhere in this component is the white/lilac RING around the avatar, which is a
  spread-only ring drawn with box-shadow — a border substitute, not an elevation effect.
*/
const TALENT_AVATAR_RING = (ringInner: string, ringOuter: string) =>
  `0 0 0 3px ${ringInner}, 0 0 0 4px ${ringOuter}`;

function TalentCard({ person }: { person: TalentPerson }) {
  return (
    <div
      className="h-full rounded-[20px] overflow-hidden flex flex-col"
      style={{
        /* Flat white now, not a wash. With no shadow the border is doing all the
           separating, and a gradient that fades toward the panel's own tint softened the
           bottom edge exactly where that border needs to read hardest. */
        backgroundColor: C.n0,
        /* `p200` rather than the near-invisible `p100`: this line IS the card's edge now,
           so it has to be visible on its own. Still a brand tint, never grey. */
        border: `1px solid ${C.p200}`,
      }}
    >
      {/* Brand accent, 3px, full bleed across the top. The card's one piece of saturated
          colour besides the button — enough to tie it to #823685 without competing with
          the photo. `overflow-hidden` on the parent is what keeps its ends rounded. */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${C.brand} 0%, ${C.p400} 55%, ${C.p300} 100%)` }} />

      {/* p-8, up from p-7: with no shadow the padding is doing more of the work of making
          the card feel considered rather than cramped. */}
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-center gap-4">
          {/*
            72px, up from 64. The photo is the first thing read on this card and at 64 it
            was the same weight as the text beside it.

            The double ring is drawn with `box-shadow`, not `border`: a border would eat
            into the 72px box and shrink the face inside it, while spread-only shadows are
            painted outside the element and leave the image untouched. White ring first,
            then the pale purple, so the photo is separated from the tint behind it.
          */}
          <div
            className="w-[72px] h-[72px] rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              backgroundColor: C.n100,
              /* Ring only — the drop-shadow that used to trail this is gone with the rest. */
              boxShadow: TALENT_AVATAR_RING(C.n0, C.p200),
            }}
          >
            {person.photo ? (
              <img src={person.photo} alt="" className="w-full h-full object-cover" style={{ objectPosition: person.imgPosition }} />
            ) : (
              /* Same placeholder the instructor cards use when a portrait is missing. */
              <Users size={26} style={{ color: C.p300 }} />
            )}
          </div>
          <div className="min-w-0">
            {/* Bigger and heavier than the role beneath it — the two used to be a
                half-step apart, which read as one block of text rather than a name with a
                caption. Negative tracking is what the rest of the site's headings use. */}
            <p className="text-lg font-bold leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>{person.name}</p>
            <p className="text-sm mt-1.5 leading-snug" style={{ color: C.muted }}>{person.role}</p>
          </div>
        </div>

        {/* A hairline that FADES rather than a flat 1px rule running wall to wall. Drawn as
            a 1px element with a gradient background, since a border cannot fade. */}
        <div className="h-px my-6" style={{ background: `linear-gradient(90deg, ${C.p200} 0%, ${C.p100} 45%, transparent 100%)` }} />

        {/* `mt-auto` pins the button to the bottom, so a short card and a tall one in the
            same carousel line their buttons up instead of floating them mid-card. */}
        <div className="mt-auto">
          {/*
            An <a> when there is a CV, a bare <button> when there is not — same markup and
            styling either way, so the card looks identical in both states.

            An anchor rather than `onClick={() => window.open(...)}` because opening a
            document IS navigation: middle-click, ctrl-click, "open in new tab" and "copy
            link address" all work on a real href and all silently do nothing on a button.
            The same choice, for the same reason, as the "Shkarko planprogramin" links.

            `rel="noopener noreferrer"` goes with every `target="_blank"`: without
            `noopener` the opened tab gets a `window.opener` handle back into this one and
            can navigate it somewhere else.

            `block text-center` on the <a> reproduces what the <button> gave for free —
            an anchor is inline by default and would otherwise shrink to its text.
          */}
          {person.cvUrl ? (
            <a
              href={person.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 rounded-[14px] text-sm font-semibold text-white transition-colors active:scale-[0.98]"
              style={{ backgroundColor: C.brand, letterSpacing: "0.01em" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.brandDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.brand; }}
            >
              Shkarko CV
            </a>
          ) : (
            <button
              className="w-full py-3 rounded-[14px] text-sm font-semibold text-white transition-colors active:scale-[0.98]"
              style={{
                /* Flat brand fill and no glow, to match the shadow-free card. Depth here
                   comes from the colour darkening on hover — the same move PrimaryBtn
                   makes everywhere else on the site — rather than from a cast shadow. */
                backgroundColor: C.brand,
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.brandDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.brand; }}
            >
              Shkarko CV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/*
  The carousel. ONE card visible, arrows on desktop, swipe on touch.

  Built on native scroll-snap rather than a transform slider or a library: the track is a
  real horizontally scrollable element, so a phone's own inertial swipe, a trackpad's
  two-finger flick and a screen reader's focus order all work for free. The arrows just
  scroll it. A transform-based slider would have to reimplement every one of those.

  `index` is derived FROM the scroll position rather than being the thing that drives it,
  which is what keeps the counter honest when the user swipes instead of clicking: the
  arrows call `scrollTo`, the scroll handler reports where the track actually landed.

  Resetting on `people` is what makes switching category feel right — pick a new category
  while on the 6th card and the carousel starts at the first person again, not on an
  index that may not exist in the new, shorter list.
*/
function TalentCarousel({ people }: { people: readonly TalentPerson[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const track = trackRef.current;
    if (!track) return;
    /* Jump, do not glide: this is a category switch, not a step through a list, and
       animating back to the start reads as a glitch. The track carries CSS
       `scroll-behavior: smooth`, so it is suspended for this one assignment and restored
       immediately after. */
    track.style.scrollBehavior = "auto";
    track.scrollLeft = 0;
    track.style.scrollBehavior = "";
  }, [people]);

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(target, people.length - 1));
    /*
      Assigning `scrollLeft` and letting CSS `scroll-behavior: smooth` animate it —
      NOT `scrollTo({ behavior: "smooth" })`.

      Measured: with `scroll-snap-type: x mandatory` on this track, Chrome cancels a
      programmatic smooth animation and re-snaps to where it started, so the arrows moved
      the counter while the track never left scrollLeft 0. The direct assignment is not
      cancelled, and the CSS property still animates it.
    */
    track.scrollLeft = clamped * track.clientWidth;
    setIndex(clamped);
  };

  /* Rounding to the nearest slide rather than flooring: mid-swipe the track sits between
     two cards, and flooring would report the previous one until the very last pixel. */
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const atStart = index <= 0;
  const atEnd = index >= people.length - 1;

  const arrowStyle = (disabled: boolean) => ({
    border: `1px solid ${disabled ? C.n200 : C.brand}`,
    color: disabled ? C.n400 : C.brand,
    backgroundColor: C.n0,
    cursor: disabled ? "default" : "pointer",
  });

  return (
    /*
      A contained panel behind the whole carousel. The card used to float on bare white
      with nothing framing it, which is what made it read as unfinished.

      The radial gradient is anchored at the TOP CENTRE, directly behind the card's head,
      so the tint is strongest where the photo and name are and washes out to white at the
      edges. A flat tinted rectangle would just look like a grey box; a gradient that
      follows the content gives the card something to sit in.
    */
    <div
      className="rounded-3xl p-5 sm:p-6"
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${C.brandLight} 0%, ${C.brandSoft} 42%, ${C.n0} 100%)`,
        border: `1px solid ${C.p100}`,
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={atStart}
          aria-label="Talenti i mëparshëm"
          className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center shrink-0 transition-colors"
          style={arrowStyle(atStart)}
        >
          <ChevronLeft size={18} />
        </button>

        {/*
          `overflow-x-auto` + `snap-x snap-mandatory` is the carousel itself.
          `scrollbar-width: none` (and the WebKit pseudo-element, which Tailwind cannot
          express, hence the <style> once at the page level) hides the bar without
          disabling the scrolling that makes swipe work.
        */}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          /* `py-1` is enough now that the card casts nothing — it only keeps the border
             off the scroll container's own edge. Horizontal padding is still deliberately
             NOT added: `clientWidth` includes padding, and the arrows scroll by exactly one
             `clientWidth` per slide, so a left/right pad would drift the carousel further
             out of alignment with every step. */
          className="talent-track flex-1 min-w-0 flex overflow-x-auto snap-x snap-mandatory py-1"
          style={{ scrollbarWidth: "none", scrollBehavior: "smooth" }}
        >
          {people.map((person) => (
            /* `w-full shrink-0` is what makes exactly one card fill the viewport of the
               track; `snap-center` is what makes a swipe settle on a card, never between
               two. `p-1` leaves the card's own shadow room to render instead of being
               clipped by the scroll container's edge. */
            <div key={person.name} className="w-full shrink-0 snap-center p-1">
              <TalentCard person={person} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={atEnd}
          aria-label="Talenti i radhës"
          className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center shrink-0 transition-colors"
          style={arrowStyle(atEnd)}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Position readout, promoted from loose grey text to a pill that matches the card's
          own surface — white, hairline purple border, the same soft contact shadow. The
          CURRENT number carries brand colour and weight while the total stays muted, so
          the pair reads as "where you are, out of how many" at a glance. */}
      {people.length > 1 && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <span
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold tabular-nums"
            style={{
              backgroundColor: C.n0,
              border: `1px solid ${C.p200}`,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: C.brand }}>{index + 1}</span>
            <span style={{ color: C.n400 }}> / {people.length}</span>
          </span>
          {/* Touch only: on desktop the arrows already say this. */}
          <span className="sm:hidden text-xs" style={{ color: C.n500 }}>rrëshqit për të parë më shumë</span>
        </div>
      )}
    </div>
  );
}

function PageBizneseTalente() {
  const lead = useBusinessLead(BUSINESS_REQUEST_TYPES.PARTNERSHIP);
  /* No separate contact-person input on this box, so the COMPANY is the lead's `name`.
     It is also sent as `kompania` so the inbox shows it under its own label. */
  const [talente, setTalente] = useState({ kompania: "", email: "", telefoni: "", fusha: "" });
  /* Which category the list on the left has selected, and therefore whose people the
     carousel beside it shows. An INDEX into TALENT_CATEGORIES rather than a role string:
     the index cannot drift out of sync with a renamed category, and it is what the
     carousel needs to look the list up anyway. Starts at 0 so the section is never empty
     on arrival — the page opens on Web & Mobile Developers. */
  const [activeTalentCategory, setActiveTalentCategory] = useState(0);

  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — centered */}
      <section className="py-24 text-center" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[760px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Rrjeti i talentëve" }]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
            Gjeni profesionistët e rinj që kërkon biznesi juaj!
          </h1>
          <p className="text-lg mb-8" style={{ color: C.muted }}>Eksploroni CV-të, aftësitë dhe përvojën e studentëve dhe të diplomuarve tanë, të përgatitur për praktikë dhe punësim në industrinë e teknologjisë.</p>
          <PrimaryBtn onClick={() => scrollToSection(TALENTE_LIST_ID)}>Mëso më shumë</PrimaryBtn>

          {/* Avatars row */}
          <div className="flex items-center justify-center mt-10 gap-1">
            {[
              /* Real talents now, in display order. `imgPosition` per avatar — a face sits
                 differently in each source crop, so one shared value cannot centre all
                 five. Raise the second number to push that avatar's image DOWN in its
                 circle, lower it to pull the face UP. */
              { url: talentMirlindArifi, imgPosition: "center 50%" },
              { url: talentDinaZejneli, imgPosition: "center 50%" },
              { url: talentAltinMorina, imgPosition: "center 50%" },
              { url: talentArjanaBellaqa, imgPosition: "center 50%" },
              { url: talentFatjonKerceli, imgPosition: "center 50%" },
            ].map(({ url, imgPosition }, i) => (
              <div key={i} className="w-12 h-12 rounded-full overflow-hidden -ml-2 first:ml-0 ring-2 ring-white" style={{ backgroundColor: C.n100 }}>
                <img src={url} alt="" className="w-full h-full object-cover" style={{ objectPosition: imgPosition }} />
              </div>
            ))}
            {/*
              The "+200 talente" pill used to sit here. Removing it is all the re-centring
              this row needs: the wrapper is already `justify-center`, and flexbox centres
              whatever it actually contains — the pill was simply part of that content, so
              its width pushed the circles left of true centre. With it gone the five
              circles are the only children and land dead centre under the button. No
              margin or offset is added to compensate; there is nothing left to compensate
              for.
            */}
          </div>
        </div>
      </section>

      {/* 2. Stats strip */}
      <section className="py-0">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden -mt-8 relative z-10 shadow-xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
            {[["1,000+", "Të diplomuar"], ["2 javë", "Kohë mesatare punësimi"], ["40+", "Kompani partnere"], ["88%", "Shkallë punësimi"]].map(([num, label], i) => (
              <div key={label} className="p-6 text-center" style={{ borderLeft: i > 0 ? `1px solid ${C.n200}` : "none" }}>
                <p className="text-3xl font-bold mb-1" style={{ color: C.brand }}>{num}</p>
                <p className="text-xs" style={{ color: C.muted }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Who you get — the landing spot for the hero's "Mëso më shumë". */}
      <section id={TALENTE_LIST_ID} className="py-24 scroll-mt-28" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Cilët talente gjeni në rrjetin tonë</h2>
          {/* WebKit has no CSS property for hiding a scrollbar, only a pseudo-element, and
              Tailwind cannot express one — so the track's bar is hidden here. Scrolling
              itself is untouched, which is what keeps the swipe working. */}
          <style>{`.talent-track::-webkit-scrollbar { display: none; }`}</style>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col gap-3">
              {TALENT_CATEGORIES.map(({ role, skills }, i) => {
                const selected = i === activeTalentCategory;
                return (
                  /*
                    A real <button>, not a clickable <div>: this changes what is shown
                    beside it, so it has to be reachable by keyboard and announced as a
                    control. `aria-pressed` is what tells a screen reader WHICH category is
                    the current one — the colour change alone says nothing to it.
                  */
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveTalentCategory(i)}
                    aria-pressed={selected}
                    className="p-4 rounded-xl flex gap-4 text-left w-full transition-all hover:shadow-md"
                    style={{
                      border: `1px solid ${selected ? C.brand : C.cardBorder}`,
                      backgroundColor: selected ? C.brandLight : "transparent",
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: selected ? C.brand : C.brandLight }}>
                      <UserCheck size={16} style={{ color: selected ? "#fff" : C.brand }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: C.n900 }}>{role}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{skills}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <TalentCarousel people={TALENT_CATEGORIES[activeTalentCategory].people} />
          </div>
        </div>
      </section>

      {/* 4. How it works for employers */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Si funksionon për punëdhënësit:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-15">
            {[["1", "Zgjidhni fushën", "Filtroni kandidatët sipas drejtimit dhe profilit profesional që kërkoni."], ["2", "Shfletoni profilet", "Shqyrtoni CV-të, aftësitë, përvojën dhe projektet e kandidatëve."], ["3", "Kërkoni intervistë", "Zgjidhni kandidatin dhe dërgoni kërkesën për kontakt ose intervistë."]].map(([n, title, desc]) => (
              <div key={n} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white mb-5" style={{ backgroundColor: C.brand }}>{n}</div>
                <h4 className="font-semibold mb-2" style={{ color: C.n900 }}>{title}</h4>
                <p className="text-sm" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Benefits grid */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Pse të zgjidhni alumni tanë:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: Code, title: "Aftësi të zhvilluara në praktikë", desc: "Njohuri të fituara përmes laboratorëve, detyrave dhe projekteve praktike." },
              { icon: FileText, title: "CV dhe portofol profesional", desc: "Informacion i qartë mbi aftësitë, projektet dhe përvojën e secilit kandidat." },
              { icon: GraduationCap, title: "Planprograme të orientuara drejt industrisë", desc: "Programe të zhvilluara sipas teknologjive dhe kërkesave të tregut të punës." },
              { icon: MessageSquare, title: "Aftësi profesionale", desc: "Komunikim, punë ekipore, mendim kritik dhe prezantim profesional." },
              { icon: Zap, title: "Kandidatë për praktikë dhe punësim", desc: "Profile të përshtatshme për praktikë profesionale dhe pozita junior." },
              { icon: Award, title: "Pa tarifë rekrutimi", desc: "Qasja në profilet dhe CV-të e kandidatëve ofrohet pa pagesë." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl" style={{ border: `1px solid ${C.cardBorder}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={18} style={{ color: C.brand }} />
                </div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: C.n900 }}>{title}</h4>
                <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Join CTA */}
      <section className="py-16" style={{ backgroundColor: C.brand }}>
        <div className="max-w-[900px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Regjistrohu si punëdhënës partner</h2>
          {lead.sent ? (
            <p className="text-white text-sm font-semibold text-center">Faleminderit! Regjistrimi u dërgua — do t'ju kontaktojmë së shpejti.</p>
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {([
              { ph: "Kompania", key: "kompania" },
              { ph: "Email", key: "email" },
              { ph: "Telefoni", key: "telefoni" },
              { ph: "Fusha e interesit", key: "fusha" },
            ] as const).map(({ ph, key }) => (
              <input key={ph} type="text" placeholder={ph} value={talente[key]} onChange={(e) => setTalente({ ...talente, [key]: key === "telefoni" ? sanitizePhone(e.target.value) : e.target.value })} className="px-4 text-sm rounded-xl" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
            ))}
            {/*
              The four inputs fill row 1 of the 4-column grid exactly, which leaves this
              button alone in row 2 — pinned to the left with ~650px of empty space
              beside it, under a heading that is centred. Spanning all four tracks and
              centring the button inside them puts it back under the heading;
              `justify-self-center` keeps its own width rather than stretching it across
              the row.

              Keyed to `md:`, the SAME breakpoint that turns the grid into four columns.
              Tying it to the row layout rather than to a screen size is what keeps the
              two from ever disagreeing: below `md` the grid is a single column, this
              button is the only thing in its row, and both utilities are inert — so the
              stacked phone layout is untouched.
            */}
            <button onClick={() => lead.submit({ name: talente.kompania, email: talente.email, phone: talente.telefoni }, { kompania: talente.kompania, fusha_interesit: talente.fusha })} className="h-[52px] px-6 rounded-xl font-semibold text-sm text-white md:col-span-4 md:justify-self-center" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>{lead.isSubmitting ? "Duke dërguar…" : "Regjistrohu në rrjet"}</button>
          </div>
              {lead.error && <p className="text-white text-sm mt-3 text-center">{lead.error}</p>}
            </>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}

/* ── 5.3 BURSA E IMPAKTIT ── */

/*
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  HERO IMAGE CROP — this is the knob to turn.                                 │
  │                                                                              │
  │  Second value = vertical. LOWER % moves the visible slice UP, HIGHER % moves │
  │  it DOWN. "center 0%" pins the top edge, "center 100%" the bottom.           │
  └──────────────────────────────────────────────────────────────────────────────┘

  Same control the study-programme hero exposes as its `imgPosition` prop. It is a
  plain const here rather than a prop because that hero is one shared component behind
  several routes — each page passes its own crop — whereas this page is rendered once,
  as a bare `<PageBizneseBursa />`, and has no caller to pass anything. Threading a prop
  in would only move the number out to the route table, further from the markup it
  affects.

  It stays an inline `style`, not a Tailwind `object-[...]` class, for the reason spelled
  out on the reference hero: Tailwind generates CSS by scanning source for complete class
  names, so a value composed at runtime would match nothing and silently produce no rule.

  Why it matters at all: the frame is a 16:10 landscape and photos dropped into it are
  usually taller, so most of the source height is discarded. `object-cover` keeps the
  middle by default — on a photo of people that tends to land on chins and chests.
*/
const BURSA_HERO_IMG_POSITION = "center 40%";

/*
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  SPONSORS — ⚠ PLACEHOLDER DATA. This is the array to edit.                   │
  │                                                                              │
  │  To add a real sponsor:                                                      │
  │    1. drop the logo file into src/imports/                                   │
  │    2. `import sponsorTeb from "../imports/teb.svg";` up with the other        │
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
interface BursaSponsor {
  /* Shown under the logo area and used as the image's alt text. */
  readonly name: string;
  /* An imported image, or null while this row is a placeholder. */
  readonly logo: string | null;
  /* Scholarships funded, rendered as "20x Bursa". */
  readonly scholarships: number;
}

const BURSA_SPONSORS: readonly BursaSponsor[] = [
  /* ⚠ Logos are real; the scholarship counts are still placeholders. */
  { name: "Harrisia", logo: sponsorHarrisia, scholarships: 20 },
  { name: "Doni", logo: sponsorDoni, scholarships: 20 },
  { name: "Cacttus", logo: sponsorCacttus, scholarships: 20 },
];

function PageBizneseBursa() {
  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — split, emotional */}
      {/*
        Sizing here deliberately mirrors the study-programme hero (PageStudimeProgram,
        the "Zhvillim i Ueb-it" page) so the two read as the same template: same section
        padding, same column gap, same top alignment, same landscape image frame. The two
        are NOT one component — this page's hero carries an overline, a single CTA and the
        floating stat card, none of which that one has — so the values are matched by hand
        rather than shared. If the reference hero's proportions are retuned, this block is
        the other half of that change.

        Background stays `n0`; the reference sits on `brandSoft`. That is this page's own
        look, not part of the layout being matched.
      */}
      <section className="py-12 md:py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Bursa e Impaktit" }]} />
          {/*
            `items-start`, not `items-center`. This is the whole reason the title used to
            float halfway down the hero: the image column was a 4:5 portrait running far
            taller than the text, and centring the short column against the tall one
            pushed the text down to meet its middle. Anchoring both to the top of the row
            puts the title directly under the breadcrumb, as on the reference page.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-30 items-start">
            <div>
            
              <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
                Investoni në të ardhmen e një të riu dhe të sektorit teknologjik
              </h1>
              {/* `leading-relaxed` to match the reference paragraph. The `mb-8` below it is
                  NOT reduced to the reference's `mb-6`: there the paragraph is followed by
                  a row of meta chips before the buttons, and this page has none, so the
                  larger gap is what keeps the CTA from crowding the text. */}
              <p className="text-lg leading-relaxed mb-8" style={{ color: C.muted }}>
                Çdo bursë e sponsorizuar hap derën e arsimit teknologjik për një student me talent që nuk ka mundësi financiare.
              </p>
              <Link to="/kontakti"><PrimaryBtn>Bëhu sponsor</PrimaryBtn></Link>
            </div>
            <div className="relative">
              {/* Landscape, matching the reference frame exactly: 4:3 on a phone, 16:10 from
                  `sm` up, and the same `2xl:w-[118%]` bleed into the right gutter on the
                  widest screens. Replaces a 4:5 portrait that made this hero roughly twice
                  the reference's height on its own. */}
              <div
                className="aspect-[4/3] sm:aspect-[16/10] 2xl:w-[118%] rounded-3xl overflow-hidden"
                style={{ backgroundColor: C.n100 }}
              >
                <img
                  src={bursaHeroImg}
                  alt="Student"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: BURSA_HERO_IMG_POSITION }}
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-2xl px-5 py-4 shadow-xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <p className="text-3xl font-bold" style={{ color: C.brand }}>70+</p>
                <p className="text-xs" style={{ color: C.muted }}>Bursa të ndara</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Narrative */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[720px] mx-auto px-5 text-center">
          <h2 className="text-2xl font-bold mb-6" style={{ color: C.n900 }}>Çfarë është Bursa e Impaktit?</h2>
          <p className="text-base leading-loose mb-4" style={{ color: C.muted }}>
            Bursa e Impaktit është një program bashkëpunimi ndërmjet Cacttus Education dhe bizneseve që synojnë të investojnë në zhvillimin e talenteve të reja në teknologji. Përmes mbështetjes financiare dhe mentorimit, kompanitë u mundësojnë studentëve me potencial dhe motivim, por me mundësi të kufizuara financiare, të ndjekin studime profesionale cilësore, duke mbuluar tarifën vjetore.

Si sponsor, kompania juaj fiton njohje publike, qasje prioritare në rrjetin e studentëve dhe të diplomuarve, si dhe raporte të qarta mbi ndikimin e investimit. Ky partneritet forcon imazhin e biznesit si mbështetës i edukimit dhe inovacionit, duke krijuar njëkohësisht lidhje të qëndrueshme me profesionistët e ardhshëm të industrisë.
          </p>
        
        </div>
      </section>

      {/* 3. Impact stats */}
      <section className="py-16" style={{ backgroundColor: C.brandLight }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[["70+", "Bursa të ndara"], ["80%", "Tarifë studimi e mbuluar"], ["15+", "Kompani Sponsorizuese"], ["75%", "Punësim pas diplomimit"]].map(([num, label]) => (
              <div key={label}>
                <p className="text-4xl font-bold mb-1" style={{ color: C.brand }}>{num}</p>
                <p className="text-sm" style={{ color: C.muted }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How sponsorship works */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Si funksionon sponsorizimi?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Star, step:"Përcaktoni nivelin e mbështetjes", desc: "Zgjidhni numrin e bursave dhe përqindjen e tarifës që dëshironi të financoni." },
              { icon: FileText, step: "Formalizoni partneritetin", desc: "Përcaktojmë kriteret, kohëzgjatjen dhe përgjegjësitë përmes një marrëveshjeje të qartë." },
              { icon: UserCheck, step: "Përzgjedhim përfituesit", desc: "Studentët përzgjidhen sipas potencialit, motivimit, rezultateve dhe nevojës financiare." },
              { icon: BarChart, step: "Raportimi", desc: "Pranoni raporte periodike mbi progresin e studentëve dhe rezultatet e mbështetjes suaj." },
            ].map(({ icon: Icon, step, desc }) => (
              <div key={step} className="flex flex-col items-center text-center p-5 rounded-2xl" style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={20} style={{ color: C.brand }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: C.n900 }}>{step}</p>
                <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Current sponsors */}
      {/*
        A card per sponsor, replacing the scrolling `InfiniteLogoMarquee` that used to sit
        here. That marquee is fed by PARTNER_LOGO_IMAGES — the site-wide tech-partner set
        (TEB, RITECH, KEDS, gjirafa.com …), which are training/industry partners, not
        scholarship funders. It still runs unchanged on the pages that legitimately show
        partners; this page simply stops borrowing it.

        A grid rather than a marquee because each entry now carries a number that has to be
        read, and a logo sliding past cannot be read.
      */}
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Same treatment as the "Si funksionon sponsorizimi?" h2 above: text-2xl,
              font-bold, centred, n900, mb-12. Kept as a <p> — it introduces the grid
              rather than titling a new section, and this page already has its h2s. */}
          <p className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>
            Faleminderit sponsorëve tanë për mbështetjen e vazhdueshme
          </p>
          {/* One across on a phone, then the full row from `sm` up. Three columns, not the
              four this started as: with three sponsors a four-track grid leaves a visibly
              empty fourth cell and shoves the row off-centre. Track count follows the data. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {BURSA_SPONSORS.map(({ name, logo, scholarships }) => (
              <div
                key={name}
                className="rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
              >
                {/* Logo well. Fixed height so a wide wordmark and a square glyph produce
                    the same card — the frame is the constant, the logo fits inside it. */}
                <div className="h-28 flex items-center justify-center px-6">
                  {logo ? (
                    <img src={logo} alt={name} loading="lazy" className="max-w-full max-h-16 object-contain" />
                  ) : (
                    /* ⚠ PLACEHOLDER — shown whenever `logo` is null in BURSA_SPONSORS. */
                    <div className="flex flex-col items-center gap-1.5" style={{ color: C.n400 }}>
                      <Building2 size={28} strokeWidth={1.5} />
                      <span className="text-xs font-medium tracking-wide">Logo</span>
                    </div>
                  )}
                </div>
                {/* The brand accent: a short purple rule, not a full-width bar across the
                    top. Enough colour to tie the card to the palette without turning the
                    logo well into a header. */}
                <div className="flex justify-center">
                  <span className="block w-8 h-[3px] rounded-full" style={{ backgroundColor: C.brand }} />
                </div>
                <div className="px-5 pt-4 pb-5 text-center">
                  <p className="text-sm font-semibold mb-2" style={{ color: C.n900 }}>{name}</p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                    style={{ backgroundColor: C.brandLight }}
                  >
                    <GraduationCap size={14} style={{ color: C.brand }} />
                    <span className="text-xs font-bold" style={{ color: C.brand }}>{scholarships}x Bursa</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </PageWrapper>
  );
}

/* ── 5.4 KLASËT ME QERA ── */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
const KLASA_HERO_IMG_POSITION = "center 50%";

function PageBiznestKlasa() {
  /*
    The booking band posts to the DEDICATED room-booking form now, not the general
    business-enquiry form: the band is literally "Rezervo hapësirën tënde", and a booking
    carries a room, which a general enquiry has no field for. `useBusinessLead` is still
    what the other two /biznese pages use.
  */
  const booking = useClassBooking();
  const [klasa, setKlasa] = useState({ emri: "", email: "", telefoni: "", data: "", pjesemarres: "", klasa: "", shenime: "" });

  /* A room card's "Rezervo" pre-selects that room and brings the band into view — the
     form already exists further down the page, so this reveals it rather than opening a
     modal the /biznese pages have no precedent for. */
  const bookRoom = (room: string) => {
    setKlasa((prev) => ({ ...prev, klasa: room }));
    document.getElementById(KLASA_BOOKING_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — image-led */}
      <section className="relative min-h-[60vh] flex items-end">
        <div className="absolute inset-0">
          <img src={klasaMeQeraHero} alt="Klasë moderne" className="w-full h-full object-cover" style={{ objectPosition: KLASA_HERO_IMG_POSITION }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.1) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-16 w-full">
          <div className="max-w-md rounded-2xl p-7 shadow-2xl" style={{ backgroundColor: "#fff" }}>
            <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Klasët me qera" }]} />
            <h1 className="text-4xl md:text-5xl font-bold mb-2 leading-tight" style={{ color: C.n900 }}>Hapësira moderne për trajnimet dhe eventet tuaja</h1>
            <p className="text-sm mb-5" style={{ color: C.muted }}>Klasa plotësisht të pajisura për trajnime, workshope, provime, takime dhe konferenca, në një lokacion të përshtatshëm.</p>
            {/* The HERO button only. The identically-labelled button further down this
                page is a form's submit control, not a link, and is left alone. */}
            <Link to="/kontakti"><PrimaryBtn>Rezervo tani</PrimaryBtn></Link>
          </div>
        </div>
      </section>

      {/* 2. Quick specs */}
      <section className="py-10" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              [Users, "Deri 30 persona"],
              [Monitor, "Kompjuterë dhe workstation"],
              [Projector, "Projektor"],
              [Wifi, "Free Wi-Fi"],
              [Wind, "Klimatizim"],
            ].map(([Icon, label]) => (
              <div key={label as string} className="flex items-center gap-3 px-5 py-3 rounded-full" style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}>
                <Icon size={18} style={{ color: C.brand }} />
                <span className="text-sm font-medium" style={{ color: C.n900 }}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The spaces */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Hapësirat tona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              /*
                `price` is the monthly figure in euro, or null for a room that is quoted
                rather than listed — null is what selects the "Çmimi me kërkesë" wording
                below, so a room becomes quote-only by clearing this field, not by editing
                markup.

                `accent` colours that price. Each is the room's own colour, sampled from
                the reference design rather than eyeballed, and is deliberately NOT one of
                the `C` brand tokens: these belong to the rooms, not to the site palette,
                and folding them into `C` would invite their reuse somewhere they mean
                nothing.

                ⚠ CONTRAST on white, large text needs 3:1 to meet WCAG AA:
                    #853A93 rozë    6.94:1  ok
                    #CF142B kuqe    5.54:1  ok
                    #00A651 gjelbër 3.19:1  ok, only just
                    #FAA700 portok. 1.98:1  FAILS
                    #FFC726 verdhë  1.56:1  FAILS
                The two failing values are kept because they are the rooms' actual colours
                and the brief asked for a match. Darker shades of the same hue that do pass
                are #C77A00 (3.38:1) and #B8860B (3.25:1) — swap them in here if the price
                proves hard to read against the white card.
              */
              { name: "Klasa Portokalli", capacity: "30 persona", price: 160, accent: "#FAA700", includes: ["30 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaPortokalli, imgPosition: "center 50%" },
              { name: "Klasa Rozë", capacity: "20 persona", price: 180, accent: "#853A93", includes: ["16 Kompjuterë iMac", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaRoze, imgPosition: "center 50%" },
              { name: "Klasa e verdhë", capacity: "50 persona", price: 220, accent: "#FFC726", includes: ["50 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaVerdhe, imgPosition: "center 50%" },
              { name: "Klasa e gjelbër", capacity: "20 persona", price: 140, accent: "#00A651", includes: ["16 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaGjelber, imgPosition: "center 50%" },
              { name: "Klasa e kuqe", capacity: "30 persona", price: 160, accent: "#CF142B", includes: ["30 Kompjuterë", "Projektor", "Tabelë e bardhë", "Klimatizim"], img: klasaKuqe, imgPosition: "center 50%" },
              { name: "Hapsira e përbashkët", capacity: "16 persona", price: null, accent: C.brand, includes: ["Aparat për kafe", "Free Wi-Fi", "Aparat për ujë", "Klimatizim"], img: klasaHapsira, imgPosition: "center 50%" },
            ].map(({ name, capacity, price, accent, includes, img, imgPosition }) => (
              <div key={name} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}>
                <div className="aspect-video overflow-hidden" style={{ backgroundColor: C.n100 }}>
                  <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: imgPosition }} />
                </div>
                <div className="p-5">
                  <p className="font-semibold mb-1" style={{ color: C.n900 }}>{name}</p>
                  <p className="text-sm mb-3" style={{ color: C.brand }}>Kapaciteti: {capacity}</p>
                  <div className="flex flex-col gap-1 mb-3">
                    {includes.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
                        <Check size={11} style={{ color: C.brand }} /> {item}
                      </div>
                    ))}
                  </div>
                  {/*
                    Fixed-height price block. The quote-only room's one line of small text
                    is far shorter than a 30px numeral, and without a floor here its
                    "Rezervo" would ride up out of line with the priced rooms beside it in
                    the same grid row. `flex items-end` keeps both variants sitting on the
                    same baseline off the button.
                  */}
                  <div className="min-h-[44px] flex items-end mb-4">
                    {price === null ? (
                      <p className="text-xs" style={{ color: C.n500 }}>Çmimi me kërkesë</p>
                    ) : (
                      /* Label small and neutral, figure large in the room's own colour —
                         the number is what is being scanned for, the word is not. */
                      <p className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-xs" style={{ color: C.n500 }}>Çmimi:</span>
                        <span className="text-3xl font-bold tracking-tight" style={{ color: accent }}>{price}€</span>
                      </p>
                    )}
                  </div>
                  <PrimaryBtn className="text-xs px-4 py-2" onClick={() => bookRoom(name)}>Rezervo</PrimaryBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Full equipment list */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[900px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-8" style={{ color: C.n900 }}>Çfarë përfshin qeraja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Kompjuterë / workstation", "Projektor", "Whiteboard dhe markerë", "Free Wi-Fi", "Klimatizim dhe ngrohje", "Aparat Uji", "Sistem audio", "Aparat Kafe", "Ekrane digjitale"].map((item) => (
              <div key={item} className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
                  <Check size={11} style={{ color: C.brand }} />
                </div>
                <span className="text-sm" style={{ color: C.n700 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Ideal for */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10 text-center" style={{ color: C.n900 }}>I përshtatshëm për</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Briefcase, label: "Trajnime korporative" },
              { icon: Users, label: "Workshope dhe bootcamp" },
              { icon: Award, label: "Ekzaminime dhe çertifikime" },
              { icon: MessageSquare, label: "Konferenca dhe prezantime" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center p-6 rounded-2xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={22} style={{ color: C.brand }} />
                </div>
                <p className="font-medium text-sm" style={{ color: C.n900 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Photo gallery */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-8" style={{ color: C.n900 }}>Pamje nga hapësirat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              /* Real photos of the rooms, replacing the stock set. Order is the grid's
                 reading order: 1-3 across the top row, 4-6 across the bottom.

                 `imgPosition` is per photo, not per grid: 1, 3 and 5 are portrait shots
                 squeezed into landscape cells and lose most of their height, while 2, 4
                 and 6 are already landscape and barely crop at all. One shared value could
                 not suit both. Second number is vertical — raise it to push the image DOWN. */
              { url: hapsira1,  imgPosition: "center 82%" },
              { url: hapsira3,  imgPosition: "center 90%" },
              { url: hapsira2,  imgPosition: "center 70%" },
              { url: hapsira5,  imgPosition: "center 50%" },
              { url: hapsira4,  imgPosition: "center 70%" },
              { url: hapsira6, alt: "Hapësira 6", imgPosition: "center 60%" },
            ].map(({ url, imgPosition }, i) => (
              <div key={i} className="rounded-2xl overflow-hidden group cursor-zoom-in" style={{ backgroundColor: C.n100, aspectRatio: i < 3 ? "4/3" : "16/9" }}>
                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" style={{ objectPosition: imgPosition }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Location & access */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: C.n900 }}>Lokacioni dhe aksesi</h2>
              {[
                [MapPin, "Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4, Prishtinë"],
                [Globe, "Afër qendrës — 10 min me këmbë nga bulevardi"],
                [Users, "Parking i disponueshëm në oborr"],
                [Phone, "+383 (0)38 600 237"],
                [Mail, "info@cacttus.education"],
              ].map(([Icon, text], i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <Icon size={17} className="mt-0.5 shrink-0" style={{ color: C.brand }} />
                  <span className="text-sm" style={{ color: C.muted }}>{text as string}</span>
                </div>
              ))}
            </div>
            <div className="aspect-video rounded-2xl flex items-center justify-center" style={{ backgroundColor: C.n100, border: `1px solid ${C.cardBorder}` }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: C.brand }}>
                  <MapPin size={22} className="text-white" />
                </div>
                <p className="text-sm font-semibold" style={{ color: C.n700 }}>Rr. Bashkim Fehmiu, Arbëria 3</p>
                <p className="text-xs mt-1" style={{ color: C.n500 }}>10000 Prishtinë, Kosovë</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* 9. Booking form */}
      <section id={KLASA_BOOKING_ID} className="py-16 scroll-mt-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="rounded-3xl px-8 md:px-12 py-14" style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}>
            <h2 className="text-2xl font-bold text-white mb-2">Rezervo hapësirën tënde</h2>
            <p className="text-white/70 text-sm mb-8">Plotëso formularin dhe do të kontaktohesh brenda 24 orëve.</p>
            {booking.sent ? (
              <p className="text-white text-sm font-semibold">Faleminderit! Rezervimi u dërgua — do të kontaktohesh brenda 24 orëve.</p>
            ) : (
              <>
            {/* Seven tracks, not six: the room select joins the five inputs and the button.
                Same cell styling as the inputs beside it. */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              <select value={klasa.klasa} onChange={(e) => setKlasa({ ...klasa, klasa: e.target.value })} className="px-4 text-sm rounded-xl col-span-1" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: klasa.klasa ? C.n900 : C.n400, outline: "none" }}>
                <option value="">Zgjidh klasën</option>
                {CLASS_BOOKING_ROOMS.map((room) => <option key={room} value={room}>{room}</option>)}
              </select>
              {([
                { ph: "Emri", key: "emri" },
                { ph: "Email", key: "email" },
                { ph: "Telefoni", key: "telefoni" },
                { ph: "Data e dëshiruar", key: "data" },
                { ph: "Nr. i personave", key: "pjesemarres" },
              ] as const).map(({ ph, key }) => (
                <input key={ph} type="text" placeholder={ph} value={klasa[key]} onChange={(e) => setKlasa({ ...klasa, [key]: key === "telefoni" ? sanitizePhone(e.target.value) : e.target.value })} className="px-4 text-sm rounded-xl col-span-1" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
              ))}
              <button onClick={() => booking.submit({ name: klasa.emri, email: klasa.email, phone: klasa.telefoni }, { klasa: klasa.klasa, data_deshiruar: klasa.data, nr_personave: klasa.pjesemarres, shenime: klasa.shenime })} className="h-[52px] px-5 rounded-xl font-semibold text-sm text-white col-span-1 whitespace-nowrap" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>{booking.isSubmitting ? "Duke dërguar…" : "Rezervo tani"}</button>
            </div>
            <textarea rows={3} placeholder="Shënime (opsionale)" value={klasa.shenime} onChange={(e) => setKlasa({ ...klasa, shenime: e.target.value })} className="w-full px-4 py-3 text-sm rounded-xl mt-3 resize-none" style={{ border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
                {booking.error && <p className="text-white text-sm mt-3">{booking.error}</p>}
              </>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   REMAINING UNCHANGED PAGES
══════════════════════════════════════════ */
/**
 * The project catalogue.
 *
 * `about` is the "Rreth projektit" copy, one entry per paragraph. It lives here because
 * the detail page used to print two fixed paragraphs of filler for EVERY project — the
 * same shape of bug the course cards and the semester credits had: content written into
 * the markup instead of into the data, so eight different projects all said the same
 * thing. Adding a project without its own text is now a type error.
 *
 * Several of these were supplied as bullet lists and deliberately rewritten as prose:
 * this block is a narrative about a finished piece of work, not a spec sheet.
 */
/* Project photos — /projektet/[slug]. `Main` is the large shot beside the "Rreth
   projektit" copy; the numbered ones fill the three-up strip below it. Six of the eight
   projects have real photos; SDC alone still has none and falls back to the stock images
   hard-coded in ProjectDetailPage. The delivered names differ slightly from how they were
   listed: us2/us3/us4, not us-2/us-3/us-4. */
/* LuxDev. `1` is the large shot; 2-4 fill the strip, left to right. All four are .jpeg
   now: luxdev1 was delivered as a 5208px PNG, and a PNG that wide is ~3.7MB even after
   resizing because PNG cannot compress a photograph. It is re-encoded as JPEG at 1600px
   (0.11MB) — 2x its 556px display slot, so it stays sharp on retina.
   `luxdev.png` is something else entirely: the FUNDER LOGO for the navbar dropdown,
   imported as `projectLuxDev` far above. Do not conflate the two. */
import projLuxDevMain from "../imports/luxdev1.jpg";
import projLuxDev2 from "../imports/luxdev2.jpeg";
import projLuxDev3 from "../imports/luxdev3.jpeg";
import projLuxDev4 from "../imports/luxdev4.jpeg";
/* SDC / Helvetas. `1` is the large shot; 2 and 3 fill the strip, which is a TWO-up
   row for this project rather than the usual three — only two extra photos exist.
   Mixed extensions, as delivered: sdc1 is .webp, 2 and 3 are .jpg. */
import projSdcMain from "../imports/sdc1.webp";
import projSdc2 from "../imports/sdc2.jpg";
import projSdc3 from "../imports/sdc3.jpg";
import projSkillMain from "../imports/skill7.jpeg";
import projSkill1 from "../imports/skill1.jpeg";
import projSkill3 from "../imports/skill3.jpeg";
import projSkill4 from "../imports/skill4.jpeg";
import projUsaidMain from "../imports/usaid.jpg";
import projUs2 from "../imports/us2.jpg";
import projUs3 from "../imports/us3.png";
import projUs4 from "../imports/us4.jpg";
import projGraMain from "../imports/gra2.jpg";
import projGra1 from "../imports/gra1.jpg";
import projGra3 from "../imports/gra3.jpg";
import projGra4 from "../imports/gra4.jpg";
import projKodeMain from "../imports/kode1.jpeg";
import projKode2 from "../imports/kode2.jpg";
import projKode3 from "../imports/kode3.jpg";
import projRcfMain from "../imports/rcf3.jpg";
import projRcf1 from "../imports/rcf1.jpg";
import projRcf2 from "../imports/rcf2.jpg";
import projRcf4 from "../imports/rcf4.jpg";
import projVicMain from "../imports/vic.png";
import projVic1 from "../imports/vic1.jpg";
import projVic2 from "../imports/vic2.jpg";
import projVic3 from "../imports/vic3.jpg";

const PROJECTS = [
  {
    title: "Skill Factory",
    partner: "PARTNER",
    desc: "Skill Factory nga Cacttus Education ishte një akademi trajnimi inovative, e mbështetur nga Bashkimi Evropian dhe Qeveria Gjermane përmes iniciativës Digital4Business.",
    path: "/projektet/skill-factory",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["1,200", "Pjesëmarrës"],
      ["35", "Trajnime"],
      ["10+", "Kategori Trajnimesh"],
    ],
    mainImg: projSkillMain,
    gallery: [
      { url: projSkill1, imgPosition: "center 50%" },
      { url: projSkill3, imgPosition: "center 50%" },
      { url: projSkill4, imgPosition: "center 50%" },
    ],
    about: [
      "Në kuadër të këtij projekti janë organizuar 35 trajnime, duke përfshirë 20 në Prizren dhe 15 në Prishtinë, të cilat kanë trajnuar mbi 1,200 kandidatë nga kategori të ndryshme, përfshirë të rinjtë e papunë dhe profesionistët e ndërmarrjeve të vogla dhe të mesme (MSEs). Programi ka ofruar kurse në programim, digjitalizimi të biznesit, menaxhim të projekteve, dizajn grafik, marketing dixhital dhe përdorimin e paketës Microsoft Office, duke i ndihmuar pjesëmarrësit të fitojnë aftësi praktike të aplikueshme në tregun e punës.",
      "Një aspekt kyç i Skill Factory ka qenë qasja e tij e hapur dhe gjithëpërfshirëse, me formate hibride të mësimdhënies që kanë kombinuar mësimin online dhe pjesëmarrjen fizike. Ky model ka lehtësuar qasjen për pjesëmarrës nga e gjithë Kosova, duke përfshirë edhe trajnime të ofruara plotësisht falas për periudha të caktuara. Një tjetër arritje e rëndësishme ka qenë pjesëmarrja e lartë e grave, veçanërisht në trajnimet e marketingut dhe dizajnit grafik.",
      "Skill Factory nuk ishte vetëm një akademi trajnimi, por një hapësirë ku talentet zhvillohen dhe mundësitë e reja krijohen. Përmes bashkëpunimeve me biznese dhe institucione të ndryshme, pjesëmarrësit tanë kanë arritur të punësohen, të hapin biznese të reja dhe të avancohen në karrierat e tyre.",
    ],
  },
  {
    title: "Partneriteti për Impaktin në TIK",
    partner: "USAID",
    desc: "Cacttus Education zbaton Programin YOU, i mbështetur nga USAID Kosovo, për të rritur qasjen e të rinjve në arsim profesional, njohuri dhe tregun e punës në ICT. Projekti ofron trajnime praktike në zhvillim softueri, administrim rrjetesh, siguri kibernetike dhe sipërmarrësi digjitale, duke i lidhur pjesëmarrësit me sektorin privat për praktika dhe mentorim.",
    path: "/projektet/usaid",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["250", "Pjesëmarrës"],
      ["60", "Bursa"],
      ["32", "Programe Trajnimi"],
    ],
    mainImg: projUsaidMain,
    gallery: [
      { url: projUs2, imgPosition: "center 50%" },
      { url: projUs3, imgPosition: "center 50%" },
      { url: projUs4, imgPosition: "center 50%" },
    ],
    about: [
      "Gjatë katër viteve të implementimit, programi përfshiu 450 aplikantë, ku 250 u përzgjodhën për trajnime aktive. U ofruan 32 programe dhe 60 studentë përfituan bursa, nga të cilët 22 ishin gra, duke promovuar barazinë gjinore në ICT. Pjesëmarrësit ishin kryesisht të moshës 18-25 vjeç, ndërsa shumë u punësuan ose themeluan startup-e. Për të siguruar suksesin afatgjatë, u krijuan partneritete me kompani teknologjike për mbështetje të karrierës.",
      "Programi u ndërtua si një cikël katërvjeçar trajnimi për aftësi në ICT, i zhvilluar njëkohësisht në institucione arsimore dhe në kompani partnere në Kosovë. Përmes 32 programeve të trajnimit, 250 të rinj përfituan mentorim nga profesionistë të fushës dhe praktikë të drejtpërdrejtë në industri, ndërsa 60 studentë — 22 prej tyre gra — u mbështetën me bursa.",
      "Pjesëmarrësit dolën me aftësi teknike dhe sipërmarrëse njëkohësisht, të cilat u hapën mundësi të reja punësimi. Mbi të gjitha, projekti krijoi një lidhje të qëndrueshme mes arsimit dhe tregut të punës — një model që mbetet i zbatueshëm për zhvillimin e aftësive në ICT edhe pas përfundimit të tij.",
    ],
  },
  {
    title: "SDC",
    partner: "SDC",
    desc: "Projekti synon përmirësimin e punësimit të të rinjve në sektorin ICT në Kosovë, duke ndërtuar ura bashkëpunimi mes arsimit dhe industrisë dhe duke rritur kapacitetet për eksport të shërbimeve ICT drejt tregjeve të BE-së dhe vendeve gjermanofolëse (DACH).",
    path: "/projektet/sdc",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["30+", "Të Punësuar"],
      ["340+", "Orë Trajnuese"],
      ["14+", "Trajnime Të Personalizuara"],
    ],
    mainImg: projSdcMain,
    /* TWO entries, not three. The strip's column count follows this array's length —
       see `shots` in ProjectDetailPage — so two photos make a two-up row that fills the
       width, rather than three columns with one left empty. */
    gallery: [
      { url: projSdc2, imgPosition: "center 50%" },
      { url: projSdc3, imgPosition: "center 50%" },
    ],
    about: [
      "Projekti, i financuar nga SDC dhe i zbatuar nga Helvetas dhe MDA, zhvilloi një model inovativ të trajnimit dhe punësimit për të rinjtë në sektorin ICT.",
      "Përmes një programi intensiv katërmujor për Full-Stack Web Development, të zhvilluar në bashkëpunim me kompanitë ICT në Kosovë, u ofrua trajnim i përshtatur me kërkesat reale të tregut.",
      "Pjesëmarrësit përzgjidheshin bashkë me kompanitë ICT dhe pas përfundimit të trajnimit u garantohej punësimi. Pagesa e trajnimit bëhej përmes një skeme ku shuma e trajnimit zbritej nga pagat e tyre pas punësimit, duke ulur barrierat financiare.",
      "Që kompanitë të bien dakord për kontrata të tilla, ato do të përfshihen shumë në përzgjedhjen e kandidatëve. Nëpërmjet kësaj, kompanitë do të kenë mundësinë të përzgjedhin njerëz që u përshtaten nevojave të tyre për sa i përket karakterit, aftësive të buta dhe të përgjithshme.",
    ],
  },
  {
    title: "Gratë në Punë Online",
    partner: "WoW",
    desc: "Projekti, zbatuar nga Cacttus Education me mbështetjen e USAID Kosovo, fuqizon gratë e papuna dhe të nënpunësuara me aftësi për punë online — freelancing, zhvillim web, dizajn grafik, SEO, menaxhim rrjetesh sociale dhe përkthim — duke i ndihmuar të ndërtojnë profile profesionale dhe të fitojnë të ardhura të pavarura.",
    path: "/projektet/wow",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["135+", "Gra Të Trajnuara"],
      ["35+", "fituan 2,511€"],
      ["1,670+", "Aplikime"],
    ],
    mainImg: projGraMain,
    gallery: [
      { url: projGra1, imgPosition: "center 50%" },
      { url: projGra3, imgPosition: "center 50%" },
      { url: projGra4, imgPosition: "center 50%" },
    ],
    about: [
      "Nga 1,670 aplikime, 250 gra u përzgjodhën për testim dhe 135 u trajnuan. Programi përfshinte ndërtimin e profileve online, strategji për aplikim, menaxhimin e kohës dhe pagesave ndërkombëtare. Monitorimi pas trajnimit ndihmoi pjesëmarrëset të aplikojnë për projekte dhe të sigurojnë të ardhura përmes platformave online. Për të rritur impaktin, organizoheshin sesione informuese dhe takime me mentorë, duke forcuar lidhjet mes pjesëmarrëseve dhe komunitetit profesional.",
      "Trajnimi u ofrua për aftësi digjitale dhe punë online, në një format që kombinonte mësimin online me praninë fizike, dhe përfshiu 135 gra nga Prishtina dhe Gjilani. Deri në fund të programit, 35 prej tyre kishin siguruar të ardhura prej 2,511 € përmes platformave online.",
      "Rezultati kryesor ishte rritja e pavarësisë financiare dhe e mundësive të punësimit për gratë në Kosovë — një model i suksesshëm për integrimin e tyre në tregun digjital.",
    ],
  },
  {
    title: "KODE",
    partner: "KODE",
    desc: "Cacttus Education zbaton Projektin KODE të Programit YOU, duke rikualifikuar përfitues të përzgjedhur në Komunën e Prizrenit përmes kurseve në Microsoft Azure Cloud, Linux dhe aftësi të buta, me katër klasa trajnimi dhe rreth 80 përfitues gjithsej.",
    path: "/projektet/kode",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["285+", "Orë Të Mbajtura"],
      ["80+", "Përfitues"],
      ["6", "Muaj"],
    ],
    mainImg: projKodeMain,
    gallery: [
      { url: projKode2, imgPosition: "center 50%" },
      { url: projKode3, imgPosition: "center 50%" },
    ],
    about: [
      "Zbatimi i kursit Microsoft Azure Cloud dhe Linux dhe aftësive të buta të listuara në Komunën e Prizrenit është pjesë e përgjegjësisë së Cacttus Education, e cila ka përfshirë organizimin e katër klasave të trajnimit me afërsisht 20 përfitues për klasë, për gjithsej 80 përfitues. Ofrimi i trajnimeve është kryer nga Cacttus Education.",
      "Gjatë projektit, Cacttus Education ka implementuar një program trajnimi gjithëpërfshirës me një kohëzgjatje prej gjashtë muajsh për klasë, i cili përfshin trajnime me qasje në klasë dhe laboratore digjitale në shtëpi. Qëllimi ynë është t'i pajisim përfituesit me aftësi teknike dhe të buta për të rritur punësimin e tyre në tregun e TI-së në Kosovë dhe/ose në platformat e pavarura online. Programi ynë i trajnimit fokusohet në rikualifikimin dhe, në disa raste, përmirësimin e aftësive të përfituesve në ekspertizën teknike dhe aftësitë e buta që lidhen me zhvillimin e tyre profesional. Kohëzgjatja totale e parashikuar e programit ishte 285 orë, e cila ka përfshirë udhëzime në klasë, detyra individuale në shtëpi dhe detyra grupore për zbatimin praktik të koncepteve teorike.",
    ],
  },
  {
    title: "Regional Challenge Fund (RCF)",
    partner: "RCF",
    desc: "Projekti, zbatuar nga Cacttus Education me partnerë teknologjikë, përmirëson aftësitë digjitale dhe punësueshmërinë e të rinjve përmes trajnimit bashkëpunues (Cooperative Training), duke kombinuar mësimin teorik me praktikën në zhvillim web, mobile dhe administrim sistemesh.",
    path: "/projektet/rcf",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["60+", "Të Trajnuar"],
      ["50%", "Gra"],
      ["2", "Vite"],
    ],
    mainImg: projRcfMain,
    gallery: [
      { url: projRcf1, imgPosition: "center 50%" },
      { url: projRcf2, imgPosition: "center 50%" },
      { url: projRcf4, imgPosition: "center 50%" },
    ],
    about: [
      "Projekti trajnon 60 të rinj në dy vite, me 50% gra, duke promovuar barazinë gjinore në sektorin e IT-së. Çdo vit, 30 studentë përfitojnë nga trajnimet e strukturuara dhe mentorimi nga profesionistë të industrisë. Programi përfshin teknologjitë më të fundit, softuerë të avancuar dhe pajisje moderne, duke i përgatitur pjesëmarrësit për tregun e punës.",
      "Trajnimi u ndërtua si një program bashkëpunues për aftësi digjitale, i zhvilluar njëkohësisht në institucionet arsimore dhe në kompanitë partnere, me një ndarje të barabartë mes teorisë dhe praktikës — gjysma e kohës në klasë, gjysma në punë reale. Pjesëmarrësit dolën me aftësi teknike, njohuri për menaxhim projektesh dhe siguri kibernetike.",
      "Ndikimi ndihet në tri drejtime: rritja e punësueshmërisë, fuqizimi i të rinjve dhe një lidhje më e ngushtë mes arsimit dhe industrisë së IT-së.",
    ],
  },
  {
    title: "LuxDev Smart Mobility Project",
    partner: "LuxDev",
    desc: "LuxDev Smart Mobility Project është një iniciativë e financuar nga LuxDev dhe fituar nga Cacttus Sh.A., që synon zhvillimin e zgjidhjeve të mençura dhe të qëndrueshme në mobilitetin urban të Kosovës, duke forcuar njohuritë lokale në smart mobility dhe teknologjitë e aplikuara.",
    path: "/projektet/luxdev",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["100+", "Pjesëmarrës"],
      ["5+", "Partnerë"],
      ["4000+", "IoT Pajisje"],
    ],
    mainImg: projLuxDevMain,
    /* Strip order IS the array order, left to right. */
    gallery: [
      { url: projLuxDev2, imgPosition: "center 50%" },
      { url: projLuxDev3, imgPosition: "center 50%" },
      { url: projLuxDev4, imgPosition: "center 50%" },
    ],
    about: [
      "Fokusi i projektit është forcimi i njohurive dhe aftësive lokale në fusha që lidhen me smart mobility, sistemet digjitale dhe teknologjitë e aplikuara, duke krijuar lidhje të drejtpërdrejta ndërmjet arsimit, nevojave të tregut të punës dhe zhvillimeve të ardhshme në sektorin e transportit dhe mobilitetit.",
      "Roli i Cacttus Education në këtë projekt është i përqendruar kryesisht në arsim dhe zhvillim të aftësive profesionale. Si institucion i arsimit dhe trajnimit profesional, Cacttus Education është përgjegjës për dizajnimin dhe ofrimin e programeve trajnuese praktike, punëtorive dhe moduleve mësimore që pajisin studentët dhe profesionistët me aftësi konkrete digjitale dhe teknike të lidhura me smart mobility. CE kontribuon gjithashtu në zhvillimin e kurrikulave, aktiviteteve praktike dhe ndërtimin e kapaciteteve afatgjata, duke siguruar që rezultatet e projektit të jenë të matshme dhe të qëndrueshme.",
      "LuxDev Smart Mobility Project është një iniciativë zhvillimore e financuar nga LuxDev dhe e fituar nga Cacttus Sh.A. Ajo synon zhvillimin e zgjidhjeve të mençura, të qëndrueshme dhe të bazuara në teknologji në fushën e mobilitetit urban në Kosovë, duke u mbështetur te ngritja e kapaciteteve dhe inovacioni si rruga kryesore drejt atij qëllimi.",
    ],
  },
  {
    title: "Virtual Innovation Consortium (VIC)",
    partner: "VIC",
    desc: "VIC është një iniciativë e mbështetur nga Bashkimi Evropian që zhvillon aftësi dixhitale të avancuara në Realitetin e Zgjeruar (AR/VR), duke bashkuar universitete, institucione kërkimore dhe liderë industrie për trajnime të përshtatura si për profesionistë të TIK-ut ashtu edhe për audiencat jo-tradicionale.",
    path: "/projektet/vic",
    /* Which slice of THIS project's main photo the 16:9 frame keeps. Raise the second
       number to push the image DOWN inside the frame, lower it to pull it UP. */
    mainImgPosition: "center 50%",
    stats: [
      ["500+", "Pjesëmarrës"],
      ["11+", "Partnerë"],
      ["25+", "Trajnime të Avancuara"],
    ],
    mainImg: projVicMain,
    gallery: [
      { url: projVic1, imgPosition: "center 50%" },
      { url: projVic2, imgPosition: "center 50%" },
      { url: projVic3, imgPosition: "center 50%" },
    ],
    about: [
      "Duke kombinuar përsosmërinë akademike me bashkëpunimin e industrisë, VIC siguron që të diplomuarit të fitojnë aftësi praktike, të harmonizuara me tregun, duke rritur punësimin dhe duke kontribuar në transformimin dixhital të Evropës.",
      "VIC është një iniciativë e mbështetur nga Bashkimi Evropian për zhvillimin e aftësive dixhitale të avancuara, e përqendruar te teknologjitë XR — duke përfshirë Realitetin e Shtuar (AR) dhe Realitetin Virtual (VR). Iniciativa bashkon universitete, institucione kërkimore, ofrues të arsimit profesional (VET) dhe liderë të industrisë.",
      "Programet e trajnimit janë moderne, në teknologji gjithëpërfshirëse dhe të orientuara drejt nevojave të tregut të punës, dhe synojnë si profesionistët e TIK-ut ashtu edhe audienca jo-tradicionale — edukatorë, profesionistë shëndetësorë, dizajnerë dhe inxhinierë. Duke mbështetur rikualifikimin dhe përmirësimin e aftësive, ato rrisin punësueshmërinë dhe kontribuojnë në transformimin dixhital të Evropës.",
    ],
  },
];

function PageProjektet() {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            Two tracks so the logo grid fills the empty right half instead of the copy
            running the full width. `520px` is a fixed track rather than a fraction: the
            grid inside it is four fixed-ratio cards, and letting the track flex would
            resize the cards on every breakpoint for no reason. `items-center` lines the
            grid up against the middle of the text rather than its top.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-12 items-center">
            <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Projektet</h1>
          {/*
            `text-lg`, not `text-1g` — the old class was a typo (digit one for the letter
            l), so Tailwind emitted nothing and this paragraph had been rendering at the
            default body size all along. The `<br />` is gone too: the two sentences are
            one paragraph and should wrap naturally rather than break at a fixed point
            that only looks right at one window width.
          */}
          <p className="text-lg mb-8 max-w-2xl" style={{ color: C.muted }}>
            Ne ndërtojmë projekte që fuqizojnë shkathtësitë digjitale të së nesërmes.
            Përmes bashkëpunimeve strategjike dhe metodologjive bashkëkohore, sjellim
            transformim teknologjik dhe zhvillim të qëndrueshëm në Kosovë e rajon.
          </p>
          {/* `gap-x-16` (64px), up from `gap-10` (40px); wraps rather than squeezing on narrow screens. */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {[["5000+", "Pjesëmarrës"], ["6", "Partnerë ndërkombëtarë"], ["2000+", "Përfitues"]].map(([num, label]) => (
              <div key={label}><p className="text-3xl font-bold" style={{ color: C.brand }}>{num}</p><p className="text-sm mt-0.5" style={{ color: C.n500 }}>{label}</p></div>
            ))}
          </div>
            </div>

            <PartnerLogoGrid />
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROJECTS.map((p) => <ProjectCard key={p.title} project={p} to={p.path} />)}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */

/*
  The strip shown for a project that has no photos of its own. Every project has real
  ones now, so nothing reaches this today — it is kept so that a newly added project
  renders a complete page before its photography arrives, rather than three empty boxes.
*/
const PROJECT_FALLBACK_GALLERY = [
  { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=266&fit=crop&auto=format", imgPosition: "center 50%" },
  { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=266&fit=crop&auto=format", imgPosition: "center 50%" },
  { url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=266&fit=crop&auto=format", imgPosition: "center 50%" },
];

function ProjectDetailPage({ project }: { project: typeof PROJECTS[0] }) {
  /*
    The funder's mark, looked up from PROJEKTET_LIST — the navbar dropdown's array — by
    path, rather than copied into PROJECTS as a second `logo` field. One mapping, one place
    to change it: a project whose logo is corrected in the dropdown is corrected here too,
    and there is no way for the two to drift into showing different marks for the same
    project. Both arrays already key on the same `/projektet/...` paths.

    `?? null` rather than a non-null assertion: a project added to PROJECTS but not yet to
    the dropdown should render without a logo, not crash the page.
  */
  const logo = PROJEKTET_LIST.find((p) => p.path === project.path)?.icon ?? null;

  /*
    The strip's photos, resolved ONCE so the column count and the cells read the same
    list. Hoisted out of the JSX because the grid needs `.length` before it can decide
    how many tracks to draw, and inlining the fallback twice is how the two drift apart.
  */
  const shots = project.gallery ?? PROJECT_FALLBACK_GALLERY;

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Projektet", path: "/projektet" }, { label: project.title }]} />
          <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>{project.title}</h1>
          <div className="inline-flex items-center px-3 h-8 rounded-lg mb-4" style={{ border: `1px solid ${C.n300}` }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.n600, letterSpacing: "0.08em" }}>{project.partner}</span>
          </div>
          {/*
            Description and logo share a row. `items-center` keeps the mark level with the
            middle of the paragraph rather than pinned to its first line, which matters
            because these descriptions run anywhere from two to five lines.

            Stacks below `md`, logo first — on a phone the mark reads as a header for the
            text rather than an orphan trailing it.
          */}
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-8">
            {/*
              Capped at 640px of the 1200px container. Full-bleed body text at this size ran
              past a comfortable measure — roughly 140 characters a line, where ~75 is where
              the eye starts losing its place returning to the next line.
            */}
            <p className="text-lg max-w-[640px]" style={{ color: C.muted }}>{project.desc}</p>
            {logo && (
              /*
                White card, as every other logo on the site is presented — these marks were
                drawn for white and several carry near-white detail that would disappear
                straight onto the section's `brandSoft`. Fixed box, `object-contain` inside:
                the frame is the constant, so a wide USAID wordmark and a square VIC glyph
                give the same footprint instead of one dwarfing the other.

                SIZE: roughly doubled, to ~360x220. The card steps down to 260x160 below
                `lg` rather than holding one fixed width — the description beside it is a
                `max-w`, so it absorbs the difference, but at the `md` breakpoint a 360px
                card would squeeze it to under 350px and the paragraph would go ragged.
                Padding scales with the box so the mark keeps its breathing room instead of
                growing tight against a bigger frame.

                ┌────────────────────────────────────────────────────────────────────────┐
                │  VERTICAL POSITION — `md:mt-[-110px]` is the knob to turn.             │
                │  MORE negative lifts the card, less negative / positive drops it.      │
                └────────────────────────────────────────────────────────────────────────┘

                The logo is already dead-centre inside this frame (equal padding above and
                below), and the frame already starts at the top of its row — so nothing
                could be gained by re-aligning either. What reads as "too low" is the whole
                card sitting beside the description instead of up level with the title, and
                a negative top margin is what lifts it there.

                Margin, not `translate`: a transform is purely visual, so the row would go
                on reserving the card's full height and leave ~110px of dead space under it.
                A negative margin shrinks the card's margin box too, so the row closes up.
                Paired with `md:self-start` the maths stays linear — the card's top is
                always `row top + this value`, so turning the knob by 10px moves it 10px.
                Under `md:` the layout stacks and this is deliberately not applied, or the
                logo would be dragged up over the badge.
              */
              <div
                className="shrink-0 self-start md:self-start md:mt-[-110px] w-[260px] h-[160px] lg:w-[360px] lg:h-[220px] rounded-2xl flex items-center justify-center p-6 lg:p-8"
                style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
              >
                {/* Decorative: the title and partner badge above already name the project. */}
                <img src={logo} alt="" aria-hidden="true" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-8" style={{ color: C.n900 }}>Rreth projektit</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* One <p> per entry in this project's own `about`, not two fixed paragraphs. */}
            <div className="flex flex-col gap-4">
              {project.about.map((paragraph, i) => (
                <p key={i} className="text-base leading-relaxed" style={{ color: C.muted }}>{paragraph}</p>
              ))}
            </div>
            {/* Frame untouched — only the source is per project. The `??` now catches SDC
                alone: it is the last project with no `mainImg`, so it keeps the stock photo
                it always showed. */}
            <div className="aspect-video rounded-2xl overflow-hidden" style={{ backgroundColor: C.n100 }}>
              <img
                src={project.mainImg ?? "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=720&h=405&fit=crop&auto=format"}
                alt={project.title}
                className="w-full h-full object-cover"
                style={{ objectPosition: project.mainImgPosition }}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            RESPONSIVE GAP. `gap-50` is 200px — fine inside a 1200px container, fatal below
            it: measured at 375px the row had 320px of width against 400px of gaps, so all
            three cells computed to ZERO width and their text spilled 158px off the page.

            `lg:gap-50` keeps the desktop spacing exactly as it was; the smaller steps only
            apply where the old value could never fit. One column below `sm` because three
            90px tracks turn "Trajnime Të Personalizuara" into six wrapped lines.
          */}
          {/*
            Compact on a phone, unchanged from `sm` up. This was `grid-cols-1` with `gap-8`,
            so three 36px figures stacked into a tall column that pushed the gallery far
            below the fold. A wrapping flex row lets the three sit side by side at 375px and
            re-wrap only if a label is long; the `sm:`/`lg:` grid classes are untouched, so
            tablet and desktop render exactly as before.
          */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-center sm:grid sm:grid-cols-3 sm:gap-10 lg:gap-50">
            {/*
              `project.stats`, not a literal. This strip used to hold one hard-coded array
              INSIDE the shared detail component, so all eight projects rendered the same
              three numbers — the figures belonged to no project in particular and were
              wrong on every page. They live on each project in PROJECTS now.

              Keyed by INDEX, not by label: two projects still have blank placeholders, and
              three empty-string labels in one strip are three duplicate keys, which React
              cannot tell apart. Index is stable here because the array is static and never
              reordered.
            */}
            {project.stats.map(([num, label], i) => (
              <div key={i}><p className="text-2xl sm:text-4xl font-bold mb-0.5 sm:mb-1" style={{ color: C.brand }}>{num}</p><p className="text-xs sm:text-sm" style={{ color: C.n500 }}>{label}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            Column count follows the number of photos: two shots make a two-up row that
            fills the width, three keep the original three-up. A fixed `grid-cols-3` left
            SDC's two photos in the first two tracks with a visibly empty third.

            Both class names are written out in full rather than built as
            `grid-cols-${n}`. Tailwind generates CSS by scanning the source for COMPLETE
            class names, so an interpolated one matches nothing and produces no rule at
            all — the same trap as the `object-[...]` note further up this file.
          */}
          <div className={`grid gap-4 ${shots.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {shots.map(({ url, imgPosition }, i) => (
              <div key={i} className="aspect-video rounded-2xl overflow-hidden" style={{ backgroundColor: C.n100 }}><img src={url} alt="" className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: imgPosition }} /></div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.p900 }}>
        <div className="max-w-[1200px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <h3 className="text-2xl font-semibold text-white">Dëshiron të bashkëpunosh me ne?</h3>
          <Link to="/kontakti"><PrimaryBtn>Na kontakto</PrimaryBtn></Link>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   LAJME — the blog, /lajme and /lajme/:slug

   Backed by `GET /api/public/posts`, which only ever returns `published = true` rows.
   Until this was wired the two pages rendered a hard-coded `ARTICLES` array and every
   card linked to a single static `/lajme/artikull` mock, so a post published in the
   dashboard could never appear here no matter how correct the backend was.

   NO CATEGORY CHIPS. The mock had "Lajmet / Teknologji / Karriera / Projekte", but `Post`
   has no category column (see schema.prisma), so those filters cannot be backed by data.
   Inventing one per post would make the filter lie; the chips are gone until the model
   grows a field to support them.
══════════════════════════════════════════ */
function PageLajme() {
  const [posts, setPosts] = useState<readonly PostCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError("");

    getPublicPosts()
      .then((data) => {
        if (active) setPosts(data);
      })
      .catch(() => {
        if (active) setLoadError("Lajmet nuk mund të ngarkohen për momentin.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // The newest post gets the wide treatment; the rest fill the grid beneath it.
  const [featured, ...rest] = posts;

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Lajme</h1>
          <p className="text-lg" style={{ color: C.muted }}>Njoftime, histori dhe risi nga Cacttus Education.</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {isLoading ? (
            <div aria-live="polite">
              <div className="rounded-2xl animate-pulse mb-12" style={{ height: 280, backgroundColor: C.n100 }} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl animate-pulse" style={{ height: 300, backgroundColor: C.n100 }} />
                ))}
              </div>
            </div>
          ) : loadError ? (
            <div className="py-16 text-center flex flex-col items-center gap-4" role="alert">
              <p className="text-lg font-medium" style={{ color: C.n900 }}>{loadError}</p>
              <p className="text-sm" style={{ color: C.n500 }}>Provo përsëri pas pak.</p>
              <SecondaryBtn onClick={() => setReloadKey((k) => k + 1)}>Provo përsëri</SecondaryBtn>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg" style={{ color: C.n700 }}>Ende nuk ka lajme të publikuara</p>
              <p className="text-sm mt-2" style={{ color: C.n500 }}>Kthehu së shpejti — po punojmë në përmbajtje të re.</p>
            </div>
          ) : (
            <>
              {featured && (
                <Link to={`/lajme/${featured.slug}`} className="block mb-12">
                  <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-8 p-6 rounded-2xl hover:shadow-md transition-all" style={{ border: `1px solid ${C.n200}` }}>
                    <div className="aspect-video rounded-xl overflow-hidden" style={{ backgroundColor: C.n100 }}>
                      {featured.coverImage ? (
                        <img src={featured.coverImage} alt={featured.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: C.brandSoft }} />
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h2 className="text-2xl font-bold mb-3 leading-snug" style={{ color: C.n900 }}>{featured.title}</h2>
                      {featured.excerpt && (
                        <p className="text-sm mb-4 leading-relaxed line-clamp-4" style={{ color: C.muted }}>{featured.excerpt}</p>
                      )}
                      <p className="text-xs mb-4" style={{ color: C.n400 }}>
                        {formatPostDate(featured.createdAt)} · {featured.author.name}
                      </p>
                      <GhostBtn>Lexo artikullin</GhostBtn>
                    </div>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((post) => <ArticleCard key={post.slug} post={post} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   /lajme/:slug — one article

   The body is operator-authored HTML from the Tiptap editor. It is sanitised server-side
   on write AND again by `renderSafeHtml` here, immediately before it reaches
   `dangerouslySetInnerHTML` — the reasoning for both passes is on that function.
══════════════════════════════════════════ */
function PageArtikulli() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [related, setRelated] = useState<readonly PostCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setIsLoading(true);
    setNotFound(false);
    setLoadError("");

    getPublicPost(slug)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof PublicApiError && error.isNotFound) {
          setNotFound(true);
        } else {
          setLoadError("Artikulli nuk mund të ngarkohet për momentin.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // "Artikuj të ngjashëm" is simply the newest few, minus this one. A failure here must
  // not cost the reader the article, so it degrades to an empty list in silence.
  useEffect(() => {
    let active = true;

    getPublicPosts()
      .then((data) => {
        if (active) setRelated(data.filter((entry) => entry.slug !== slug).slice(0, 3));
      })
      .catch(() => {
        if (active) setRelated([]);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <PageWrapper>
        <section className="py-24" aria-live="polite">
          <div className="max-w-[760px] mx-auto px-5 flex flex-col gap-4">
            <div className="rounded-xl animate-pulse" style={{ height: 44, width: "70%", backgroundColor: C.n100 }} />
            <div className="rounded-2xl animate-pulse" style={{ height: 320, backgroundColor: C.n100 }} />
            <div className="rounded-xl animate-pulse" style={{ height: 160, backgroundColor: C.n100 }} />
          </div>
        </section>
      </PageWrapper>
    );
  }

  if (notFound || loadError || !post) {
    return (
      <PageWrapper>
        <section className="py-24">
          <div className="max-w-[900px] mx-auto px-5 text-center flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold" style={{ color: C.n900 }}>
              {notFound ? "Ky artikull nuk u gjet" : loadError}
            </h1>
            <p style={{ color: C.n500 }}>
              {notFound ? "Ndoshta është hequr ose linku është i vjetër." : "Provo përsëri pas pak."}
            </p>
            <Link to="/lajme"><PrimaryBtn>Shiko të gjitha lajmet</PrimaryBtn></Link>
          </div>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-[1200px] mx-auto px-5 py-16">
        <div className="max-w-[760px] mx-auto">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Lajme", path: "/lajme" }, { label: post.title }]} />
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full overflow-hidden" style={{ backgroundColor: C.brandLight }}>
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-bold text-sm" style={{ color: C.brand }}>CE</span>
              </div>
            </div>
            <span className="text-sm" style={{ color: C.muted }}>{post.author.name}</span>
            <span style={{ color: C.n300 }}>·</span>
            <span className="text-sm" style={{ color: C.n500 }}>{formatPostDate(post.createdAt)}</span>
          </div>
        </div>

        {post.coverImage && (
          <div className="aspect-video rounded-2xl overflow-hidden mb-10" style={{ backgroundColor: C.n100 }}>
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="max-w-[700px] mx-auto">
          {/*
            Sanitised on the line above the injection, not somewhere upstream where a later
            refactor could route around it. Styling lives in styles/post-body.css because
            this markup arrives without utility classes.
          */}
          <div className="post-body" dangerouslySetInnerHTML={renderSafeHtml(post.content)} />

          <div className="flex items-center gap-3 py-6 mt-10" style={{ borderTop: `1px solid ${C.n200}` }}>
            <Link to="/lajme" className="text-sm font-semibold" style={{ color: C.brand }}>
              ← Kthehu te lajmet
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <div className="max-w-[1160px] mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: C.n900 }}>Artikuj të ngjashëm</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((entry) => <ArticleCard key={entry.slug} post={entry} />)}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function PageKontakti() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ emri: "", email: "", telefon: "", subjekti: "", mesazhi: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Posts to the generic form engine every other public form on this site already uses.
   *
   * This page does NOT render the form's fields from the API the way the application
   * band does — its inputs are laid out by hand, and only the SUBMIT travels through
   * `submitPublicForm`. The consequence is that the `data` keys below are a contract
   * with the form record's field names, not something the server infers: it drops any
   * key the form does not declare, so a rename in the dashboard silently empties the
   * message unless CONTACT_FORM_SLUG's fields are renamed to match.
   *
   * `submitted` flips only after the POST resolves. A rejection leaves the form on
   * screen with every value still in it, so nothing has to be retyped.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The button stays enabled, so a second Enter press before the first POST settles
    // would otherwise send the message twice.
    if (isSubmitting) return;

    if (!form.emri.trim() || !form.email.trim() || !form.telefon.trim() || !form.subjekti || !form.mesazhi.trim()) {
      setError("Ju lutemi plotësoni të gjitha fushat.");
      return;
    }
    if (!isValidPhone(form.telefon)) {
      setError(PHONE_ERROR);
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await submitPublicForm(CONTACT_FORM_SLUG, {
        // name/email/phone are promoted to real Submission columns server-side; every
        // other answer travels in `data`, keyed by the form's field names.
        name: form.emri.trim(),
        email: form.email.trim(),
        phone: form.telefon.trim(),
        data: { subjekti: form.subjekti, mesazhi: form.mesazhi.trim() },
      });
      setSubmitted(true);
    } catch (cause: unknown) {
      // Same branches as the application band, so both forms fail the same way.
      if (cause instanceof PublicApiError) {
        setError(
          cause.isValidation
            ? "Disa fusha nuk janë të vlefshme. Kontrollo të dhënat dhe provo përsëri."
            : cause.message,
        );
      } else {
        setError("Diçka shkoi keq. Provo përsëri.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Kontakti</h1>
          <p className="text-lg" style={{ color: C.muted }}>Na shkruaj ose na vizito — jemi këtu për çdo pyetje rreth studimeve dhe trajnimeve.</p>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8">
            <div className="p-8 rounded-2xl" style={{ backgroundColor: C.n0, boxShadow: "0 4px 12px rgba(45,22,55,0.08)", border: `1px solid ${C.n200}` }}>
              <h3 className="text-xl font-semibold mb-6" style={{ color: C.n900 }}>Na dërgo mesazh</h3>
              {submitted ? (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brandLight }}><Check size={32} style={{ color: C.brand }} /></div>
                  <h3 className="text-xl font-bold" style={{ color: C.n900 }}>Mesazhi u dërgua.</h3>
                  <p style={{ color: C.n500 }}>Do të të përgjigjemi sa më shpejt.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormField label="Emri dhe mbiemri" type="text" value={form.emri} onChange={(v) => setForm({ ...form, emri: v })} />
                  <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                  <FormField label="Numri i telefonit" type="tel" value={form.telefon} onChange={(v) => setForm({ ...form, telefon: sanitizePhone(v) })} />
                  <FormSelect label="Subjekti" value={form.subjekti} onChange={(v) => setForm({ ...form, subjekti: v })} options={["Studime profesionale", "Trajnime profesionale", "Për biznese", "Tjetër"]} />
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>Mesazhi</label>
                    <textarea rows={5} value={form.mesazhi} onChange={(e) => setForm({ ...form, mesazhi: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none" style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: C.n800 }} onFocus={(e) => (e.target.style.borderColor = C.brand)} onBlur={(e) => (e.target.style.borderColor = C.n300)} />
                  </div>
                  {error && <p className="text-sm font-medium" style={{ color: "#D64545" }}>{error}</p>}
                  <PrimaryBtn type="submit">{isSubmitting ? "Duke dërguar…" : "Dërgo mesazhin"}</PrimaryBtn>
                </form>
              )}
            </div>
            <div className="p-8 rounded-2xl flex flex-col gap-5" style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: C.n900 }}>Të dhënat e kontaktit</h3>
              {[[MapPin, "Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4"], [MapPin, "10000 Prishtinë, Kosovë"], [Phone, "+383 (0)38 600 237"], [Mail, "info@cacttus.education"], [Clock, "E hënë – E premte, 09:00 – 17:00"]].map(([Icon, text], i) => (
                <div key={i} className="flex items-start gap-3"><Icon size={18} className="mt-0.5 shrink-0" style={{ color: C.brand }} /><span className="text-sm" style={{ color: C.n700 }}>{text as string}</span></div>
              ))}
              <div className="mt-4">
                <p className="text-sm font-semibold mb-3" style={{ color: C.n700 }}>Na ndiq</p>
                <div className="flex gap-3">
                  {CONTACT_SOCIALS.map(({ Icon, label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}><Icon size={16} style={{ color: C.n600 }} /></a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/*
            `overflow-hidden` is the one class added to this box: the grey placeholder it
            replaced had nothing square inside it, so `rounded-2xl` alone was enough. An
            iframe is a rectangle that would otherwise poke through the rounded corners.

            Keyless `/maps/embed?pb=…`, NOT the Embed API — nothing here can expire or
            leak, and no billing account is involved.

            THE LONG `pb` IS LOAD-BEARING. Two shorter spellings look equivalent and are
            not: `maps.google.com/maps?q=<address>&output=embed` 301-redirects to a
            MINIMAL pb (`!1m3!2m1!1s<query>!6i16`), and that minimal form renders nothing
            but Google's grey "Open in Maps" fallback — verified in-browser, twice. The
            full viewport pb below draws real tiles. If this ever needs repointing, take
            the string from Google Maps' own Share → "Embed a map" dialog rather than
            hand-shortening it.

            Coordinates and place id are the real ones behind the address, resolved from
            the office's Maps short link: 42.6570015, 21.147896 / place "Cacttus".

            `border: 0` rather than a `frameBorder` attribute, which is not valid React.
          */}
          <div className="mt-10 aspect-video rounded-2xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: C.n100 }}>
            <iframe
              title="Harta — Cacttus Education, Rr. Bashkim Fehmiu, Arbëria 3, Prishtinë"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2939.5!2d21.147896!3d42.6570015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13549edd669de99b%3A0x3e37c39c9f671dd5!2sCacttus!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: 0, display: "block" }}
            />
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* Team portraits — /ekipi. See TEAM_MEMBERS. Prefixed `ekipi` because several of
   these names already exist as other imports: `vetoni.png` is the LECTURER Veton on
   /ligjërueit (this one is `vetoniEkipi.png`), and `ErnataKoliqi.png` is the graduate in
   the homepage carousel. Same people, different photos and different pages.
   `ekipiRilindi` points at `rilind.png` — the file arrived without the trailing i. */
import ekipiDritoni from "../imports/dritoni.png";
import ekipiVili from "../imports/vili.png";
import ekipiShuki from "../imports/shuki.png";
import ekipiVetoni from "../imports/vetoniEkipi.png";
import ekipiDonjeta from "../imports/donjeta.png";
import ekipiVjosa from "../imports/vjosa.png";
import ekipiRinoni from "../imports/rinoni.png";
import ekipiTina from "../imports/tina.png";
import ekipiGona from "../imports/gona.png";
import ekipiArnisa from "../imports/arnisa.png";
import ekipiEdona from "../imports/edona.png";
import ekipiYlljeta from "../imports/ylljeta.png";
import ekipiFinesa from "../imports/finesa.png";
import ekipiDafina from "../imports/dafina.png";
import ekipiRinesa from "../imports/rinesa.png";
import ekipiErnata from "../imports/ernata.png";
import ekipiBani from "../imports/bani.png";
import ekipiRilindi from "../imports/rilind.png";
import ekipiKrenare from "../imports/krenare.png";
import ekipiAnesa from "../imports/anesa.png";

const TEAM_MEMBERS = [
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

/* ══════════════════════════════════════════
   /rreth-nesh — ABOUT

   Order: story → vision & mission → values → numbers → apply band. It runs from the
   softest claim to the hardest: who we are, what we are aiming at, what we hold
   ourselves to, and only then the figures that back it up. Numbers land better as
   evidence for something already said than as an opening statistic.

   The route is Albanian and dash-separated to match /trajnime, /programim and
   /biznese/talente rather than introducing an English /about.

   It does NOT duplicate the dropdown's destinations: Ekipi and Ligjëruesit remain their
   own pages, and this links to them instead of restating their content.
══════════════════════════════════════════ */

/** The three commitments under the mission statement. */
const ABOUT_MISSION_POINTS: readonly string[] = [
  "Dizajnojmë dhe ofrojmë programe profesionale cilësore, të orientuara drejt industrisë dhe tregut të punës.",
  "Zhvillojmë të menduarit kritik, zgjidhjen e problemeve, komunikimin dhe aftësitë profesionale.",
  "Krijojmë përvoja praktike të të nxënit përmes metodave bashkëkohore dhe bashkëpunimit me industrinë.",
];

/**
 * The seven company values, in the order the company states them.
 *
 * Numbered rather than illustrated: seven icons distinct enough to mean anything on their
 * own do not exist, and seven near-identical ones would be visual noise. The index does
 * the work instead, which also keeps each card small — the point here is that there are
 * SEVEN of these, not that any one of them is a feature.
 */
const ABOUT_VALUES: readonly { title: string; body: string }[] = [
  { title: "Integriteti", body: "Veprojmë me etikë dhe transparencë, duke bërë gjithmonë atë që është e drejtë." },
  { title: "Cilësia dhe përsosmëria", body: "Synojmë standardet më të larta në gjithçka që bëjmë dhe përmirësohemi vazhdimisht." },
  { title: "Respekti", body: "I trajtojmë të gjithë me respekt dhe dinjitet, duke ndërtuar marrëdhënie të besueshme." },
  { title: "Bashkëpunimi", body: "Punojmë së bashku dhe ndajmë njohuritë për të krijuar rezultate më të mira për të gjithë." },
  { title: "Përgjegjësia", body: "Marrim përgjegjësi për vendimet, veprimet, sjelljet dhe rezultatet tona." },
  { title: "Inovacioni", body: "Zhvillojmë vazhdimisht forma më bashkëkohore dhe efektive të edukimit." },
];

const ABOUT_STAT_ICONS: readonly React.ElementType[] = [Award, Users, Clock, Briefcase];

/* ── Count-up ──
   Hand-rolled rather than reached for from a library. `motion` is in package.json but is
   imported nowhere in src/, and every other animation on this site is plain React plus a
   CSS transition — adding a runtime dependency the bundle does not currently carry, for
   one counter, is not a trade worth making. This is ~30 lines. */
const COUNT_UP_MS = 1600;

/**
 * True once the element has been scrolled into view — and it never goes back to false.
 *
 * That one-way latch IS the "plays once" requirement: the observer disconnects on the
 * first intersection, so scrolling the section off screen and back does nothing. The
 * state lives in the component, so a page refresh remounts it and the count starts at 0
 * again, which is the other half of what was asked.
 */
function useHasEnteredView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Someone who asked the OS for less motion gets the final number, not a 1.6s crawl.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, entered };
}

/**
 * Splits a display figure into the number to animate and the text around it, so "1,000+",
 * "88%" and "9 vite" all count while keeping whatever they are written with. Anything
 * without digits falls through and is rendered untouched.
 *
 * The numeric run is captured WITH its separators — `\d[\d.,\s]*\d` — because a plain
 * `\d+` stops at the first comma: "1,000+" would count to 1 and render the leftover
 * ",000+" as a suffix. Whichever separator the source used is remembered so the counting
 * figure is grouped the same way, rather than being forced into one locale's convention.
 */
function splitStatValue(raw: string): {
  prefix: string;
  target: number | null;
  suffix: string;
  separator: string | null;
} {
  const match = raw.match(/^(\D*?)(\d[\d.,\s]*\d|\d)(.*)$/);
  if (!match) return { prefix: raw, target: null, suffix: "", separator: null };

  const token = match[2] ?? "";
  return {
    prefix: match[1] ?? "",
    target: Number(token.replace(/\D/g, "")),
    suffix: match[3] ?? "",
    separator: token.match(/[.,\s]/)?.[0] ?? null,
  };
}

function CountUpValue({ value, run }: { value: string; run: boolean }) {
  const { prefix, target, suffix, separator } = splitStatValue(value);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!run || target === null) return;

    let frame = 0;
    let startedAt: number | null = null;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min((now - startedAt) / COUNT_UP_MS, 1);
      // easeOutCubic: quick off the mark, gliding into the final figure rather than
      // stopping dead on it.
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, target]);

  if (target === null) return <>{value}</>;

  const current = run ? shown : 0;
  const rendered = separator === null
    ? String(current)
    : current.toLocaleString("en-US").replace(/,/g, separator);

  return <>{prefix}{rendered}{suffix}</>;
}

/**
 * The four figures as one compact band, not four large cards.
 *
 * The previous version gave each number a tall padded card and a decorative arc, which
 * made four short facts occupy more of the page than the mission statement above them.
 * This is the same data in a single strip: one gradient panel — the site's existing
 * accent surface, borrowed from the apply band — with the numbers set inline and split by
 * hairline rules rather than by gaps between separate boxes.
 */
function AboutStatsBand() {
  // One observer for the whole band, not one per figure: the four numbers should start
  // together, and they are always on screen together anyway.
  const { ref, entered } = useHasEnteredView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="rounded-3xl px-6 py-10 md:px-10"
      style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {HERO_STATS.map(([num, label], i) => {
          const Icon = ABOUT_STAT_ICONS[i] ?? Award;
          return (
            <div
              key={label}
              /*
                The divider is a left border on every item except the first of its row, so
                it has to be re-declared per breakpoint: at 2 columns the third item
                starts a new row and must lose it, at 4 columns it must keep it.
              */
              className={`flex flex-col items-center text-center px-4 py-4 ${
                i % 2 === 0 ? "" : "border-l"
              } ${i === 0 ? "lg:border-l-0" : "lg:border-l"} ${i < 2 ? "" : "border-t lg:border-t-0"}`}
              style={{ borderColor: "rgba(255,255,255,0.22)" }}
            >
              <Icon size={20} className="mb-3" style={{ color: "rgba(255,255,255,0.75)" }} aria-hidden="true" />
              {/*
                `tabular-nums` keeps every digit the same width, so the figure does not
                jitter sideways while it counts from 0 to 500.
              */}
              <p
                className="text-3xl md:text-4xl font-bold leading-none text-white tabular-nums"
                style={{ letterSpacing: "-0.02em" }}
              >
                <CountUpValue value={num} run={entered} />
              </p>
              <p className="text-xs md:text-sm mt-2 leading-snug" style={{ color: "rgba(255,255,255,0.72)" }}>
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
const RRETH_AMBIENT_IMG_POSITION = "center 50%";

/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
const RRETH_TEAM_IMG_POSITION = "center 50%";

function PageRrethNesh() {
  return (
    <PageWrapper>
      {/* 1 — who we are, text left / image right */}
      <section className="py-16 md:py-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth Nesh" }]} />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
                Rreth Cacttus Education
              </h1>
              {/* The opening paragraph only. The two that used to follow it moved out to
                  their own section below — three stacked paragraphs beside the artwork
                  read as a wall of text, and they were what made this hero so tall.
                  `mb-8` here is the margin the last of the three used to carry, so the
                  gap down to the buttons is unchanged. */}
              <p className="text-lg leading-relaxed mb-8" style={{ color: C.muted }}>
                Me rrënjë në edukimin profesional që nga viti 2003, Cacttus Education vepron që nga viti 2015 si institucioni i parë privat profesional i Nivelit 5 në Kosovë, i specializuar në Teknologjinë e Informacionit dhe Komunikimit. Institucioni është i akredituar nga Autoriteti Kombëtar i Kualifikimeve dhe i licencuar nga MASHTI.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/ekipi"><PrimaryBtn>Njihu me ekipin</PrimaryBtn></Link>
                <Link to="/ligjërueit"><SecondaryBtn>Ligjëruesit tanë</SecondaryBtn></Link>
              </div>
            </div>

            {/*
              The real staff photo, in place of the Bursa_Redesign.png this column used to
              borrow from the homepage. `studimePhoto` still serves that homepage section,
              so its import stays — this page simply no longer shares it.

              A 3:2 photo in a 4:3 frame: `object-cover` fills the box and throws away the
              overflow, and RRETH_AMBIENT_IMG_POSITION is what chooses which slice is kept.
            */}
            <div className="aspect-[4/3] rounded-3xl overflow-hidden" style={{ backgroundColor: C.brandLight }}>
              <img
                src={rrethNeshStafi}
                alt="Stafi i Cacttus Education"
                className="w-full h-full object-cover"
                style={{ objectPosition: RRETH_AMBIENT_IMG_POSITION }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/*
        2 — what we teach, and how.

        The two paragraphs lifted out of the hero. Two cards rather than two more stacked
        paragraphs: they are already a natural pair — one answers WHAT is offered, the
        other HOW it is taught and where it leads — so splitting them side by side turns a
        block of prose into a comparison the eye can take in at a glance.

        Deliberately the calm section on this page. The mosaic directly below it is the
        visually loud one (photo scrim, gradient card, bullet list), and two sections
        competing back to back would flatten both. Icon tile, heading, paragraph — the same
        three-part card the /biznese and Bursa pages use, so it is a shape the site already
        speaks.

        Background is `brandLight`. `brandSoft` above and `n0` below are both taken, and a
        third tint keeps every boundary on this page a real colour change rather than two
        same-coloured bands running together.
      */}
      <section className="py-16 md:py-20" style={{ backgroundColor: C.brandLight }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: GraduationCap,
                title: "Programet tona",
                /* Paragraph 2, verbatim from the hero. */
                body: "Ofrojmë studime profesionale dyvjeçare në Zhvillimin e Uebit dhe Aplikacioneve Mobile dhe Siguri Kibernetike, si dhe trajnime të specializuara në programim, rrjete kompjuterike, cloud, siguri kibernetike, të dhëna, dizajn dhe marketing digjital. Programet tona kombinojnë teorinë me mësimin praktik, laboratorët dhe projektet reale.",
              },
              {
                icon: TrendingUp,
                title: "Ligjëruesit dhe karriera",
                /* Paragraph 3, verbatim from the hero. */
                body: "Përmes ligjëruesve nga industria, teknologjisë bashkëkohore dhe mbështetjes së Qendrës së Karrierës, studentët zhvillojnë aftësitë teknike dhe profesionale që kërkon tregu i punës. Cacttus Education është zgjedhja e besueshme për të gjithë ata që synojnë të ndërtojnë dhe avancojnë karrierën e tyre në teknologji.",
              },
            ].map(({ icon: Icon, title, body }) => (
              /* `h-full` on a grid child makes both cards the height of the taller one, so
                 the two blocks line up at the bottom instead of stepping. */
              <div
                key={title}
                className="h-full rounded-3xl p-8 md:p-9"
                style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: C.brandLight }}
                >
                  <Icon size={22} style={{ color: C.brand }} />
                </div>
                <h2 className="text-xl font-bold mb-3" style={{ color: C.n900 }}>{title}</h2>
                <p className="text-base leading-relaxed" style={{ color: C.muted }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*
        3 — story, mission and vision as one mosaic.

        Layout mirrors the supplied reference: a tall image on the left carrying its
        caption over a scrim, and two stacked cards on the right, the upper one light and
        the lower one solid. The reference's green is replaced throughout by the brand
        purple — `brandLight` for the light card, the brand→secondary gradient for the
        dark one — so the light/dark pairing survives the palette swap.

        The image column has no fixed height: it stretches to whatever the two cards on
        the right add up to. That is why the mission card can keep all three of its bullet
        points without the row falling out of proportion.
      */}
      <section className="py-20 md:py-24" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-5 items-stretch">
            {/* Story — caption sits on the photo */}
            <div className="relative rounded-3xl overflow-hidden min-h-[380px]">
              {/*
                PLACEHOLDER IMAGE, same status as the one in the section above: an Unsplash
                URL so this column is not empty. Swap it for a real photo of a classroom or
                the team. Kept as a remote URL rather than a bundled import precisely so it
                is obvious it is temporary.
              */}
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1000&h=1200&fit=crop&auto=format"
                alt="Ekipi i Cacttus Education"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: RRETH_TEAM_IMG_POSITION }}
                loading="lazy"
              />
              {/*
                Bottom-weighted scrim. A flat overlay would grey out the whole photo; a
                gradient keeps the top of the image readable and only darkens where the
                text actually sits.
              */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(36,16,40,0.94) 0%, rgba(36,16,40,0.72) 30%, rgba(36,16,40,0.10) 65%, rgba(36,16,40,0) 100%)",
                }}
              />
              <div className="relative h-full flex flex-col justify-end p-8 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Historia jonë</h2>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.86)" }}>
                  Cacttus Education u themelua në vitin 2015 si vazhdimësi e departamentit të trajnimeve profesionale të kompanisë CACTTUS, i cili vepron që nga viti 2003. Sot, ofrojmë arsim profesional të orientuar drejt praktikës dhe nevojave të industrisë.
                </p>
              </div>
            </div>

            {/* Mission (light) above Vision (dark) */}
            <div className="flex flex-col gap-5">
              <div className="rounded-3xl p-8 md:p-9" style={{ backgroundColor: C.brandLight }}>
                <h2 className="text-2xl font-bold mb-3" style={{ color: C.n900 }}>Misioni ynë</h2>
                <p className="text-xl font-semibold mb-3" style={{ color: C.brand }}>
                  &ldquo;Arsim cilësor. Mundësi reale për sukses.&rdquo;
                </p>
              
                <ul className="flex flex-col gap-3">
                  {ABOUT_MISSION_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: C.brand }}
                      >
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: C.n700 }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="relative rounded-3xl p-8 md:p-9 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                />
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-3 text-white">Vizioni ynë</h2>
                  <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                    Të jemi institucioni udhëheqës në Arsimin dhe Aftësimin Profesional dhe zgjedhja e parë për studentët që kërkojnë arsim praktik e cilësor në Kosovë dhe rajon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        4 — the seven values.

        Three tracks, so seven cards fall 3 + 3 + 1. Wider tracks mean each card gets more
        room for the same sentence, which is why the padding goes up with the column count
        rather than the cards simply being stretched.
      */}
      <section className="py-20 md:py-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-2" style={{ color: C.n900 }}>Vlerat tona</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Shtatë parime që i mbajmë në çdo vendim.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ABOUT_VALUES.map(({ title, body }, i) => (
              <div
                key={title}
                className="rounded-2xl p-7 md:p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}
              >
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold mb-5"
                  style={{ backgroundColor: C.brandLight, color: C.brand }}
                >
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold mb-2" style={{ color: C.n900 }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — the numbers, as evidence for everything above */}
      <section className="py-20 md:py-24" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-2" style={{ color: C.n900 }}>Në shifra</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Ku jemi sot, pas nëntë vitesh.</p>
          <AboutStatsBand />
        </div>
      </section>

      {/* 5 — the same apply band every other page ends on */}
      <HorizontalApplicationBand />
    </PageWrapper>
  );
}

function PageEkipi() {
  const [activeCity, setActiveCity] = useState("Të gjitha");
  const cities = ["Të gjitha", "Prishtinë", "Prizren", "Kamenicë"];
  const members = activeCity === "Të gjitha" ? TEAM_MEMBERS : TEAM_MEMBERS.filter((m) => m.city === activeCity);
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth nesh" }, { label: "Ekipi" }]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Ekipi</h1>
          <p className="text-lg" style={{ color: C.muted }}>Njihu me njerëzit që qëndrojnë prapa Cacttus Education.</p>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            {cities.map((c) => <button key={c} onClick={() => setActiveCity(c)} className="px-5 py-2 rounded-full text-sm font-medium transition-all" style={{ backgroundColor: activeCity === c ? C.brand : C.n100, color: activeCity === c ? "#fff" : C.n700, border: activeCity === c ? `1px solid ${C.brand}` : `1px solid ${C.n200}` }}>{c}</button>)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {members.map((m) => <PersonCard key={m.name} person={m} />)}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

const LIGJËRUEIT = [
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

function PageLigjërueit() {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth nesh" }, { label: "Ligjëruesit" }]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Ligjëruesit</h1>
          <p className="text-0.5g" style={{ color: C.muted }}>Njihuni me ligjëruesit, profesionistë të industrisë që sjellin njohuri praktike dhe ju përgatisin për tregun e punës.</p>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-16">
            {/* `nameOnly` here and NOT on /ekipi, which keeps its role, city and LinkedIn. */}
            {LIGJËRUEIT.map((l) => <PersonCard key={l.name} person={l} nameOnly />)}
          </div>
          <div className="py-16 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 px-8" style={{ backgroundColor: C.p900 }}>
            <h3 className="text-2xl font-semibold text-white">Dëshiron të ligjërosh te ne?</h3>
            <Link to="/kontakti"><SecondaryBtn className="border-white/50 text-white">Na kontakto</SecondaryBtn></Link>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   APPLY POPUP ACCESS + IN-PAGE SCROLL
══════════════════════════════════════════ */

/*
  The application popup is owned by `Layout` — the banner, the navbar and the footer all
  open it from there. Pages, though, arrive as `children` inside <main>, so they have no
  prop path back up to that opener.

  A context is what closes the gap WITHOUT a second popup existing anywhere. One state,
  one <ScrollPopupForm>, and any page deep in the tree can ask for the same door the
  navbar uses. Threading an `onApplyClick` prop through every page component instead
  would touch a dozen signatures to deliver one function.

  The default is a no-op rather than a throw: a page rendered outside Layout (a test, a
  future embed) should degrade to a dead button, not crash the route.
*/
const ApplyPopupContext = React.createContext<() => void>(() => {});

/** Opens the same application popup as the navbar's "Apliko tani". */
function useApplyPopup(): () => void {
  return React.useContext(ApplyPopupContext);
}

/*
  Anchors for the two in-page "scroll down to…" buttons. Declared as constants because
  each id is written twice — once on the section, once on the button that jumps to it —
  and a typo in either half fails silently as a button that does nothing.
*/
const BALLINA_PROGRAMS_ID = "programet";
const TALENTE_LIST_ID = "talentet";

/*
  Smooth in-page scroll.

  `scrollIntoView` rather than a hand-rolled `requestAnimationFrame` easing loop, which is
  what this briefly was. The rAF version was written after the native call appeared to be
  a no-op in testing — but the real cause was that the test tab was BACKGROUNDED, and
  Chrome suspends animation frames in a hidden tab. That kills a rAF loop exactly as dead
  as it kills the native animation, so the extra 25 lines bought nothing. In a tab the
  user is actually looking at, this animates.

  It also gets two things free that the hand-rolled version had to spell out: it honours
  `prefers-reduced-motion` on its own, and it recomputes the distance if an image above
  the target finishes loading and shifts the page mid-scroll.

  The sticky navbar would otherwise cover the top of whatever we land on. That offset
  comes from the target's own `scroll-mt-28`, the CSS property built for this, so the
  number lives with the element rather than being guessed here.

  A missing id is a no-op by design — a dead button beats a crash.
*/
function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ══════════════════════════════════════════
   ROOT LAYOUT + ROUTING
══════════════════════════════════════════ */
function Layout({ children }: { children: React.ReactNode }) {
  const [showBanner] = useState(true); /* TopBanner has no close button, so no setter */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  /* Owned here, not in the popup: the banner and Navbar buttons need it too. */
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  /* In-memory only: stops the auto-trigger re-firing, but dies on refresh. */
  const popupShownThisLoad = useRef(false);

  /* useCallback keeps one stable identity across renders, so the popup's effects
     do not tear themselves down and rebuild every time Layout re-renders. */
  const openPopup = useCallback(() => {
    popupShownThisLoad.current = true;
    setIsPopupOpen(true);
  }, []);
  const closePopup = useCallback(() => setIsPopupOpen(false), []);

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  /* ─── Auto-trigger: two downward scroll bursts, homepage only ─── */
  useEffect(() => {
    if (location.pathname !== "/") return;   // every other route: no listener at all
    if (isPopupOpen || popupShownThisLoad.current) return; // already had its turn

    let lastY = window.scrollY;
    let bursts = 0;
    let idleTimer: number | undefined;

    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;
      if (!goingDown) return;               // scrolling back up never counts

      window.clearTimeout(idleTimer);       // still moving: this burst isn't over
      idleTimer = window.setTimeout(() => { // 300ms of stillness ends the burst
        bursts += 1;
        if (bursts >= 2) openPopup();       // the same door the buttons use
      }, 300);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {                          // cleanup: never leave a listener behind
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idleTimer);
    };
  }, [isPopupOpen, openPopup, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Inter, sans-serif", backgroundColor: C.n0, color: C.n700 }}>
      <style>{globalStyle}</style>
      {showBanner && <TopBanner onApplyClick={openPopup} />}
      <Navbar showBanner={showBanner} setMobileMenuOpen={setMobileMenuOpen} onApplyClick={openPopup} />
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {/* Every page below can now call `useApplyPopup()` and get THIS opener. */}
      <ApplyPopupContext.Provider value={openPopup}>
        <main className="flex-1">{children}</main>
      </ApplyPopupContext.Provider>
      {/* Chrome, like the navbar: rendered here so no route can be missing it. */}
      <Footer onApplyClick={openPopup} />
      {/* Lives in Layout so it is available on every route, not just the homepage. */}
      <ScrollPopupForm isOpen={isPopupOpen} onClose={closePopup} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<PageBallina />} />
                <Route path="/programim" element={<PageProgramim />} />
                <Route path="/siguria" element={<PageSiguria />} />
                <Route path="/trajnime" element={<PageTrajnime />} />
                {/* Detail page. Declared after the exact "/trajnime" so the catalogue
                    keeps its own route; React Router ranks static over dynamic anyway. */}
                <Route path="/trajnime/:slug" element={<PageTrajnimiDetal />} />
                {/* Social-media intake: the link an admin copies out of the dashboard. */}
                <Route path="/forma/:slug" element={<PageForma />} />
                <Route path="/biznese" element={<PageBiznese />} />
                <Route path="/biznese/trajnime" element={<PageBizneseTrajnime />} />
                <Route path="/biznese/talente" element={<PageBizneseTalente />} />
                <Route path="/biznese/bursa" element={<PageBizneseBursa />} />
                <Route path="/biznese/klasa" element={<PageBiznestKlasa />} />
                <Route path="/projektet" element={<PageProjektet />} />
                {PROJECTS.map((p) => (
                  <Route key={p.path} path={p.path} element={<ProjectDetailPage project={p} />} />
                ))}
                <Route path="/lajme" element={<PageLajme />} />
                {/* Detail page. Declared after the exact "/lajme" so the feed keeps that
                    path, exactly as /trajnime/:slug is declared after /trajnime. This
                    replaces the old static "/lajme/artikull" mock route — that path now
                    resolves here as a slug and 404s honestly, which is correct: it never
                    named a real post. */}
                <Route path="/lajme/:slug" element={<PageArtikulli />} />
                <Route path="/kontakti" element={<PageKontakti />} />
                <Route path="/rreth-nesh" element={<PageRrethNesh />} />
                <Route path="/ekipi" element={<PageEkipi />} />
                <Route path="/ligjërueit" element={<PageLigjërueit />} />
                <Route path="*" element={<PageBallina />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
