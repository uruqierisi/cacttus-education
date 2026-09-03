import { usePageMeta } from "../hooks/usePageMeta";
import { ProjectCard } from "../cards/ProjectCard";
import { PROJECTS } from "../data/projects";
import { PartnerLogoGrid } from "../sections/PartnerLogoGrid";
import { C } from "../theme";
import { PageWrapper } from "../ui/PageWrapper";



export function PageProjektet() {
  usePageMeta(
    "Projektet — Cacttus Education",
    "Ne ndërtojmë projekte që fuqizojnë shkathtësitë digjitale të së nesërmes, me bashkëpunime strategjike dhe zhvillim të qëndrueshëm në Kosovë e rajon.",
  );
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
