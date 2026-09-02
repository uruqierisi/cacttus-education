import { useEffect, useState } from "react";
import { C } from "../theme";




/* ── ROTATING HEADLINE ── */
export function RotatingWord({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => (i + 1) % words.length); setVisible(true); }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, [words]);

  /* md+: text-[0.78em] shrinks the phrase enough that the longest one ("siguri
     kibernetike.") fits the column, nowrap guarantees one line, and min-h
     1.25em reserves exactly that one line so nothing below can shift.
     Below md the column is too narrow for one line, so it may wrap and min-h
     2.5em reserves two. All em-based, so both breakpoints stay in sync.
     align-top makes the reserved height independent of baseline alignment. */
  return (
    <span
      className="inline-block align-top transition-all duration-300 min-h-[2.5em] md:min-h-[1.25em] md:whitespace-nowrap md:text-[0.90em]"
      style={{ color: C.brand, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)", minWidth: 280 }}
    >
      {words[idx]}
    </span>
  );
}
