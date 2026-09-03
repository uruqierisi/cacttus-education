import { useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { useParams } from "react-router";
import { PublicApplicationForm } from "../forms/PublicApplicationForm";
import { C } from "../theme";
import { Overline } from "../ui/Overline";
import { PageWrapper } from "../ui/PageWrapper";


/* ══════════════════════════════════════════
   4.3 — /forma/:slug — social-media intake

   A form link shared on Instagram or Facebook lands here. Deliberately BARE: one
   heading, one form, nothing else. No sidebar, no categories, no recent posts, no
   cross-sell — every extra element on this page is another way to lose someone who
   arrived ready to apply.
══════════════════════════════════════════ */
export function PageForma() {
  const { slug } = useParams<{ slug: string }>();
  /*
    The form itself is fetched by `PublicApplicationForm`, which also renders inside a
    training's detail page — so it cannot set the title itself without clobbering the
    training's. It reports the title up through an OPTIONAL callback instead: additive,
    and the training page simply does not pass one.

    Declared above the `!slug` guard because hooks cannot run after a conditional return.
  */
  const [formTitle, setFormTitle] = useState("");

  usePageMeta(
    formTitle ? `${formTitle} — Cacttus Education` : "Aplikim — Cacttus Education",
    "Merr vetëm një minutë. Stafi ynë të kontakton brenda 48 orëve.",
  );

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
          <PublicApplicationForm slug={slug} onFormLoaded={setFormTitle} />
        </div>
      </section>
    </PageWrapper>
  );
}
