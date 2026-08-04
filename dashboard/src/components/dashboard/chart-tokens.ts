/**
 * Chart colour + chrome tokens.
 *
 * These are hex rather than the `hsl(var(--…))` utilities the rest of the app uses,
 * because Recharts renders SVG attributes (`fill`, `stroke`) that cannot resolve a
 * Tailwind class. Slot 1 IS the locked brand primary #823685; the other three were
 * chosen to sit around it and the set was then MEASURED, not eyeballed.
 *
 * VALIDATION (light surface #ffffff, categorical, both `--pairs adjacent` and
 * `--pairs all`):
 *   lightness band ......... PASS  all four inside L 0.43–0.77
 *   chroma floor ........... PASS  all four >= 0.1
 *   CVD separation ......... PASS  worst pair aqua/orange ΔE 9.2 deutan, 9.6 tritan
 *   normal-vision floor .... PASS  worst pair blue/purple ΔE 20.8
 *   contrast vs surface .... WARN  aqua #1baf7a is 2.82:1 on white
 *
 * That single WARN is not dismissable — it obliges "relief": the value must be
 * readable without relying on the swatch. `TypeDonut` therefore ships a labelled
 * legend carrying every category name AND its count, so identity and magnitude are
 * both available as text and colour is only ever a secondary cue.
 *
 * The slot ORDER is load-bearing, not cosmetic: it is what the adjacency checks were
 * run against. Re-order it and the palette must be re-validated.
 */
import type { FormType } from '@/lib/constants';

/** Categorical slots, in validated order. */
export const SERIES_COLORS: Readonly<Record<FormType, string>> = Object.freeze({
  ZHVAM: '#823685',
  CYBER: '#eb6834',
  TRAINING: '#1baf7a',
  SCHOOL: '#2a78d6',
});

/** Single-series trend colour — the brand primary. One series needs no legend. */
export const TREND_COLOR = '#823685';

/** Recessive chrome. Grid and axes must never compete with the data. */
export const CHART_CHROME = Object.freeze({
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  label: '#898781',
  surface: '#ffffff',
});

/** Stroke widths and mark sizes, per the mark spec. */
export const CHART_MARKS = Object.freeze({
  /** Data lines are 2px; anything heavier reads as decoration. */
  lineWidth: 2,
  /** Hover marker. Below ~8px it is not a reliable pointer target. */
  activeDotRadius: 4.5,
  /** Surface-coloured gap between adjacent filled marks (donut segments). */
  segmentGap: 2,
});
