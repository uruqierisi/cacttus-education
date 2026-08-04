/**
 * Validation for the ADMIN-only dashboard statistics API.
 *
 * These endpoints are READS and nothing else — there is no create / update / delete
 * schema in this file and there never will be. They aggregate rows that other
 * endpoints already own; none of them mutate anything, which is also why none of them
 * write an audit row (see the note in `services/stats.service.ts`).
 */
import { z } from 'zod';
import { isoDateSchema } from './common.schema';

/**
 * Bucket size for the applications-over-time chart.
 *
 * The three values map 1:1 onto a Postgres `date_trunc` unit. That mapping lives in
 * the service behind a frozen lookup table, never string interpolation, so a value
 * that somehow bypassed this enum still cannot reach SQL.
 */
export const STATS_GRANULARITIES = ['day', 'week', 'month'] as const;
export const granularitySchema = z.enum(STATS_GRANULARITIES).default('day');
export type StatsGranularity = z.infer<typeof granularitySchema>;

/**
 * Optional explicit window. Omitted, the service picks a sensible default span per
 * granularity (30 days / 12 weeks / 12 months) so the chart is never unbounded.
 */
export const statsTimeseriesQuerySchema = z
  .object({
    granularity: granularitySchema,
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ['from'],
    message: '`from` must be before or equal to `to`.',
  });
export type StatsTimeseriesQuery = z.infer<typeof statsTimeseriesQuerySchema>;
