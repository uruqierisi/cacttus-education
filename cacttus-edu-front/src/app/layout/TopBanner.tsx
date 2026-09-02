import { ArrowRight } from "lucide-react";
import { C } from "../theme";


/* ══════════════════════════════════════════
   PART 1 — GLOBAL: BANNER + NAVBAR
══════════════════════════════════════════ */

/* 1.1 — TOP BANNER: deep brand purple #823685 */
export function TopBanner({ onApplyClick }: { onApplyClick: () => void }) {
  return (
    <div
      className="w-full flex items-center justify-between gap-2 px-4 sm:px-7 relative overflow-hidden"
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
      <p className="text-white text-xs sm:text-sm font-medium truncate min-w-0">
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
        className="relative shrink-0 flex items-center gap-1 whitespace-nowrap text-white text-xs font-medium px-3 rounded-full transition-all hover:bg-white/20 after:absolute after:content-[''] after:-inset-y-[9px]"
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
