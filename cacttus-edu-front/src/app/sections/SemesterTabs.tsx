import React, { useState } from "react";
import { SEM_PROGRAMIM } from "../data/semesters";
import { C } from "../theme";


export function SemesterTabs({ semesters }: { semesters: typeof SEM_PROGRAMIM }) {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState(true);

  const select = (i: number) => {
    if (i === active) return;
    setFade(false);
    setTimeout(() => { setActive(i); setFade(true); }, 180);
  };

  const handleKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); }
    if (e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % semesters.length); }
    if (e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + semesters.length) % semesters.length); }
  };

  return (
    <div>
      {/* Progress rail + circles */}
      <div className="relative flex items-center justify-between mb-10 px-4">
        {/* Connector line background */}
        <div className="absolute left-8 right-8 top-4 h-0.5" style={{ backgroundColor: C.n200 }} />
        {/*
          Filled portion, measured against the RAIL SPAN rather than the whole container.

          This used to set `left: 32px`, `width: <pct>%` and `right: <pct>%` all at once.
          An absolutely positioned box cannot honour all three — CSS drops `right` — so the
          width was a percentage of the FULL container while the box already started 32px
          in. At the last step that resolves to `left: 32px` + `width: 100%`, i.e. 32px
          wider than its own container, which pushed roughly 12px past the viewport on a
          phone and produced the horizontal scroll. It also overshot the final circle by
          32px at every width, desktop included.

          The fix is to stop sizing this box at all. It now spans `left-8 right-8` — exactly
          the grey rail behind it — and the progress is drawn with `scaleX()` from
          `origin-left`. A scale can only ever shrink the box, so the fill is incapable of
          leaving the rail no matter how many steps there are or how narrow the screen is.

          It also has to be a transform rather than an animated width: `transition-all` on
          `width` could not interpolate between the two `calc()` expressions this used to
          produce, so the bar silently stayed at 0 and no progress was drawn at all
          (measured — setting the same value with `transition: none` rendered it correctly).
          Transforms interpolate on the compositor and have no such problem.
        */}
        <div
          className="absolute left-8 right-8 top-4 h-0.5 origin-left transition-transform duration-300"
          style={{ backgroundColor: C.brand, transform: `scaleX(${active / (semesters.length - 1)})` }}
        />

        {semesters.map((s, i) => (
          <div key={i} className="relative flex flex-col items-center gap-2 z-10">
            <button
              onClick={() => select(i)}
              onKeyDown={(e) => handleKey(e, i)}
              tabIndex={0}
              aria-label={s.sem}
              aria-pressed={i === active}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 focus:outline-none cursor-pointer"
              style={{
                backgroundColor: i === active ? C.brand : C.n0,
                color: i === active ? "#fff" : C.brand,
                border: i === active ? `2px solid ${C.brand}` : `2px solid #E4D3E6`,
                transform: i === active ? "scale(1.18)" : "scale(1)",
                boxShadow: i === active ? `0 0 0 4px rgba(130,54,133,0.18)` : "none",
              }}
            >
              {i + 1}
            </button>
            <span className="text-[11px] sm:text-xs font-medium whitespace-nowrap" style={{ color: i === active ? C.brand : C.n500 }}>
              {s.sem}
            </span>
          </div>
        ))}
      </div>

      {/* Curriculum panel */}
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{ border: `1px solid ${C.cardBorder}`, opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(8px)" }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: C.brandLight, borderBottom: `1px solid ${C.cardBorder}` }}>
          <span className="font-semibold" style={{ color: C.brandDark }}>{semesters[active].sem}</span>
          {/* Summed, not hardcoded: change a course's credits and this follows. */}
          <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: C.brand, color: "#fff" }}>
            {semesters[active].modules.reduce((total, [, ecvet]) => total + ecvet, 0)} ECVET
          </span>
        </div>

        {/* Module rows */}
        {semesters[active].modules.map(([name, ecvet, hours], i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-3.5 text-sm"
            style={{
              borderBottom: i < semesters[active].modules.length - 1 ? `1px solid ${C.n100}` : "none",
              backgroundColor: i % 2 === 0 ? C.n0 : "#FAF5FB",
            }}
          >
            <span className="font-medium" style={{ color: C.n800 }}>{name}</span>
            <span className="text-xs shrink-0 ml-4" style={{ color: C.n400 }}>{ecvet} ECVET · {hours} orë</span>
          </div>
        ))}
      </div>
    </div>
  );
}
