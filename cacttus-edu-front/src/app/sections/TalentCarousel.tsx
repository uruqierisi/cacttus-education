import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TalentCard } from "../cards/TalentCard";
import type { TalentPerson } from "../data/talents";
import { C } from "../theme";


/*
  The carousel. ONE card visible, arrows on desktop, swipe on touch.

  Built on native scroll-snap rather than a transform slider or a library: the track is a
  real horizontally scrollable element, so a phone's own inertial swipe, a trackpad's
  two-finger flick and a screen reader's focus order all work for free. The arrows just
  scroll it. A transform-based slider would have to reimplement every one of those.

  `index` is derived FROM the scroll position rather than being the thing that drives it,
  which is what keeps the counter honest when the user swipes instead of clicking: the
  arrows call `scrollTo`, the scroll handler reports where the track actually landed.

  Resetting on `people` is what makes switching category feel right — pick a new category
  while on the 6th card and the carousel starts at the first person again, not on an
  index that may not exist in the new, shorter list.
*/
export function TalentCarousel({ people }: { people: readonly TalentPerson[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const track = trackRef.current;
    if (!track) return;
    /* Jump, do not glide: this is a category switch, not a step through a list, and
       animating back to the start reads as a glitch. The track carries CSS
       `scroll-behavior: smooth`, so it is suspended for this one assignment and restored
       immediately after. */
    track.style.scrollBehavior = "auto";
    track.scrollLeft = 0;
    track.style.scrollBehavior = "";
  }, [people]);

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(target, people.length - 1));
    /*
      Assigning `scrollLeft` and letting CSS `scroll-behavior: smooth` animate it —
      NOT `scrollTo({ behavior: "smooth" })`.

      Measured: with `scroll-snap-type: x mandatory` on this track, Chrome cancels a
      programmatic smooth animation and re-snaps to where it started, so the arrows moved
      the counter while the track never left scrollLeft 0. The direct assignment is not
      cancelled, and the CSS property still animates it.
    */
    track.scrollLeft = clamped * track.clientWidth;
    setIndex(clamped);
  };

  /* Rounding to the nearest slide rather than flooring: mid-swipe the track sits between
     two cards, and flooring would report the previous one until the very last pixel. */
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const atStart = index <= 0;
  const atEnd = index >= people.length - 1;

  const arrowStyle = (disabled: boolean) => ({
    border: `1px solid ${disabled ? C.n200 : C.brand}`,
    color: disabled ? C.n400 : C.brand,
    backgroundColor: C.n0,
    cursor: disabled ? "default" : "pointer",
  });

  return (
    /*
      A contained panel behind the whole carousel. The card used to float on bare white
      with nothing framing it, which is what made it read as unfinished.

      The radial gradient is anchored at the TOP CENTRE, directly behind the card's head,
      so the tint is strongest where the photo and name are and washes out to white at the
      edges. A flat tinted rectangle would just look like a grey box; a gradient that
      follows the content gives the card something to sit in.
    */
    <div
      className="rounded-3xl p-5 sm:p-6"
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${C.brandLight} 0%, ${C.brandSoft} 42%, ${C.n0} 100%)`,
        border: `1px solid ${C.p100}`,
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={atStart}
          aria-label="Talenti i mëparshëm"
          className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center shrink-0 transition-colors"
          style={arrowStyle(atStart)}
        >
          <ChevronLeft size={18} />
        </button>

        {/*
          `overflow-x-auto` + `snap-x snap-mandatory` is the carousel itself.
          `scrollbar-width: none` (and the WebKit pseudo-element, which Tailwind cannot
          express, hence the <style> once at the page level) hides the bar without
          disabling the scrolling that makes swipe work.
        */}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          /* `py-1` is enough now that the card casts nothing — it only keeps the border
             off the scroll container's own edge. Horizontal padding is still deliberately
             NOT added: `clientWidth` includes padding, and the arrows scroll by exactly one
             `clientWidth` per slide, so a left/right pad would drift the carousel further
             out of alignment with every step. */
          className="talent-track flex-1 min-w-0 flex overflow-x-auto snap-x snap-mandatory py-1"
          style={{ scrollbarWidth: "none", scrollBehavior: "smooth" }}
        >
          {people.map((person) => (
            /* `w-full shrink-0` is what makes exactly one card fill the viewport of the
               track; `snap-center` is what makes a swipe settle on a card, never between
               two. `p-1` leaves the card's own shadow room to render instead of being
               clipped by the scroll container's edge. */
            <div key={person.name} className="w-full shrink-0 snap-center p-1">
              <TalentCard person={person} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={atEnd}
          aria-label="Talenti i radhës"
          className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center shrink-0 transition-colors"
          style={arrowStyle(atEnd)}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Position readout, promoted from loose grey text to a pill that matches the card's
          own surface — white, hairline purple border, the same soft contact shadow. The
          CURRENT number carries brand colour and weight while the total stays muted, so
          the pair reads as "where you are, out of how many" at a glance. */}
      {people.length > 1 && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <span
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold tabular-nums"
            style={{
              backgroundColor: C.n0,
              border: `1px solid ${C.p200}`,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: C.brand }}>{index + 1}</span>
            <span style={{ color: C.n400 }}> / {people.length}</span>
          </span>
          {/* Touch only: on desktop the arrows already say this. */}
          <span className="sm:hidden text-xs" style={{ color: C.n500 }}>rrëshqit për të parë më shumë</span>
        </div>
      )}
    </div>
  );
}
