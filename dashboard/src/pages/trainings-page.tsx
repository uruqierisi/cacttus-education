/**
 * Trajnimet — the training CATALOGUE.
 *
 * This screen used to be a filtered view of `GET /api/admin/forms?type=TRAINING`, i.e.
 * it listed FORMS that happened to collect training applications. It now manages
 * `Training` rows, which are a different thing: a training is a course with a card and a
 * public detail page, and it POINTS AT a form rather than being one. Several trainings
 * may share one application form, and a form shared on Instagram belongs to no training.
 *
 * The applications themselves have not moved — still Submissions, still in Aplikimet.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/state-views';
import { PaginationControls } from '@/components/common/pagination-controls';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { deleteTraining, listTrainings } from '@/api/trainings.api';
import { queryKeys } from '@/api/query-keys';
import type { Training } from '@/api/types';
import {
  DEFAULT_PAGE_SIZE,
  ROUTES,
  TRAINING_CATEGORY_LABELS,
  TRAINING_STATUS_LABELS,
  TRAINING_FORMAT_LABELS,
  publicTrainingUrl,
} from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/format';
import { describeApiError } from '@/lib/api-error';
import { useAuth } from '@/hooks/use-auth';
import { useDocumentTitle } from '@/hooks/use-document-title';

function MetaRow({ label, value }: { readonly label: string; readonly value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function TrainingsPage(): JSX.Element {
  useDocumentTitle('Trajnimet');

  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Training | null>(null);

  const filters = {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: 'order' as const,
    order: 'asc' as const,
  };

  const trainingsQuery = useQuery({
    queryKey: queryKeys.trainings.list(filters),
    queryFn: () => listTrainings(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (training: Training) => deleteTraining(training.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
      setPendingDelete(null);
      toast.success('Trajnimi u fshi.');
    },
    onError: (error: unknown) => toast.error(describeApiError(error)),
  });

  const totalApplications =
    trainingsQuery.data?.items.reduce((sum, training) => sum + training.submissionCount, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Trajnimet"
        description={
          trainingsQuery.data
            ? `${formatNumber(trainingsQuery.data.meta.total)} trajnime · ${formatNumber(
                totalApplications,
              )} aplikime në këtë faqe`
            : 'Katalogu i trajnimeve dhe faqet e tyre publike.'
        }
        actions={
          <Button asChild>
            <Link to={ROUTES.TRAINING_NEW}>
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
          description="Krijo trajnimin e parë dhe do të shfaqet menjëherë në faqen publike."
          action={
            <Button asChild>
              <Link to={ROUTES.TRAINING_NEW}>Krijo trajnim të ri</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {trainingsQuery.data.items.map((training) => (
              <Card key={training.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        <Link to={ROUTES.TRAINING_EDIT(training.id)} className="hover:underline">
                          {training.title}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {TRAINING_CATEGORY_LABELS[training.category]} · krijuar më{' '}
                        {formatDate(training.createdAt)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-semibold tabular-nums">
                        {formatNumber(training.submissionCount)}
                      </p>
                      <p className="text-xs text-muted-foreground">aplikime</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <MetaRow
                      label="Fillimi"
                      value={training.startDate ? formatDate(training.startDate) : '—'}
                    />
                    <MetaRow label="Formati" value={TRAINING_FORMAT_LABELS[training.format]} />
                    <MetaRow
                      label="Orët"
                      value={training.hours === null ? '—' : `${training.hours} orë`}
                    />
                    <MetaRow label="Ligjëruesi" value={training.instructor ?? '—'} />
                    <MetaRow label="Qyteti" value={training.city ?? '—'} />
                    <MetaRow label="Forma" value={training.formTitle ?? training.formSlug} />
                    <MetaRow
                      label="Statusi"
                      value={TRAINING_STATUS_LABELS[training.status]}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {training.isActive ? (
                      <Badge variant="success">Aktive</Badge>
                    ) : (
                      <Badge variant="warning">E ndalur</Badge>
                    )}
                    {/*
                      Only the finished state gets a badge. "Aktive" is already taken by
                      the publish flag directly above, so badging the active lifecycle too
                      would put the same word twice in one row meaning two different
                      things. The MetaRow above always spells the status out; this is the
                      at-a-glance marker for the case that differs from the default.
                    */}
                    {training.status === 'COMPLETED' ? (
                      <Badge variant="secondary">Përfunduar</Badge>
                    ) : null}
                    {/* The linked form no longer resolves — the Apliko button is dead. */}
                    {training.formTitle === null ? (
                      <Badge variant="warning">Forma mungon</Badge>
                    ) : null}
                    {training.description ? <Badge variant="secondary">Përshkrim</Badge> : null}
                    {training.strengths.length > 0 ? (
                      <Badge variant="secondary">{training.strengths.length} pika të forta</Badge>
                    ) : null}
                    {training.syllabusPdf ? <Badge variant="secondary">PDF</Badge> : null}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={publicTrainingUrl(training.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink />
                        Shiko faqen
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={ROUTES.TRAINING_EDIT(training.id)}>
                        <Pencil />
                        Ndrysho
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={`${ROUTES.SUBMISSIONS}?search=${encodeURIComponent(training.title)}`}
                      >
                        Shiko aplikimet
                        <ArrowRight />
                      </Link>
                    </Button>
                    {/* Soft delete is ADMIN-only server-side; hiding it from an EDITOR
                        avoids offering a button that could only ever 403. */}
                    {role === 'ADMIN' ? (
                      <Button variant="ghost" size="sm" onClick={() => setPendingDelete(training)}>
                        <Trash2 />
                        Fshi
                      </Button>
                    ) : null}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        title="Fshi trajnimin"
        description={
          <>
            <p>«{pendingDelete?.title}» do të hiqet nga faqja publike menjëherë.</p>
            <p className="mt-2">
              Aplikimet e bëra nga kjo faqe nuk fshihen — mbeten në Aplikimet.
            </p>
          </>
        }
        confirmLabel="Fshi"
        isDestructive
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete);
          }
        }}
      />
    </>
  );
}
