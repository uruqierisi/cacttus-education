import React from "react";
import { Award, Briefcase, Clock, Users } from "lucide-react";


/* ══════════════════════════════════════════
   /rreth-nesh — ABOUT

   Order: story → vision & mission → values → numbers → apply band. It runs from the
   softest claim to the hardest: who we are, what we are aiming at, what we hold
   ourselves to, and only then the figures that back it up. Numbers land better as
   evidence for something already said than as an opening statistic.

   The route is Albanian and dash-separated to match /trajnime, /programim and
   /biznese/talente rather than introducing an English /about.

   It does NOT duplicate the dropdown's destinations: Ekipi and Ligjëruesit remain their
   own pages, and this links to them instead of restating their content.
══════════════════════════════════════════ */

/** The three commitments under the mission statement. */
export const ABOUT_MISSION_POINTS: readonly string[] = [
  "Dizajnojmë dhe ofrojmë programe profesionale cilësore, të orientuara drejt industrisë dhe tregut të punës.",
  "Zhvillojmë të menduarit kritik, zgjidhjen e problemeve, komunikimin dhe aftësitë profesionale.",
  "Krijojmë përvoja praktike të të nxënit përmes metodave bashkëkohore dhe bashkëpunimit me industrinë.",
];


/**
 * The seven company values, in the order the company states them.
 *
 * Numbered rather than illustrated: seven icons distinct enough to mean anything on their
 * own do not exist, and seven near-identical ones would be visual noise. The index does
 * the work instead, which also keeps each card small — the point here is that there are
 * SEVEN of these, not that any one of them is a feature.
 */
export const ABOUT_VALUES: readonly { title: string; body: string }[] = [
  { title: "Integriteti", body: "Veprojmë me etikë dhe transparencë, duke bërë gjithmonë atë që është e drejtë." },
  { title: "Cilësia dhe përsosmëria", body: "Synojmë standardet më të larta në gjithçka që bëjmë dhe përmirësohemi vazhdimisht." },
  { title: "Respekti", body: "I trajtojmë të gjithë me respekt dhe dinjitet, duke ndërtuar marrëdhënie të besueshme." },
  { title: "Bashkëpunimi", body: "Punojmë së bashku dhe ndajmë njohuritë për të krijuar rezultate më të mira për të gjithë." },
  { title: "Përgjegjësia", body: "Marrim përgjegjësi për vendimet, veprimet, sjelljet dhe rezultatet tona." },
  { title: "Inovacioni", body: "Zhvillojmë vazhdimisht forma më bashkëkohore dhe efektive të edukimit." },
];


export const ABOUT_STAT_ICONS: readonly React.ElementType[] = [Award, Users, Clock, Briefcase];
