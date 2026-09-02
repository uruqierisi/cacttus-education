import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { ABOUT_STAT_ICONS } from "../data/about";
import { HERO_STATS } from "../data/hero-stats";
import { useHasEnteredView } from "../hooks/useHasEnteredView";
import { C } from "../theme";


/* ── Count-up ──
   Hand-rolled rather than reached for from a library. `motion` is in package.json but is
   imported nowhere in src/, and every other animation on this site is plain React plus a
   CSS transition — adding a runtime dependency the bundle does not currently carry, for
   one counter, is not a trade worth making. This is ~30 lines. */
export const COUNT_UP_MS = 1600;


/**
 * Splits a display figure into the number to animate and the text around it, so "1,000+",
 * "88%" and "9 vite" all count while keeping whatever they are written with. Anything
 * without digits falls through and is rendered untouched.
 *
 * The numeric run is captured WITH its separators — `\d[\d.,\s]*\d` — because a plain
 * `\d+` stops at the first comma: "1,000+" would count to 1 and render the leftover
 * ",000+" as a suffix. Whichever separator the source used is remembered so the counting
 * figure is grouped the same way, rather than being forced into one locale's convention.
 */
export function splitStatValue(raw: string): {
  prefix: string;
  target: number | null;
  suffix: string;
  separator: string | null;
} {
  const match = raw.match(/^(\D*?)(\d[\d.,\s]*\d|\d)(.*)$/);
  if (!match) return { prefix: raw, target: null, suffix: "", separator: null };

  const token = match[2] ?? "";
  return {
    prefix: match[1] ?? "",
    target: Number(token.replace(/\D/g, "")),
    suffix: match[3] ?? "",
    separator: token.match(/[.,\s]/)?.[0] ?? null,
  };
}


export function CountUpValue({ value, run }: { value: string; run: boolean }) {
  const { prefix, target, suffix, separator } = splitStatValue(value);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!run || target === null) return;

    let frame = 0;
    let startedAt: number | null = null;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min((now - startedAt) / COUNT_UP_MS, 1);
      // easeOutCubic: quick off the mark, gliding into the final figure rather than
      // stopping dead on it.
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, target]);

  if (target === null) return <>{value}</>;

  const current = run ? shown : 0;
  const rendered = separator === null
    ? String(current)
    : current.toLocaleString("en-US").replace(/,/g, separator);

  return <>{prefix}{rendered}{suffix}</>;
}


/**
 * The four figures as one compact band, not four large cards.
 *
 * The previous version gave each number a tall padded card and a decorative arc, which
 * made four short facts occupy more of the page than the mission statement above them.
 * This is the same data in a single strip: one gradient panel — the site's existing
 * accent surface, borrowed from the apply band — with the numbers set inline and split by
 * hairline rules rather than by gaps between separate boxes.
 */
export function AboutStatsBand() {
  // One observer for the whole band, not one per figure: the four numbers should start
  // together, and they are always on screen together anyway.
  const { ref, entered } = useHasEnteredView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="rounded-3xl px-6 py-10 md:px-10"
      style={{ background: `linear-gradient(135deg, ${C.brand} 0%, ${C.secondary} 100%)` }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {HERO_STATS.map(([num, label], i) => {
          const Icon = ABOUT_STAT_ICONS[i] ?? Award;
          return (
            <div
              key={label}
              /*
                The divider is a left border on every item except the first of its row, so
                it has to be re-declared per breakpoint: at 2 columns the third item
                starts a new row and must lose it, at 4 columns it must keep it.
              */
              className={`flex flex-col items-center text-center px-4 py-4 ${
                i % 2 === 0 ? "" : "border-l"
              } ${i === 0 ? "lg:border-l-0" : "lg:border-l"} ${i < 2 ? "" : "border-t lg:border-t-0"}`}
              style={{ borderColor: "rgba(255,255,255,0.22)" }}
            >
              <Icon size={20} className="mb-3" style={{ color: "rgba(255,255,255,0.75)" }} aria-hidden="true" />
              {/*
                `tabular-nums` keeps every digit the same width, so the figure does not
                jitter sideways while it counts from 0 to 500.
              */}
              <p
                className="text-3xl md:text-4xl font-bold leading-none text-white tabular-nums"
                style={{ letterSpacing: "-0.02em" }}
              >
                <CountUpValue value={num} run={entered} />
              </p>
              <p className="text-xs md:text-sm mt-2 leading-snug" style={{ color: "rgba(255,255,255,0.72)" }}>
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
