/**
 * Public URL + copy button.
 *
 * The confirmation is inline and transient (a two-second check mark) rather than a
 * toast: copying a link is a micro-action, and a stack of toasts for it would drown
 * out the ones that report real outcomes.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/download';
import { cn } from '@/lib/utils';

const CONFIRM_MS = 2_000;

export function CopyUrlButton({
  url,
  className,
}: {
  readonly url: string;
  readonly className?: string;
}): JSX.Element {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Clearing the timer on unmount is what stops a setState-after-unmount warning when
  // the row is removed (deleted form, page change) inside the confirmation window.
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const handleCopy = async (): Promise<void> => {
    const didCopy = await copyToClipboard(url);

    if (!didCopy) {
      toast.error('Kopjimi dështoi. Kopjoni linkun manualisht.');
      return;
    }

    setIsCopied(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setIsCopied(false), CONFIRM_MS);
  };

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
        {url}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={() => void handleCopy()}
        aria-label={`Kopjo linkun publik: ${url}`}
      >
        {isCopied ? <Check className="text-success" /> : <Copy />}
      </Button>
      {/* Announced to screen readers; the icon swap alone is silent. */}
      <span role="status" aria-live="polite" className="sr-only">
        {isCopied ? 'Linku u kopjua' : ''}
      </span>
    </div>
  );
}
