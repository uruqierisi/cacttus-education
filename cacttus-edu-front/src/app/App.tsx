import React, { useState, useEffect, useRef, useCallback } from "react";
import heroGraduates from "../imports/group4.png";
import studimePhoto from "../imports/Bursa_Redesign.png";
import logoImg from "../imports/logo-180px.png";
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
  type TrainingCategory,
  type TrainingDetail,
  type TrainingFormat,
} from "../marketing/lib/public-api";
import { APPLICATION_FORM_SLUG } from "../marketing/lib/forms.config";

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
  X,
  Menu,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
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
  Target,
  Zap,
  Plus,
  Minus,
  Building,
  FileText,
  UserCheck,
  MessageSquare,
  GraduationCap,
  DollarSign,
  BarChart,
  Projector,
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
`;

/* ─── SHARED TYPES ─── */
type DropdownId = "studime" | "projektet" | "biznese" | "rreth" | null;

/* ══════════════════════════════════════════
   PART 1 — GLOBAL: BANNER + NAVBAR
══════════════════════════════════════════ */

/* 1.1 — TOP BANNER: deep brand purple #823685 */
function TopBanner({ onApplyClick }: { onApplyClick: () => void }) {
  return (
    <div
      className="w-full flex items-center justify-center px-4 relative"
      style={{ backgroundColor: C.brand, height: 40 }}
    >
      <p className="text-white text-sm font-medium text-center">
        Regjistrohu me <span className="font-bold">20%</span> zbritje
      </p>
      <div className="absolute right-7 top-0 h-full flex items-center gap-3">
        {/* A button, not a Link: it opens the popup instead of navigating. */}
        <button
          type="button"
          onClick={onApplyClick}
          className="hidden md:flex items-center gap-1 text-white text-xs font-medium px-3 py-1 rounded-full transition-all hover:bg-white/20"
          style={{ border: "1px solid rgba(255,255,255,0.5)" }}
        >
          Apliko tani <ArrowRight size={12} />
        </button>
      </div>
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

  const navLinkClass =
    "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-purple-700";
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
        <Link to="/" className="shrink-0 flex items-center" style={{ height: 52, overflow: "hidden" }}>
          <img
            src={logoImg}
            alt="Cacttus Education"
            style={{
              height: 130,
              width: "auto",
              objectFit: "contain",
              display: "block",
              mixBlendMode: "multiply",
              marginTop: -39,
              marginBottom: -39,
            }}
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
            <button className={navLinkClass} style={navLinkStyle}>
              Rreth Nesh{" "}
              <ChevronDown size={13} className={`inline ml-0.5 transition-transform ${activeDropdown === "rreth" ? "rotate-180" : ""}`} />
            </button>
            {activeDropdown === "rreth" && <DropdownRreth onClose={() => setActiveDropdown(null)} />}
          </div>

          <Link to="/kontakti" className={navLinkClass} style={navLinkStyle}>
            Kontakti
          </Link>
        </nav>

        <div className="hidden lg:block">
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
          { to: "/programim", Icon: Code, title: "Zhvillues i Ueb-it dhe Aplikacioneve Mobile", sub: "Programim, zhvillim uebi, aplikacione mobile" },
          { to: "/siguria", Icon: Shield, title: "Siguria Kibernetike", sub: "Mbrojtje sistemesh, analiza rreziqesh, incidente kibernetike" },
        ].map(({ to, Icon, title, sub }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className="flex items-start gap-4 p-4 rounded-xl transition-all hover:shadow-md group"
            style={{ border: `1px solid ${C.n200}` }}
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

const PROJEKTET_LIST = [
  { name: "Skill Factory", path: "/projektet/skill-factory" },
  { name: "Partneriteti për Impaktin në TIK", path: "/projektet/usaid" },
  { name: "SDC", path: "/projektet/sdc" },
  { name: "Gratë në Punë Online", path: "/projektet/wow" },
  { name: "KODE", path: "/projektet/kode" },
  { name: "Regional Challenge Fund (RCF)", path: "/projektet/rcf" },
  { name: "LuxDev Smart Mobility Project", path: "/projektet/luxdev" },
  { name: "Virtual Innovation Consortium (VIC)", path: "/projektet/vic" },
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
          className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-purple-50 group"
          style={{ color: C.n700 }}
        >
          {p.name}
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.brand }} />
        </Link>
      ))}
    </div>
  );
}

function DropdownBiznese({ onClose }: { onClose: () => void }) {
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
            className="p-4 rounded-xl transition-all hover:shadow-md"
            style={{ border: `1px solid ${C.n200}` }}
          >
            <p className="font-semibold text-sm" style={{ color: C.n900 }}>{item.title}</p>
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
  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-sm flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ backgroundColor: C.n0 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.n200 }}>
          <img src={logoImg} alt="Cacttus Education" style={{ height: 32, width: "auto", objectFit: "contain", mixBlendMode: "multiply" }} />
          <button onClick={onClose}><X size={22} style={{ color: C.n700 }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <AccordionMobile label="Studime profesionale" id="studime" expanded={expanded} toggle={toggle}>
            <Link to="/programim" onClick={onClose} className="py-2 pl-4 text-sm block border-l-2" style={{ color: C.brand, borderColor: C.p300 }}>Zhvillues i Ueb-it dhe Aplikacioneve Mobile</Link>
            <Link to="/siguria" onClick={onClose} className="py-2 pl-4 text-sm block border-l-2" style={{ color: C.brand, borderColor: C.p300 }}>Siguria Kibernetike</Link>
          </AccordionMobile>
          <Link to="/trajnime" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Trajnime profesionale</Link>
          <AccordionMobile label="Projektet" id="projektet" expanded={expanded} toggle={toggle}>
            {PROJEKTET_LIST.map((p) => (
              <Link key={p.path} to={p.path} onClick={onClose} className="py-2 pl-4 text-sm block border-l-2" style={{ color: C.brand, borderColor: C.p300 }}>{p.name}</Link>
            ))}
          </AccordionMobile>
          <AccordionMobile label="Për biznese" id="biznese" expanded={expanded} toggle={toggle}>
            {[["Trajnime të personalizuara", "/biznese/trajnime"], ["Rrjeti i talentëve", "/biznese/talente"], ["Bursa e Impaktit", "/biznese/bursa"], ["Klasët me qera", "/biznese/klasa"]].map(([name, path]) => (
              <Link key={path} to={path} onClick={onClose} className="py-2 pl-4 text-sm block border-l-2" style={{ color: C.brand, borderColor: C.p300 }}>{name}</Link>
            ))}
          </AccordionMobile>
          <Link to="/lajme" onClick={onClose} className="flex px-5 py-3 text-sm font-medium" style={{ color: C.n800 }}>Lajme</Link>
          {/* Rreth Nesh BEFORE Kontakti */}
          <AccordionMobile label="Rreth Nesh" id="rreth" expanded={expanded} toggle={toggle}>
            <Link to="/ekipi" onClick={onClose} className="py-2 pl-4 text-sm block border-l-2" style={{ color: C.brand, borderColor: C.p300 }}>Ekipi</Link>
            <Link to="/ligjërueit" onClick={onClose} className="py-2 pl-4 text-sm block border-l-2" style={{ color: C.brand, borderColor: C.p300 }}>Ligjëruesit</Link>
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

function AccordionMobile({ label, id, expanded, toggle, children }: { label: string; id: string; expanded: string | null; toggle: (id: string) => void; children: React.ReactNode }) {
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
      {expanded === id && <div className="px-5 pb-2 flex flex-col gap-1">{children}</div>}
    </>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer style={{ backgroundColor: C.p900 }} className="pt-20 pb-8">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div>
            <div className="inline-flex items-center justify-center rounded-lg mb-5 overflow-hidden" style={{ backgroundColor: "#fff", padding: "4px 10px" }}>
              <img src={logoImg} alt="Cacttus Education" style={{ height: 28, width: "auto", objectFit: "contain", display: "block" }} />
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
              Cacttus Education është lider në Kosovë në ofrimin e edukimit profesional në fushën e teknologjisë informative.
            </p>
            <div className="flex flex-col gap-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>Rr. Bashkim Fehmiu, Arbëria 3, BC2/14 nr.4</span>
              <span>10000 Prishtinë, Kosovë</span>
              <span>+383 (0)38 600 237</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-4">Navigimi</p>
            <div className="flex flex-col gap-2">
              {[["Studime profesionale", "/programim"], ["Trajnime profesionale", "/trajnime"], ["Projektet", "/projektet"], ["Për biznese", "/biznese"], ["Lajme", "/lajme"]].map(([label, path]) => (
                <Link key={path} to={path} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-4">Rreth nesh</p>
            <div className="flex flex-col gap-2">
              {[["Ekipi", "/ekipi"], ["Ligjëruesit", "/ligjërueit"], ["Kontakti", "/kontakti"]].map(([label, path]) => (
                <Link key={path} to={path} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-4">Rrjetet Sociale</p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Linkedin, Twitter].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <Icon size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Cacttus Education 2026. Të gjitha drejtat e rezervuara.</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Ndërtuar me ♥ në Prishtinë</p>
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
    <button onClick={onClick} className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors group ${className}`} style={{ color: C.brand }}>
      {children}
      <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.brand, letterSpacing: "0.08em" }}>{children}</p>;
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

