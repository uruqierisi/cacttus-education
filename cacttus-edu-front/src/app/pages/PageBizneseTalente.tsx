import { usePageMeta } from "../hooks/usePageMeta";
import { useState } from "react";
import {
  Award,
  Code,
  FileText,
  GraduationCap,
  MessageSquare,
  UserCheck,
  Zap,
} from "lucide-react";
import { BUSINESS_REQUEST_TYPES } from "../../marketing/lib/forms.config";
import { TALENT_CATEGORIES } from "../data/talents";
import { useBusinessLead } from "../hooks/useBusinessLead";
import { sanitizePhone } from "../lib/phone";
import { TALENTE_LIST_ID, scrollToSection } from "../lib/scroll";
import { TalentCarousel } from "../sections/TalentCarousel";
import { C, globalStyle } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn } from "../ui/buttons";

import talentDinaZejneli from "../../imports/dinaZejneli.jpeg";

import talentMirlindArifi from "../../imports/mirlindArifi.jpeg";

import talentAltinMorina from "../../imports/altinMorina.jpeg";

import talentArjanaBellaqa from "../../imports/arjanaBellaqa.jpeg";

import talentFatjonKerceli from "../../imports/fatjonKerceli.jpeg";


export function PageBizneseTalente() {
  usePageMeta(
    "Rrjeti i talentëve — Cacttus Education",
    "Eksploroni CV-të, aftësitë dhe përvojën e studentëve dhe të diplomuarve tanë, të përgatitur për praktikë dhe punësim në industrinë e teknologjisë.",
  );
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
        {/*
          Wider from `lg:` up than the 900px this band shipped with, because the submit
          button joins the input row there and five items need the room — at 900px the
          four inputs would be squeezed to ~145px each. Below `lg` the grid is a single
          column and the extra width is inert, so the phone and tablet layouts are
          untouched.
        */}
        <div className="max-w-[900px] lg:max-w-[1080px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Regjistrohu si punëdhënës partner</h2>
          {lead.sent ? (
            <p className="text-white text-sm font-semibold text-center">Faleminderit! Regjistrimi u dërgua — do t'ju kontaktojmë së shpejti.</p>
          ) : (
            <>
          {/*
            FIVE tracks from `lg:` up: the four inputs plus the submit button, so the
            button sits in the empty space to their right instead of dropping to a row
            of its own.

            The button's track is `auto` — sized to its own content — while the inputs
            are `minmax(0,1fr)` and share what is left. That asymmetry is the whole
            point: an equal five-column split would leave the button too narrow and wrap
            "Regjistrohu në rrjet" onto a second line inside a 52px-tall pill. Sizing
            its track to the label instead means the label decides the column, never the
            other way round.

            `minmax(0,1fr)` rather than a bare `1fr` for the inputs, which is also what
            Tailwind's own `grid-cols-4` expands to: an `<input>` has an intrinsic
            minimum width of roughly 170px, and a bare `1fr` (i.e. `minmax(auto,1fr)`)
            would refuse to shrink past it and push the row out of the container.

            `lg:` AND NOT `md:`, which is the one number here that was chosen by
            measurement rather than by symmetry. Five items need about 730px of row at
            768px, which leaves each input 125px — and "Fusha e interesit" needs 143px,
            so the fourth placeholder was cut off. It clears at ~836px. Rather than
            shorten the placeholder or shave the gaps to buy 6px, the row simply starts
            at `lg:` (1024px), where every input gets 189px. Everything below that stays
            single-column: on a portrait tablet a stacked form is the better layout
            anyway, and this way no width renders a truncated field label.

            Row height needs no alignment rule — every input carries `height: 52` and
            the button `h-[52px]`, so the tracks already line up.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-3">
            {([
              { ph: "Kompania", key: "kompania" },
              { ph: "Email", key: "email" },
              { ph: "Telefoni", key: "telefoni" },
              { ph: "Fusha e interesit", key: "fusha" },
            ] as const).map(({ ph, key }) => (
              <input key={ph} type="text" placeholder={ph} value={talente[key]} onChange={(e) => setTalente({ ...talente, [key]: key === "telefoni" ? sanitizePhone(e.target.value) : e.target.value })} className="px-4 text-sm rounded-xl" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
            ))}
            {/*
              The fifth grid item. It carries no column utilities of its own — the grid
              template above places it — so below `lg` it simply stacks under the inputs
              exactly as it always has.

              `whitespace-nowrap` is the guarantee the `auto` track is built around: the
              track is sized from the label, so the label must never be the thing that
              gives way. Without it a narrow `lg` viewport could still break the pill
              across two lines inside its fixed 52px height.
            */}
            <button onClick={() => lead.submit({ name: talente.kompania, email: talente.email, phone: talente.telefoni }, { kompania: talente.kompania, fusha_interesit: talente.fusha })} className="h-[52px] px-6 rounded-xl font-semibold text-sm text-white whitespace-nowrap" style={{ border: "1.5px solid rgba(255,255,255,0.7)" }}>{lead.isSubmitting ? "Duke dërguar…" : "Regjistrohu në rrjet"}</button>
          </div>
              {lead.error && <p className="text-white text-sm mt-3 text-center">{lead.error}</p>}
            </>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
