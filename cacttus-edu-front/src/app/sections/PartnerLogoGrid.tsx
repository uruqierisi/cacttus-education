import { HERO_PARTNERS } from "../data/hero-partners";
import { C } from "../theme";


export function PartnerLogoGrid() {
  return (
    /*
      Three across on anything but a phone, so six logos land as two clean rows. The
      column track this sits in is a fixed 520px, so dropping from four columns to three
      is what makes each card bigger — the freed width is divided among fewer cards
      rather than left as empty gap. Two across below `sm`, where three would leave each
      card too narrow for a wordmark.
    */
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {HERO_PARTNERS.map(({ name, src }) => (
        <div
          key={name}
          /*
            White cards on the hero's own `brandSoft`, not on the reference's dark purple
            panel: dropping a saturated block into this hero would fight the section it
            sits in. Same white-card-on-tinted-background pairing the rest of the site
            uses, so the grid reads as part of the page rather than pasted onto it.

            Logos sit at full colour and opacity, and hover is a scale-up and nothing
            else — no lift, no shadow — matching the marquee cards elsewhere on the site.
          */
          className="aspect-[3/2] rounded-xl flex items-center justify-center p-3 transition-transform duration-200 hover:scale-105"
          style={{ backgroundColor: C.n0, border: `1px solid ${C.cardBorder}` }}
        >
          {src ? (
            <img src={src} alt={name} loading="lazy" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs font-semibold text-center leading-tight" style={{ color: C.n400 }}>
              {name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
