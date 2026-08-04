/**
 * Applications split by product line.
 *
 * Four categories, part-to-whole. The legend beside the ring is not decoration — it is
 * the REQUIRED RELIEF for the palette's one contrast warning (aqua sits at 2.82:1 on
 * white). It carries every category's name, count and share as text, so a reader who
 * cannot separate two slices by hue still gets the whole answer, and a screen-reader
 * user gets it without the SVG at all.
 *
 * Segments are separated by a 2px surface-coloured stroke rather than being flush, so
 * two adjacent slices never bleed into one shape.
 */
import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { FORM_TYPE_LABELS, type FormType } from '@/lib/constants';
import { formatNumber, formatPercent } from '@/lib/format';
import { CHART_CHROME, CHART_MARKS, SERIES_COLORS } from './chart-tokens';
import type { ByTypePoint } from '@/api/types';

const CHART_SIZE = 220;
const INNER_RADIUS = 62;
const OUTER_RADIUS = 92;
const PERCENT_FACTOR = 100;

type DonutRow = {
  readonly type: FormType;
  readonly label: string;
  readonly count: number;
  readonly share: number | null;
  readonly color: string;
};

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload: DonutRow }[];
}): JSX.Element | null {
  const row = payload?.[0]?.payload;

  if (!active || !row) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{row.label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {formatNumber(row.count)} · {formatPercent(row.share)}
      </p>
    </div>
  );
}

export function TypeDonut({
  items,
  total,
}: {
  readonly items: readonly ByTypePoint[];
  readonly total: number;
}): JSX.Element {
  const rows = useMemo<DonutRow[]>(
    () =>
      items.map((item) => ({
        type: item.type,
        label: FORM_TYPE_LABELS[item.type],
        count: item.count,
        share: total > 0 ? (item.count / total) * PERCENT_FACTOR : null,
        color: SERIES_COLORS[item.type],
      })),
    [items, total],
  );

  // Recharts renders nothing for an all-zero dataset, which would leave a bare hole.
  const hasData = total > 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows.filter((row) => row.count > 0)}
                dataKey="count"
                nameKey="label"
                innerRadius={INNER_RADIUS}
                outerRadius={OUTER_RADIUS}
                paddingAngle={1}
                stroke={CHART_CHROME.surface}
                strokeWidth={CHART_MARKS.segmentGap}
                isAnimationActive={false}
              >
                {rows
                  .filter((row) => row.count > 0)
                  .map((row) => (
                    <Cell key={row.type} fill={row.color} />
                  ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-border" />
        )}

        {/* Hero figure in the hole: the total the slices add up to. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</span>
          <span className="text-xs text-muted-foreground">gjithsej</span>
        </div>
      </div>

      {/*
        The relief layer. A <dl> rather than a <ul>: each row is a term (category) and
        its value (count + share), which is exactly what a description list is for.
      */}
      <dl className="w-full min-w-0 space-y-2.5">
        {rows.map((row) => (
          <div key={row.type} className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: row.color }}
            />
            <dt className="min-w-0 flex-1 truncate text-sm">{row.label}</dt>
            <dd className="shrink-0 text-sm font-medium tabular-nums">
              {formatNumber(row.count)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {formatPercent(row.share)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
