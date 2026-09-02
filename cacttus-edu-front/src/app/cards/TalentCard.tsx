import { Users } from "lucide-react";
import type { TalentPerson } from "../data/talents";
import { C } from "../theme";


/*
  One person's card. Same frame as the sample card it replaces — same padding, radius,
  shadow, border, the same 64px circle and the same divider under the header.

  What is GONE, deleted rather than hidden: the five-star row with "4.9", the tech tag
  pills, and the small outlined "CV" button. Their space is not left empty — the header's
  own `pb-5` and the divider now carry the rhythm, and the purple button spans the full
  width the two buttons used to share. Three elements out, nothing floating.

  `h-full` matters inside the carousel: every card sits in the same flex row, so the row is
  as tall as the tallest of them and each card stretches to match. Without it, moving from
  a one-line role to a three-line one would change the card's height mid-slide.
*/
/*
  ─── Talent card: NO shadow, by decision ───

  Two shadow attempts were rejected on this card — Tailwind's `shadow-2xl` (one hard
  offset, reads as a dark smear) and a layered purple-tinted elevation (too heavy against
  the tinted panel it sits on). The card now casts nothing at all.

  What separates it from the panel instead is cheaper and cleaner, and is what most
  restrained "premium" UI actually leans on:

    · a real 1px border in a brand tint, not a grey hairline
    · white card on a tinted panel — the contrast IS the separation
    · generous internal padding, so the content is not crowding its own edges
    · one 3px brand accent along the top edge

  Nothing here should reintroduce `boxShadow` on the card surface. The only shadow left
  anywhere in this component is the white/lilac RING around the avatar, which is a
  spread-only ring drawn with box-shadow — a border substitute, not an elevation effect.
*/
export const TALENT_AVATAR_RING = (ringInner: string, ringOuter: string) =>
  `0 0 0 3px ${ringInner}, 0 0 0 4px ${ringOuter}`;


export function TalentCard({ person }: { person: TalentPerson }) {
  return (
    <div
      className="h-full rounded-[20px] overflow-hidden flex flex-col"
      style={{
        /* Flat white now, not a wash. With no shadow the border is doing all the
           separating, and a gradient that fades toward the panel's own tint softened the
           bottom edge exactly where that border needs to read hardest. */
        backgroundColor: C.n0,
        /* `p200` rather than the near-invisible `p100`: this line IS the card's edge now,
           so it has to be visible on its own. Still a brand tint, never grey. */
        border: `1px solid ${C.p200}`,
      }}
    >
      {/* Brand accent, 3px, full bleed across the top. The card's one piece of saturated
          colour besides the button — enough to tie it to #823685 without competing with
          the photo. `overflow-hidden` on the parent is what keeps its ends rounded. */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${C.brand} 0%, ${C.p400} 55%, ${C.p300} 100%)` }} />

      {/* p-8, up from p-7: with no shadow the padding is doing more of the work of making
          the card feel considered rather than cramped. */}
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-center gap-4">
          {/*
            72px, up from 64. The photo is the first thing read on this card and at 64 it
            was the same weight as the text beside it.

            The double ring is drawn with `box-shadow`, not `border`: a border would eat
            into the 72px box and shrink the face inside it, while spread-only shadows are
            painted outside the element and leave the image untouched. White ring first,
            then the pale purple, so the photo is separated from the tint behind it.
          */}
          <div
            className="w-[72px] h-[72px] rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              backgroundColor: C.n100,
              /* Ring only — the drop-shadow that used to trail this is gone with the rest. */
              boxShadow: TALENT_AVATAR_RING(C.n0, C.p200),
            }}
          >
            {person.photo ? (
              <img src={person.photo} alt="" className="w-full h-full object-cover" style={{ objectPosition: person.imgPosition }} />
            ) : (
              /* Same placeholder the instructor cards use when a portrait is missing. */
              <Users size={26} style={{ color: C.p300 }} />
            )}
          </div>
          <div className="min-w-0">
            {/* Bigger and heavier than the role beneath it — the two used to be a
                half-step apart, which read as one block of text rather than a name with a
                caption. Negative tracking is what the rest of the site's headings use. */}
            <p className="text-lg font-bold leading-tight" style={{ color: C.n900, letterSpacing: "-0.01em" }}>{person.name}</p>
            <p className="text-sm mt-1.5 leading-snug" style={{ color: C.muted }}>{person.role}</p>
          </div>
        </div>

        {/* A hairline that FADES rather than a flat 1px rule running wall to wall. Drawn as
            a 1px element with a gradient background, since a border cannot fade. */}
        <div className="h-px my-6" style={{ background: `linear-gradient(90deg, ${C.p200} 0%, ${C.p100} 45%, transparent 100%)` }} />

        {/* `mt-auto` pins the button to the bottom, so a short card and a tall one in the
            same carousel line their buttons up instead of floating them mid-card. */}
        <div className="mt-auto">
          {/*
            An <a> when there is a CV, a bare <button> when there is not — same markup and
            styling either way, so the card looks identical in both states.

            An anchor rather than `onClick={() => window.open(...)}` because opening a
            document IS navigation: middle-click, ctrl-click, "open in new tab" and "copy
            link address" all work on a real href and all silently do nothing on a button.
            The same choice, for the same reason, as the "Shkarko planprogramin" links.

            `rel="noopener noreferrer"` goes with every `target="_blank"`: without
            `noopener` the opened tab gets a `window.opener` handle back into this one and
            can navigate it somewhere else.

            `block text-center` on the <a> reproduces what the <button> gave for free —
            an anchor is inline by default and would otherwise shrink to its text.
          */}
          {person.cvUrl ? (
            <a
              href={person.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 rounded-[14px] text-sm font-semibold text-white transition-colors active:scale-[0.98]"
              style={{ backgroundColor: C.brand, letterSpacing: "0.01em" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.brandDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.brand; }}
            >
              Shkarko CV
            </a>
          ) : (
            <button
              className="w-full py-3 rounded-[14px] text-sm font-semibold text-white transition-colors active:scale-[0.98]"
              style={{
                /* Flat brand fill and no glow, to match the shadow-free card. Depth here
                   comes from the colour darkening on hover — the same move PrimaryBtn
                   makes everywhere else on the site — rather than from a cast shadow. */
                backgroundColor: C.brand,
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.brandDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.brand; }}
            >
              Shkarko CV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
