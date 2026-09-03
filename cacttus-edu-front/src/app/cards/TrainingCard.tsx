import { Link } from "react-router";
import type { TrainingCard as TrainingCardData } from "../../marketing/lib/public-api";
import { formatTrainingDate } from "../lib/dates";
import {
  TRAINING_FORMAT_LABELS,
} from "../lib/training-labels";
import { C } from "../theme";
import { MetaChip } from "../ui/MetaChip";
import { TrainingStatusBadge } from "../ui/TrainingStatusBadge";
import { PrimaryBtn } from "../ui/buttons";


/* ══════════════════════════════════════════
   4 — TRAJNIME: catalogue grid (live data)

   The card list, the category chips and the city chips all come from the API. The
   previous version hard-coded 14 trainings and two chip lists in this file, which meant
   publishing a training was a code change. Chips are DERIVED from what is actually on
   live cards, so a filter can never lead to an empty grid.
══════════════════════════════════════════ */
export function TrainingCard({ training }: { training: TrainingCardData }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ border: `1px solid ${C.n200}`, backgroundColor: C.n0 }}
    >
      {/* Category left, status right — the badge sits beside the tag rather than being
          absolutely positioned, so it can never overlap a long category label. */}
      <div className="flex items-start justify-between gap-2">
        <MetaChip>{training.category.name}</MetaChip>
        <TrainingStatusBadge status={training.status} />
      </div>
      <h4 className="text-base font-semibold leading-snug" style={{ color: C.n900 }}>{training.title}</h4>
      <div className="flex flex-col gap-2 flex-1">
        {/*
          "Qyteti" is CONDITIONAL, not defaulted to an em dash. An online training has no
          city — that is what `format` says — so printing "Qyteti: —" invents a field the
          training does not have. The row is omitted entirely instead. `format` is
          unaffected and still renders one line above, which is where Klasë / Hibrid /
          Online is expressed.
        */}
        {([
          ["Fillimi", formatTrainingDate(training.startDate)],
          ["Formati", TRAINING_FORMAT_LABELS[training.format]],
          ["Orët", training.hours === null ? "—" : `${training.hours} orë`],
          ["Ligjëruesi", training.instructor || "—"],
          ...(training.city ? [["Qyteti", training.city] as const] : []),
        ] as readonly (readonly [string, string])[]).map(([label, val]) => (
          <div key={label} className="flex items-center justify-between text-sm gap-2">
            <span style={{ color: C.n500 }}>{label}</span>
            <span className="font-medium text-right" style={{ color: C.n700 }}>{val}</span>
          </div>
        ))}
      </div>
      {/* Navigates to the DETAIL page — not a modal, and not the form directly. */}
      <Link to={training.applyUrl}>
        <PrimaryBtn className="text-sm px-5 py-2.5 w-full justify-center">Apliko</PrimaryBtn>
      </Link>
    </div>
  );
}
