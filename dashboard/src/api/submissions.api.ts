import { getData, getPaginated, patchData, type Paginated } from '@/lib/api-client';
import { downloadCsv, type CsvDownloadResult } from '@/lib/download';
import type { FormType, SubmissionStatus } from '@/lib/constants';
import type { Submission, SubmissionStats } from './types';

const BASE = '/api/admin/submissions';

export type SubmissionFilters = {
  readonly formId?: string;
  /** Product line, resolved through the Submission -> Form relation server-side. */
  readonly type?: FormType;
  readonly status?: SubmissionStatus;
  readonly search?: string;
  readonly from?: string;
  readonly to?: string;
};

export type ListSubmissionsParams = SubmissionFilters & {
  readonly page?: number;
  readonly pageSize?: number;
  readonly order?: 'asc' | 'desc';
};

export function listSubmissions(params: ListSubmissionsParams): Promise<Paginated<Submission>> {
  return getPaginated<Submission>(BASE, { params });
}

export function getSubmission(id: string): Promise<Submission> {
  return getData<Submission>(`${BASE}/${id}`);
}

export function updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<Submission> {
  return patchData<Submission>(`${BASE}/${id}/status`, { status });
}

export function getSubmissionStats(): Promise<SubmissionStats> {
  return getData<SubmissionStats>(`${BASE}/stats`);
}

/**
 * Download the CURRENTLY FILTERED inbox as CSV.
 *
 * The same `filters` object that produced the on-screen table is passed straight
 * through, so what the admin exports is what the admin is looking at — an export that
 * quietly ignored the filters would be a data-protection problem, not a convenience.
 */
export function downloadSubmissionsCsv(
  filters: SubmissionFilters,
): Promise<CsvDownloadResult> {
  return downloadCsv(`${BASE}/export`, 'aplikimet.csv', { params: filters });
}
