import { ArrowRight, Code, Shield } from "lucide-react";
import { Link, useLocation } from "react-router";
import { PROJEKTET_LIST } from "../data/projektet-list";
import { C } from "../theme";


/* ─── DROPDOWNS ─── */
export function DropdownStudime({ onClose }: { onClose: () => void }) {
  const { pathname } = useLocation();
  return (
    <div
      className="absolute top-full left-0 mt-1 rounded-2xl shadow-2xl p-8 z-50"
      style={{ width: 720, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.brand, letterSpacing: "0.08em" }}>
        Studime Profesionale
      </p>
      <p className="text-sm mb-6" style={{ color: C.n500 }}>
        Cacttus Education ofron studime dyvjeçare të akredituara në fushën e teknologjisë.
      </p>
      <div className="flex flex-col gap-3">
        {[
          { to: "/programim", Icon: Code, title: "Zhvillues i Ueb-it dhe Aplikacioneve Mobile", sub: "Zhvillim uebi dhe aplikacionesh mobile me integrim të Inteligjencës Artificiale." },
          { to: "/siguria", Icon: Shield, title: "Siguria Kibernetike", sub: "Mbrojtje e rrjeteve dhe sistemeve, operacione kibernetike, siguri në cloud dhe testim." },
        ].map(({ to, Icon, title, sub }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            aria-current={pathname === to ? "page" : undefined}
            className="flex items-start gap-4 p-4 rounded-xl transition-all hover:shadow-md group"
            style={{
              border: `1px solid ${pathname === to ? C.brand : C.n200}`,
              backgroundColor: pathname === to ? C.brandSoft : "transparent",
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: C.brandLight }}>
              <Icon size={22} style={{ color: C.brand }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug" style={{ color: C.n900 }}>{title}</p>
              <p className="text-xs mt-1" style={{ color: C.n500 }}>{sub}</p>
            </div>
            <ArrowRight size={16} className="ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: C.brand }} />
          </Link>
        ))}
      </div>
    </div>
  );
}


export function DropdownProjektet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 rounded-2xl shadow-2xl py-2 z-50"
      style={{ width: 420, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      {PROJEKTET_LIST.map((p) => (
        <Link
          key={p.path}
          to={p.path}
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-purple-50 group"
          style={{ color: C.n700 }}
        >
          {/*
            Fixed-size round frame rather than a bare <img>: the source logos are wildly
            different aspect ratios (a wide USAID wordmark next to a square VIC glyph), so
            letting them size themselves would give every row a different visual weight.
            The frame is the constant, `object-contain` fits the mark inside it, and
            `shrink-0` stops the longer Albanian titles from squeezing it flat.
          */}
          <span
            className="shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center p-1.5"
            style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
          >
            {/* Decorative: the row's own text already names the project, so an alt here
                would just make screen readers say it twice. */}
            <img src={p.icon} alt="" aria-hidden="true" loading="lazy" className="max-w-full max-h-full object-contain" />
          </span>
          {p.name}
          <ArrowRight size={14} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.brand }} />
        </Link>
      ))}
    </div>
  );
}


export function DropdownBiznese({ onClose }: { onClose: () => void }) {
  /* Marks the sub-page the visitor is already on, so the dropdown says where they are
     rather than only where they could go. Brand purple on the border and title. */
  const { pathname } = useLocation();
  return (
    <div
      className="absolute top-full left-0 mt-1 rounded-2xl shadow-2xl p-6 z-50"
      style={{ width: 660, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.brand, letterSpacing: "0.08em" }}>Për Biznese</p>
      <p className="text-sm mb-5" style={{ color: C.n500 }}>Ndihmojmë kompanitë të përgatiten për transformimin dixhital.</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: "Trajnime të personalizuara", desc: "Rikualifikoni punëtorët ekzistues për role dixhitale", path: "/biznese/trajnime" },
          { title: "Rrjeti i talentëve", desc: "Akses në portfoliot dhe CV e studentëve", path: "/biznese/talente" },
          { title: "Bursa e Impaktit", desc: "Bëhu Sponsor i Bursave të impaktit", path: "/biznese/bursa" },
          { title: "Klasët me qera", desc: "Klasat moderne të pajisura për qira", path: "/biznese/klasa" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            aria-current={pathname === item.path ? "page" : undefined}
            className="p-4 rounded-xl transition-all hover:shadow-md"
            style={{
              border: `1px solid ${pathname === item.path ? C.brand : C.n200}`,
              backgroundColor: pathname === item.path ? C.brandSoft : "transparent",
            }}
          >
            <p className="font-semibold text-sm" style={{ color: pathname === item.path ? C.brand : C.n900 }}>{item.title}</p>
            <p className="text-xs mt-1" style={{ color: C.n500 }}>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}


export function DropdownRreth({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute top-full right-0 mt-1 rounded-2xl shadow-2xl py-2 z-50"
      style={{ width: 240, backgroundColor: C.n0, border: `1px solid ${C.n200}` }}
    >
      {[["Ekipi", "/ekipi"], ["Ligjëruesit", "/ligjërueit"]].map(([label, path]) => (
        <Link
          key={path}
          to={path}
          onClick={onClose}
          className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-purple-50 group"
          style={{ color: C.n700 }}
        >
          {label}
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.brand }} />
        </Link>
      ))}
    </div>
  );
}
