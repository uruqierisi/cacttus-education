import { Badge, type BadgeProps } from '@/components/ui/badge';
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from '@/lib/constants';

const STATUS_VARIANT: Record<SubmissionStatus, NonNullable<BadgeProps['variant']>> = {
  NEW: 'default',
  CONTACTED: 'success',
  ARCHIVED: 'muted',
};

export function StatusBadge({ status }: { status: SubmissionStatus }): JSX.Element {
  return <Badge variant={STATUS_VARIANT[status]}>{SUBMISSION_STATUS_LABELS[status]}</Badge>;
}
