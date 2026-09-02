import React from "react";


/* ─── FOOTER ─── */
/* ── FOOTER ──
   Four columns: identity, contact, navigation, social + CTA.

   Rendered ONCE from `Layout`, not from `PageWrapper`. It used to hang off PageWrapper
   behind a `withFooter` prop, and `ProgramPage` passed `withFooter={false}` — which is
   how /programim and /siguria ended up with no footer at all. A footer is chrome, same as
   the navbar, so it belongs with the navbar in the shell where no page can opt out. */

/**
 * TikTok, drawn here rather than imported.
 *
 * lucide-react (0.487) has no TikTok icon at all — its brand glyphs are legacy, already
 * flagged deprecated, and no new ones are being added. So this is an inline SVG built to
 * lucide's own conventions: a 24×24 viewBox, `fill="none"`, and a `currentColor` stroke at
 * width 2 with round caps and joins.
 *
 * Stroke rather than fill is the load-bearing detail. The usual TikTok mark is a solid
 * shape, and a solid glyph sitting beside four outline ones reads as heavier and darker
 * even when the colour value is character-for-character identical. Matching the drawing
 * style is what makes it match the colour.
 *
 * Because it inherits `currentColor` exactly as a lucide icon does, the `style={{ color }}`
 * already on the row applies to it unchanged — no per-icon colour anywhere.
 */
export function TikTokIcon({ size = 24, ...rest }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}
