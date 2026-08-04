import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

/** Delay a fast-changing value (search box) so it does not fire a request per keystroke. */
export function useDebouncedValue<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
