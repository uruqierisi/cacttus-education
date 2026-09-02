import { useEffect, useRef, useState } from "react";


/**
 * True once the element has been scrolled into view — and it never goes back to false.
 *
 * That one-way latch IS the "plays once" requirement: the observer disconnects on the
 * first intersection, so scrolling the section off screen and back does nothing. The
 * state lives in the component, so a page refresh remounts it and the count starts at 0
 * again, which is the other half of what was asked.
 */
export function useHasEnteredView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Someone who asked the OS for less motion gets the final number, not a 1.6s crawl.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, entered };
}
