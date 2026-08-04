/**
 * Optimistic status transitions for a submission.
 *
 * Triaging an inbox is a rapid, repetitive action — the badge has to flip the instant
 * it is clicked, not 300 ms later. So the cache is written first and the request goes
 * out behind it.
 *
 * The rollback is the part that matters. `onMutate` snapshots EVERY cached submissions
 * query (list pages under different filters, the detail entry, the dashboard's "recent"
 * slice — the same row can be sitting in several of them at once) and `onError` puts
 * all of them back exactly as they were. A half-restored cache would leave the table
 * showing "I kontaktuar" while the server still says "I ri", which is the worst outcome
 * of the three: worse than a slow update, and worse than an honest failure.
 */
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateSubmissionStatus } from '@/api/submissions.api';
import { queryKeys } from '@/api/query-keys';
import { describeApiError } from '@/lib/api-error';
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from '@/lib/constants';
import type { Paginated } from '@/lib/api-client';
import type { Submission } from '@/api/types';

type Variables = {
  readonly id: string;
  readonly status: SubmissionStatus;
};

type Snapshot = readonly [QueryKey, unknown][];

/** Narrow an unknown cache entry to a paginated submissions page. */
function isPaginatedSubmissions(value: unknown): value is Paginated<Submission> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { items?: unknown }).items)
  );
}

function isSubmission(value: unknown): value is Submission {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { formId?: unknown }).formId === 'string'
  );
}

/** Apply the new status to whichever shape this particular cache entry holds. */
function patchEntry(entry: unknown, id: string, status: SubmissionStatus): unknown {
  if (isPaginatedSubmissions(entry)) {
    return {
      ...entry,
      items: entry.items.map((item) => (item.id === id ? { ...item, status } : item)),
    };
  }

  if (isSubmission(entry) && entry.id === id) {
    return { ...entry, status };
  }

  return entry;
}

export function useSubmissionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<Submission, unknown, Variables, Snapshot>({
    mutationFn: ({ id, status }) => updateSubmissionStatus(id, status),

    onMutate: async ({ id, status }) => {
      // Any refetch already in flight would land AFTER the optimistic write and undo
      // it, so it has to be cancelled before the cache is touched.
      await queryClient.cancelQueries({ queryKey: queryKeys.submissions.all });

      const snapshot = queryClient.getQueriesData({ queryKey: queryKeys.submissions.all });

      queryClient.setQueriesData({ queryKey: queryKeys.submissions.all }, (entry: unknown) =>
        patchEntry(entry, id, status),
      );

      return snapshot;
    },

    onError: (error, _variables, snapshot) => {
      // Restore every key captured above, not just the one the user was looking at.
      snapshot?.forEach(([key, entry]) => {
        queryClient.setQueryData(key, entry);
      });
      toast.error(describeApiError(error));
    },

    onSuccess: (_data, { status }) => {
      toast.success(`Statusi u ndryshua në «${SUBMISSION_STATUS_LABELS[status]}».`);
    },

    onSettled: () => {
      // Reconcile with the server regardless of outcome — the optimistic value was a
      // prediction, and the stats cards derived from it need the real numbers.
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}
