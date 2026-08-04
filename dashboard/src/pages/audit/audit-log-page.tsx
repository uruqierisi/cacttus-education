/**
 * Regjistri — the audit trail. ADMIN only, READ ONLY.
 *
 * THERE IS NO EDIT OR DELETE CONTROL ANYWHERE ON THIS PAGE, and none may be added. The
 * table is append-only on the server (`AuditLog` is written exclusively inside the
 * transaction of the action it records, and the router exposes GET and nothing else).
 * A trail with a delete button is not a trail.
 *
 * Rows are newest-first with no sort control, matching the API: a timeline read in any
 * other order is not a useful view of an append-only log.
 */
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Lock } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/state-views';
import { PaginationControls } from '@/components/common/pagination-controls';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listAuditActions, listAuditLogs } from '@/api/audit.api';
import { queryKeys } from '@/api/query-keys';
import { AUDIT_ENTITY_TYPES, type AuditLog } from '@/api/types';
import {
  actorLabel,
  auditActionLabel,
  auditEntityLabel,
  auditPredicate,
} from '@/lib/audit-labels';
import { ALL_FILTER_VALUE, AUDIT_PAGE_SIZE } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocumentTitle } from '@/hooks/use-document-title';

/** `<input type="date">` gives "2026-08-03"; the API wants an instant. */
function toDayStart(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

function toDayEnd(value: string): string | undefined {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
}

function AuditRow({ log }: { log: AuditLog }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="min-w-0 text-sm leading-relaxed">
          <span className="font-medium">{actorLabel(log.actorEmail, log.actorRole)}</span>{' '}
          <span className="text-muted-foreground">{auditPredicate(log)}</span>
          <span className="whitespace-nowrap text-muted-foreground">
            {' '}
            — {formatDateTime(log.createdAt)}
          </span>
        </p>

        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((previous) => !previous)}
        >
          Detajet
          <ChevronDown
            className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>

      {isOpen ? (
        <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-lg bg-muted/50 p-4 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Veprimi</dt>
            <dd className="font-medium">{auditActionLabel(log.action)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Emaili i aktorit</dt>
            <dd className="break-all font-medium">{log.actorEmail}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Entiteti</dt>
            <dd className="font-medium">
              {auditEntityLabel(log.entityType)}
              {log.entityId ? (
                <span className="ml-2 font-mono text-muted-foreground">{log.entityId}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Adresa IP</dt>
            <dd className="font-mono font-medium">{log.ip ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">User agent</dt>
            <dd className="break-all font-mono">{log.userAgent ?? '—'}</dd>
          </div>
          {log.metadata ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Konteksti</dt>
              <dd>
                <pre className="mt-1 overflow-x-auto rounded-md bg-background p-3 font-mono text-[11px]">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </li>
  );
}

export default function AuditLogPage(): JSX.Element {
  useDocumentTitle('Regjistri');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState(ALL_FILTER_VALUE);
  const [entityType, setEntityType] = useState(ALL_FILTER_VALUE);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const debouncedSearch = useDebouncedValue(search);

  const resetPage = useCallback(<T,>(setter: (value: T) => void) => {
    return (value: T): void => {
      setter(value);
      setPage(1);
    };
  }, []);

  const filters = {
    page,
    pageSize: AUDIT_PAGE_SIZE,
    action: action === ALL_FILTER_VALUE ? undefined : action,
    entityType:
      entityType === ALL_FILTER_VALUE
        ? undefined
        : (entityType as (typeof AUDIT_ENTITY_TYPES)[number]),
    search: debouncedSearch.trim() || undefined,
    from: toDayStart(from),
    to: toDayEnd(to),
  };

  const logsQuery = useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => listAuditLogs(filters),
  });

  // Served from the Prisma enum, so the dropdown cannot drift from the database.
  const actionsQuery = useQuery({
    queryKey: queryKeys.audit.actions,
    queryFn: listAuditActions,
    // The enum changes only on deploy — no reason to re-fetch it every 30 seconds.
    staleTime: Infinity,
  });

  return (
    <>
      <PageHeader
        title="Regjistri"
        description="Çdo veprim i kryer në panel, nga më i riu te më i vjetri."
        actions={
          <Badge variant="muted" className="gap-1.5 py-1">
            <Lock className="h-3 w-3" aria-hidden />
            Vetëm lexim
          </Badge>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="audit-search">Emaili i aktorit</Label>
          <Input
            id="audit-search"
            placeholder="p.sh. admin@…"
            value={search}
            onChange={(event) => resetPage(setSearch)(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-action">Veprimi</Label>
          <Select value={action} onValueChange={resetPage(setAction)}>
            <SelectTrigger id="audit-action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>Të gjitha veprimet</SelectItem>
              {(actionsQuery.data ?? []).map((value) => (
                <SelectItem key={value} value={value}>
                  {auditActionLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-entity">Entiteti</Label>
          <Select value={entityType} onValueChange={resetPage(setEntityType)}>
            <SelectTrigger id="audit-entity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>Të gjitha</SelectItem>
              {AUDIT_ENTITY_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {auditEntityLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-from">Prej datës</Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => resetPage(setFrom)(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-to">Deri më</Label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => resetPage(setTo)(event.target.value)}
          />
        </div>
      </div>

      {logsQuery.isPending ? (
        <LoadingRows rows={8} />
      ) : logsQuery.isError ? (
        <ErrorState error={logsQuery.error} onRetry={() => void logsQuery.refetch()} />
      ) : logsQuery.data.items.length === 0 ? (
        <EmptyState
          title="Asnjë veprim nuk përputhet me këta filtra"
          description="Provoni një periudhë tjetër ose pastroni filtrat."
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-background">
            <ul className="divide-y divide-border">
              {logsQuery.data.items.map((log) => (
                <AuditRow key={log.id} log={log} />
              ))}
            </ul>
          </div>

          <PaginationControls
            meta={logsQuery.data.meta}
            onPageChange={setPage}
            isDisabled={logsQuery.isFetching}
          />
        </>
      )}
    </>
  );
}
