/**
 * Dashboard statistics.
 *
 * READ-ONLY BY CONSTRUCTION. Every function here is an aggregate over rows another
 * service owns; none of them writes, and — deliberately — none of them records an
 * audit row. The trail exists to answer "who changed what"; a manager opening the
 * overview screen changed nothing, and logging every chart refresh would bury the
 * events that matter under thousands of no-op reads.
 *
 * Month boundaries are computed in UTC, not server-local time. A container that moves
 * between regions (or a laptop crossing a DST boundary) must not silently reclassify
 * which month a lead belongs to.
 */
import { FormType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { StatsGranularity, StatsTimeseriesQuery } from '../schemas/stats.schema';

/** Percentages are reported to one decimal place. */
const PERCENT_DECIMALS = 1;
const PERCENT_FACTOR = 100;

/** Default span per bucket size, used when the caller supplies no explicit window. */
const DEFAULT_SPAN: Readonly<Record<StatsGranularity, number>> = Object.freeze({
  day: 30,
  week: 12,
  month: 12,
});

/**
 * Granularity -> Postgres `date_trunc` unit.
 *
 * The values are hard-coded literals looked up by an enum-validated key, never
 * interpolated from a request. This is the only place a SQL fragment is built by hand
 * in this file, and it cannot carry caller-controlled text.
 */
const TRUNC_UNIT: Readonly<Record<StatsGranularity, Prisma.Sql>> = Object.freeze({
  day: Prisma.sql`'day'`,
  week: Prisma.sql`'week'`,
  month: Prisma.sql`'month'`,
});

export type StatsSummary = {
  /** Submissions created since the first instant of the current UTC month. */
  readonly currentMonth: number;
  /** Same measure for the month before it — the denominator of `changePercent`. */
  readonly previousMonth: number;
  /**
   * Month-over-month change, or null when it cannot be computed. Null (not 0, and not
   * Infinity) is the honest answer when the previous month had no applications at all:
   * there is no percentage change from zero, and the UI renders "—" for it.
   */
  readonly changePercent: number | null;
  /** Untriaged inbox: submissions still sitting at status NEW. */
  readonly newCount: number;
  readonly total: number;
  readonly rangeStart: Date;
  readonly previousRangeStart: Date;
};

export type TimeseriesPoint = {
  /** First instant of the bucket, ISO-serialised by the response layer. */
  readonly bucket: Date;
  readonly count: number;
};

export type TimeseriesResult = {
  readonly granularity: StatsGranularity;
  readonly from: Date;
  readonly to: Date;
  readonly points: readonly TimeseriesPoint[];
};

export type ByTypePoint = {
  readonly type: FormType;
  readonly count: number;
};

export type ByTypeResult = {
  readonly total: number;
  readonly items: readonly ByTypePoint[];
};

/** First instant of the UTC month `offset` months away from `reference`. */
function startOfUtcMonth(reference: Date, offset = 0): Date {
  return new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + offset, 1, 0, 0, 0, 0),
  );
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }

  const raw = ((current - previous) / previous) * PERCENT_FACTOR;
  return Number(raw.toFixed(PERCENT_DECIMALS));
}

/**
 * Applications this month vs last month, plus the untriaged count.
 *
 * The four counts run inside one `$transaction` so they are read at a single snapshot.
 * Without it a submission arriving between query two and query three could be counted
 * in `total` but not in `currentMonth`, and the card row would contradict itself.
 */
export async function getSummary(now: Date = new Date()): Promise<StatsSummary> {
  const currentStart = startOfUtcMonth(now);
  const previousStart = startOfUtcMonth(now, -1);

  const [currentMonth, previousMonth, newCount, total] = await prisma.$transaction([
    prisma.submission.count({ where: { createdAt: { gte: currentStart } } }),
    prisma.submission.count({
      where: { createdAt: { gte: previousStart, lt: currentStart } },
    }),
    prisma.submission.count({ where: { status: 'NEW' } }),
    prisma.submission.count(),
  ]);

  return {
    currentMonth,
    previousMonth,
    changePercent: percentChange(currentMonth, previousMonth),
    newCount,
    total,
    rangeStart: currentStart,
    previousRangeStart: previousStart,
  };
}

/** Default window start for a granularity, counting back from `to`. */
function defaultFrom(granularity: StatsGranularity, to: Date): Date {
  const span = DEFAULT_SPAN[granularity];

  if (granularity === 'month') {
    return startOfUtcMonth(to, -(span - 1));
  }

  const daysBack = granularity === 'week' ? span * 7 : span;
  const start = new Date(to.getTime());
  start.setUTCDate(start.getUTCDate() - daysBack);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/**
 * Applications over time.
 *
 * `date_trunc` has no Prisma-native equivalent, so this is the one raw query in the
 * service. Both bounds are bound parameters and the only non-parameter fragment is the
 * frozen `TRUNC_UNIT` literal above, so no caller-supplied text ever reaches the
 * statement. `::int` casts the count out of Postgres `bigint`, which would otherwise
 * arrive as a BigInt that `JSON.stringify` refuses to serialise.
 */
export async function getTimeseries(query: StatsTimeseriesQuery): Promise<TimeseriesResult> {
  const to = query.to ?? new Date();
  const from = query.from ?? defaultFrom(query.granularity, to);

  const rows = await prisma.$queryRaw<{ bucket: Date; count: number }[]>`
    SELECT date_trunc(${TRUNC_UNIT[query.granularity]}, "createdAt") AS bucket,
           COUNT(*)::int AS count
    FROM "submissions"
    WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return {
    granularity: query.granularity,
    from,
    to,
    points: rows.map((row) => ({ bucket: row.bucket, count: Number(row.count) })),
  };
}

/**
 * Applications split by product line.
 *
 * One `count` per FormType rather than a `groupBy`: `FormType` lives on `Form`, not on
 * `Submission`, and Prisma cannot group by a relation field. Four counted index scans
 * against a four-row enum is cheaper than the alternative of pulling every submission
 * into memory to bucket it, and every type is present in the result even at zero — a
 * donut chart with a silently missing slice is worse than one showing an honest 0.
 */
export async function getByType(): Promise<ByTypeResult> {
  const types = Object.values(FormType);

  const counts = await prisma.$transaction(
    types.map((type) => prisma.submission.count({ where: { form: { type } } })),
  );

  const items = types.map((type, index) => ({ type, count: counts[index] ?? 0 }));

  return {
    total: items.reduce((sum, item) => sum + item.count, 0),
    items,
  };
}
