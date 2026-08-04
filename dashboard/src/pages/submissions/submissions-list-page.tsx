/**
 * Aplikimet — the lead inbox. Available to BOTH roles.
 *
 * Filters live in the URL (`useSearchParams`), not in component state, so a filtered
 * view is a shareable link and survives a reload or a trip into a detail page and back.
 * That also makes the CSV export unambiguous: it is handed the same filter object that
 * produced the table.
 */
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Download, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/state-views';
import { PaginationControls } from '@/components/common/pagination-controls';
import { StatusBadge } from '@/components/common/status-badge';
import { SubmissionDrawer } from '@/components/submissions/submission-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { downloadSubmissionsCsv, listSubmissions } from '@/api/submissions.api';
import { listForms } from '@/api/forms.api';
import { queryKeys } from '@/api/query-keys';
import {
  ALL_FILTER_VALUE,
  DEFAULT_PAGE_SIZE,
  FORM_TYPES,
  FORM_TYPE_LABELS,
  MAX_PAGE_SIZE,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  type FormType,
  type SubmissionStatus,
} from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useSubmissionStatusMutation } from '@/hooks/use-submission-status';
import type { Submission } from '@/api/types';

/** Read a query param, mapping the "all" sentinel back to `undefined`. */
function readFilter(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key);
  return !value || value === ALL_FILTER_VALUE ? undefined : value;
}

export default function SubmissionsListPage(): JSX.Element {
  useDocumentTitle('Aplikimet');

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');
  const [isExporting, setIsExporting] = useState(false);
  const [activeRow, setActiveRow] = useState<Submission | null>(null);

  const debouncedSearch = useDebouncedValue(searchInput);

  const page = Number(searchParams.get('page') ?? '1') || 1;

  const filters = {
    formId: readFilter(searchParams, 'formId'),
    type: readFilter(searchParams, 'type') as FormType | undefined,
    status: readFilter(searchParams, 'status') as SubmissionStatus | undefined,
    search: debouncedSearch.trim() || undefined,
  };

  /** Write one filter and reset to page 1 — page 7 of the old result set is nonsense. */
  const setFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (!value || value === ALL_FILTER_VALUE) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous);
          params.set('page', String(next));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ ...filters, page }),
    queryFn: () => listSubmissions({ ...filters, page, pageSize: DEFAULT_PAGE_SIZE }),
  });

  // The picker needs every form, paused ones included, in a single page.
  const formsQuery = useQuery({
    queryKey: queryKeys.forms.list({ picker: true }),
    queryFn: () => listForms({ page: 1, pageSize: MAX_PAGE_SIZE }),
  });

  const statusMutation = useSubmissionStatusMutation();

  const handleSearchChange = (value: string): void => {
    setSearchInput(value);
    setFilter('search', value);
  };

  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    try {
      const result = await downloadSubmissionsCsv(filters);
      toast.success(`Eksporti u shkarkua: ${result.filename}`);
      if (result.isTruncated) {
        toast.warning('Eksporti u shkurtua në kufirin maksimal. Ngushtoni filtrat për të gjitha.');
      }
    } catch (error) {
      toast.error(describeApiError(error));
    } finally {
      setIsExporting(false);
    }
  };

  /** NEW <-> CONTACTED. ARCHIVED rows are left alone — that is a deliberate end state. */
  const toggleStatus = (submission: Submission): void => {
    const next: SubmissionStatus = submission.status === 'NEW' ? 'CONTACTED' : 'NEW';
    statusMutation.mutate({ id: submission.id, status: next });
  };

  return (
    <>
      <PageHeader
        title="Aplikimet"
        description="Çdo aplikim nga çdo formë publike."
        actions={
          <Button variant="outline" onClick={() => void handleExport()} disabled={isExporting}>
            <Download />
            {isExporting ? 'Duke përgatitur…' : 'Eksporto CSV'}
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="submission-search">Kërko</Label>
          <Input
            id="submission-search"
            placeholder="Emri, email ose telefon…"
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="submission-form">Forma</Label>
          <Select
            value={searchParams.get('formId') ?? ALL_FILTER_VALUE}
            onValueChange={(value) => setFilter('formId', value)}
          >
            <SelectTrigger id="submission-form">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>Të gjitha format</SelectItem>
              {(formsQuery.data?.items ?? []).map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="submission-type">Tipi</Label>
          <Select
            value={searchParams.get('type') ?? ALL_FILTER_VALUE}
            onValueChange={(value) => setFilter('type', value)}
          >
            <SelectTrigger id="submission-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>Të gjithë tipet</SelectItem>
              {FORM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {FORM_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="submission-status">Statusi</Label>
          <Select
            value={searchParams.get('status') ?? ALL_FILTER_VALUE}
            onValueChange={(value) => setFilter('status', value)}
          >
            <SelectTrigger id="submission-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>Të gjitha statuset</SelectItem>
              {SUBMISSION_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {SUBMISSION_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {submissionsQuery.isPending ? (
        <LoadingRows />
      ) : submissionsQuery.isError ? (
        <ErrorState error={submissionsQuery.error} onRetry={() => void submissionsQuery.refetch()} />
      ) : submissionsQuery.data.items.length === 0 ? (
        <EmptyState
          title="Asnjë aplikim nuk përputhet me këta filtra"
          description="Pastroni filtrat ose prisni aplikimin e radhës."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emri</TableHead>
                  <TableHead>Kontakti</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead>Pranuar</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionsQuery.data.items.map((submission) => (
                  <TableRow
                    key={submission.id}
                    // Row click opens the drawer. The row is not a <button> (invalid
                    // inside a table) so it carries the role + keyboard handler itself.
                    role="button"
                    tabIndex={0}
                    aria-label={`Hap detajet e aplikimit të ${submission.name}`}
                    className="cursor-pointer"
                    onClick={() => setActiveRow(submission)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveRow(submission);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{submission.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block max-w-[16rem] truncate">{submission.email}</span>
                      <span className="block text-xs">{submission.phone}</span>
                    </TableCell>
                    <TableCell>{submission.formTitle}</TableCell>
                    <TableCell>
                      <StatusBadge status={submission.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(submission.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {submission.status === 'ARCHIVED' ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          // The row's own click handler must not also fire.
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleStatus(submission);
                          }}
                        >
                          {submission.status === 'NEW' ? (
                            <>
                              <Check />
                              Shëno të kontaktuar
                            </>
                          ) : (
                            <>
                              <Undo2 />
                              Kthe në «I ri»
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            meta={submissionsQuery.data.meta}
            onPageChange={setPage}
            isDisabled={submissionsQuery.isFetching}
          />
        </>
      )}

      <SubmissionDrawer
        submission={activeRow}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRow(null);
          }
        }}
        footer={
          activeRow && activeRow.status !== 'ARCHIVED' ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                toggleStatus(activeRow);
                setActiveRow({
                  ...activeRow,
                  status: activeRow.status === 'NEW' ? 'CONTACTED' : 'NEW',
                });
              }}
            >
              {activeRow.status === 'NEW' ? 'Shëno të kontaktuar' : 'Kthe në «I ri»'}
            </Button>
          ) : null
        }
      />
    </>
  );
}
