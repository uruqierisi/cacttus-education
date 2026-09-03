import { deleteData, getData, patchData, postData } from '@/lib/api-client';
import type { PostCategory } from './types';

const BASE = '/api/admin/post-categories';

export type PostCategoryPayload = {
  readonly name: string;
  /** Omitted on create, the API derives an Albanian-safe slug from the name. */
  readonly slug?: string;
  readonly sortOrder?: number;
};

/**
 * The whole list, unpaginated — it feeds a `<select>` and a management dialog, both of
 * which need every option at once. The API returns it in `sortOrder` then `name` order,
 * so no client-side sorting is needed or wanted: re-sorting here would silently override
 * the ordering an admin set.
 */
export function listPostCategories(): Promise<readonly PostCategory[]> {
  return getData<readonly PostCategory[]>(BASE);
}

export function createPostCategory(payload: PostCategoryPayload): Promise<PostCategory> {
  return postData<PostCategory>(BASE, payload);
}

export function updatePostCategory(
  id: string,
  payload: Partial<PostCategoryPayload>,
): Promise<PostCategory> {
  return patchData<PostCategory>(`${BASE}/${id}`, payload);
}

/**
 * HARD delete, ADMIN-only server-side, and refused with a 409 while any post still
 * references the category. The refusal message is written in Albanian by the API, so the
 * caller renders `error.message` as-is rather than inventing its own wording.
 */
export function deletePostCategory(id: string): Promise<void> {
  return deleteData(`${BASE}/${id}`);
}
