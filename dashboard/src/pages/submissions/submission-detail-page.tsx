/**
 * Full-page view of one application.
 *
 * The drawer on the list page covers the common case; this exists because a submission
 * URL has to be shareable — an admin forwarding "look at this application" to a
 * colleague needs a link that opens the record directly, not the inbox.
 */
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingRows } from '@/components/common/state-views';
import { StatusBadge } from '@/components/common/status-badge';
import { AnswerList } from '@/components/submissions/answer-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSubmission } from '@/api/submissions.api';
import { getForm } from '@/api/forms.api';
import { queryKeys } from '@/api/query-keys';
import {
  ROUTES,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  type SubmissionStatus,
} from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useSubmissionStatusMutation } from '@/hooks/use-submission-status';

function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm sm:col-span-2">{value}</dd>
    </div>
  );
}

export default function SubmissionDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('Aplikimi');

  const submissionQuery = useQuery({
    queryKey: queryKeys.submissions.detail(id ?? ''),
    queryFn: () => getSubmission(id as string),
    enabled: Boolean(id),
  });

  const formId = submissionQuery.data?.formId;

  // Question labels only — see the note in `AnswerList`.
  const formQuery = useQuery({
    queryKey: queryKeys.forms.detail(formId ?? ''),
    queryFn: () => getForm(formId as string),
    enabled: Boolean(formId),
  });

  const statusMutation = useSubmissionStatusMutation();

  if (submissionQuery.isPending) {
    return <LoadingRows rows={5} />;
  }

  if (submissionQuery.isError) {
    return (
      <ErrorState error={submissionQuery.error} onRetry={() => void submissionQuery.refetch()} />
    );
  }

  const submission = submissionQuery.data;

  return (
    <>
      <PageHeader
        title={submission.name}
        description={`${submission.formTitle} · pranuar më ${formatDateTime(submission.createdAt)}`}
        actions={
          <Button asChild variant="outline">
            <Link to={ROUTES.SUBMISSIONS}>
              <ArrowLeft />
              Kthehu te aplikimet
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Aplikuesi</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Emri" value={submission.name} />
              <DetailRow label="Email" value={submission.email} />
              <DetailRow label="Telefoni" value={submission.phone} />
              <DetailRow
                label="Forma"
                value={`${submission.formTitle} (/${submission.formSlug})`}
              />
            </dl>

            <h2 className="mb-2 mt-6 text-sm font-semibold">Përgjigjet</h2>
            <AnswerList data={submission.data} fields={formQuery.data?.fields ?? []} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Trajtimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Aktualisht:</span>
              <StatusBadge status={submission.status} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-select">Ndrysho statusin</Label>
              <Select
                value={submission.status}
                onValueChange={(value) =>
                  statusMutation.mutate({
                    id: submission.id,
                    status: value as SubmissionStatus,
                  })
                }
                disabled={statusMutation.isPending}
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBMISSION_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {SUBMISSION_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button asChild variant="outline" className="w-full">
              <a href={`mailto:${submission.email}`}>Dërgo email</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
