import React from "react";
import { C } from "../theme";


export function Overline({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.brand, letterSpacing: "0.08em" }}>{children}</p>;
}
