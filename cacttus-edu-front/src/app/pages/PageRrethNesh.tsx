import { Check, GraduationCap, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import { ABOUT_MISSION_POINTS, ABOUT_VALUES } from "../data/about";
import { HorizontalApplicationBand } from "../forms/HorizontalApplicationBand";
import { AboutStatsBand } from "../sections/AboutStatsBand";
import { C } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn, SecondaryBtn } from "../ui/buttons";

/* Hero photo for /rreth-nesh, replacing the Bursa_Redesign.png placeholder that column
   borrowed. Shot 3:2 (8192x5464) and dropped into a 4:3 frame, so the crop is real:
   RRETH_AMBIENT_IMG_POSITION decides which band of it survives. */
import rrethNeshStafi from "../../imports/rrethNeshStafi.jpeg";


/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
export const RRETH_AMBIENT_IMG_POSITION = "center 50%";


/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
export const RRETH_TEAM_IMG_POSITION = "center 50%";


export function PageRrethNesh() {
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
