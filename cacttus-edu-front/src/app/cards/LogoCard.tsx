import type { MarqueeLogo } from "../data/partner-logos";
import { C } from "../theme";


export function LogoCard({ logo }: { logo: MarqueeLogo }) {
  const name = typeof logo === "string" ? logo : logo.name;
  const src = typeof logo === "string" ? null : logo.src;

  return (
    /*
      Logos sit at their own colour and opacity at rest — no grayscale, no dimming. The
      partners are the point of the section, so there is nothing to gain by hiding them
      until the pointer happens to land on one, and on touch there is no hover at all.

      Hover is a scale-up and nothing else: no lift, no shadow. `transition-transform`
      rather than `transition-all` so only the scale animates.
    */
    <div
      className="shrink-0 flex items-center justify-center rounded-xl transition-transform duration-200 hover:scale-105 cursor-default"
      style={{ width: 180, height: 90, border: `1px solid #EEE8EF`, backgroundColor: C.n0 }}
    >
      {src ? (
        /* `contain` inside a padded box: logos differ in aspect from 1:1 to 5:1, and this
           is what keeps the tall ones and the wide ones optically the same weight. */
        <img src={src} alt={name} loading="lazy" className="max-w-full max-h-full object-contain p-4" />
      ) : (
        <span className="text-xs font-semibold tracking-wide" style={{ color: C.n600 }}>{name}</span>
      )}
    </div>
  );
}
