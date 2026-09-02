import React from "react";
import { ChevronRight } from "lucide-react";
import { C } from "../theme";


/* ══════════════════════════════════════════
   SHARED UI PRIMITIVES
══════════════════════════════════════════ */
export function PrimaryBtn({ children, className = "", onClick, type = "button" }: { children: React.ReactNode; className?: string; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${className}`}
      style={{ backgroundColor: C.brand }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.brandDark)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.brand)}
    >
      {children}
    </button>
  );
}


export function SecondaryBtn({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${className}`}
      style={{ color: C.brand, border: `1.5px solid ${C.brand}`, backgroundColor: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.brandLight; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {children}
    </button>
  );
}


export function GhostBtn({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    /*
      `py-2 -my-2` is a TAP TARGET, not spacing. Measured on a 375px phone this control was
      20px tall — well under the ~44px a fingertip needs — because it is bare text plus a
      chevron with no padding of its own.

      The padding grows the clickable box by 8px above and below; the equal negative margin
      takes those same 16px back out of the layout, so every card and row this sits in keeps
      the exact geometry it had. Bigger to touch, identical to look at.
    */
    <button onClick={onClick} className={`inline-flex items-center gap-1 py-2 -my-2 text-sm font-semibold transition-colors group ${className}`} style={{ color: C.brand }}>
      {children}
      <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
