import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Loading placeholder. `aria-hidden` because it carries no information for a reader. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div aria-hidden className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
  );
}
