import type { TrainingStatus } from "../../marketing/lib/public-api";
import { TRAINING_STATUS_LABELS, TRAINING_STATUS_STYLES } from "../lib/training-labels";







/**
 * The card's status pill. Same shape as `MetaChip`, different palette.
 *
 * The lookup is guarded rather than destructured straight away: `status` arrives over the
 * network, so an older API that predates the field — or a value added server-side before
 * this file learns its label — hands us something outside the two keys below. Indexing a
 * `Record` still type-checks in that case, so the crash would only show up at runtime, and
 * it would take the whole catalogue down over one missing pill. No style, no badge; the
 * card's other rows still render.
 */
export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  const style = TRAINING_STATUS_STYLES[status];
  if (!style) return null;
  const { bg, fg } = style;

  return (
    <span
      className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {TRAINING_STATUS_LABELS[status]}
    </span>
  );
}
