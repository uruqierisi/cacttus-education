import { apiClient, getData, postData } from '@/lib/api-client';
import type { AuthResponse, User } from './types';

export type LoginPayload = {
  readonly email: string;
  readonly password: string;
};

export type ChangePasswordPayload = {
  readonly currentPassword: string;
  readonly newPassword: string;
};

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return postData<AuthResponse>('/api/auth/login', payload);
}

export function refreshSession(): Promise<AuthResponse> {
  return postData<AuthResponse>('/api/auth/refresh');
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}

export async function fetchCurrentUser(): Promise<User> {
  const { user } = await getData<{ user: User }>('/api/auth/me');
  return user;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post('/api/auth/change-password', payload);
}
