/**
 * The Cacttus Education wordmark.
 *
 * Two files ship: the black lockup for light surfaces (login card, print, light
 * headers) and the white one for the dark sidebar. Which one to use is a property of
 * the BACKGROUND, so it is a required prop — there is no default that silently renders
 * black-on-black the first time someone drops this into a dark panel.
 *
 * SVG, NOT PNG. Both marks are true vector, converted from the supplied vector master
 * (`Logo Cacttus Education Vector.ps`, actually a PDF 1.6 carrying real outlined
 * paths — no fonts, no embedded rasters). The wordmark is small on screen: the
 * "Education" line is only ~16.8% of the lockup height, so at any realistic header
 * size it lands under ~10px and a raster source visibly mushes it. Vector keeps it
 * sharp at every size, zoom level and DPR.
 *
 * ASPECT RATIO IS NON-NEGOTIABLE. The intrinsic `width`/`height` below are the
 * viewBox dimensions (710.096 x 199.759, ~3.555:1) and only the height is ever
 * constrained by CSS (`w-auto`), so the browser reserves the correct box before load
 * — no layout shift — and the mark can never be stretched.
 */
import { cn } from '@/lib/utils';

// Matches viewBox="25.253 184.258 710.096 199.759" in both files. Rounded: the
// browser only uses these for the intrinsic ratio, and 710/200 is the same 3.55:1.
const INTRINSIC_WIDTH = 710;
const INTRINSIC_HEIGHT = 200;

const SOURCES = {
  light: '/brand/education-black.svg',
  dark: '/brand/education-white.svg',
} as const;

type BrandLogoProps = {
  /** `dark` = dark background, so the WHITE lockup. `light` = the black one. */
  readonly on: keyof typeof SOURCES;
  /** Tailwind height utility. Width always follows from the locked ratio. */
  readonly className?: string;
};

export function BrandLogo({ on, className }: BrandLogoProps): JSX.Element {
  return (
    <img
      src={SOURCES[on]}
      width={INTRINSIC_WIDTH}
      height={INTRINSIC_HEIGHT}
      alt="Cacttus Education"
      // Eager + high priority: this is the LCP element on the login screen.
      loading="eager"
      decoding="async"
      className={cn('h-8 w-auto select-none', className)}
    />
  );
}
