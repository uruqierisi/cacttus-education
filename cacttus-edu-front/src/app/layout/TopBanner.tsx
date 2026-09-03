import { ArrowRight } from "lucide-react";
import { C } from "../theme";


/* ══════════════════════════════════════════
   PART 1 — GLOBAL: BANNER + NAVBAR
══════════════════════════════════════════ */

/* 1.1 — TOP BANNER: deep brand purple #823685 */
export function TopBanner({ onApplyClick }: { onApplyClick: () => void }) {
  return (
    /*
      WIDE SCREENS: the bar stays full-bleed, but its CONTENT is pulled in to the
      navbar's content edges so the message and the pill line up with the logo and
      the CTA directly below them. Past 1536px the bar is far wider than the 1200px
      page container, and without this the text sat against the left edge of the
      viewport with the button ~350px to the right of everything else on the page.

      Done with padding rather than a `max-w-[1200px] mx-auto` wrapper because the
      background must keep spanning the full width — constraining this element would
      shrink the purple bar itself. `calc(50% - 600px + 20px)` is the navbar's own
      geometry written out: half the viewport, minus half of the 1200px container,
      plus that container's own `px-5`.

      `2xl:` only. Below 1536px the existing `px-4 sm:px-7` is unchanged, so every
      narrower width — including the 375px overflow fix below — renders as before.

      CENTRING THE MESSAGE, from `sm:` up, is a THREE-COLUMN GRID `[1fr_auto_1fr]`
      rather than a centred paragraph with an absolutely-positioned pill. Two reasons.
      Taking the pill out of flow would let the message run underneath it — grid tracks
      cannot overlap, so the two can never collide however long the message gets. And an
      absolute pill would have to restate this element's padding at all three breakpoints
      to sit on the right edge, including the `calc()` above; as a grid item it simply
      ends at the content edge, and the `2xl:` geometry keeps working untouched.

      Because the outer tracks are an equal `1fr` and the gaps between them are equal, the
      middle track lands on the bar's centre line — centred against the WHOLE bar, not
      against the space left over beside the pill. The first track holds nothing; the two
      children name their columns explicitly, so no spacer element is needed.

      Below `sm` this stays the original flex row: `grid` only takes over at the same
      breakpoint that gives the pill its full "Apliko tani" label, so the 375px layout —
      message left, short "Apliko" pill right — is byte for byte what it was.
    */
    <div
      className="w-full flex items-center justify-between gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr] px-4 sm:px-7 2xl:px-[calc(50%_-_600px_+_20px)] relative overflow-hidden"
      style={{ backgroundColor: C.brand, height: 40 }}
    >
      {/*
        A real flex row rather than centred text with an absolutely-positioned button,
        because the button used to be `hidden md:flex` and a phone got nothing to tap.

        `min-w-0` is what actually makes `truncate` work here. A flex item defaults to
        `min-width: auto`, which refuses to shrink below its own text, so without this the
        paragraph keeps its full width and pushes the button off the end of the bar. The
        message gives up characters; the call to action never gives up space.
      */}
      <p className="text-white text-xs sm:text-sm font-medium truncate min-w-0 sm:col-start-2 sm:text-center">
        Regjistrohu me <span className="font-bold">20%</span> zbritje
      </p>
      {/* A button, not a Link: it opens the popup instead of navigating — the same
          `onApplyClick` the navbar's "Apliko tani" and the hero button already use. */}
      <button
        type="button"
        onClick={onApplyClick}
        aria-label="Apliko tani"
        /*
          `whitespace-nowrap` is load-bearing. The label sits in a fixed 30px-tall pill,
          so if it is ever allowed to wrap — which it will on a device whose fallback font
          is wider than ours before the webfont loads — the second line spills out of the
          pill and reads as a cut-off button. This pins it to one line always.

          The bar is 40px tall, so the pill itself cannot BE 44px. The hit area is widened
          with an ::after overlay instead (30 + 2x9 = 48px). The inset is VERTICAL ONLY:
          an -inset-x would push 8px of invisible box past the pill on each side, which at
          the right edge of the screen counts as horizontal overflow for no benefit — the
          pill is already ~100px wide, far past the 44px minimum.
        */
        className="relative shrink-0 flex items-center gap-1 whitespace-nowrap text-white text-xs font-medium px-3 rounded-full transition-all hover:bg-white/20 after:absolute after:content-[''] after:-inset-y-[9px] sm:col-start-3 sm:justify-self-end"
        style={{ border: "1px solid rgba(255,255,255,0.5)", height: 30, minHeight: 30 }}
      >
        {/* Short label on the narrowest screens so the pill can never be squeezed at
            375px; the full wording returns from `sm` up. */}
        <span className="sm:hidden">Apliko</span>
        <span className="hidden sm:inline">Apliko tani</span>
        <ArrowRight size={12} className="shrink-0" />
      </button>
    </div>
  );
}
