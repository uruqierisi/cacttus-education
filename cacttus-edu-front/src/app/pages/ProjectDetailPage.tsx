import { usePageMeta, metaSummary } from "../hooks/usePageMeta";
import { Link } from "react-router";
import { PROJECTS, PROJECT_FALLBACK_GALLERY } from "../data/projects";
import { PROJEKTET_LIST } from "../data/projektet-list";
import { C } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn } from "../ui/buttons";


export function ProjectDetailPage({ project }: { project: typeof PROJECTS[0] }) {
  usePageMeta(
    `${project.title} — Cacttus Education`,
    // `desc` runs long on several projects, so it is cut at a word boundary rather
    // than rewritten — what ships is a prefix of the page's own opening paragraph.
    metaSummary(project.desc, "Projekt i Cacttus Education."),
  );
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
