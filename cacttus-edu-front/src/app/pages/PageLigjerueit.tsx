/* The route, the component and the data table keep their Albanian spelling
   (“Ligjërueit”); only this FILENAME is ASCII, to keep git and Windows out of
   NFC/NFD normalisation trouble. */
import { Link } from "react-router";
import { PersonCard } from "../cards/PersonCard";
import { LIGJËRUEIT } from "../data/lecturers";
import { C } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { SecondaryBtn } from "../ui/buttons";


export function PageLigjërueit() {
  return (
    <PageWrapper>
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Rreth nesh" }, { label: "Ligjëruesit" }]} />
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Ligjëruesit</h1>
          <p className="text-0.5g" style={{ color: C.muted }}>Njihuni me ligjëruesit, profesionistë të industrisë që sjellin njohuri praktike dhe ju përgatisin për tregun e punës.</p>
        </div>
      </section>
      <section className="py-16" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-16">
            {/* `nameOnly` here and NOT on /ekipi, which keeps its role, city and LinkedIn. */}
            {LIGJËRUEIT.map((l) => <PersonCard key={l.name} person={l} nameOnly />)}
          </div>
          <div className="py-16 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 px-8" style={{ backgroundColor: C.p900 }}>
            <h3 className="text-2xl font-semibold text-white">Dëshiron të ligjërosh te ne?</h3>
            <Link to="/kontakti"><SecondaryBtn className="border-white/50 text-white">Na kontakto</SecondaryBtn></Link>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
