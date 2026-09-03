import { deleteData, getData, patchData, postData } from '@/lib/api-client';
import type { TrainingCategory } from './types';

const BASE = '/api/admin/training-categories';

export type TrainingCategoryPayload = {
  readonly name: string;
  /** Omitted on create, the API derives an Albanian-safe slug from the name. */
  readonly slug?: string;
  readonly sortOrder?: number;
};

/**
 * The whole list, unpaginated — it feeds a `<select>` and a management table, both of
 * which need every option at once. The API returns it in `sortOrder` then `name` order,
 * so no client-side sorting is needed or wanted: re-sorting here would silently override
 * the ordering an admin set.
 */
export function listTrainingCategories(): Promise<readonly TrainingCategory[]> {
  return getData<readonly TrainingCategory[]>(BASE);
}

export function createTrainingCategory(
  payload: TrainingCategoryPayload,
): Promise<TrainingCategory> {
  return postData<TrainingCategory>(BASE, payload);
}

export function updateTrainingCategory(
  id: string,
  payload: Partial<TrainingCategoryPayload>,
): Promise<TrainingCategory> {
  return patchData<TrainingCategory>(`${BASE}/${id}`, payload);
}

/**
 * HARD delete, ADMIN-only server-side, and refused with a 409 while any training still
 * references the category. The refusal message is written in Albanian by the API, so the
 * caller renders `error.message` as-is rather than inventing its own wording.
 */
export function deleteTrainingCategory(id: string): Promise<void> {
  return deleteData(`${BASE}/${id}`);
}
