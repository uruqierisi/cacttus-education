import { Award, BookOpen, Code, Globe, Laptop, Shield } from "lucide-react";
import { SEM_SIGURIA } from "../data/semesters";
import { ProgramPage } from "./ProgramPage";

import cyberHero from "../../imports/cyberPage.png";


export function PageSiguria() {
  return (
    <ProgramPage
      title="Siguria Kibernetike"
      breadcrumbEnd="Siguria Kibernetike"
      heroParagraph="Programi të përgatit me njohuri praktike për mbrojtjen e rrjeteve, sistemeve, të dhënave dhe infrastrukturës cloud nga kërcënimet kibernetike. Përmes ushtrimeve laboratorike, skenarëve realë dhe mjeteve profesionale, do të mësosh të identifikosh cenueshmëritë, të analizosh log-et dhe trafikun, të reagosh ndaj incidenteve dhe të realizosh testime të sigurisë."
      /* ── "Çfarë do të mësosh" cards — EDIT THE `description` STRINGS HERE ── */
      whatCards={[
        {
          title: "Rrjeta dhe sisteme",
          icon: Globe,
          description: "Mëso të instalosh, konfigurosh, administrosh dhe mbrosh rrjetet kompjuterike.",
        },
        {
          title: "Linux dhe administrim sistemesh",
          icon: Shield,
          description: "Zhvillo aftësi praktike në përdorimin e Linux-it, administrimin e serverëve dhe automatizimin përmes skriptimit.",
        },
        {
          title: "Cloud dhe virtualizim",
          icon: Code,
          description: "Mëso të krijosh, menaxhosh dhe sigurosh infrastrukturën virtuale dhe shërbimet në cloud.",
        },
        {
          title: "Siguria e informacionit",
          icon: BookOpen,
          description: "Kupto parimet e mbrojtjes së të dhënave, menaxhimit të qasjes dhe zvogëlimit të rreziqeve të sigurisë.",
        },
        {
          title: "Operacionet kibernetike",
          icon: Laptop,
          description: "Mëso të monitorosh sistemet, të identifikosh kërcënimet dhe të reagosh ndaj incidenteve kibernetike.",
        },
        {
          title: "Testimi i sigurisë",
          icon: Award,
          description: "Identifiko cenueshmëritë, vlerëso sigurinë e sistemeve dhe realizo testime praktike të depërtimit.",
        },
      ]}
      semesters={SEM_SIGURIA}
      roles={["Cybersecurity Analyst", "SOC Analyst", "Network Administrator", "Penetration Tester", "Cloud Security Specialist", "Information Security Specialist"]}
      preselected="Siguria Kibernetike"
      imgUrl={cyberHero}
      /* ── HERO IMAGE VERTICAL CROP — TUNE THE SECOND NUMBER ──
         Same knob as /programim above: higher % pushes the photo DOWN, lower % pulls it UP.
         Passed explicitly rather than left to `ProgramPage`'s default, which is 20% — this
         page used to inherit that silently, so the value had to be stated to reach 50%. */
      imgPosition="center 55%"
      /* Drop the real file at cacttus-edu-front/public/pdfs/ under exactly this name. */
      planUrl="/pdfs/plani-siguria-kibernetike.pdf"
      to="/siguria"
    />
  );
}
