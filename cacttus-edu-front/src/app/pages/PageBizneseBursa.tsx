import { usePageMeta } from "../hooks/usePageMeta";
import {
  BarChart,
  Building2,
  FileText,
  GraduationCap,
  Star,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router";
import { BURSA_SPONSORS } from "../data/bursa-sponsors";
import { C, globalStyle } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn } from "../ui/buttons";

/* Hero photo for /biznese/bursa. A 1279x1600 portrait dropped into a 16:10 landscape
   frame, so roughly two thirds of its height is cropped away — which slice survives is
   BURSA_HERO_IMG_POSITION, next to the component that uses it. */
import bursaHeroImg from "../../imports/BursaImpaktit.jpeg";


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
export const BURSA_HERO_IMG_POSITION = "center 40%";


export function PageBizneseBursa() {
  usePageMeta(
    "Bursa e Impaktit — Cacttus Education",
    "Çdo bursë e sponsorizuar hap derën e arsimit teknologjik për një student me talent që nuk ka mundësi financiare.",
  );
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
