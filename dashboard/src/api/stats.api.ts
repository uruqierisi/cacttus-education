import { getData } from '@/lib/api-client';
import type { StatsByType, StatsGranularity, StatsSummary, StatsTimeseries } from './types';

const BASE = '/api/admin/stats';

/** Applications this month vs last, plus the untriaged (NEW) count. ADMIN only. */
export function getStatsSummary(): Promise<StatsSummary> {
  return getData<StatsSummary>(`${BASE}/summary`);
}

/** Applications over time, bucketed by day / week / month. ADMIN only. */
export function getStatsTimeseries(granularity: StatsGranularity): Promise<StatsTimeseries> {
  return getData<StatsTimeseries>(`${BASE}/timeseries`, { params: { granularity } });
}

/** Applications split by product line (ZHVAM / CYBER / TRAINING / SCHOOL). ADMIN only. */
export function getStatsByType(): Promise<StatsByType> {
  return getData<StatsByType>(`${BASE}/by-type`);
}
