/**
 * A single headline number with an optional month-over-month delta.
 *
 * This is a STAT TILE, not a one-bar chart: the data is one current value plus its
 * trend, and a tile says that faster and smaller than any plot could.
 *
 * `value` accepts `null` for "we genuinely do not know" — the analytics cards use it
 * while no visitor source is wired — and renders an em dash rather than a misleading
 * zero. `0` and `null` are different facts and must not look the same.
 */
import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercentChange } from '@/lib/format';

const EM_DASH = '—';

type StatCardProps = {
  readonly label: string;
  readonly value: number | null;
  /** Rendered instead of `value` when the number needs a unit, e.g. "4,2%". */
  readonly displayValue?: string;
  readonly changePercent?: number | null;
  readonly icon: LucideIcon;
  /** Draws attention to a number that means "someone has to act". */
  readonly isHighlighted?: boolean;
  /** Small caption under the value — used for the analytics "not configured" note. */
  readonly note?: string;
};

function DeltaBadge({ changePercent }: { changePercent: number | null }): JSX.Element {
  if (changePercent === null || !Number.isFinite(changePercent)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden />
        <span>pa krahasim</span>
      </span>
    );
  }

  const isUp = changePercent > 0;
  const isFlat = changePercent === 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isFlat && 'text-muted-foreground',
        // More applications is good; fewer is not. Direction carries meaning here, so
        // the arrow is paired with the colour rather than replaced by it.
        !isFlat && (isUp ? 'text-success' : 'text-destructive'),
      )}
    >
      {isFlat ? <Minus className="h-3 w-3" aria-hidden /> : <Icon className="h-3 w-3" aria-hidden />}
      <span>{formatPercentChange(changePercent)}</span>
      <span className="font-normal text-muted-foreground">ndaj muajit të kaluar</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  displayValue,
  changePercent,
  icon: Icon,
  isHighlighted = false,
  note,
}: StatCardProps): JSX.Element {
  const shown = displayValue ?? (value === null ? EM_DASH : formatNumber(value));

  return (
    <Card className={cn(isHighlighted && 'border-primary/40 bg-primary/[0.03]')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-md',
              isHighlighted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        </div>

        <p className="mt-3 text-3xl font-semibold tracking-tight">{shown}</p>

        <div className="mt-2 min-h-[1.25rem]">
          {changePercent !== undefined ? <DeltaBadge changePercent={changePercent} /> : null}
          {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
