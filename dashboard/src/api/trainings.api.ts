import { getData, getPaginated, patchData, postData, deleteData, type Paginated } from '@/lib/api-client';
import type {
  FormOption,
  Training,
  TrainingCategory,
  TrainingFormat,
  TrainingStatus,
} from './types';

const BASE = '/api/admin/trainings';

export type ListTrainingsParams = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly category?: TrainingCategory;
  readonly city?: string;
  readonly isActive?: boolean;
  readonly includeDeleted?: boolean;
  readonly search?: string;
  readonly sort?: 'order' | 'createdAt' | 'updatedAt' | 'title' | 'startDate';
  readonly order?: 'asc' | 'desc';
};

/**
 * The write shape.
 *
 * Nullable fields are `T | null` rather than optional, and that is deliberate: on PATCH
 * the API reads `undefined` as "leave alone" and `null` as "clear". Making them optional
 * here would let a caller drop a key by accident and silently mean the opposite of what
 * the editor's empty input intends.
 */
export type TrainingPayload = {
  /** Optional on create — the API derives an Albanian-safe slug from the title. */
  readonly slug?: string;
  readonly title: string;
  readonly category: TrainingCategory;
  /** `YYYY-MM-DD`, exactly what `<input type="date">` produces. */
  readonly startDate: string | null;
  readonly format: TrainingFormat;
  readonly hours: number | null;
  readonly instructor: string | null;
  readonly instructorPhoto: string | null;
  readonly instructorBio: string | null;
  readonly city: string | null;
  /** Whole euros. */
  readonly price: number | null;
  readonly status: TrainingStatus;
  readonly description: string | null;
  readonly strengths: readonly string[];
  /** Sent as a whole list on every save; `[]` clears it (the column has no null state). */
  readonly jobRoles: readonly string[];
  readonly syllabusPdf: string | null;
  readonly formSlug: string;
  readonly isActive: boolean;
  readonly order: number;
};

export function listTrainings(params: ListTrainingsParams): Promise<Paginated<Training>> {
  return getPaginated<Training>(BASE, { params });
}

export function getTraining(id: string): Promise<Training> {
  return getData<Training>(`${BASE}/${id}`);
}

/** Active forms only — the dropdown must not offer a form nobody can submit to. */
export function getFormOptions(): Promise<readonly FormOption[]> {
  return getData<readonly FormOption[]>(`${BASE}/form-options`);
}

export function createTraining(payload: TrainingPayload): Promise<Training> {
  return postData<Training>(BASE, payload);
}

export function updateTraining(id: string, payload: Partial<TrainingPayload>): Promise<Training> {
  return patchData<Training>(`${BASE}/${id}`, payload);
}

/** Soft delete. ADMIN-only server-side; the row and its submissions survive. */
export function deleteTraining(id: string): Promise<void> {
  return deleteData(`${BASE}/${id}`);
}
