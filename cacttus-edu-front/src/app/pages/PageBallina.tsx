import { HorizontalApplicationBand } from "../forms/HorizontalApplicationBand";
import { useApplyPopup } from "../hooks/apply-popup";
import { BALLINA_PROGRAMS_ID, scrollToSection } from "../lib/scroll";
import { RotatingWord } from "../sections/RotatingWord";
import { StudimeProfesionaleSection } from "../sections/StudimeProfesionaleSection";
import { SuccessCarousel } from "../sections/SuccessCarousel";
import { TrajnimePromoSection } from "../sections/TrajnimePromoSection";
import { C } from "../theme";
import { HeroStats } from "../ui/HeroStats";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn, SecondaryBtn } from "../ui/buttons";

import heroGraduates from "../../imports/group4.png";



/* ══════════════════════════════════════════
   PART 2 — HOME PAGE
══════════════════════════════════════════ */
export function PageBallina() {
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
