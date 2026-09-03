import { usePageMeta } from "../hooks/usePageMeta";
import { Award, BookOpen, Briefcase, Users } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { C } from "../theme";
import { PageWrapper } from "../ui/PageWrapper";
import { GhostBtn, PrimaryBtn } from "../ui/buttons";

import bizneseHero from "../../imports/perbiznese.png";




/* ══════════════════════════════════════════
   PËR BIZNESE HUB — unchanged
══════════════════════════════════════════ */

/*
  ── HERO IMAGE NUDGE — TUNE THESE TWO NUMBERS ──

  `y` moves the artwork DOWN as it grows and UP as it shrinks; `x` moves it RIGHT as it
  grows and LEFT as it shrinks. Negative values are fine ("-20px"). The two current
  values are exactly what was hardcoded on the <img> before this constant existed, so
  lifting them here changed nothing on screen.

  WHY NOT `objectPosition`, the knob /programim, /siguria and Bursa use:
  that one only does something when a frame CROPS a photo — it picks which slice of an
  oversized image survives inside a fixed box. Those heroes are `w-full h-full
  object-cover` inside such a box, so they have a crop to aim. THIS hero is a
  transparent cutout of four people, sized `w-auto` against a max height: the box is
  the artwork's own 1:1 shape, nothing is cropped, and `object-fit` is left at its
  `fill` default. Setting `objectPosition` here is inert — the browser reports
  `50% 50%` on this element today and moving it changes not one pixel. Offsetting the
  whole element is the only thing that can move this image, which is why the original
  markup reached for `translate-*` and not `object-*`.

  It is a {x, y} pair rather than an `object-position`-style string on purpose: the two
  are not interchangeable, and a name like BIZNESE_HERO_IMG_POSITION would invite
  someone to write "center 50%" in here, which is not a length and would silently do
  nothing.

  Applied through the standalone CSS `translate` property, which is what the Tailwind v4
  `translate-*` utilities this replaces compile to — NOT `transform`. Both exist
  independently, so a `transform` set elsewhere on this element would still compose
  rather than fight with this.
*/
export const BIZNESE_HERO_IMG_OFFSET = { x: "95px", y: "-65px" };


/*
  ── HERO IMAGE SIZE — TUNE THIS ONE NUMBER ──

  The artwork is square (500x500 source), so this height sets the width to match and the
  figures scale as one. Raise it to grow them, lower it to shrink them.

  Set as an inline style rather than Tailwind's `max-h-[...]`: Tailwind scans the SOURCE
  for complete class names, so a value built from a constant would never make it into the
  stylesheet. The same reason `imgPosition` elsewhere in this file is a style and not an
  `object-[...]` class.

  TWO THINGS MOVE WHEN THIS GROWS, both intentional:

  1. The column beside the text is a fixed 480px track (`lg:grid-cols-[1fr_480px]`).
     Past 480 the square image is WIDER than its track and spills evenly on both sides.
     That is fine and is what the reference shows — the 40px grid gap plus the page margin
     absorb it, and BIZNESE_HERO_IMG_OFFSET.x nudges it clear of the text. Do not widen
     the track to "fix" this: that would re-flow the text column.

  2. The row is as tall as its tallest child, and this image has been the taller one since
     it passed ~300px. So raising this raises the hero band with it. There is no way to
     enlarge the artwork in place without that — the section has no fixed height to grow
     into.
*/
/* The `min()` is a GUARD, not decoration. Tune the 560px; leave the 38vw alone.

   Past the 480px track this image spills to both sides, and the right-hand spill has
   nothing to spill INTO once the 1200px container stops centring — measured, a flat
   560px put the right edge 30px beyond a 1024px viewport and 30px beyond a 1280px one,
   which is a horizontal scrollbar on the whole page. 38vw makes the artwork step down on
   those widths instead of overflowing, and is slack enough that anything >=1500px gets
   the full 560. Raise 560 as far as you like; the guard keeps narrow screens honest. */
