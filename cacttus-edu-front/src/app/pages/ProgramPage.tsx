import React from "react";
import { PARTNER_LOGO_IMAGES } from "../data/partner-logos";
import { SEM_PROGRAMIM } from "../data/semesters";
import { HorizontalApplicationBand } from "../forms/HorizontalApplicationBand";
import { useApplyPopup } from "../hooks/apply-popup";
import { InfiniteLogoMarquee } from "../sections/InfiniteLogoMarquee";
import { SemesterTabs } from "../sections/SemesterTabs";
import { C } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { MetaChip } from "../ui/MetaChip";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn, SecondaryBtn } from "../ui/buttons";


/* ── PROGRAM PAGE TEMPLATE ── */
export function ProgramPage({
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
