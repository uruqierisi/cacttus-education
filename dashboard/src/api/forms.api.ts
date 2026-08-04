import {
  apiClient,
  getData,
  getPaginated,
  patchData,
  postData,
  type Paginated,
} from '@/lib/api-client';
import { downloadCsv, type CsvDownloadResult } from '@/lib/download';
import type { FieldType, FormType } from '@/lib/constants';
import type { FieldDefinition, Form } from './types';

const BASE = '/api/admin/forms';

export type ListFormsParams = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly type?: FormType;
  readonly isActive?: boolean;
  readonly includeDeleted?: boolean;
  readonly search?: string;
  readonly sort?: 'createdAt' | 'updatedAt' | 'title';
  readonly order?: 'asc' | 'desc';
};

export type ListArchivedFormsParams = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly type?: FormType;
  readonly search?: string;
  readonly sort?: 'createdAt' | 'updatedAt' | 'title';
  readonly order?: 'asc' | 'desc';
};

export type FormPayload = {
  /** Optional on create — the API derives an Albanian-safe slug from the title. */
  readonly slug?: string;
  readonly title: string;
  readonly type: FormType;
  readonly fields: readonly FieldDefinition[];
  readonly isActive: boolean;
};

/** Axios serialises `undefined` away, so optional filters simply drop out of the URL. */
export function listForms(params: ListFormsParams): Promise<Paginated<Form>> {
  return getPaginated<Form>(BASE, { params });
}

/** Soft-deleted forms only. ADMIN-only server-side. */
export function listArchivedForms(params: ListArchivedFormsParams): Promise<Paginated<Form>> {
  return getPaginated<Form>(`${BASE}/archived`, { params });
}

export function getForm(id: string): Promise<Form> {
  return getData<Form>(`${BASE}/${id}`);
}

/** Field-type vocabulary for the builder's type picker, served from the API. */
export async function getFieldTypes(): Promise<readonly FieldType[]> {
  const { fieldTypes } = await getData<{ fieldTypes: readonly FieldType[] }>(`${BASE}/field-types`);
  return fieldTypes;
}

export function createForm(payload: FormPayload): Promise<Form> {
  return postData<Form>(BASE, payload);
}

export function updateForm(id: string, payload: Partial<FormPayload>): Promise<Form> {
  return patchData<Form>(`${BASE}/${id}`, payload);
}

/** Soft delete — the API keeps the row and returns it with `isDeleted: true`. */
export async function softDeleteForm(id: string): Promise<Form> {
  const response = await apiClient.delete<{ data: Form }>(`${BASE}/${id}`);
  return response.data.data;
}

export function restoreForm(id: string): Promise<Form> {
  return postData<Form>(`${BASE}/${id}/restore`);
}

/**
 * Download every submission for ONE form as CSV. ADMIN only.
 *
 * This is the first half of the delete-with-backup flow: the caller awaits this, and
 * only issues `softDeleteForm` once it resolves. If the export throws, the delete must
 * not happen — a backup that silently failed is worse than no backup offered at all.
 */
export function downloadFormSubmissionsCsv(id: string, slug: string): Promise<CsvDownloadResult> {
  return downloadCsv(`${BASE}/${id}/submissions/export`, `aplikimet-${slug}.csv`);
}