export const BIZNESE_HERO_IMG_HEIGHT = "min(500px, 35vw)";


/*
  ── HERO IMAGE SCALE — TUNE THIS ONE NUMBER ──

  1 = the size the layout reserves (BIZNESE_HERO_IMG_HEIGHT above). Anything higher blows
  the artwork up past that WITHOUT the page noticing: `transform` is painted after layout
  is already decided, so the row, the section, the text column and the button all keep the
  exact geometry they had at scale 1. That is the whole reason this is a transform and not
  a bigger height — height feeds back into the row and drags the section taller with it,
  which is what happened the last two times.

  1.45 renders the ~500px box at roughly 725px on screen.

  The trade is that the overflow has to go somewhere, and `overflow-x: clip` on the section
  is where. Raise this far enough and the figures start losing their sides and their feet
  at the section's edges. If you want them BIGGER AND WHOLE, that is the other knob:
  raise BIZNESE_HERO_IMG_HEIGHT instead and accept a taller hero band.

  `transformOrigin: "center top"` anchors the growth at the top edge, so the heads stay put
  and the extra height goes downward, out through the bottom of the band. Growing from the
  centre instead sent 100+px up behind the navbar and decapitated them.
*/
export const BIZNESE_HERO_IMG_SCALE = 1.30;


