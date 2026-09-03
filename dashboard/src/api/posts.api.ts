import {
  deleteData,
  getData,
  getPaginated,
  patchData,
  postData,
  type Paginated,
} from '@/lib/api-client';
import type { Post, PostStats } from './types';

const BASE = '/api/admin/posts';

export type ListPostsParams = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly published?: boolean;
  readonly search?: string;
  readonly sort?: 'createdAt' | 'updatedAt' | 'title';
  readonly order?: 'asc' | 'desc';
};

export type PostPayload = {
  readonly slug: string;
  readonly title: string;
  readonly coverImage: string | null;
  readonly content: string;
  readonly published: boolean;
  /** A `post_categories` row id, or null for "no category". */
  readonly categoryId: string | null;
};

export function listPosts(params: ListPostsParams): Promise<Paginated<Post>> {
  return getPaginated<Post>(BASE, { params });
}

export function getPost(id: string): Promise<Post> {
  return getData<Post>(`${BASE}/${id}`);
}

export function createPost(payload: PostPayload): Promise<Post> {
  return postData<Post>(BASE, payload);
}

export function updatePost(id: string, payload: Partial<PostPayload>): Promise<Post> {
  return patchData<Post>(`${BASE}/${id}`, payload);
}

export function deletePost(id: string): Promise<void> {
  return deleteData(`${BASE}/${id}`);
}

export function getPostStats(): Promise<PostStats> {
  return getData<PostStats>(`${BASE}/stats`);
}
