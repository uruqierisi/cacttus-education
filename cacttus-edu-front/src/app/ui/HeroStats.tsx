import { HERO_STATS } from "../data/hero-stats";
import { C } from "../theme";


export function HeroStats({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-7 pt-6 ${className}`}
      style={{ borderTop: `1px solid ${C.n200}` }}
    >
      {HERO_STATS.map(([num, label]) => (
        <div key={label}>
          <p className="text-2xl font-bold" style={{ color: C.brand }}>{num}</p>
          <p className="text-sm mt-0.5" style={{ color: C.n500 }}>{label}</p>
        </div>
      ))}
    </div>
  );
}
