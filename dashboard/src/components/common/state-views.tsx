/**
 * The three non-happy-path states every list and detail view must render explicitly:
 * loading, error and empty. Centralised so they look and behave identically everywhere.
 */
import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { describeApiError } from '@/lib/api-error';

const DEFAULT_SKELETON_ROWS = 5;

export function LoadingRows({ rows = DEFAULT_SKELETON_ROWS }: { rows?: number }): JSX.Element {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Duke u ngarkuar…</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

type ErrorStateProps = {
  readonly error: unknown;
  readonly onRetry?: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps): JSX.Element {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
    >
      <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
      <p className="text-sm font-medium text-foreground">Të dhënat nuk u ngarkuan</p>
      <p className="max-w-md text-sm text-muted-foreground">{describeApiError(error)}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Provo përsëri
        </Button>
      ) : null}
    </div>
  );
}

type EmptyStateProps = {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background p-12 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
