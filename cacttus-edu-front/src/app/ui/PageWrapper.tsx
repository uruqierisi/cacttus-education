import React, { useEffect } from "react";


/**
 * Scroll-to-top on mount, and nothing else.
 *
 * It used to render the footer too, behind a `withFooter` prop — which meant a page could
 * silently ship without one, and `ProgramPage` did exactly that. The footer now lives in
 * `Layout` beside the navbar, so this is purely the "new page, start at the top" helper
 * its name suggests.
 */
export function PageWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return <>{children}</>;
}
