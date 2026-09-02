import { useEffect, useState } from "react";
import { Briefcase, Check, FileText } from "lucide-react";
import { Link, useParams } from "react-router";
import {
  PublicApiError,
  getTraining,
  type TrainingDetail,
} from "../../marketing/lib/public-api";
import { PublicApplicationForm } from "../forms/PublicApplicationForm";
import { formatTrainingDate } from "../lib/dates";
import {
  TRAINING_CATEGORY_LABELS,
  TRAINING_FORMAT_LABELS,
} from "../lib/training-labels";
import { C } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { MetaChip } from "../ui/MetaChip";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn, SecondaryBtn } from "../ui/buttons";


/* ══════════════════════════════════════════
   4.2 — TRAJNIME: the detail page, /trajnime/:slug

   EXACTLY five sections, and every optional one disappears when empty:
   hero · përshkrimi · Pikat e Forta · planprogrami (PDF) · forma e aplikimit.
   Nothing else — no deadline/seats boxes, no topic list, no testimonials, no trainer
   bio (the instructor is a line in the hero meta and nothing more).
══════════════════════════════════════════ */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
export const TRAJNIMI_INSTRUCTOR_IMG_POSITION = "center 50%";


export function PageTrajnimiDetal() {
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
