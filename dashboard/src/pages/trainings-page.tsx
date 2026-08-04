/**
 * Trajnimet — the TRAINING slice of the forms list.
 *
 * Not a new resource: it is `GET /api/admin/forms?type=TRAINING`, given its own screen
 * because "how are the trainings doing?" is a question someone asks daily and should
 * not require filtering Format by hand each time. Every card links straight into that
 * form's applications with the filter pre-applied.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/state-views';
import { PaginationControls } from '@/components/common/pagination-controls';
import { CopyUrlButton } from '@/components/forms/copy-url-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { listForms } from '@/api/forms.api';
import { queryKeys } from '@/api/query-keys';
import { DEFAULT_PAGE_SIZE, ROUTES, publicFormUrl } from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function TrainingsPage(): JSX.Element {
  useDocumentTitle('Trajnimet');

  const [page, setPage] = useState(1);

  const filters = {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    type: 'TRAINING' as const,
    sort: 'createdAt' as const,
    order: 'desc' as const,
  };

  const trainingsQuery = useQuery({
    queryKey: queryKeys.forms.list(filters),
    queryFn: () => listForms(filters),
  });

  const totalApplications =
    trainingsQuery.data?.items.reduce((sum, form) => sum + form.submissionCount, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Trajnimet"
        description={
          trainingsQuery.data
            ? `${formatNumber(trainingsQuery.data.meta.total)} trajnime · ${formatNumber(
                totalApplications,
              )} aplikime në këtë faqe`
            : 'Format e tipit «Trajnime» dhe aplikimet e tyre.'
        }
        actions={
          <Button asChild>
            <Link to={ROUTES.FORM_NEW}>
              <Plus />
              Krijo trajnim të ri
            </Link>
          </Button>
        }
      />

      {trainingsQuery.isPending ? (
        <LoadingRows />
      ) : trainingsQuery.isError ? (
        <ErrorState error={trainingsQuery.error} onRetry={() => void trainingsQuery.refetch()} />
      ) : trainingsQuery.data.items.length === 0 ? (
        <EmptyState
          title="Ende nuk ka trajnime"
          description="Krijo një formë me programin «Trajnime» dhe do të shfaqet këtu."
          action={
            <Button asChild>
              <Link to={ROUTES.FORM_NEW}>Krijo trajnim të ri</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {trainingsQuery.data.items.map((form) => (
              <Card key={form.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        <Link to={ROUTES.FORM_EDIT(form.id)} className="hover:underline">
                          {form.title}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Krijuar më {formatDate(form.createdAt)}
                      </p>
                    </div>

                    {/*
                      The submission count is the number this screen exists for, so it
                      gets hero-figure treatment rather than sitting inside a sentence.
                    */}
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-semibold tabular-nums">
                        {formatNumber(form.submissionCount)}
                      </p>
                      <p className="text-xs text-muted-foreground">aplikime</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {form.isActive ? (
                      <Badge variant="success">Aktive</Badge>
                    ) : (
                      <Badge variant="warning">E ndalur</Badge>
                    )}
                  </div>

                  <CopyUrlButton url={publicFormUrl(form.slug)} />

                  <div className="flex justify-end border-t border-border pt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`${ROUTES.SUBMISSIONS}?formId=${form.id}`}>
                        Shiko aplikimet
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls
            meta={trainingsQuery.data.meta}
            onPageChange={setPage}
            isDisabled={trainingsQuery.isFetching}
          />
        </>
      )}
    </>
  );
}
