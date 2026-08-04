/**
 * Row-click detail panel for the applications table.
 *
 * The row already carries the summary the table shows, so the panel opens INSTANTLY
 * with that data and then fills in the answers once the detail (and the parent form's
 * field definitions, which supply the real question labels) arrive. Waiting on the
 * network before showing anything would make every row click feel broken.
 */
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone } from 'lucide-react';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/status-badge';
import { ErrorState } from '@/components/common/state-views';
import { AnswerList } from './answer-list';
import { getSubmission } from '@/api/submissions.api';
import { getForm } from '@/api/forms.api';
import { queryKeys } from '@/api/query-keys';
import { formatDateTime } from '@/lib/format';
import type { Submission } from '@/api/types';

type SubmissionDrawerProps = {
  /** The row that was clicked. `null` closes the panel. */
  readonly submission: Submission | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly footer?: React.ReactNode;
};

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  readonly icon: typeof Mail;
  readonly label: string;
  readonly value: string;
  readonly href: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <a href={href} className="block truncate text-sm font-medium hover:underline">
          {value}
        </a>
      </div>
    </div>
  );
}

export function SubmissionDrawer({
  submission,
  onOpenChange,
  footer,
}: SubmissionDrawerProps): JSX.Element {
  const isOpen = submission !== null;

  const detailQuery = useQuery({
    queryKey: queryKeys.submissions.detail(submission?.id ?? ''),
    queryFn: () => getSubmission(submission?.id ?? ''),
    enabled: isOpen,
  });

  // Only for the question labels. A failure here is not worth an error state — the
  // answers still render with humanised keys.
  const formQuery = useQuery({
    queryKey: queryKeys.forms.detail(submission?.formId ?? ''),
    queryFn: () => getForm(submission?.formId ?? ''),
    enabled: isOpen && Boolean(submission?.formId),
  });

  const detail = detailQuery.data ?? submission;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader>
          <DrawerTitle>{detail?.name ?? '—'}</DrawerTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {detail ? <StatusBadge status={detail.status} /> : null}
            <span className="text-sm text-muted-foreground">
              {detail ? formatDateTime(detail.createdAt) : '—'}
            </span>
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          {detail ? (
            <>
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Kontakti</h3>
                <ContactRow
                  icon={Mail}
                  label="Email"
                  value={detail.email}
                  href={`mailto:${detail.email}`}
                />
                <ContactRow
                  icon={Phone}
                  label="Telefon"
                  value={detail.phone}
                  href={`tel:${detail.phone}`}
                />
              </section>

              <section>
                <h3 className="mb-1 text-sm font-semibold">Forma</h3>
                <p className="text-sm text-muted-foreground">
                  {detail.formTitle}{' '}
                  <span className="font-mono text-xs">/{detail.formSlug}</span>
                </p>
              </section>

              <section>
                <h3 className="mb-1 text-sm font-semibold">Përgjigjet</h3>
                {detailQuery.isPending ? (
                  <div className="space-y-3 pt-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : detailQuery.isError ? (
                  <ErrorState
                    error={detailQuery.error}
                    onRetry={() => void detailQuery.refetch()}
                  />
                ) : (
                  <AnswerList
                    data={detailQuery.data.data}
                    fields={formQuery.data?.fields ?? []}
                  />
                )}
              </section>
            </>
          ) : null}
        </DrawerBody>

        <DrawerFooter className="flex flex-col gap-2 sm:flex-row">
          {footer}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href={`mailto:${detail?.email ?? ''}`}>Dërgo email</a>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
