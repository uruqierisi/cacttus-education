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
    <div
      className={
        wide
          ? "md:col-span-2 lg:basis-full"
          : // From `lg:` up this is a flex item in the field region: grow into the spare
            // width, but never shrink past `basis` — that floor is what makes the region
            // WRAP to another line instead of squeezing a placeholder out of view. 10rem
            // clears the longest placeholder the promoted inputs ask for ("Numri i
            // telefonit", 139px including the input's padding) with room to spare; the
            // 150px figure the row comment below quotes was "Emri dhe mbiemri", which
            // the split into Emri and Mbiemri retired.
            // `min-w-0` stops the input's intrinsic ~170px minimum from overriding it.
            "lg:min-w-0 lg:flex-1 lg:basis-[10rem]"
      }
    >
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