function PageWrapper({ children, withFooter = true }: { children: React.ReactNode; withFooter?: boolean }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <>
      {children}
      {withFooter && <Footer />}
    </>
  );
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

/* ─── Motion timings. POPUP_EXIT_MS also gates the delayed unmount below. ─── */
const POPUP_ENTER_MS = 400;        // the card arriving
const POPUP_EXIT_MS = 180;         // the card leaving
const POPUP_ROW_MS = 280;          // one staggered row
const POPUP_ROW_STAGGER_MS = 50;   // gap between consecutive rows
const POPUP_ROW_START_MS = 100;    // rows begin while the card is still settling
const POPUP_REDUCED_MS = 150;      // reduced motion: one plain quick fade

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
      let second = 0;
      const first = requestAnimationFrame(() => {          // let the closed look paint once
        second = requestAnimationFrame(() => {             // now flip: browser animates
          setVisible(true);
          setEntered(true);                                // starts the row stagger
        });
      });
      return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();                     // stop the browser's default page reload
    if (!emri.trim() || !mbiemri.trim() || !drejtimi) {
      setError("Ju lutem plotësoni fushat e detyrueshme.");
      return;
    }
    console.log("Aplikim nga popup-i:", { emri, mbiemri, drejtimi, email, telefoni });
    setSent(true);
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
            {/* Rows 0-8: same classes, only the delay inside rowStyle(i) differs. */}
            <div className={rowClass} style={rowStyle(0)}><Overline>Apliko tani</Overline></div>
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
                <FormField label="Numri i telefonit" type="tel" value={telefoni} onChange={setTelefoni} placeholder="+383 4X XXX XXX" />
              </div>

              {/* Renders only when `error` is a non-empty string. Not staggered:
                  it appears on submit, long after the entrance has finished. */}
              {error && <p className="text-sm" style={{ color: C.danger }}>{error}</p>}

              <div className={rowClass} style={rowStyle(8)}>
                <PrimaryBtn type="submit" className="w-full justify-center mt-1">Apliko</PrimaryBtn>
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

    for (const field of form?.fields ?? []) {
      if (field.required && isBlank(answers[field.name] ?? "")) {
        missing[field.name] = `${field.label} është i detyrueshëm.`;
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
          onChange={(e) => setAnswer(field.name, e.target.value)}
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
          onChange={(e) => setContact({ ...contact, [name]: e.target.value })}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
                      {renderContactField("name", "Emri dhe mbiemri", "text", "Emri dhe mbiemri")}
                      {renderContactField("email", "Email", "email", "Email-i juaj")}
                      {renderContactField("phone", "Telefoni", "tel", "Numri i telefonit")}
                      {sortedFields.map(renderField)}
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

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="shrink-0 px-8 font-semibold text-sm rounded-xl transition-all hover:brightness-110 active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{ height: 52, backgroundColor: "#fff", color: C.brand }}
                      >
                        {isSubmitting ? "Duke dërguar..." : "Apliko tani"}
                      </button>
                      <p className="text-white/50 text-xs">
                        Duke dërguar formularin, pranon kushtet e privatësisë. Do të kontaktohesh brenda 48 orëve.
                      </p>
                    </div>
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
/**
 * Label + error wrapper for `PublicApplicationForm`'s fields.
 *
 * MUST stay at module scope. Declared inside the form component it would be a NEW
 * component type on every render, so React would unmount and remount the input on each
 * keystroke — the field loses focus after one character and the form reads as untypeable.
 * The error text arrives as a prop for exactly that reason: closing over `fieldErrors`
 * is what tempts this back inside the component.
 *
 * Sibling of `ApplyFieldShell`, which does the same job for the dark band; the two differ
 * only in colour, so they stay separate rather than growing a variant flag.
 */
function PublicFieldShell({
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
    for (const field of form.fields) {
      if (field.required && isBlank(answers[field.name] ?? "")) {
        missing[field.name] = `${field.label} është i detyrueshëm.`;
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
        <PublicFieldShell key={field.name} {...shell}>
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
        </PublicFieldShell>
      );
    }

    if (field.type === "multiselect" || field.type === "radio") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <PublicFieldShell key={field.name} {...shell}>
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
        </PublicFieldShell>
      );
    }

    if (field.type === "select") {
      const selected = typeof value === "string" ? value : "";
      return (
        <PublicFieldShell key={field.name} {...shell}>
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
        </PublicFieldShell>
      );
    }

    if (field.type === "textarea") {
      return (
        <PublicFieldShell key={field.name} {...shell}>
          <textarea
            id={id}
            rows={5}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            placeholder={field.placeholder}
            style={{ ...style, height: "auto", padding: "14px 16px", resize: "vertical" }}
          />
        </PublicFieldShell>
      );
    }

    return (
      <PublicFieldShell key={field.name} {...shell}>
        <input
          id={id}
          type={TEXT_INPUT_TYPES[field.type] ?? "text"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setAnswer(field.name, e.target.value)}
          placeholder={field.placeholder}
          style={style}
        />
      </PublicFieldShell>
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

  if (submitted) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center text-center gap-3" style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.brandSoft }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brand }}>
          <Check size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-bold" style={{ color: C.n900 }}>Faleminderit! Aplikimi u dërgua.</h3>
        <p className="text-sm" style={{ color: C.muted }}>Do të të kontaktojmë brenda 48 orëve.</p>
        <SecondaryBtn onClick={() => setSubmitted(false)}>Dërgo një tjetër</SecondaryBtn>
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
        <PublicFieldShell name="name" label="Emri dhe mbiemri" required error={fieldErrors.name}>
          <input
            id="f-name"
            type="text"
            autoComplete="name"
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            style={fieldErrors.name ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFieldShell>
        <PublicFieldShell name="email" label="Email" required error={fieldErrors.email}>
          <input
            id="f-email"
            type="email"
            autoComplete="email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            style={fieldErrors.email ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFieldShell>
        <PublicFieldShell name="phone" label="Numri i telefonit" required error={fieldErrors.phone}>
          <input
            id="f-phone"
            type="tel"
            autoComplete="tel"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            style={fieldErrors.phone ? { ...inputStyle, ...errorBorder } : inputStyle}
          />
        </PublicFieldShell>

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
const STUDENT_PHOTOS = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&h=506&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&h=506&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&h=506&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=900&h=506&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&h=506&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=900&h=506&fit=crop&auto=format",
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
        {visible.map((url, i) => (
          <div key={i} className="flex-1 rounded-2xl overflow-hidden aspect-[16/9]" style={{ backgroundColor: C.n100 }}>
            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setCurrent((c) => (c - 1 + STUDENT_PHOTOS.length) % STUDENT_PHOTOS.length)} className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:shadow-md" style={{ border: `1.5px solid ${C.n200}`, backgroundColor: C.n0 }}>
          <ChevronLeft size={20} style={{ color: C.n700 }} />
        </button>
        <div className="flex gap-2">
          {STUDENT_PHOTOS.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className="transition-all rounded-full" style={{ width: i === current ? 24 : 8, height: 8, backgroundColor: i === current ? C.brand : C.n300 }} />
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
function PersonCard({ person }: { person: { name: string; role: string; city: string; imgUrl?: string } }) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}>
      <div className="aspect-[4/5] overflow-hidden" style={{ backgroundColor: C.n100 }}>
        {person.imgUrl ? <img src={person.imgUrl} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: C.brandSoft }}><Users size={36} style={{ color: C.p300 }} /></div>}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-sm" style={{ color: C.n900 }}>{person.name}</h4>
        <p className="text-xs mt-0.5 mb-3" style={{ color: C.n500 }}>{person.role}</p>
        <div className="flex items-center justify-between">
          <MetaChip>{person.city}</MetaChip>
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors" aria-label="LinkedIn"><Linkedin size={15} style={{ color: C.n500 }} /></button>
        </div>
      </div>
    </div>
  );
}

/* ── PROJECT CARD ── */
function ProjectCard({ project, to }: { project: { title: string; partner: string; desc: string }; to: string }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }} onClick={() => navigate(to)}>
      <div className="inline-flex items-center px-3 h-8 rounded-lg" style={{ border: `1px solid ${C.n300}`, width: "fit-content" }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.n600, letterSpacing: "0.08em" }}>{project.partner}</span>
      </div>
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
                  Ndërto karrierën tënde në<br />
                  <RotatingWord words={["programim.", "siguri kibernetike.", "teknologji."]} />
                </h1>
                <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: C.muted }}>
                  Shkolla e parë profesionale e teknologjisë në Kosovë. Studime dyvjeçare të akredituara, trajnime praktike dhe ligjërues nga industria.
                </p>
                <div className="flex flex-wrap gap-5">
                  <Link to="/#apliko"><PrimaryBtn>Apliko tani</PrimaryBtn></Link>
                  <SecondaryBtn>Shiko programet</SecondaryBtn>
                </div>
              </div>

              {/* Stats directly below buttons */}
              <div className="mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-7 pt-6" style={{ borderTop: `1px solid ${C.n200}` }}>
                  {[["500+", "Studentë të diplomuar"], ["20%", "Zbritje në studime "], ["9 vite", "Përvojë në treg të punës"], ["40+", "Partnerë nga industria"]].map(([num, label]) => (
                    <div key={label}>
                      <p className="text-2xl font-bold" style={{ color: C.brand }}>{num}</p>
                      <p className="text-sm mt-0.5" style={{ color: C.n500 }}>{label}</p>
                    </div>
                  ))}
                </div>
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
function StudimeProfesionaleSection() {
  const navigate = useNavigate();

  return (
    <section className="py-24" style={{ backgroundColor: C.n0, borderTop: `1px solid ${C.n200}` }}>
      <div className="max-w-[1200px] mx-auto px-5">

        {/* ── BAND 1: framed photo left · intro text right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">

          {/* Left — framed photo with blob + badge */}
          <div className="relative flex items-center justify-center">
            {/* Decorative blob behind frame */}
            <div
              className="absolute"
              style={{
                width: 340,
                height: 340,
                borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%",
                backgroundColor: C.brandLight,
                opacity: 0.7,
                top: "10%",
                left: "2%",
                zIndex: 0,
                filter: "blur(2px)",
              }}
            />

            {/* Photo frame */}
            <div
              className="relative z-10 overflow-hidden"
              style={{
                borderRadius: 28,
                border: `1.5px solid ${C.cardBorder}`,
                boxShadow: "0 20px 60px rgba(130,54,133,0.14), 0 4px 16px rgba(0,0,0,0.06)",
                maxWidth: 500,
                width: "100%",
                aspectRatio: "4/3",
              }}
            >
              <img
                src={studimePhoto}
                alt="Studentë në klasë"
                className="w-full h-full object-cover"
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
              Studime dyvjeçare të akredituara nga MAS, të ndërtuara bashkë me industrinë teknologjike.
            </p>
            <Link to="/programim">
              <GhostBtn>Shiko të gjitha programet</GhostBtn>
            </Link>
          </div>
        </div>

        {/* ── BAND 2: two program cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {[
            {
              to: "/programim",
              Icon: Code,
              iconBg: C.brandLight,
              iconColor: C.brand,
              title: "Zhvillues i Ueb-it dhe Aplikacioneve Mobile",
              desc: "Nga HTML te React dhe React Native — mëso të ndërtosh produkte dixhitale të plota, nga faqja e parë deri te aplikacioni mobil në duar të mijëra përdoruesve.",
              tags: ["Programim", "Zhvillim uebi", "Mobile"],
              tagBg: C.brandLight,
              tagColor: C.brandDark,
              meta: ["2 vite · 4 semestra", "Diplomë profesionale", "Akredituar MAS"],
            },
            {
              to: "/siguria",
              Icon: Shield,
              iconBg: "#FFF0F3",
              iconColor: "#C0395A",
              title: "Siguria Kibernetike",
              desc: "Mbroni sisteme, analizoni rreziqe dhe reagoni ndaj incidenteve kibernetike. Curriculum i ndërtuar me ekspertë të sigurisë nga kompanitë kryesore.",
              tags: ["Mbrojtje sistemesh", "Analizë rreziqesh", "Incidente"],
              tagBg: "#FFF0F3",
              tagColor: "#9B2B45",
              meta: ["2 vite · 4 semestra", "Diplomë profesionale", "Akredituar MAS"],
            },
          ].map(({ to, Icon, iconBg, iconColor, title, desc, tags, tagBg, tagColor, meta }) => (
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
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: tagBg, color: tagColor }}>{tag}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2" style={{ borderTop: `1px solid ${C.n100}` }}>
                {meta.map((m) => (
                  <span key={m} className="text-xs" style={{ color: C.n500 }}>{m}</span>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-auto">
                <span className="text-sm font-semibold" style={{ color: C.brand }}>Mëso më shumë</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" style={{ color: C.brand }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── BAND 3: four feature chip-cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Award,    label: "Akredituar MAS",         sub: "Njohur zyrtarisht",    bg: C.brandLight,  color: C.brand },
            { icon: Laptop,   label: "Mësim praktik",          sub: "Projekte reale",        bg: "#FFF0F3",     color: "#C0395A" },
            { icon: Users,    label: "Ligjërues nga industria", sub: "Profesionistë aktivë", bg: "#EEF6FF",     color: "#2563EB" },
            { icon: Briefcase,label: "Mbështetje karriere",     sub: "Rrjet punëdhënësish",  bg: "#ECFDF5",     color: "#059669" },
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

/* 2.2 — Trajnime promo with 4th box */
function TrajnimePromoSection() {
  return (
    <section className="py-24" style={{ backgroundColor: C.p900 }}>
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="mb-10">
          <Overline>TRAJNIME PROFESIONALE</Overline>
          <h2 className="text-4xl font-bold mb-3 text-white" style={{ letterSpacing: "-0.01em" }}>
            Aftësohu shpejt, në muaj — jo në vite.
          </h2>
          <p className="text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.65)" }}>
            Trajnime intensive praktike në programim, siguri kibernetike, dizajn dhe menaxhim projektesh — online, në klasë ose hibrid.
          </p>
        </div>

        {/* 4-column grid (2×2 tablet, 1col mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { name: "JavaScript", desc: "Zhvillim web modern me JavaScript dhe React", meta: "30 orë · Hibrid", icon: Code },
            { name: "Cyber Security Essentials", desc: "Bazat e sigurisë kibernetike dhe mbrojtjes", meta: "— orë · Klasë", icon: Shield },
            { name: "Dizajn Grafik", desc: "Vizual dhe brand identity me mjete dixhitale", meta: "40 orë · Hibrid", icon: Laptop },
            { name: "Data Science", desc: "Analizë të dhënash, statistikë dhe machine learning", meta: "120 orë · Klasë", icon: BarChart },
          ].map(({ name, desc, meta, icon: Icon }) => (
            <div
              key={name}
              className="p-5 rounded-2xl flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.brand }}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{name}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</p>
              </div>
              <p className="text-xs mt-auto" style={{ color: "rgba(255,255,255,0.4)" }}>{meta}</p>
              <GhostBtn className="text-white/70 hover:text-white">Shiko trajnimin</GhostBtn>
            </div>
          ))}
        </div>

        <Link to="/trajnime"><PrimaryBtn>Shiko të gjitha trajnimet</PrimaryBtn></Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   PART 3 — PROGRAMIM PAGE
══════════════════════════════════════════ */

/* 3.2 — INFINITE LOGO MARQUEE */
const PARTNER_LOGOS = [
  "Infosys", "Microsoft", "Deloitte", "IBM", "Accenture",
  "SAP", "Oracle", "Cisco", "Google", "Amazon",
  "PwC", "KPMG", "BCG", "Siemens", "Telecom Kosovo",
];

function InfiniteLogoMarquee() {
  const row1 = [...PARTNER_LOGOS, ...PARTNER_LOGOS];
  const row2 = [...PARTNER_LOGOS.slice(5), ...PARTNER_LOGOS, ...PARTNER_LOGOS.slice(0, 5)];

  return (
    <div className="marquee-wrap overflow-hidden relative">
      {/* Fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${C.n0}, transparent)` }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${C.n0}, transparent)` }} />

      {/* Row 1 — left */}
      <div className="flex mb-4">
        <div className="marquee-left flex gap-4 shrink-0">
          {row1.map((name, i) => (
            <LogoCard key={`r1-${i}`} name={name} />
          ))}
        </div>
      </div>

      {/* Row 2 — right */}
      <div className="flex">
        <div className="marquee-right flex gap-4 shrink-0">
          {row2.map((name, i) => (
            <LogoCard key={`r2-${i}`} name={name} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoCard({ name }: { name: string }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default"
      style={{ width: 180, height: 90, border: `1px solid #EEE8EF`, backgroundColor: C.n0, filter: "grayscale(60%)", opacity: 0.6 }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = "grayscale(0%)"; e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "grayscale(60%)"; e.currentTarget.style.opacity = "0.6"; }}
    >
      <span className="text-xs font-semibold tracking-wide" style={{ color: C.n600 }}>{name}</span>
    </div>
  );
}

/* 3.1 — INTERACTIVE SEMESTER TABS */
const SEM_PROGRAMIM = [
  { sem: "Semestri 1", modules: [["Hyrje në programim", 45], ["Bazat e HTML dhe CSS", 45], ["Algoritme dhe struktura të dhënash", 45], ["Matematikë diskrete", 45], ["Anglishte teknike", 45]] },
  { sem: "Semestri 2", modules: [["JavaScript dhe DOM", 45], ["Bazat e të dhënave (SQL)", 45], ["Programim i orientuar në objekte", 45], ["Dizajn i ndërfaqeve (UI/UX)", 45], ["Kontroll versionesh me Git", 45]] },
  { sem: "Semestri 3", modules: [["Zhvillim front-end me React", 45], ["Zhvillim back-end me Node.js", 45], ["Zhvillim i aplikacioneve mobile", 45], ["API dhe integrime", 45], ["Testim i softuerit", 45]] },
  { sem: "Semestri 4", modules: [["Cloud dhe DevOps", 45], ["Siguri e aplikacioneve", 45], ["Menaxhim projektesh Agile", 45], ["Praktikë profesionale", 90], ["Projekt diplome", 90]] },
];

const SEM_SIGURIA = [
  { sem: "Semestri 1", modules: [["Hyrje në rrjeta kompjuterike", 45], ["Sisteme operative Linux", 45], ["Bazat e sigurisë së informacionit", 45], ["Skriptim me Python", 45], ["Anglishte teknike", 45]] },
  { sem: "Semestri 2", modules: [["Administrim i rrjetave", 45], ["Kriptografi e aplikuar", 45], ["Siguri e sistemeve Windows", 45], ["Bazat e të dhënave dhe siguria", 45], ["Etika dhe legjislacioni kibernetik", 45]] },
  { sem: "Semestri 3", modules: [["Testim i depërtimit (Penetration Testing)", 45], ["Analizë e malware-it", 45], ["Monitorim dhe SIEM", 45], ["Siguri në cloud", 45], ["Menaxhim i rrezikut", 45]] },
  { sem: "Semestri 4", modules: [["Reagim ndaj incidenteve", 45], ["Forenzikë dixhitale", 45], ["Siguri e aplikacioneve web", 45], ["Praktikë profesionale", 90], ["Projekt diplome", 90]] },
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
        {/* Filled portion */}
        <div
          className="absolute left-8 top-4 h-0.5 transition-all duration-300"
          style={{ backgroundColor: C.brand, right: `${((semesters.length - 1 - active) / (semesters.length - 1)) * 100 * (1 - 16 / 100)}%`, width: `calc(${(active / (semesters.length - 1)) * 100}% - 0px)` }}
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
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: i === active ? C.brand : C.n500 }}>
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
          <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: C.brand, color: "#fff" }}>30 ECTS</span>
        </div>

        {/* Module rows */}
        {semesters[active].modules.map(([name, hours], i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-3.5 text-sm"
            style={{
              borderBottom: i < semesters[active].modules.length - 1 ? `1px solid ${C.n100}` : "none",
              backgroundColor: i % 2 === 0 ? C.n0 : "#FAF5FB",
            }}
          >
            <span className="font-medium" style={{ color: C.n800 }}>{name as string}</span>
            <span className="text-xs shrink-0 ml-4" style={{ color: C.n400 }}>6 ECTS · {hours as number} orë</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── PROGRAM PAGE TEMPLATE ── */
function ProgramPage({
  title, breadcrumbEnd, heroParagraph, whatCards, semesters, roles, preselected, imgUrl,
}: {
  title: string; breadcrumbEnd: string; heroParagraph: string;
  whatCards: { title: string; icon: React.ElementType }[];
  semesters: typeof SEM_PROGRAMIM; roles: string[]; preselected: string; imgUrl: string; to: string;
}) {
  return (
    <PageWrapper withFooter={false}>
      {/* Hero */}
      <section className="py-16 md:py-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Studime profesionale" }, { label: breadcrumbEnd }]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>{title}</h1>
              <p className="text-lg leading-relaxed mb-6" style={{ color: C.muted }}>{heroParagraph}</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {["2 vite · 4 semestra", "120 ECTS", "Prishtinë · Prizren · Kamenicë", "Akredituar MAS"].map((c) => <MetaChip key={c}>{c}</MetaChip>)}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/#apliko"><PrimaryBtn>Apliko tani</PrimaryBtn></Link>
                <SecondaryBtn>Shkarko planprogramin</SecondaryBtn>
              </div>
            </div>
            <div className="aspect-[4/5] rounded-3xl overflow-hidden" style={{ backgroundColor: C.brandLight }}>
              <img src={imgUrl} alt={title} className="w-full h-full object-cover" />
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
                  <p className="text-sm" style={{ color: C.n500 }}>Njohuri dhe aftësi praktike nga industria.</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3.1 — INTERACTIVE SEMESTER TABS */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Plani mësimor</h2>
          <p className="text-lg mb-10" style={{ color: C.n500 }}>Katër semestra që të çojnë nga zero te punësimi.</p>
          <SemesterTabs semesters={semesters} />
        </div>
      </section>

      {/* 3.2 — INFINITE LOGO MARQUEE */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.n900 }}>Ku punojnë të diplomuarit tanë</h2>
          <p className="text-base mb-8" style={{ color: C.n500 }}>Kompanitë kryesore të teknologjisë ku punojnë alumni tanë.</p>
          <div className="flex flex-wrap gap-3 mb-10">
            {roles.map((r) => <span key={r} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: C.brandLight, color: C.brandDark }}>{r}</span>)}
          </div>
          <InfiniteLogoMarquee />
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
      title="Zhvillues i Ueb-it dhe Aplikacioneve Mobile"
      breadcrumbEnd="Zhvillues i Ueb-it dhe Aplikacioneve Mobile"
      heroParagraph="Bëhu zhvillues i kompletuar: nga faqja e parë e internetit te aplikacioni mobil në duart e mijëra përdoruesve. Dy vite, katër semestra, projekte reale."
      whatCards={[{ title: "Bazat e programimit", icon: Code }, { title: "Zhvillim front-end", icon: Laptop }, { title: "Zhvillim back-end", icon: Globe }, { title: "Aplikacione mobile", icon: Briefcase }, { title: "Bazat e të dhënave", icon: BookOpen }, { title: "Projekte reale me klientë", icon: Users }]}
      semesters={SEM_PROGRAMIM}
      roles={["Front-end Developer", "Back-end Developer", "Mobile Developer", "QA Engineer", "UI/UX Designer", "DevOps Engineer"]}
      preselected="Zhvillues i Ueb-it dhe Aplikacioneve Mobile"
      imgUrl="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=800&fit=crop&auto=format"
      to="/programim"
    />
  );
}

function PageSiguria() {
  return (
    <ProgramPage
      title="Siguria Kibernetike"
      breadcrumbEnd="Siguria Kibernetike"
      heroParagraph="Mbroj sistemet, të dhënat dhe njerëzit. Mëso të zbulosh dobësitë, të analizosh rreziqet dhe të reagosh ndaj incidenteve kibernetike."
      whatCards={[{ title: "Rrjeta dhe sisteme", icon: Globe }, { title: "Kriptografi e aplikuar", icon: Shield }, { title: "Testim i depërtimit", icon: Code }, { title: "Analizë e incidenteve", icon: BookOpen }, { title: "Forenzikë dixhitale", icon: Laptop }, { title: "Siguri në cloud", icon: Award }]}
      semesters={SEM_SIGURIA}
      roles={["SOC Analyst", "Penetration Tester", "Security Engineer", "IT Auditor", "Incident Responder", "Network Administrator"]}
      preselected="Siguria Kibernetike"
      imgUrl="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=640&h=800&fit=crop&auto=format"
      to="/siguria"
    />
  );
}

/* ══════════════════════════════════════════
   PART 4 — TRAJNIME PAGE (filter labels)
══════════════════════════════════════════ */
const TRAINERS = [
  { name: "Arsim Susuri", role: "Applied AI and Machine Learning", imgUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&auto=format" },
  { name: "Hana Hoxha", role: "Data Science", imgUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop&auto=format" },
  { name: "Ali Kaçamaku", role: "JavaScript", imgUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&auto=format" },
  { name: "Mentor Berisha", role: "Ethical Hacking", imgUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&auto=format" },
  { name: "Enes Sermaxhaj", role: "Dizajn Grafik", imgUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&auto=format" },
  { name: "Era Gjakova", role: "Komunikim Profesional", imgUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&auto=format" },
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
      <MetaChip>{TRAINING_CATEGORY_LABELS[training.category]}</MetaChip>
      <h4 className="text-base font-semibold leading-snug" style={{ color: C.n900 }}>{training.title}</h4>
      <div className="flex flex-col gap-2 flex-1">
        {([
          ["Fillimi", formatTrainingDate(training.startDate)],
          ["Formati", TRAINING_FORMAT_LABELS[training.format]],
          ["Orët", training.hours === null ? "—" : `${training.hours} orë`],
          ["Ligjëruesi", training.instructor || "—"],
          ["Qyteti", training.city || "—"],
        ] as const).map(([label, val]) => (
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

function PageTrajnime() {
  const [trainings, setTrainings] = useState<readonly TrainingCardData[]>([]);
  const [categories, setCategories] = useState<readonly TrainingCategory[]>([]);
  const [cities, setCities] = useState<readonly string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [cat, setCat] = useState(ALL_FILTER);
  const [city, setCity] = useState(ALL_FILTER);

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

  const filtered = trainings.filter(
    (t) =>
      (cat === ALL_FILTER || TRAINING_CATEGORY_LABELS[t.category] === cat) &&
      (city === ALL_FILTER || t.city === city),
  );

  const catOptions = [ALL_FILTER, ...categories.map((c) => TRAINING_CATEGORY_LABELS[c])];
  const cityOptions = [ALL_FILTER, ...cities];

  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Trajnime profesionale</h1>
          <p className="text-lg mb-6 max-w-2xl" style={{ color: C.muted }}>
            Trajnime të shkurtra dhe intensive, të dizajnuara me kompanitë e teknologjisë. Zgjidh formatin që të përshtatet: online, në klasë ose hibrid — dhe merr certifikatë në përfundim.
          </p>
          {!isLoading && !loadError && trainings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <MetaChip>{trainings.length} trajnime</MetaChip>
              <MetaChip>{categories.length} kategori</MetaChip>
              <MetaChip>Certifikatë profesionale</MetaChip>
            </div>
          )}
        </div>
      </section>

      {/* Chips stay hidden while loading rather than rendering empty and then jumping. */}
      {!isLoading && !loadError && trainings.length > 0 && (
        <div className="sticky top-[76px] z-30 py-4" style={{ backgroundColor: C.n0, borderBottom: `1px solid ${C.n200}` }}>
          <div className="max-w-[1200px] mx-auto px-5 flex flex-col gap-5">
            <FilterRow label="Trajnimet:" options={catOptions} active={cat} onSelect={setCat} />
            {cityOptions.length > 1 && (
              <FilterRow label="Qyteti:" options={cityOptions} active={city} onSelect={setCity} />
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
              <SecondaryBtn onClick={() => { setCat(ALL_FILTER); setCity(ALL_FILTER); }}>Pastro filtrat</SecondaryBtn>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => <TrainingCard key={t.slug} training={t} />)}
            </div>
          )}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRAINERS.map((t) => (
              <div key={t.name} className="flex flex-col items-center text-center">
                <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden mb-3" style={{ backgroundColor: C.n100 }}>
                  <img src={t.imgUrl} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <p className="text-sm font-semibold" style={{ color: C.n900 }}>{t.name}</p>
                <p className="text-xs mt-0.5" style={{ color: C.n500 }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
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

  const meta = [
    ["Fillimi", formatTrainingDate(training.startDate)],
    ["Formati", TRAINING_FORMAT_LABELS[training.format]],
    ["Orët", training.hours === null ? "—" : `${training.hours} orë`],
    ["Ligjëruesi", training.instructor || "—"],
    ["Qyteti", training.city || "—"],
  ] as const;

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
          </div>

          {/* ── Application form ── */}
          <div className="lg:sticky lg:top-24" id="apliko">
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
function PageBiznese() {
  const navigate = useNavigate();
  const BUSINESS_OFFERINGS = [
    { title: "Trajnime të personalizuara", desc: "Rikualifikoni punëtorët ekzistues për role dixhitale", icon: Briefcase, path: "/biznese/trajnime" },
    { title: "Rrjeti i talentëve", desc: "Akses në portfoliot dhe CV e studentëve", icon: Users, path: "/biznese/talente" },
    { title: "Bursa e Impaktit", desc: "Bëhu Sponsor i Bursave të impaktit", icon: Award, path: "/biznese/bursa" },
    { title: "Klasët me qera", desc: "Klasat moderne të pajisura për qira", icon: BookOpen, path: "/biznese/klasa" },
  ];
  return (
    <PageWrapper>
      <section className="py-16 md:py-24" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Për biznese</h1>
          <p className="text-lg mb-2" style={{ color: C.muted }}>Ndihmojmë kompanitë të përgatiten për transformimin dixhital.</p>
          <p className="text-lg mb-8" style={{ color: C.muted }}>Nga rikualifikimi i ekipit deri te qasja në talentët e rinj të teknologjisë.</p>
          <Link to="/kontakti"><PrimaryBtn>Na kontakto</PrimaryBtn></Link>
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
      <section className="py-16" style={{ backgroundColor: C.p900 }}>
        <div className="max-w-[1200px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <h3 className="text-2xl font-semibold text-white">Ke një nevojë specifike për ekipin tënd?</h3>
          <Link to="/kontakti"><PrimaryBtn>Bisedo me ne</PrimaryBtn></Link>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   PART 5 — CUSTOM BIZNESE SUBPAGES
══════════════════════════════════════════ */

/* ── 5.1 TRAJNIME TË PERSONALIZUARA ── */
function PageBizneseTrajnime() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [
    ["Sa kohë zgjat një program trajnimi i personalizuar?", "Kohëzgjatja varet nga nevojat specifike të kompanisë — nga 2 ditë intensive deri në programe 3-mujore."],
    ["A mund të mbahen trajnimet në ambientet e kompanisë?", "Po, ofrojmë trajnime on-site, në kampusin tonë, ose hybrid sipas preferencës suaj."],
    ["Si përcaktohet curriculum-i?", "Fillojmë me një auditim të aftësive ekzistuese dhe hartojmë program sipas gap-eve të identifikuara."],
    ["A lëshoni certifikata?", "Po, çdo pjesëmarrës merr certifikatë të njohur nga Cacttus Education pas përfundimit me sukses."],
    ["Sa person mund të trajnohen njëkohësisht?", "Grupet optimale janë 8–16 persona. Për numra më të mëdhenj ofrojmë sesione paralele."],
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
              <Overline>PËR BIZNESE</Overline>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
                Rikualifikoni talentin tuaj ekzistues për rolet dixhitale të nesërmes
              </h1>
              <p className="text-lg mb-8" style={{ color: C.muted }}>
                Programe trajnimi të dizajnuara posaçërisht për kompaninë tuaj — nga analiza e nevojave deri te certifikimi i ekipit.
              </p>
              <div className="flex flex-wrap gap-3">
                <PrimaryBtn>Kontaktoni ne</PrimaryBtn>
                <SecondaryBtn>Shkarko broshurën</SecondaryBtn>
              </div>
            </div>
            <div className="aspect-[4/3] rounded-[20px] overflow-hidden" style={{ backgroundColor: C.n100 }}>
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=720&h=540&fit=crop&auto=format" alt="Trajnim korporativ" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. The problem — 3 columns */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: C.n900 }}>Sfida me të cilën po përballet kompania juaj</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Mungesa e aftësive dixhitale", desc: "Teknologjia ndryshon me shpejtësi — shumë ekipe nuk kanë aftësitë e nevojshme për t'i mbajtur hapat." },
              { icon: DollarSign, title: "Kostoja e punësimit të ri", desc: "Rekrutimi i talenteve të jashtëm është i shtrenjtë dhe i ngadaltë — kostoja mesatare tejkalon 8,000€ për pozicion." },
              { icon: Users, title: "Lëvizja e lartë e stafit", desc: "Investimi në zhvillimin e punonjësve ekzistues rrit ndjeshëm mbajtjen dhe besnikërinë ndaj kompanisë." },
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
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Si funksionon</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { n: 1, title: "Analiza e nevojave", desc: "Vlerësojmë aftësitë ekzistuese dhe identifikojmë gap-et." },
              { n: 2, title: "Dizajnimi i programit", desc: "Hartojmë curriculum të personalizuar sipas objektivave tuaja." },
              { n: 3, title: "Realizimi i trajnimit", desc: "Ligjërues ekspertë zbatojnë programin on-site ose online." },
              { n: 4, title: "Matja dhe certifikimi", desc: "Vlerësim i rezultateve dhe lëshim i certifikatave." },
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
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Çfarë mund të trajnojmë</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Code, topic: "Zhvillim softueri", desc: "Web, mobile dhe back-end" },
              { icon: Shield, topic: "Siguri kibernetike", desc: "Mbrojtje dhe reagim ndaj incidenteve" },
              { icon: BarChart, topic: "Të dhëna dhe analitikë", desc: "Data science dhe raportim" },
              { icon: Globe, topic: "Cloud dhe DevOps", desc: "AWS, Azure, CI/CD" },
              { icon: Laptop, topic: "Mjete dixhitale", desc: "Produktivitet dhe automatizim" },
              { icon: Target, topic: "Menaxhim projektesh", desc: "Agile, Scrum, PMP" },
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

      {/* 6. Formats */}
      <section className="py-12" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {[
              { icon: Building, label: "Në ambientet tuaja", desc: "Trajnerët vijnë tek ju" },
              { icon: GraduationCap, label: "Kampusi ynë", desc: "Klasa moderne të pajisura" },
              { icon: Globe, label: "Hibrid", desc: "Kombinim fleksibël" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex-1 flex items-center gap-4 p-5 rounded-2xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={20} style={{ color: C.brand }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.n900 }}>{label}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Stats band */}
      <section className="py-16" style={{ backgroundColor: C.brand }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[["35+", "Kompani të trajnuara"], ["800+", "Punonjës të rikualifikuar"], ["94%", "Shkallë kënaqësie"], ["9 vite", "Përvojë trajnimi"]].map(([num, label]) => (
              <div key={label}>
                <p className="text-4xl font-bold text-white mb-1">{num}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Testimonial */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[720px] mx-auto px-5">
          <div className="p-8 rounded-3xl" style={{ backgroundColor: C.brandLight, border: `1px solid ${C.cardBorder}` }}>
            <p className="text-lg font-medium mb-6 leading-relaxed" style={{ color: C.n800 }}>
              "Cacttus Education na ndihmoi të rikualifikojmë 12 punonjës brenda 3 muajve. Sot ata janë zhvilluesit kryesorë të platformës sonë dixhitale — rezultat që nuk do ta arrinim me rekrutime të reja."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden" style={{ backgroundColor: C.n200 }}>
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: C.n900 }}>Erjon Krasniqi</p>
                <p className="text-xs" style={{ color: C.muted }}>Drejtor HR · TechCo Kosovo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
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

      {/* 10. Contact form band */}
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="rounded-3xl px-8 md:px-12 py-12" style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}>
            <h2 className="text-2xl font-bold text-white mb-2">Keni nevojë për trajnime të personalizuara?</h2>
            <p className="text-white/70 text-sm mb-8">Na kontaktoni dhe do t'ju ofrojmë një propozim brenda 48 orëve.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {["Emri i kompanisë", "Personi kontaktues", "Email", "Telefoni"].map((ph) => (
                <input key={ph} type="text" placeholder={ph} className="px-4 text-sm rounded-xl" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
              ))}
              <button className="h-[52px] px-6 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 whitespace-nowrap" style={{ backgroundColor: "#fff", color: C.brand }}>
                Kontaktoni ne
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ── 5.2 RRJETI I TALENTËVE ── */
function PageBizneseTalente() {
  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — centered */}
      <section className="py-24 text-center" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[760px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Rrjeti i talentëve" }]} />
          <Overline>PËR BIZNESE</Overline>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
            Punësoni talente dixhitale të vërteta, të gatshme për punë
          </h1>
          <p className="text-lg mb-8" style={{ color: C.muted }}>Qasje direkte në portfoliot dhe CV e studentëve dhe të diplomuarve tanë — pa tarifë rekrutimi.</p>
          <PrimaryBtn>Bëhu partner</PrimaryBtn>

          {/* Avatars row */}
          <div className="flex items-center justify-center mt-10 gap-1">
            {["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=60&h=60&fit=crop&auto=format",
            ].map((url, i) => (
              <div key={i} className="w-12 h-12 rounded-full overflow-hidden -ml-2 first:ml-0 ring-2 ring-white" style={{ backgroundColor: C.n100 }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <span className="ml-3 px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: C.brandLight, color: C.brand }}>+200 talente</span>
          </div>
        </div>
      </section>

      {/* 2. Stats strip */}
      <section className="py-0">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden -mt-8 relative z-10 shadow-xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
            {[["200+", "Të diplomuar të disponueshëm"], ["2 javë", "Kohë mesatare punësimi"], ["40+", "Kompani partnere"], ["87%", "Shkallë punësimi"]].map(([num, label], i) => (
              <div key={label} className="p-6 text-center" style={{ borderLeft: i > 0 ? `1px solid ${C.n200}` : "none" }}>
                <p className="text-3xl font-bold mb-1" style={{ color: C.brand }}>{num}</p>
                <p className="text-xs" style={{ color: C.muted }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Who you get */}
      <section className="py-24" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Cilët talente gjeni në rrjetin tonë</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col gap-3">
              {[["Zhvillues Web & Mobile", "React, Node.js, React Native, API design"], ["Specialistë Sigurie Kibernetike", "Penetration testing, SOC, incident response"], ["Data Analysts", "Python, SQL, visualization, reporting"], ["DevOps Engineers", "Cloud (AWS/Azure), CI/CD, containerization"], ["UI/UX Designers", "Figma, prototyping, user research"]].map(([role, skills]) => (
                <div key={role} className="p-4 rounded-xl flex gap-4 transition-all hover:shadow-md" style={{ border: `1px solid ${C.cardBorder}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
                    <UserCheck size={16} style={{ color: C.brand }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: C.n900 }}>{role}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{skills}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample talent card */}
            <div className="p-6 rounded-2xl shadow-2xl" style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}>
              <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: `1px solid ${C.n100}` }}>
                <div className="w-16 h-16 rounded-full overflow-hidden" style={{ backgroundColor: C.n100 }}>
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: C.n900 }}>Enis Krasniqi</p>
                  <p className="text-sm" style={{ color: C.muted }}>Zhvillues i Ueb-it dhe Aplikacioneve Mobile</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[Star, Star, Star, Star, Star].map((Icon, i) => <Icon key={i} size={12} style={{ color: "#F5A524" }} fill="#F5A524" />)}
                    <span className="text-xs ml-1" style={{ color: C.n500 }}>4.9</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {["React", "Node.js", "TypeScript", "PostgreSQL", "Git"].map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: C.brandLight, color: C.brandDark }}>{tag}</span>
                ))}
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: C.brand }}>Kërko intervistë</button>
                <button className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ border: `1px solid ${C.brand}`, color: C.brand }}>CV</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How it works for employers */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Si funksionon për punëdhënësit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[["1", "Regjistro kompaninë", "Krijoni profilin tuaj falas si punëdhënës partner."], ["2", "Shfletoni profilet", "Qasuni në portfoliot, CV-të dhe projektet e studentëve."], ["3", "Kërkoni intervistë", "Ne lehtësojmë kontaktin dhe planifikojmë intervistën."]].map(([n, title, desc]) => (
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
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Pse të zgjidhni alumni tanë</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: Code, title: "Trajnim bazuar në praktikë", desc: "Projekte reale që nga semestri i parë." },
              { icon: FileText, title: "Portfolio të vërteta", desc: "Punë e dokumentuar e realizueshme." },
              { icon: GraduationCap, title: "Curriculum i industrisë", desc: "Dizajnuar me partnerët tanë." },
              { icon: MessageSquare, title: "Aftësi komunikimi", desc: "Komunikim profesional dhe prezantim." },
              { icon: Zap, title: "Disponueshmëri e menjëhershme", desc: "Të gatshëm për punë pas diplomimit." },
              { icon: Award, title: "Pa tarifë rekrutimi", desc: "Qasja bazë është plotësisht falas." },
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

      {/* 6. Logo marquee */}
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-xl font-bold text-center mb-8" style={{ color: C.n900 }}>Punëdhënësit tanë partnerë</h2>
          <InfiniteLogoMarquee />
        </div>
      </section>

      {/* 7. Testimonial */}
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[640px] mx-auto px-5">
          <div className="p-8 rounded-3xl" style={{ backgroundColor: C.brandLight, border: `1px solid ${C.cardBorder}` }}>
            <p className="text-lg font-medium mb-6 leading-relaxed" style={{ color: C.n800 }}>
              "Tre zhvilluesit që rekrutuam nga Cacttus Education janë ndër kontribuesit më të mirë të ekipit tonë. Procesi ishte i thjeshtë dhe pa kosto."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden" style={{ backgroundColor: C.n200 }}>
                <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: C.n900 }}>Vjosa Osmani</p>
                <p className="text-xs" style={{ color: C.muted }}>CTO · DigitalPrime SH.P.K.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Join CTA */}
      <section className="py-16" style={{ backgroundColor: C.brand }}>
        <div className="max-w-[900px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Regjistrohu si punëdhënës partner</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {["Kompania", "Email", "Fusha e interesit"].map((ph) => (
              <input key={ph} type="text" placeholder={ph} className="px-4 text-sm rounded-xl" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
            ))}
            <button className="h-[52px] px-6 rounded-xl font-semibold text-sm text-white" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>Regjistrohu në rrjet</button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ── 5.3 BURSA E IMPAKTIT ── */
function PageBizneseBursa() {
  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — split, emotional */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Bursa e Impaktit" }]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <Overline>BURSA E IMPAKTIT</Overline>
              <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
                Investoni në të ardhmen e një të riu — dhe të sektorit teknologjik
              </h1>
              <p className="text-lg mb-8" style={{ color: C.muted }}>
                Çdo bursë e sponsorizuar hap derën e arsimit teknologjik për një student me talent që nuk ka mundësi financiare.
              </p>
              <PrimaryBtn>Bëhu sponsor</PrimaryBtn>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[20px] overflow-hidden" style={{ backgroundColor: C.n100 }}>
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&h=800&fit=crop&auto=format" alt="Student" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-2xl px-5 py-4 shadow-xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <p className="text-3xl font-bold" style={{ color: C.brand }}>120+</p>
                <p className="text-xs" style={{ color: C.muted }}>Bursa të ndara deri tani</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Narrative */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[720px] mx-auto px-5 text-center">
          <h2 className="text-2xl font-bold mb-6" style={{ color: C.n900 }}>Çfarë është Bursa e Impaktit</h2>
          <p className="text-base leading-loose mb-4" style={{ color: C.muted }}>
            Bursa e Impaktit është një program me të cilin Cacttus Education, bashkë me sponsorët e saj, mundëson qasje të barabartë në arsim teknologjik cilësor. Studentët që shfaqin talent dhe motivim, por nuk kanë mundësi financiare, mbulojnë deri në 80% të tarifës vjetore.
          </p>
          <p className="text-base leading-loose" style={{ color: C.muted }}>
            Çdo sponsor merr njohje publike, qasje prioritare te të diplomuarit dhe raporte të detajuara të impaktit — duke ditur saktë se cilën jetë ka ndryshuar investimi i tij.
          </p>
        </div>
      </section>

      {/* 3. Impact stats */}
      <section className="py-16" style={{ backgroundColor: C.brandLight }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[["120+", "Bursa të ndara"], ["85", "Studentë mbështetur"], ["72%", "Punësim pas diplomimit"], ["18", "Kompani sponsorizuese"]].map(([num, label]) => (
              <div key={label}>
                <p className="text-4xl font-bold mb-1" style={{ color: C.brand }}>{num}</p>
                <p className="text-sm" style={{ color: C.muted }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Tiers */}
      <section className="py-24" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Nivelet e sponsorizimit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tier: "Bronz", sub: "Një bursë", price: "Sponsor i një studenti", perks: ["Logo në faqen tonë", "Raport vjetor i impaktit", "Njoftim pas diplomimit"], primary: false },
              { tier: "Argjend", sub: "Tre bursa", price: "Sponsor i tre studentëve", perks: ["Gjithçka nga Bronz", "Prezencë në eventet tona", "Qasje prioritare te alumni", "Raporte tremujore"], primary: true },
              { tier: "Ar", sub: "Program i plotë", price: "Sponsor i një klase", perks: ["Gjithçka nga Argjend", "Bashkëprojektim i curriculum-it", "Rekrutim ekskluziv i klasës", "Raporte mujore & KPI"], primary: false },
            ].map(({ tier, sub, price, perks, primary }) => (
              <div
                key={tier}
                className={`p-7 rounded-2xl relative flex flex-col ${primary ? "shadow-2xl" : ""}`}
                style={{
                  backgroundColor: primary ? C.brand : C.n0,
                  border: primary ? `2px solid ${C.brand}` : `1px solid ${C.cardBorder}`,
                  transform: primary ? "scale(1.03)" : undefined,
                }}
              >
                {primary && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "#fff", color: C.brand }}>Më i zgjedhuri</span>}
                <div className="mb-5">
                  <p className="font-bold text-xl" style={{ color: primary ? "#fff" : C.n900 }}>{tier}</p>
                  <p className="text-sm" style={{ color: primary ? "rgba(255,255,255,0.7)" : C.muted }}>{sub}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: primary ? "rgba(255,255,255,0.9)" : C.brand }}>{price}</p>
                </div>
                <div className="flex flex-col gap-2 flex-1 mb-6">
                  {perks.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm">
                      <Check size={13} style={{ color: primary ? "rgba(255,255,255,0.8)" : C.brand }} />
                      <span style={{ color: primary ? "rgba(255,255,255,0.9)" : C.muted }}>{p}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{
                    backgroundColor: primary ? "#fff" : C.brand,
                    color: primary ? C.brand : "#fff",
                  }}
                >
                  Bëhu sponsor
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Student stories */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Historitë e studentëve</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Arta Gashi", program: "Zhvillues i Ueb-it dhe Aplikacioneve Mobile", quote: "Bursa ndryshoi gjithçka. Sot jam front-end developer dhe ëndërroja për këtë.", imgUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&auto=format" },
              { name: "Drin Osmani", program: "Siguria Kibernetike", quote: "Pa bursë nuk do ta filloja kurrë. Tani punoj si SOC analyst.", imgUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format" },
              { name: "Blerta Morina", program: "Zhvillues i Ueb-it dhe Aplikacioneve Mobile", quote: "Sponsori nuk ishte vetëm financiar — ishte besim. Dhe e ktheva me punë.", imgUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format" },
            ].map(({ name, program, quote, imgUrl }) => (
              <div key={name} className="p-6 rounded-2xl flex flex-col gap-4" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden" style={{ backgroundColor: C.n100 }}>
                    <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: C.n900 }}>{name}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{program}</p>
                  </div>
                </div>
                <p className="text-sm italic leading-relaxed" style={{ color: C.n700 }}>"{quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. How sponsorship works */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Si funksionon sponsorizimi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Star, step: "Zgjidhni nivelin", desc: "Zgjidhni paketën e sponsorizimit." },
              { icon: FileText, step: "Nënshkruani marrëveshjen", desc: "Kontratë e thjeshtë dhe transparente." },
              { icon: UserCheck, step: "Studenti zgjidhet", desc: "Ne zgjedhim kandidatin sipas kritereve." },
              { icon: BarChart, step: "Raporte impakti", desc: "Merrni updates rregullisht." },
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

      {/* 7. Current sponsors marquee */}
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-sm mb-8 font-medium" style={{ color: C.muted }}>Faleminderit sponsorëve tanë për mbështetjen e vazhdueshme</p>
          <InfiniteLogoMarquee />
        </div>
      </section>

      {/* 8. Final CTA band */}
      <section className="py-16" style={{ backgroundColor: C.brand }}>
        <div className="max-w-[900px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Bëhuni pjesë e ndryshimit</h2>
            <p className="text-white/70 text-sm">Sponsorizoni një student sot.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-white/20 border border-white/50 hover:bg-white/30 transition-all">Bëhu sponsor</button>
            <button className="px-6 py-3 rounded-full text-sm font-semibold border border-white/50 hover:bg-white/10 transition-all" style={{ color: "#fff" }}>Shkarko raportin e impaktit</button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ── 5.4 KLASËT ME QERA ── */
function PageBiznestKlasa() {
  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — image-led */}
      <section className="relative min-h-[60vh] flex items-end">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1440&h=720&fit=crop&auto=format" alt="Klasë moderne" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.1) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-16 w-full">
          <div className="max-w-md rounded-2xl p-7 shadow-2xl" style={{ backgroundColor: "#fff" }}>
            <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Klasët me qera" }]} />
            <h1 className="text-2xl font-bold mb-2 leading-tight" style={{ color: C.n900 }}>Klasa moderne, plotësisht të pajisura, në zemër të Prishtinës</h1>
            <p className="text-sm mb-5" style={{ color: C.muted }}>Trajnime, workshope, ekzaminime dhe konferenca — hapësira profesionale për çdo nevoje.</p>
            <PrimaryBtn>Rezervo tani</PrimaryBtn>
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
              [Projector, "Projector & ekran"],
              [Wifi, "Wi-Fi i shpejtë"],
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
              { name: "Klasa A", capacity: "20 persona", includes: ["20 kompjuterë", "Projektor & ekran", "Whiteboard interaktiv", "Wi-Fi 1Gbps"], img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=300&fit=crop&auto=format" },
              { name: "Klasa B", capacity: "30 persona", includes: ["30 kompjuterë", "Dy projektora", "Sistem audio", "Klimatizim i dyfishte"], img: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=500&h=300&fit=crop&auto=format" },
              { name: "Salla e konferencës", capacity: "15 persona", includes: ["TV 75\"", "Video conference setup", "Kavanë kafejar", "Drita natyrale"], img: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=300&fit=crop&auto=format" },
            ].map(({ name, capacity, includes, img }) => (
              <div key={name} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}>
                <div className="aspect-video overflow-hidden" style={{ backgroundColor: C.n100 }}>
                  <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <p className="font-semibold mb-1" style={{ color: C.n900 }}>{name}</p>
                  <p className="text-sm mb-3" style={{ color: C.brand }}>Kapaciteti: {capacity}</p>
                  <div className="flex flex-col gap-1 mb-4">
                    {includes.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
                        <Check size={11} style={{ color: C.brand }} /> {item}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mb-4" style={{ color: C.n500 }}>Çmimi me kërkesë</p>
                  <PrimaryBtn className="text-xs px-4 py-2">Rezervo</PrimaryBtn>
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
            {["Kompjuterë / workstation", "Projector ose TV i madh", "Whiteboard dhe markerë", "Wi-Fi me shpejtësi të lartë", "Klimatizim dhe ngrohje", "Iluminim profesional", "Sistem audio", "Kafe dhe ujë", "Parking i disponueshëm", "Mbyllim i sigurt i hapësirës"].map((item) => (
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
              "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=400&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=400&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=400&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&h=300&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=500&h=300&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&h=300&fit=crop&auto=format",
            ].map((url, i) => (
              <div key={i} className="rounded-2xl overflow-hidden group cursor-zoom-in" style={{ backgroundColor: C.n100, aspectRatio: i < 3 ? "4/3" : "16/9" }}>
                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
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

      {/* 8. Pricing note */}
      <section className="py-12 text-center" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[560px] mx-auto px-5">
          <h3 className="text-xl font-bold mb-3" style={{ color: C.n900 }}>Çmimet dhe disponueshmëria</h3>
          <p className="text-sm mb-6" style={{ color: C.muted }}>Çmimet varën nga kohëzgjatja, numri i pjesëmarrësve dhe konfigurimi i sallës. Kontaktoni na për një ofertë të personalizuar brenda 24 orëve.</p>
          <SecondaryBtn>Kërko ofertë</SecondaryBtn>
        </div>
      </section>

      {/* 9. Booking form */}
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="rounded-3xl px-8 md:px-12 py-14" style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}>
            <h2 className="text-2xl font-bold text-white mb-2">Rezervo hapësirën tënde</h2>
            <p className="text-white/70 text-sm mb-8">Plotëso formularin dhe do të kontaktohesh brenda 24 orëve.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {["Emri", "Email", "Telefoni", "Data e dëshiruar", "Nr. i pjesëmarrësve"].map((ph) => (
                <input key={ph} type="text" placeholder={ph} className="px-4 text-sm rounded-xl col-span-1" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
              ))}
              <button className="h-[52px] px-5 rounded-xl font-semibold text-sm text-white col-span-1 whitespace-nowrap" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>Rezervo tani</button>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════
   REMAINING UNCHANGED PAGES
══════════════════════════════════════════ */
const PROJECTS = [
  { title: "Skill Factory", partner: "PARTNER", desc: "Program praktik për aftësimin e të rinjve në teknologji.", path: "/projektet/skill-factory" },
  { title: "Partneriteti për Impaktin në TIK", partner: "USAID", desc: "Partneritet për rritjen e impaktit të sektorit të TIK-ut në Kosovë.", path: "/projektet/usaid" },
  { title: "SDC", partner: "SDC", desc: "Mbështetje për aftësimin profesional dhe punësimin.", path: "/projektet/sdc" },
  { title: "Gratë në Punë Online", partner: "WoW", desc: "Fuqizimi i grave për punë online dhe të pavarur.", path: "/projektet/wow" },
  { title: "KODE", partner: "KODE", desc: "Zhvillimi i ekonomisë dixhitale përmes aftësive të TIK-ut.", path: "/projektet/kode" },
  { title: "Regional Challenge Fund (RCF)", partner: "RCF", desc: "Investim në arsimin profesional dual me industrinë.", path: "/projektet/rcf" },
  { title: "LuxDev Smart Mobility Project", partner: "LuxDev", desc: "Zgjidhje dixhitale për mobilitetin e zgjuar.", path: "/projektet/luxdev" },
  { title: "Virtual Innovation Consortium (VIC)", partner: "VIC", desc: "Konsorcium virtual për inovacion dhe bashkëpunim ndërkufitar.", path: "/projektet/vic" },
];

function PageProjektet() {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Projektet</h1>
          <p className="text-lg mb-8 max-w-2xl" style={{ color: C.muted }}>
            Cacttus Education zbaton projekte me partnerë vendorë dhe ndërkombëtarë për të rritur aftësitë dixhitale në Kosovë — nga rikualifikimi profesional te punësimi i të rinjve dhe fuqizimi i grave në teknologji.
          </p>
          <div className="flex gap-10">
            {[["8", "Projekte"], ["6", "Partnerë ndërkombëtarë"], ["2000+", "Përfitues"]].map(([num, label]) => (
              <div key={label}><p className="text-3xl font-bold" style={{ color: C.brand }}>{num}</p><p className="text-sm mt-0.5" style={{ color: C.n500 }}>{label}</p></div>
            ))}
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

function ProjectDetailPage({ project }: { project: typeof PROJECTS[0] }) {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Projektet", path: "/projektet" }, { label: project.title }]} />
          <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>{project.title}</h1>
          <div className="inline-flex items-center px-3 h-8 rounded-lg mb-4" style={{ border: `1px solid ${C.n300}` }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.n600, letterSpacing: "0.08em" }}>{project.partner}</span>
          </div>
          <p className="text-lg mb-6" style={{ color: C.muted }}>{project.desc}</p>
          <div className="flex flex-wrap gap-2">
            {["2024 – 2026", "Kosovë", "Në zbatim"].map((c) => <MetaChip key={c}>{c}</MetaChip>)}
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold mb-8" style={{ color: C.n900 }}>Rreth projektit</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-4">
              <p className="text-base leading-relaxed" style={{ color: C.muted }}>Ky projekt synon të rrisë kapacitetet e aftësimit profesional dhe dixhital në Kosovë, duke sjellë ekspertizë ndërkombëtare dhe metodologji inovative.</p>
              <p className="text-base leading-relaxed" style={{ color: C.muted }}>Bashkëpunimi me partnerë strategjikë mundëson zbatimin e programeve të avancuara dhe rritjen e mundësive të punësimit.</p>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden" style={{ backgroundColor: C.n100 }}>
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=720&h=405&fit=crop&auto=format" alt="Projekti" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[["500+", "Përfitues"], ["12", "Trajnime të mbajtura"], ["4", "Partnerë"]].map(([num, label]) => (
              <div key={label}><p className="text-4xl font-bold mb-1" style={{ color: C.brand }}>{num}</p><p className="text-sm" style={{ color: C.n500 }}>{label}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-3 gap-4">
            {["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=266&fit=crop&auto=format", "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=266&fit=crop&auto=format", "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=266&fit=crop&auto=format"].map((url, i) => (
              <div key={i} className="aspect-video rounded-2xl overflow-hidden" style={{ backgroundColor: C.n100 }}><img src={url} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emri.trim() || !form.email.trim() || !form.telefon.trim() || !form.subjekti || !form.mesazhi.trim()) {
      setError("Ju lutemi plotësoni të gjitha fushat.");
      return;
    }
    setError("");
    // TODO: wire to submission API - call fetch here and drive setSubmitted(true)
    // from its resolution (and setError from its rejection) instead of directly
    // from this handler, once the submission endpoint exists.
    setSubmitted(true);
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
                  <PrimaryBtn onClick={() => setSubmitted(false)}>Mbyll</PrimaryBtn>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FormField label="Emri dhe mbiemri" type="text" value={form.emri} onChange={(v) => setForm({ ...form, emri: v })} />
                  <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                  <FormField label="Numri i telefonit" type="tel" value={form.telefon} onChange={(v) => setForm({ ...form, telefon: v })} />
                  <FormSelect label="Subjekti" value={form.subjekti} onChange={(v) => setForm({ ...form, subjekti: v })} options={["Studime profesionale", "Trajnime profesionale", "Për biznese", "Tjetër"]} />
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: C.n700 }}>Mesazhi</label>
                    <textarea rows={5} value={form.mesazhi} onChange={(e) => setForm({ ...form, mesazhi: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none" style={{ border: `1px solid ${C.n300}`, backgroundColor: C.n0, color: C.n800 }} onFocus={(e) => (e.target.style.borderColor = C.brand)} onBlur={(e) => (e.target.style.borderColor = C.n300)} />
                  </div>
                  {error && <p className="text-sm font-medium" style={{ color: "#D64545" }}>{error}</p>}
                  <PrimaryBtn type="submit">Dërgo mesazhin</PrimaryBtn>
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
                  {[Facebook, Instagram, Linkedin, Twitter].map((Icon, i) => (
                    <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}><Icon size={16} style={{ color: C.n600 }} /></button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 aspect-video rounded-2xl flex items-center justify-center" style={{ backgroundColor: C.n100 }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: C.brand }}><MapPin size={22} className="text-white" /></div>
              <p className="text-sm font-semibold" style={{ color: C.n700 }}>Rr. Bashkim Fehmiu, Arbëria 3</p>
              <p className="text-xs mt-1" style={{ color: C.n500 }}>10000 Prishtinë, Kosovë</p>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

const TEAM_MEMBERS = [
  { name: "Arta Berisha", role: "Drejtoreshë ekzekutive", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop&auto=format" },
  { name: "Blerim Krasniqi", role: "Menaxher i programeve akademike", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&auto=format" },
  { name: "Donika Hoxha", role: "Koordinatore e trajnimeve", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&auto=format" },
  { name: "Fisnik Morina", role: "Menaxher i projekteve", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&auto=format" },
  { name: "Rina Sylejmani", role: "Zyrtare për marrëdhënie me studentë", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&auto=format" },
  { name: "Endrit Gashi", role: "Udhëheqës i degës", city: "Prizren", imgUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&auto=format" },
  { name: "Learta Zeqiri", role: "Koordinatore akademike", city: "Prizren", imgUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop&auto=format" },
  { name: "Valon Ismaili", role: "Zyrtar për marketing", city: "Prizren", imgUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&auto=format" },
  { name: "Diellza Rexhepi", role: "Zyrtare administrative", city: "Prizren", imgUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&auto=format" },
  { name: "Granit Mustafa", role: "Udhëheqës i degës", city: "Kamenicë", imgUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&auto=format" },
  { name: "Adelina Bekteshi", role: "Koordinatore e trajnimeve", city: "Kamenicë", imgUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&auto=format" },
  { name: "Leotrim Salihu", role: "Mbështetje teknike", city: "Kamenicë", imgUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&auto=format" },
];

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
  { name: "Arsim Susuri", role: "Applied AI and Machine Learning", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&auto=format" },
  { name: "Andi Ahmeti", role: "AI Security", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&auto=format" },
  { name: "Hana Hoxha", role: "Data Science", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop&auto=format" },
  { name: "Ali Kaçamaku", role: "JavaScript", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&auto=format" },
  { name: "Pegmatit Bruci", role: "Software Testing QA and Automation", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&auto=format" },
  { name: "Alban Krasniqi", role: "Cloud and DevOps", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&auto=format" },
  { name: "Mentor Berisha", role: "Ethical Hacking & Penetration Testing", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&auto=format" },
  { name: "Enes Sermaxhaj", role: "Dizajn Grafik", city: "Prizren", imgUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop&auto=format" },
  { name: "Arber Gashi", role: "Content Creation", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&auto=format" },
  { name: "Era Gjakova", role: "Komunikimi dhe Prezantimi Profesional", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&auto=format" },
  { name: "Fatlum Ahmeti", role: "Cyber Security Essentials", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=400&h=500&fit=crop&auto=format" },
  { name: "Vlora Dema", role: "Project Management & Agile", city: "Prishtinë", imgUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&auto=format" },
];

function PageLigjërueit() {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth nesh" }, { label: "Ligjëruesit" }]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Ligjëruesit</h1>
          <p className="text-lg" style={{ color: C.muted }}>Profesionistë aktivë në industri, që sjellin përvojën reale në klasë.</p>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-16">
            {LIGJËRUEIT.map((l) => <PersonCard key={l.name} person={l} />)}
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
      <main className="flex-1">{children}</main>
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
