import React, { useState, useEffect, useRef, useCallback } from "react";
import bizneseHero from "../imports/perbiznese.png";
/* Hero photo for /rreth-nesh, replacing the Bursa_Redesign.png placeholder that column
   borrowed. Shot 3:2 (8192x5464) and dropped into a 4:3 frame, so the crop is real:
   RRETH_AMBIENT_IMG_POSITION decides which band of it survives. */
import rrethNeshStafi from "../imports/rrethNeshStafi.jpeg";
/* Hero photo for /biznese/trajnime, replacing the Unsplash stock URL. Same 3:2 source in
   a 4:3 frame — see BIZNESE_TRAJNIME_IMG_POSITION. */
import trajnimePersonalizuara from "../imports/trajnimePersonalizuara.jpeg";
import talentDinaZejneli from "../imports/dinaZejneli.jpeg";
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
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  useParams,
} from "react-router";
import {
  submitPublicForm,
  getPublicPosts,
  getPublicPost,
  PublicApiError,
  type PostCard as PostCardData,
  type PostDetail,
} from "../marketing/lib/public-api";
import { BUSINESS_REQUEST_TYPES, CLASS_BOOKING_ROOMS, CONTACT_FORM_SLUG } from "../marketing/lib/forms.config";
import { C, globalStyle } from "./theme";
import { formatPostDate } from "./lib/dates";
import { PHONE_ERROR, isValidPhone, sanitizePhone } from "./lib/phone";
import { TALENTE_LIST_ID, scrollToSection } from "./lib/scroll";
import { renderSafeHtml } from "./lib/sanitize";
import { ApplyPopupContext } from "./hooks/apply-popup";
import { useBusinessLead } from "./hooks/useBusinessLead";
import { useClassBooking } from "./hooks/useClassBooking";
import { ABOUT_MISSION_POINTS, ABOUT_VALUES } from "./data/about";
import { BURSA_SPONSORS } from "./data/bursa-sponsors";
import { LIGJËRUEIT } from "./data/lecturers";
import { PROJECTS, PROJECT_FALLBACK_GALLERY } from "./data/projects";
import { PROJEKTET_LIST } from "./data/projektet-list";
import { CONTACT_SOCIALS } from "./data/socials";
import { TALENT_CATEGORIES } from "./data/talents";
import { TEAM_MEMBERS } from "./data/team";
import talentMirlindArifi from "../imports/mirlindArifi.jpeg";
import talentAltinMorina from "../imports/altinMorina.jpeg";
import talentArjanaBellaqa from "../imports/arjanaBellaqa.jpeg";
import talentFatjonKerceli from "../imports/fatjonKerceli.jpeg";
import {
  Check,
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
} from "lucide-react";
import { Breadcrumb } from "./ui/Breadcrumb";
import { GhostBtn, PrimaryBtn, SecondaryBtn } from "./ui/buttons";
import { FormField, FormSelect } from "./ui/FormField";
import { PageWrapper } from "./ui/PageWrapper";
import { Footer } from "./layout/Footer";
import { MobileMenu } from "./layout/MobileMenu";
import { Navbar } from "./layout/Navbar";
import { TopBanner } from "./layout/TopBanner";
import { HorizontalApplicationBand } from "./forms/HorizontalApplicationBand";
import { ScrollPopupForm } from "./forms/ScrollPopupForm";
import { ArticleCard } from "./cards/ArticleCard";
import { PersonCard } from "./cards/PersonCard";
import { ProjectCard } from "./cards/ProjectCard";
import { AboutStatsBand } from "./sections/AboutStatsBand";
import { PartnerLogoGrid } from "./sections/PartnerLogoGrid";
import { TalentCarousel } from "./sections/TalentCarousel";
import { PageBallina } from "./pages/PageBallina";
import { PageForma } from "./pages/PageForma";
import { PageTrajnimiDetal } from "./pages/PageTrajnimiDetal";
import { PageProgramim } from "./pages/PageProgramim";
import { PageSiguria } from "./pages/PageSiguria";
import { PageTrajnime } from "./pages/PageTrajnime";



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
            <button onClick={() => lead.submit({ name: talente.kompania, email: talente.email, phone: talente.telefoni }, { kompania: talente.kompania, fusha_interesit: talente.fusha })} className="h-[52px] px-6 rounded-xl font-semibold text-sm text-white" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>{lead.isSubmitting ? "Duke dërguar…" : "Regjistrohu në rrjet"}</button>
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
