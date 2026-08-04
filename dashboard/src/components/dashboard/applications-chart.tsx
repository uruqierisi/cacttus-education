/**
 * Applications over time — one series, so an area with a 2px line and NO legend
 * (the card title already names what is plotted).
 *
 * One y-axis, always. If a second measure is ever wanted here it gets its own chart;
 * a twin-scale axis is the single most misread thing you can put on a dashboard.
 */
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateShort, formatMonth, formatNumber } from '@/lib/format';
import { CHART_CHROME, CHART_MARKS, TREND_COLOR } from './chart-tokens';
import type { StatsGranularity, TimeseriesPoint } from '@/api/types';

const GRANULARITY_OPTIONS: readonly { value: StatsGranularity; label: string }[] = [
  { value: 'day', label: 'Ditë' },
  { value: 'week', label: 'Javë' },
  { value: 'month', label: 'Muaj' },
];

const CHART_HEIGHT = 260;
/** Beyond this many buckets, printing every tick turns the axis into a smear. */
const MAX_VISIBLE_TICKS = 8;

type ChartRow = {
  readonly bucket: string;
  readonly label: string;
  readonly count: number;
};

function bucketLabel(bucket: string, granularity: StatsGranularity): string {
  return granularity === 'month' ? formatMonth(bucket) : formatDateShort(bucket);
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload: ChartRow }[];
}): JSX.Element | null {
  const row = payload?.[0]?.payload;

  if (!active || !row) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{row.label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {formatNumber(row.count)} aplikime
      </p>
    </div>
  );
}

type ApplicationsChartProps = {
  readonly points: readonly TimeseriesPoint[];
  readonly granularity: StatsGranularity;
  readonly onGranularityChange: (value: StatsGranularity) => void;
  readonly isFetching?: boolean;
};

export function ApplicationsChart({
  points,
  granularity,
  onGranularityChange,
  isFetching = false,
}: ApplicationsChartProps): JSX.Element {
  const rows = useMemo<ChartRow[]>(
    () =>
      points.map((point) => ({
        bucket: point.bucket,
        label: bucketLabel(point.bucket, granularity),
        count: point.count,
      })),
    [points, granularity],
  );

  const tickInterval = Math.max(0, Math.ceil(rows.length / MAX_VISIBLE_TICKS) - 1);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Aplikimet me kalimin e kohës</h2>
          <p className="text-sm text-muted-foreground">
            Numri i aplikimeve për secilën periudhë.
          </p>
        </div>

        {/* Radio group semantics: exactly one bucket size is active at a time. */}
        <div
          role="radiogroup"
          aria-label="Madhësia e periudhës"
          className="flex rounded-md border border-border p-0.5"
        >
          {GRANULARITY_OPTIONS.map((option) => {
            const isActive = option.value === granularity;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3 text-sm',
                  isActive && 'bg-accent text-accent-foreground hover:bg-accent',
                )}
                onClick={() => onGranularityChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <p
          className="flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
          style={{ height: CHART_HEIGHT }}
        >
          Ende nuk ka aplikime në këtë periudhë.
        </p>
      ) : (
        <div
          className={cn('transition-opacity', isFetching && 'opacity-60')}
          style={{ height: CHART_HEIGHT }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="applications-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0.01} />
                </linearGradient>
              </defs>

              {/* Horizontal rules only — vertical ones add ink without adding meaning. */}
              <CartesianGrid stroke={CHART_CHROME.grid} strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="label"
                interval={tickInterval}
                tickLine={false}
                axisLine={{ stroke: CHART_CHROME.axis }}
                tick={{ fill: CHART_CHROME.label, fontSize: 12 }}
                minTickGap={8}
              />
              <YAxis
                allowDecimals={false}
                width={56}
                tickLine={false}
                axisLine={false}
                tick={{ fill: CHART_CHROME.label, fontSize: 12 }}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: CHART_CHROME.axis, strokeWidth: 1 }}
              />

              <Area
                type="monotone"
                dataKey="count"
                name="Aplikime"
                stroke={TREND_COLOR}
                strokeWidth={CHART_MARKS.lineWidth}
                fill="url(#applications-fill)"
                // No dot per point: on a 30-day view that is 30 marks competing with
                // the line itself. The hover dot is the affordance instead.
                dot={false}
                activeDot={{ r: CHART_MARKS.activeDotRadius, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
