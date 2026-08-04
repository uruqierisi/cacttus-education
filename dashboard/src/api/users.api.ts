/**
 * Staff account management. Every endpoint here is ADMIN-only server-side; the UI
 * role check mirrors that, it never replaces it.
 */
import { apiClient, getData, getPaginated, patchData, postData, type Paginated } from '@/lib/api-client';
import type { Role } from '@/lib/constants';
import type { AdminUser } from './types';

const BASE = '/api/admin/users';

export type ListUsersParams = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly role?: Role;
  readonly isActive?: 'true' | 'false';
  readonly search?: string;
  readonly sort?: 'createdAt' | 'name' | 'email';
  readonly order?: 'asc' | 'desc';
};

export type CreateUserPayload = {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly role: Role;
};

/**
 * Email is deliberately absent: the API rejects it, because the address is the login
 * identifier and silently changing it would lock the holder out.
 */
export type UpdateUserPayload = {
  readonly name?: string;
  readonly role?: Role;
  readonly isActive?: boolean;
};

export function listUsers(params: ListUsersParams): Promise<Paginated<AdminUser>> {
  return getPaginated<AdminUser>(BASE, { params });
}

export function getUser(id: string): Promise<AdminUser> {
  return getData<AdminUser>(`${BASE}/${id}`);
}

export function createUser(payload: CreateUserPayload): Promise<AdminUser> {
  return postData<AdminUser>(BASE, payload);
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminUser> {
  return patchData<AdminUser>(`${BASE}/${id}`, payload);
}

/** Admin-initiated reset. Returns 204, so there is no body to unwrap. */
export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await apiClient.post(`${BASE}/${id}/reset-password`, { newPassword });
}

/**
 * Hard delete. The API answers 409 when the account authored posts or is the last
 * active administrator; those messages are surfaced verbatim as toasts.
 */
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
