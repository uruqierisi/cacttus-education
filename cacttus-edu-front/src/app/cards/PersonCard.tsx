import { Users } from "lucide-react";
import { C } from "../theme";
import { MetaChip } from "../ui/MetaChip";


/* ── PERSON CARD ── */
export function PersonCard({
  person,
  nameOnly = false,
  imgPosition = "center 50%",
}: {
  person: { name: string; role: string; city: string; imgUrl?: string };
  /**
   * Photo + name only: no role line, no city pill, no LinkedIn button, and a slightly
   * shorter portrait so the card does not carry the whitespace those three used to fill.
   *
   * A flag rather than a second component, and OFF by default, because this card is
   * shared: /ekipi opts in, /ligjërueit does not and keeps its role and city exactly as
   * they are. Editing the markup directly would have silently stripped that page too.
   */
  nameOnly?: boolean;
  /**
   * Which slice of the portrait survives the crop. Second number is vertical — raise it to
   * push the image DOWN. Worth reaching for here more than anywhere else on the site: this
   * frame is a tall 4:5 (or 6:7) and headroom varies wildly between photos, so a face that
   * sits high in one shot and low in another cannot both be right at the default centre.
   */
  imgPosition?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group" style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}>
      <div className={`${nameOnly ? "aspect-[6/7]" : "aspect-[4/5]"} overflow-hidden`} style={{ backgroundColor: C.n100 }}>
        {person.imgUrl ? <img src={person.imgUrl} alt={person.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: imgPosition }} /> : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: C.brandSoft }}><Users size={36} style={{ color: C.p300 }} /></div>}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-sm" style={{ color: C.n900 }}>{person.name}</h4>
        {/*
          Not rendered at all when `nameOnly` — not hidden with CSS. A `display: none`
          role would still be in the DOM for a screen reader to read out and for a
          "find on page" to match, which is not "removed", it is just invisible.
        */}
        {!nameOnly && (
          <>
            <p className="text-xs mt-0.5 mb-3" style={{ color: C.n500 }}>{person.role}</p>
            {/* The LinkedIn button that used to sit opposite the city chip is gone: it had
                no href and no onClick on any card, so it was a control that looked
                interactive and did nothing. The chip now owns the row on its own. */}
            <div className="flex items-center">
              <MetaChip>{person.city}</MetaChip>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
