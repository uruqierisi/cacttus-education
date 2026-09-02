import {
  ArrowRight,
  Award,
  Briefcase,
  Code,
  GraduationCap,
  Laptop,
  Shield,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import { BALLINA_PROGRAMS_ID } from "../lib/scroll";
import { C } from "../theme";
import { Overline } from "../ui/Overline";
import { SecondaryBtn } from "../ui/buttons";

import studimePhoto from "../../imports/Bursa_Redesign.png";


/* 2.1 — Studime Profesionale section — three-band layout */
/* `object-position` for the framed image in this component. Second number is the
   vertical one — raise it to push the image DOWN inside its frame. */
export const STUDIME_SECTION_IMG_POSITION = "center 50%";


export function StudimeProfesionaleSection() {
  const navigate = useNavigate();

  return (
    /* `id` + `scroll-mt-28` make this the landing spot for the hero's "Shiko programet".
       The margin is what stops the sticky navbar covering this section's own top edge. */
    <section id={BALLINA_PROGRAMS_ID} className="py-24 scroll-mt-28" style={{ backgroundColor: C.n0, borderTop: `1px solid ${C.n200}` }}>
      <div className="max-w-[1200px] mx-auto px-5">

        {/* ── BAND 1: framed photo left · intro text right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">

          {/* Left — framed photo with blob + badge */}
          <div className="relative flex items-center justify-center">
            {/*
              The decorative blurred blob that used to sit here is gone. It was a 340px
              pale-purple ellipse with `blur(2px)`, absolutely positioned at top:10%/left:2%
              BEHIND the photo frame. Because the frame shrinks with the column but the blob
              did not shrink with it, on a phone the blob ended ~76px below the frame and
              bled into the heading underneath — the "broken shadow" that was reported.
              Depth now comes from the frame's own contained shadow instead.
            */}
{/* Photo frame */}
            <div
              className="relative z-10 overflow-hidden"
              style={{
                borderRadius: 28,
                border: `1.5px solid ${C.cardBorder}`,
                /* Contained: a short, tight drop shadow that stays under the card
                   instead of a 60px purple bloom that halos past its edges. */
                boxShadow: "0 6px 18px rgba(45,22,55,0.10), 0 2px 6px rgba(45,22,55,0.06)",
                maxWidth: 500,
                width: "100%",
                aspectRatio: "4/3",
              }}
            >
              <img
                src={studimePhoto}
                alt="Studentë në klasë"
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ objectPosition: STUDIME_SECTION_IMG_POSITION }}
              />
            </div>

            {/* Badge — top-right corner of frame, rotated slightly */}
            <div
              className="absolute z-20 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg"
              style={{
                top: "6%",
                right: "4%",
                border: `1px solid ${C.cardBorder}`,
                transform: "rotate(4deg)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
              }}
            >
              <GraduationCap size={15} style={{ color: C.brand }} />
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: C.n800 }}>Dy vite / diplomë</span>
            </div>
          </div>

          {/* Right — eyebrow + headline + supporting line + link */}
          <div>
            <Overline>STUDIME PROFESIONALE</Overline>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-snug" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
              Dy vite. Dy programe.<br />Karrierë e garantuar.
            </h2>
            <p className="text-base mb-8" style={{ color: C.muted }}>
              Zgjidh Programim ose Siguri Kibernetike dhe ndërto aftësi profesionale përmes mësimit praktik, projekteve reale dhe ligjëruesve që punojnë në industri. 
                
              Programet të përgatisin për certifikime ndërkombëtare dhe karrierë në tregun vendor e ndërkombëtar, duke përfshirë mundësitë për punë remote dhe freelance.
            </p>
          </div>
        </div>

        {/* ── BAND 2: two program cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {[
            {
              to: "/programim",
              Icon: Code,
              iconBg: C.brandLight,
              iconColor: C.brand,
              title: "Zhvillim i Ueb-it dhe Aplikacioneve Mobile",
              desc: "Ktheji idetë në produkte digjitale. Programi të përgatit me njohuri praktike për zhvillimin e faqeve ueb, aplikacioneve mobile dhe integrimin e Inteligjencës Artificiale (AI).",
              meta: ["2 vite · 4 semestra", "Diplomë profesionale", "Akredituar nga MASHT"],
            },
            {
              to: "/siguria",
              Icon: Shield,
              iconBg: C.brandLight,
              iconColor: C.brand,
              title: "Siguri Kibernetike",
              desc: "Hyr në botën e mbrojtjes digjitale. Programi të përgatit për mbrojtjen e sistemeve dhe rrjeteve, analizimin e rreziqeve dhe përdorimin e AI-së në identifikimin e kërcënimeve kibernetike.",
              meta: ["2 vite · 4 semestra", "Diplomë profesionale", "Akredituar nga MASHT"],
            },
          ].map(({ to, Icon, iconBg, iconColor, title, desc, meta }) => (
            <div
              key={to}
              onClick={() => navigate(to)}
              className="cursor-pointer group rounded-2xl p-8 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.n0 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                  <Icon size={22} style={{ color: iconColor }} />
                </div>
                <h3 className="text-lg font-bold leading-snug pt-1" style={{ color: C.n900 }}>{title}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2" style={{ borderTop: `1px solid ${C.n100}` }}>
                {meta.map((m) => (
                  <span key={m} className="text-xs" style={{ color: C.n500 }}>{m}</span>
                ))}
              </div>
              {/*
                The site's own SecondaryBtn rather than a bespoke link: same pill shape,
                padding, brand outline and hover lift as "Shiko programet" on the
                homepage. The whole card is already clickable, so this needs no onClick —
                the click bubbles up to the card's navigate().
              */}
              <div className="mt-auto pt-1">
                <SecondaryBtn>
                  Mëso më shumë
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </SecondaryBtn>
              </div>
            </div>
          ))}
        </div>

        {/* ── BAND 3: four feature chip-cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Award,    label: "20+ vite",         sub: "Përvojë në edukim profesional",    bg: C.brandLight,  color: C.brand },
            { icon: Laptop,   label: "Diplomë e Akredituar",          sub: "120 kredi",        bg: C.brandLight,     color: C.brand },
            { icon: Users,    label: "Mësim Praktik", sub: "Projekte reale, mësim praktik", bg: C.brandLight,     color: C.brand },
            { icon: Briefcase,label: "Mbështetje Karriere",     sub: "Mundësi reale punësimi",  bg: C.brandLight,     color: C.brand },
          ].map(({ icon: Icon, label, sub, bg, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl"
              style={{ backgroundColor: C.brandSoft, border: `1px solid ${C.cardBorder}` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight" style={{ color: C.n900 }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: C.n400 }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
