import { BookOpen, Briefcase, Code, Globe, Laptop, Users } from "lucide-react";
import { SEM_PROGRAMIM } from "../data/semesters";
import { ProgramPage } from "./ProgramPage";

/* Hero photos for the two programme pages. Both are passed to `ProgramPage` as its
   `imgUrl` prop, so each page picks its own and neither can affect the other. */
import programimHero from "../../imports/programimPage.png";


export function PageProgramim() {
  return (
    <ProgramPage
      title="Zhvillim i Ueb-it dhe Aplikacioneve Mobile"
      breadcrumbEnd="Zhvillim i Ueb-it dhe Aplikacioneve Mobile"
      heroParagraph="Programi të përgatit me njohuri praktike për zhvillimin e uebfaqeve, aplikacioneve mobile dhe integrimin e Inteligjencës Artificiale (AI). Përmes mësimit praktik dhe projekteve reale, do të mësosh krijimin e ndërfaqeve moderne, menaxhimin e bazave të të dhënave dhe zhvillimin e produkteve digjitale funksionale."
      /* ── "Çfarë do të mësosh" cards — EDIT THE `description` STRINGS HERE ── */
      whatCards={[
        {
          title: "Bazat e programimit",
          icon: Code,
          description: "Mëso logjikën programuese, algoritmet, strukturat e të dhënave dhe programimin e orientuar në objekte.",
        },
        {
          title: "Zhvillim front-end",
          icon: Laptop,
          description: "Krijo ndërfaqe moderne dhe interaktive për ueb duke përdorur JavaScript, TypeScript, React dhe Vue.js.",
        },
        {
          title: "Zhvillim back-end",
          icon: Globe,
          description: "Ndërto aplikacione funksionale, sisteme të sigurta dhe REST API të integruara me shërbime të jashtme.",
        },
        {
          title: "Aplikacione mobile",
          icon: Briefcase,
          description: "Zhvillo aplikacione moderne për pajisje mobile, me integrim të API-ve, cloud-it dhe funksioneve të AI-së.",
        },
        {
          title: "Bazat e të dhënave",
          icon: BookOpen,
          description: "Mëso të dizajnosh, organizosh dhe menaxhosh baza të të dhënave për aplikacione ueb dhe mobile.",
        },
        {
          title: "Intelegjencë Artificiale",
          icon: Users,
          description: "Përdor AI-në për kodim, debugging, testim dhe integro funksione inteligjente në projektet e tua.",
        },
      ]}
      semesters={SEM_PROGRAMIM}
      roles={["Full-Stack Developer", "Mobile App Developer", "QA / Software Tester", "UI/UX Designer", "Software Developer", "Junior AI Developer"]}
      preselected="Zhvillim i Ueb-it dhe Aplikacioneve Mobile"
      /*
        Bundled asset rather than the stock photo this used to point at. `ProgramPage`
        takes the hero image as a prop, so swapping it here changes this page only —
        /siguria still passes its own URL and is untouched.
      */
      imgUrl={programimHero}
      /* ── HERO IMAGE VERTICAL CROP — TUNE THE SECOND NUMBER ──
         Higher % pushes the photo DOWN in the frame (shows more of its lower half);
         lower % pulls it UP. Reset to 50% for the new photo: the old 75% was dialled in
         against a different picture and means nothing to this one. */
      imgPosition="center 60%"
      /* Drop the real file at cacttus-edu-front/public/pdfs/ under exactly this name. */
      planUrl="/pdfs/plani-zhvillim-web-aplikacione-mobile.pdf"
      to="/programim"
    />
  );
}