export function PageBiznese() {
  usePageMeta(
    "Për biznese — Cacttus Education",
    "Cacttus Education mbështet bizneset në zhvillimin e kapaciteteve profesionale: trajnime të personalizuara, qasje në rrjetin e studentëve dhe të diplomuarve.",
  );
  const navigate = useNavigate();
  const BUSINESS_OFFERINGS = [
    { title: "Trajnime të personalizuara", desc: "Investoni në aftësitë, zhvillimin dhe të ardhmen e ekipit tuaj!", icon: Briefcase, path: "/biznese/trajnime" },
    { title: "Rrjeti i talentëve", desc: "Akses në portfoliot dhe CV e studentëve", icon: Users, path: "/biznese/talente" },
    { title: "Bursa e Impaktit", desc: "Bëhu Sponsor i Bursave të impaktit", icon: Award, path: "/biznese/bursa" },
    { title: "Klasët me qera", desc: "Klasat moderne të pajisura për qira", icon: BookOpen, path: "/biznese/klasa" },
  ];
  return (
    <PageWrapper>
      {/*
        `py-12 md:py-16`, down from `py-16 md:py-24`. That is 32px off each end — the
        smaller half of the height problem; see the note on the illustration for the
        larger half.
      */}
      {/*
        `overflow-x: clip` is what lets BIZNESE_HERO_IMG_SCALE exist. The scaled artwork is
        wider than its 480px track and, on a 1280px screen, wider than the viewport — which
        without this is a horizontal scrollbar on the whole page.

        `clip` rather than `hidden` on purpose: `hidden` turns the section into a scroll
        container, which would also force `overflow-y` to `auto` and break `position:
        sticky` for anything inside. `clip` just clips.

        BOTH axes. Clipping only X let the scaled figures run 225px out of the bottom of
        the band and sit on top of the cards in the next section — measured, their visual
        box ended at 958 while the section ended at 733. Clipping Y crops them cleanly at
        the band's own edge instead, which is why the growth is anchored at the TOP: the
        crop lands on legs, never on faces.
      */}
      <section className="py-12 md:py-16" style={{ backgroundColor: C.brandSoft, overflow: "clip" }}>
        <div className="max-w-[1200px] mx-auto px-5">
          {/*
            `items-center`, NOT `items-end`.

            This row was briefly bottom-aligned, to stand the figures on the same line as
            the "Na kontakto" button. It did that — but bottom-aligning a row aligns BOTH
            columns, and the text is far shorter than the illustration (~186px against
            380px). So the text got shoved ~194px down the row and the title ended up
            sitting well below where it had always been, with an unexplained gap under the
            navbar. The alignment was doing something nobody asked for to the column that
            was already correct.

            Centring balances the two against each other instead: the text sits level with
            the middle of the illustration, and neither column is dragged to the other's
            extreme.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: C.n900, letterSpacing: "-0.01em" }}>Për biznese</h1>
              <p className="text-lg mb-5" style={{ color: C.muted }}>Cacttus Education mbështet bizneset dhe organizatat në zhvillimin e kapaciteteve profesionale dhe përmbushjen e nevojave të tyre për talente të kualifikuara. Ofrojmë trajnime të personalizuara për avancimin e stafit, qasje në rrjetin e studentëve dhe të diplomuarve tanë, mundësi për financimin e bursave me impakt, si dhe klasa moderne me qira për trajnime, takime dhe aktivitete profesionale.</p>
              <Link to="/kontakti"><PrimaryBtn>Na kontakto</PrimaryBtn></Link>
            </div>

            {/*
              A free-standing cutout: no wrapper background, no border, no rounding. The
              SVG already carries its own transparency, and anything behind it would turn
              a cutout into a framed picture.

              Sized by HEIGHT, not width — see BIZNESE_HERO_IMG_HEIGHT above, which
              is the one number to tune. Height drives it because the artwork is square
              while the space beside the text is landscape: pinning the width would leave
              the figures small in a wide track.

              THE HEIGHT FIX: the source had 28.7% of its canvas as empty transparent
              space above the figures' heads (measured: content began at y=387 of 1350).
              An `<img>` is sized by its canvas, not by what is drawn on it, so the box was
              ~120px taller than anything visible — and because the row is bottom-aligned,
              that invisible band sat between the navbar and the title and read as a gap
              nobody could account for. The asset in `imports/` is now cropped to the
              figures' own bounding box, so its height and what you can see are the same
              number. The figures themselves are untouched.

              `hidden lg:flex`: below the two-column breakpoint this would stack under the
              button and shove the cards off screen, and it is decoration — hence the empty
              `alt` and `aria-hidden`, so a screen reader skips it rather than announcing
              a filename.
            */}
            <div className="hidden lg:flex justify-center">
              <img
                src={bizneseHero}
                alt=""
                aria-hidden="true"
                className="w-auto select-none pointer-events-none"
                style={{
                  height: BIZNESE_HERO_IMG_HEIGHT,
                  /* Tailwind's preflight sets `img { max-width: 100% }`, which pinned this
                     to its 480px track and silently capped the height constant above at
                     480 no matter what it said. Released HERE, on the image, so the track
                     itself is untouched. */
                  maxWidth: "none",
                  translate: `${BIZNESE_HERO_IMG_OFFSET.x} ${BIZNESE_HERO_IMG_OFFSET.y}`,
                  /* `translate` and `transform` are SEPARATE CSS properties, not two names
                     for one thing — so the offset above and this scale compose instead of
                     overwriting each other, and either can be tuned without touching the
                     other. */
                  transform: `scale(${BIZNESE_HERO_IMG_SCALE})`,
                  transformOrigin: "center top",
                }}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="py-20" style={{ backgroundColor: C.n0 }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BUSINESS_OFFERINGS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="p-8 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" style={{ border: `1px solid ${C.n200}` }} onClick={() => navigate(b.path)}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: C.brandLight }}>
                    <Icon size={26} style={{ color: C.brand }} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2" style={{ color: C.n900 }}>{b.title}</h4>
                  <p className="text-sm mb-4" style={{ color: C.muted }}>{b.desc}</p>
                  <GhostBtn>Mëso më shumë</GhostBtn>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Partner logos, directly above the closing CTA — the same placement the other
          /biznese pages use, so the section order reads the same across the group. */}
      
    </PageWrapper>
  );
}
