import { LogoCard } from "../cards/LogoCard";
import { PARTNER_LOGOS, type MarqueeLogo } from "../data/partner-logos";
import { C } from "../theme";


/**
 * The endlessly scrolling band of partner logos.
 *
 * Not a carousel: there are no slides, no snap points and nothing to navigate, so embla
 * would be the wrong tool. It is one long flex row translated from 0 to -50% on a linear
 * loop. Both halves of that row hold the same logos in the same order, so the instant the
 * animation snaps back to 0 the pixels are identical and the seam is invisible — which is
 * why each row below is built by duplicating the set rather than listing it once.
 *
 * `rows` and `logos` both default to what every existing caller was already getting, so
 * adding them changed no page that does not pass them.
 */
export function InfiniteLogoMarquee({
  logos = PARTNER_LOGOS,
  rows = 2,
}: {
  logos?: readonly MarqueeLogo[];
  /** 1 keeps only the leftward row — for sections where two bands are too heavy. */
  rows?: 1 | 2;
}) {
  const row1 = [...logos, ...logos];
  /* Row 2 is the same set rotated five along, so the two bands never show the same logo
     at the same x. Rotating still leaves two identical halves, so the loop stays seamless
     at any list length. */
  const row2 = [...logos.slice(5), ...logos, ...logos.slice(0, 5)];

  return (
    /*
      `py-1 -my-1` is headroom, not spacing: the rows sit flush against this box and it
      has to clip horizontally, so a card scaling up on hover would lose 2.25px off the
      top or bottom edge. The padding gives it room and the matching negative margin
      cancels it again, leaving the section's own layout exactly where it was.
    */
    <div className="marquee-wrap overflow-hidden relative py-1 -my-1">
      {/* Fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${C.n0}, transparent)` }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${C.n0}, transparent)` }} />

      {/* Row 1 — left */}
      <div className={`flex ${rows === 2 ? "mb-4" : ""}`}>
        <div className="marquee-left flex gap-4 shrink-0">
          {row1.map((logo, i) => (
            <LogoCard key={`r1-${i}`} logo={logo} />
          ))}
        </div>
      </div>

      {/* Row 2 — right */}
      {rows === 2 && (
        <div className="flex">
          <div className="marquee-right flex gap-4 shrink-0">
            {row2.map((logo, i) => (
              <LogoCard key={`r2-${i}`} logo={logo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
