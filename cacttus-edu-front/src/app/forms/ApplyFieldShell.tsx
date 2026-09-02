import React from "react";


/**
 * Label + help text + error wrapper for one input.
 *
 * Deliberately declared at module scope, NOT inside the band. A component defined
 * inside another component gets a new function identity on every render, which makes
 * React unmount and remount its whole subtree — the visible symptom being an input
 * that loses focus after every single keystroke.
 */
export function ApplyFieldShell({
  name,
  label,
  required,
  helpText,
  error,
  wide = false,
  children,
}: {
  name: string;
  label: string;
  required: boolean;
  helpText?: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "md:col-span-2 xl:col-span-4" : ""}>
      <label htmlFor={`apliko-${name}`} className="block text-xs font-medium mb-1.5 text-white/85">
        {label}
        {required && <span className="text-white/60"> *</span>}
      </label>
      {children}
      {helpText && <p className="text-white/50 text-xs mt-1">{helpText}</p>}
      {error && (
        <p className="text-xs mt-1 font-medium" style={{ color: "#FFD9D9" }}>
          {error}
        </p>
      )}
    </div>
  );
}
