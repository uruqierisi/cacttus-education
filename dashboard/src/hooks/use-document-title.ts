import { useEffect } from 'react';

const TITLE_SUFFIX = 'Cacttus Education Admin';

/** Keep the browser tab label in sync with the current page. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — ${TITLE_SUFFIX}`;

    return () => {
      document.title = previous;
    };
  }, [title]);
}
