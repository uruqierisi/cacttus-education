/**
 * Format — every public form, as cards rather than a table.
 *
 * A card, not a row, because the primary thing an admin does here is COPY THE PUBLIC
 * URL, and a URL plus a copy button does not fit a table cell at 375px without
 * truncating the one string that has to be complete to be useful.
 *
 * "Të arkivuara" is ADMIN-only and hits a different endpoint (`/forms/archived`), not a
 * filter on this one — mirroring the API.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/state-views';
import { PaginationControls } from '@/components/common/pagination-controls';
import { CopyUrlButton } from '@/components/forms/copy-url-button';
import { DeleteFormDialog } from '@/components/forms/delete-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { listArchivedForms, listForms, restoreForm, softDeleteForm } from '@/api/forms.api';
import { queryKeys } from '@/api/query-keys';
import type { Form } from '@/api/types';
import {
  DEFAULT_PAGE_SIZE,
  FORM_TYPE_LABELS,
  ROUTES,
  publicFormUrl,
} from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useAuth } from '@/hooks/use-auth';

type Tab = 'active' | 'archived';

export default function FormsListPage(): JSX.Element {
  useDocumentTitle('Format');

  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [tab, setTab] = useState<Tab>('active');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Form | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const filters = { page, pageSize: DEFAULT_PAGE_SIZE, search: debouncedSearch.trim() || undefined };

  const activeQuery = useQuery({
    queryKey: queryKeys.forms.list(filters),
    queryFn: () => listForms(filters),
    enabled: tab === 'active',
  });

  const archivedQuery = useQuery({
    queryKey: queryKeys.forms.archived(filters),
    queryFn: () => listArchivedForms(filters),
    // Guarded twice: the tab is not rendered for an EDITOR, and even if it were, the
    // query would not fire. The API would answer 403 regardless.
    enabled: tab === 'archived' && isAdmin,
  });

  const query = tab === 'active' ? activeQuery : archivedQuery;

  const invalidateForms = (): void => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteForm(id),
    onSuccess: () => {
      toast.success('Forma u arkivua. Aplikimet e saj mbeten të paprekura.');
      invalidateForms();
    },
    // No onError toast here: DeleteFormDialog owns the failure message so the export
    // and the delete report through one voice.
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreForm(id),
    onSuccess: () => {
      toast.success('Forma u rikthye.');
      invalidateForms();
    },
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  const switchTab = (next: Tab): void => {
    setTab(next);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Format"
        description="Çdo formë ka një link publik. Fushat konfigurohen këtu — pa nevojë për deploy."
        actions={
          <Button asChild>
            <Link to={ROUTES.FORM_NEW}>
              <Plus />
              Krijo formë të re
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          className="sm:max-w-xs"
          placeholder="Kërko sipas titullit ose slug-ut…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          aria-label="Kërko forma"
        />

        {isAdmin ? (
          <div
            role="tablist"
            aria-label="Filtri i formave"
            className="flex rounded-md border border-border p-0.5"
          >
            {([
              ['active', 'Aktive'],
              ['archived', 'Të arkivuara'],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                role="tab"
                aria-selected={tab === value}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3',
                  tab === value && 'bg-accent text-accent-foreground hover:bg-accent',
                )}
                onClick={() => switchTab(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {query.isPending ? (
        <LoadingRows />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title={tab === 'archived' ? 'Nuk ka forma të arkivuara' : 'Ende nuk ka forma'}
          description={
            tab === 'archived'
              ? 'Format e fshira shfaqen këtu dhe mund të rikthehen.'
              : 'Krijo formën e parë për të filluar mbledhjen e aplikimeve.'
          }
          action={
            tab === 'active' ? (
              <Button asChild>
                <Link to={ROUTES.FORM_NEW}>Krijo formë të re</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/*
            Two columns from `xl`, one below. Three would squeeze the URL row into
            an ellipsis on a 1280px laptop, which defeats the card's purpose.
          */}
          <div className="grid gap-4 xl:grid-cols-2">
            {query.data.items.map((form) => (
              <Card key={form.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        <Link to={ROUTES.FORM_EDIT(form.id)} className="hover:underline">
                          {form.title}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {FORM_TYPE_LABELS[form.type]} · krijuar {formatDate(form.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {form.isDeleted ? (
                        <Badge variant="muted">E arkivuar</Badge>
                      ) : form.isActive ? (
                        <Badge variant="success">Aktive</Badge>
                      ) : (
                        <Badge variant="warning">E ndalur</Badge>
                      )}
                    </div>
                  </div>

                  <CopyUrlButton url={publicFormUrl(form.slug)} />

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <Link
                      to={`${ROUTES.SUBMISSIONS}?formId=${form.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                      <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {formatNumber(form.submissionCount)} aplikime
                    </Link>

                    <div className="flex gap-2">
                      {form.isDeleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isAdmin || restoreMutation.isPending}
                          onClick={() => restoreMutation.mutate(form.id)}
                        >
                          <RotateCcw />
                          Rikthe
                        </Button>
                      ) : (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link to={ROUTES.FORM_EDIT(form.id)}>
                              <Pencil />
                              Ndrysho
                            </Link>
                          </Button>
                          {isAdmin ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingDelete(form)}
                            >
                              <Trash2 />
                              Fshij
                            </Button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls
            meta={query.data.meta}
            onPageChange={setPage}
            isDisabled={query.isFetching}
          />
        </>
      )}

      <DeleteFormDialog
        form={pendingDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        onDelete={(form) => deleteMutation.mutateAsync(form.id).then(() => undefined)}
      />
    </>
  );
}
