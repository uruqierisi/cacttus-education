import React from "react";
import { C } from "../theme";


/**
 * The same wrapper for `PublicApplicationForm` — the light card on a training's detail
 * page, rather than the band's dark gradient.
 *
 * At module scope for exactly the reason spelled out on `ApplyFieldShell` above, and it
 * takes `error` as a PROP for the same reason: reading `fieldErrors` from an enclosing
 * scope is what forces a component to be declared inside its parent in the first place.
 */
export function PublicFormFieldShell({
  name,
  label,
  required,
  helpText,
  error,
  children,
}: {
  name: string;
  label: string;
  required: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="block text-sm font-medium mb-1.5" style={{ color: C.n700 }}>
        {label}
        {required && <span style={{ color: C.brand }}> *</span>}
      </label>
      {children}
      {helpText && <p className="text-xs mt-1" style={{ color: C.n500 }}>{helpText}</p>}
      {error && (
        <p className="text-xs mt-1 font-medium" style={{ color: C.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
