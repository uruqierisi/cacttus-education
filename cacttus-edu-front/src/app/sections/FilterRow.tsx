import { C } from "../theme";


/* 4.1 — Filter chips with labels */
export function FilterRow({ label, options, active, onSelect }: { label: string; options: string[]; active: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <span className="text-sm font-semibold shrink-0" style={{ color: C.n900, fontSize: 15 }}>{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-0.5 flex-wrap md:flex-nowrap">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onSelect(o)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: active === o ? C.brand : C.n100,
              color: active === o ? "#fff" : C.n700,
              border: active === o ? `1px solid ${C.brand}` : `1px solid ${C.n200}`,
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
