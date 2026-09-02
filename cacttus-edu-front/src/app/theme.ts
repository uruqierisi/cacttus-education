
/* ─── BRAND COLORS ─── */
export const C = {
  /* primary brand purples (brief spec) */
  brand: "#823685",
  brandDark: "#6A2A6D",
  brandLight: "#F4EAF5",
  brandSoft: "#FAF6FB",
  secondary: "#91478d",

  /* palette kept from original */
  p50: "#F9F4FB",
  p100: "#F2E9F7",
  p200: "#E4CFEC",
  p300: "#D1AEE0",
  p400: "#AF73C9",
  p500: "#823685",
  p600: "#6A2A6D",
  p700: "#5D2C72",
  p800: "#452154",
  p900: "#2D1637",

  /* neutrals */
  n0: "#FFFFFF",
  n50: "#FAFAFB",
  n100: "#F4F4F6",
  n200: "#E6E6EA",
  n300: "#D2D2D9",
  n400: "#9E9EA9",
  n500: "#71717D",
  n600: "#52525C",
  n700: "#3F3F46",
  n800: "#27272C",
  n900: "#1A1A1A",

  /* semantic */
  cardBorder: "#E9DCEA",
  muted: "#5A5A5A",
  success: "#1E9E6A",
  /* Inline validation messages and error borders on light surfaces. */
  danger: "#D33A3A",
};


/* ─── GLOBAL STYLES ─── */
export const globalStyle = `
  @keyframes marquee-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marquee-right {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  .marquee-left { animation: marquee-left 40s linear infinite; }
  .marquee-right { animation: marquee-right 40s linear infinite; }
  .marquee-wrap:hover .marquee-left,
  .marquee-wrap:hover .marquee-right { animation-play-state: paused; }

  /*
    Navbar hover underline.

    A ::after bar that is always in the DOM and always the full width of the label, but
    squashed to nothing along its left edge until hover. Animating \`transform\` is what
    makes it cheap: scale runs on the compositor, so the bar never forces the browser to
    re-measure the navbar. Animating \`width\` instead would relayout on every frame.

    Because the element merely un-squashes, it animates back out on the way off — the
    reverse of the same transition, not a disappearance.

    Insets match the link's own \`px-3\` (12px) so the bar tracks the text and does not
    run out under the padding. \`bottom\` sits it inside the \`py-2\`, under the label.
  */
  .nav-underline { position: relative; }
  .nav-underline::after {
    content: "";
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 4px;
    height: 2px;
    border-radius: 1px;
    background-color: #823685;
    transform: scaleX(0);
    transform-origin: left center;
    /*
      DURATION — this is the number to change if the sweep feels off. Higher is slower.
      Rough feel: 200ms reads as instant, 400ms as deliberate, 600ms+ starts to lag
      behind the pointer and feels unresponsive.

      TIMING — ease-out (Tailwind's own curve, so it matches every other transition on
      the site): fast at the start, settling at the end. That is what makes it read as
      smooth. An ease-in curve would be the wrong choice here — it starts slow, so the
      bar would seem to hesitate before answering the hover.
    */
    transition: transform 400ms cubic-bezier(0, 0, 0.2, 1);
  }
  .nav-underline:hover::after,
  .nav-underline:focus-visible::after { transform: scaleX(1); }

  /* Respect a reduced-motion preference: the underline still appears, it just does not
     travel. Removing the cue entirely would leave those users worse off, not calmer. */
  @media (prefers-reduced-motion: reduce) {
    .nav-underline::after { transition: none; }
  }
`;
