import React from "react";


/* ══════════════════════════════════════════
   APPLY POPUP ACCESS + IN-PAGE SCROLL
══════════════════════════════════════════ */

/*
  The application popup is owned by `Layout` — the banner, the navbar and the footer all
  open it from there. Pages, though, arrive as `children` inside <main>, so they have no
  prop path back up to that opener.

  A context is what closes the gap WITHOUT a second popup existing anywhere. One state,
  one <ScrollPopupForm>, and any page deep in the tree can ask for the same door the
  navbar uses. Threading an `onApplyClick` prop through every page component instead
  would touch a dozen signatures to deliver one function.

  The default is a no-op rather than a throw: a page rendered outside Layout (a test, a
  future embed) should degrade to a dead button, not crash the route.
*/
export const ApplyPopupContext = React.createContext<() => void>(() => {});


/** Opens the same application popup as the navbar's "Apliko tani". */
export function useApplyPopup(): () => void {
  return React.useContext(ApplyPopupContext);
}
