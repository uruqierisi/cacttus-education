import { useState } from "react";
import {
  BarChart,
  Check,
  Code,
  Globe,
  Laptop,
  Minus,
  Monitor,
  Plus,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { BUSINESS_REQUEST_TYPES } from "../../marketing/lib/forms.config";
import { useBusinessLead } from "../hooks/useBusinessLead";
import { sanitizePhone } from "../lib/phone";
import { C, globalStyle } from "../theme";
import { Breadcrumb } from "../ui/Breadcrumb";
import { PageWrapper } from "../ui/PageWrapper";
import { PrimaryBtn } from "../ui/buttons";

/* Hero photo for /biznese/trajnime, replacing the Unsplash stock URL. Same 3:2 source in
   a 4:3 frame — see BIZNESE_TRAJNIME_IMG_POSITION. */
import trajnimePersonalizuara from "../../imports/trajnimePersonalizuara.jpeg";


export const BIZNESE_TRAJNIME_IMG_POSITION = "center 50%";


export function PageBizneseTrajnime() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const lead = useBusinessLead(BUSINESS_REQUEST_TYPES.TRAININGS);
  const [biz, setBiz] = useState({ kompania: "", personi: "", email: "", telefoni: "" });
  const faqs = [
    ["Sa zgjat një trajnim i personalizuar?", "Kohëzgjatja përcaktohet sipas temës, nivelit të pjesëmarrësve dhe objektivave të kompanisë."],
    ["Si mund të kërkojmë një ofertë?", "Na kontaktoni duke përshkruar nevojat, fushën e trajnimit dhe numrin e pjesëmarrësve. Ekipi ynë do t’ju propozojë zgjidhjen dhe ofertën përkatëse."],
    ["Si përcaktohet çmimi i trajnimit?", "Çmimi varet nga përmbajtja, kohëzgjatja, formati dhe numri i pjesëmarrësve. Pas analizës së kërkesës, kompania pranon një ofertë të personalizuar."],
    ["A pajisen pjesëmarrësit me certifikatë pas përfundimit të trajnimit?", "Po, çdo pjesëmarrës merr certifikatë të njohur nga Cacttus Education pas përfundimit me sukses."],
    ["A ruhet konfidencialiteti i të dhënave të kompanisë?", "Po. Informacionet dhe rastet e brendshme të përdorura gjatë trajnimit trajtohen sipas kushteve të dakorduara me kompaninë."],
  ];

  return (
    <PageWrapper>
      <style>{globalStyle}</style>

      {/* 1. Hero — split layout, left text right photo */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <Breadcrumb items={[{ label: "Ballina", path: "/" }, { label: "Për biznese", path: "/biznese" }, { label: "Trajnime të personalizuara" }]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>           
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>
                Investoni në aftësitë, zhvillimin dhe të ardhmen e ekipit tuaj!
              </h1>
              <p className="text-lg mb-8" style={{ color: C.muted }}>
                Programe trajnimi të personalizuara sipas nevojave të biznesit tuaj, nga analiza dhe zhvillimi i aftësive deri te vlerësimi dhe certifikimi i stafit.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/kontakti"><PrimaryBtn>Na kontaktoni</PrimaryBtn></Link>
              </div>
            </div>
            <div className="aspect-[5/3] rounded-[20px] overflow-hidden" style={{ backgroundColor: C.n100 }}>
              <img src={trajnimePersonalizuara} alt="Trajnim i personalizuar" className="w-full h-full object-cover" style={{ objectPosition: BIZNESE_TRAJNIME_IMG_POSITION }} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. The problem — 3 columns */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: C.n900 }}>Qasje e personalizuar për zhvillimin e ekipit tuaj</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Trajnime të personalizuara", desc: "Programe të përshtatura sipas nevojave, objektivave dhe roleve specifike të ekipit tuaj." },
              { icon: Users, title: "Ekspertë nga industria", desc: "Trajnime praktike të udhëhequra nga profesionistë me përvojë në fushat përkatëse." },
              { icon: Monitor , title: "Formate fleksibile", desc: "Trajnime në klasë, online ose në format hibrid, të organizuara sipas orarit të biznesit tuaj." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={22} style={{ color: C.brand }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ color: C.n900 }}>{title}</h4>
                <p className="text-sm" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Comparison — hire vs reskill */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[900px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: C.n900 }}>Pse të rikualifikoni në vend që të punësoni?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-2xl" style={{ backgroundColor: C.n50, border: `1px solid ${C.n200}` }}>
              <h4 className="font-semibold mb-5 text-lg" style={{ color: C.n700 }}>Punësim i ri</h4>
              {["Kosto rekrutimi 6,000–12,000€", "Kohë pritjeje 2–4 muaj", "Rreziku i papërshtatshmërisë kulturore", "Ndikimi i ulët i organizatës"].map((d) => (
                <div key={d} className="flex items-center gap-3 mb-3 text-sm" style={{ color: C.n600 }}>
                  <span style={{ color: C.n400 }}>—</span> {d}
                </div>
              ))}
            </div>
            <div className="p-7 rounded-2xl relative" style={{ backgroundColor: C.brand, border: `2px solid ${C.brand}`, boxShadow: "0 8px 32px rgba(130,54,133,0.25)" }}>
              <span className="absolute -top-3 right-6 text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: C.brandDark }}>E rekomanduar</span>
              <h4 className="font-semibold mb-5 text-lg text-white">Rikualifikim i brendshëm</h4>
              {["Kosto 3–5× më e ulët", "Rezultate brenda 6–8 javësh", "Staf i motivuar dhe besnik", "Njohuri të thella të proceseve tuaja"].map((d) => (
                <div key={d} className="flex items-center gap-3 mb-3 text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
                  <Check size={14} className="shrink-0" /> {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. How it works — 4 steps */}
      <section className="py-20" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: C.n900 }}>Si funksionon?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { n: 1, title: "Analiza e nevojave", desc: "Vlerësojmë aftësitë ekzistuese dhe identifikojmë nevojat për zhvillim." },
              { n: 2, title: "Dizajnimi i programit", desc: "Hartojmë një program të personalizuar sipas objektivave të kompanisë." },
              { n: 3, title: "Realizimi i trajnimit", desc: "Ekspertët tanë zhvillojnë trajnimin në klasë, online ose në ambientet tuaja." },
              { n: 4, title: "Vlerësimi dhe certifikimi", desc: "Vlerësojmë rezultatet dhe certifikojmë pjesëmarrësit pas përfundimit." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="p-6 rounded-2xl relative" style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}>
                <div className="text-7xl font-black absolute top-4 right-4 leading-none select-none" style={{ color: C.brandLight }}>0{n}</div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white mb-4 relative z-10" style={{ backgroundColor: C.brand }}>{n}</div>
                <h4 className="font-semibold mb-2 relative z-10" style={{ color: C.n900 }}>{title}</h4>
                <p className="text-sm relative z-10" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Topics grid */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-10" style={{ color: C.n900 }}>Çfarë mund të trajnojmë?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Code, topic: "Programim", desc: "Zhvillim full stack ueb dhe mobile" },
              { icon: BarChart, topic: "Administrim", desc: "Sisteme, rrjete dhe baza të të dhënave" },
              { icon: Shield, topic: "Siguri kibernetike", desc: "Mbrojtje, monitorim dhe reagim ndaj incidenteve" },
              { icon: Globe, topic: "Marketing dhe dizajn", desc: "Marketing digjital, dizajn grafik dhe UI/UX" },
              { icon: Laptop, topic: "Menaxhim i projekteve", desc: "Planifikim, Agile dhe Scrum" },
              { icon: Users, topic: "Shkathtësi të buta", desc: "Komunikim, udhëheqje dhe punë ekipore" },
            ].map(({ icon: Icon, topic, desc }) => (
              <div key={topic} className="flex items-start gap-4 p-5 rounded-xl" style={{ border: `1px solid ${C.cardBorder}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
                  <Icon size={18} style={{ color: C.brand }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.n900 }}>{topic}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Stats band */}
      <section className="py-16" style={{ backgroundColor: C.brand }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[["65+", "Kompani të trajnuara"], ["800+", "Punonjës të rikualifikuar"], ["50+", "Ligjërues dhe ekspertë"], ["23 vite", "Përvojë trajnimi"]].map(([num, label]) => (
              <div key={label}>
                <p className="text-4xl font-bold text-white mb-1">{num}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[720px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: C.n900 }}>Pyetje të shpeshta</h2>
          <div className="flex flex-col divide-y" style={{ borderTop: `1px solid ${C.n200}`, borderBottom: `1px solid ${C.n200}` }}>
            {faqs.map(([q, a], i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium pr-4" style={{ color: C.n900 }}>{q}</span>
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: C.brandLight }}>
                    {openFaq === i ? <Minus size={13} style={{ color: C.brand }} /> : <Plus size={13} style={{ color: C.brand }} />}
                  </span>
                </button>
                {openFaq === i && <p className="pb-5 text-sm leading-relaxed" style={{ color: C.muted }}>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Contact form band */}
      <section className="py-16" style={{ backgroundColor: C.brandSoft }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="rounded-3xl px-8 md:px-12 py-12" style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}>
            <h2 className="text-2xl font-bold text-white mb-2">Keni nevojë për trajnime të personalizuara?</h2>
            <p className="text-white/70 text-sm mb-8">Na kontaktoni dhe do t'ju ofrojmë një propozim brenda 48 orëve.</p>
            {lead.sent ? (
              <p className="text-white text-sm font-semibold">Faleminderit! Kërkesa u dërgua — do t'ju kontaktojmë brenda 48 orëve.</p>
            ) : (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {([
                { ph: "Emri i kompanisë", key: "kompania" },
                { ph: "Personi kontaktues", key: "personi" },
                { ph: "Email", key: "email" },
                { ph: "Telefoni", key: "telefoni" },
              ] as const).map(({ ph, key }) => (
                <input key={ph} type="text" placeholder={ph} value={biz[key]} onChange={(e) => setBiz({ ...biz, [key]: key === "telefoni" ? sanitizePhone(e.target.value) : e.target.value })} className="px-4 text-sm rounded-xl" style={{ height: 52, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "#fff", color: C.n900, outline: "none" }} />
              ))}
              <button onClick={() => lead.submit({ name: biz.personi, email: biz.email, phone: biz.telefoni }, { kompania: biz.kompania })} className="h-[52px] px-6 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 whitespace-nowrap" style={{ backgroundColor: "#fff", color: C.brand }}>
                {lead.isSubmitting ? "Duke dërguar…" : "Kontaktoni ne"}
              </button>
            </div>
                {lead.error && <p className="text-white text-sm mt-3">{lead.error}</p>}
              </>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
