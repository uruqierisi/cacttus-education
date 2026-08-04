/**
 * Audit trail — READ ONLY.
 *
 * This module exposes two GETs and nothing else, mirroring the router it talks to.
 * `AuditLog` is append-only on the server; there is no create, update or delete to
 * call, and none will be added here.
 */
import { getData, getPaginated, type Paginated } from '@/lib/api-client';
import type { AuditAction, AuditEntityType, AuditLog } from './types';

const BASE = '/api/admin/audit-logs';

export type ListAuditLogsParams = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly actorId?: string;
  readonly action?: AuditAction;
  readonly entityType?: AuditEntityType;
  readonly entityId?: string;
  /** Matches the actor's email only — the API does not wildcard across columns. */
  readonly search?: string;
  readonly from?: string;
  readonly to?: string;
};

export function listAuditLogs(params: ListAuditLogsParams): Promise<Paginated<AuditLog>> {
  return getPaginated<AuditLog>(BASE, { params });
}

/** The `AuditAction` vocabulary, served from the Prisma enum so the filter cannot drift. */
export async function listAuditActions(): Promise<readonly AuditAction[]> {
  const { actions } = await getData<{ actions: readonly AuditAction[] }>(`${BASE}/actions`);
  return actions;
}
