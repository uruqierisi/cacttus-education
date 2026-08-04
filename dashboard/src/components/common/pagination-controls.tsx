import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import type { PaginationMeta } from '@/lib/api-client';

type PaginationControlsProps = {
  readonly meta: PaginationMeta;
  readonly onPageChange: (page: number) => void;
  readonly isDisabled?: boolean;
};

export function PaginationControls({
  meta,
  onPageChange,
  isDisabled = false,
}: PaginationControlsProps): JSX.Element | null {
  if (meta.totalPages <= 1) {
    return null;
  }

  const canGoBack = meta.page > 1 && !isDisabled;
  const canGoForward = meta.page < meta.totalPages && !isDisabled;

  const firstRow = (meta.page - 1) * meta.pageSize + 1;
  const lastRow = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav
      className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row"
      aria-label="Faqosja"
    >
      <p className="text-sm text-muted-foreground">
        Po shfaqen {formatNumber(firstRow)}–{formatNumber(lastRow)} nga {formatNumber(meta.total)}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft />
          Mbrapa
        </Button>
        <span className="text-sm text-muted-foreground">
          Faqja {meta.page} nga {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Para
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
