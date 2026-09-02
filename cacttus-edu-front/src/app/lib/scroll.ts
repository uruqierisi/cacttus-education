
/*
  Anchors for the two in-page "scroll down to…" buttons. Declared as constants because
  each id is written twice — once on the section, once on the button that jumps to it —
  and a typo in either half fails silently as a button that does nothing.
*/
export const BALLINA_PROGRAMS_ID = "programet";

export const TALENTE_LIST_ID = "talentet";


/*
  Smooth in-page scroll.

  `scrollIntoView` rather than a hand-rolled `requestAnimationFrame` easing loop, which is
  what this briefly was. The rAF version was written after the native call appeared to be
  a no-op in testing — but the real cause was that the test tab was BACKGROUNDED, and
  Chrome suspends animation frames in a hidden tab. That kills a rAF loop exactly as dead
  as it kills the native animation, so the extra 25 lines bought nothing. In a tab the
  user is actually looking at, this animates.

  It also gets two things free that the hand-rolled version had to spell out: it honours
  `prefers-reduced-motion` on its own, and it recomputes the distance if an image above
  the target finishes loading and shifts the page mid-scroll.

  The sticky navbar would otherwise cover the top of whatever we land on. That offset
  comes from the target's own `scroll-mt-28`, the CSS property built for this, so the
  number lives with the element rather than being guessed here.

  A missing id is a no-op by design — a dead button beats a crash.
*/
export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
