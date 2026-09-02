import React from "react";
import { C } from "../theme";


export function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: C.brandLight, color: C.brandDark }}>
      {children}
    </span>
  );
}
