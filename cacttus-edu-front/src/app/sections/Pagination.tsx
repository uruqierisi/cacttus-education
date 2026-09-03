import { C } from "../theme";


/* 4.2 — Numbered pagination with prev/next.
 *
 * Renders nothing at all when there is only one page: controls that cannot move anywhere
 * are furniture, and the same guard already keeps a lone "Të gjitha" chip off the filter
 * row above it.
 *
 * Every control is a real <button>, not an <a>. The page lives in the query string and is
 * pushed onto history by the caller, so the browser's back button already walks the pages
 * — turning these into links would duplicate that in a second, competing mechanism.
 */
export function Pagination({
  page,
  totalPages,
  onSelect,
}: {
  page: number;
  totalPages: number;
  onSelect: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const arrowStyle = (disabled: boolean) => ({
    backgroundColor: C.n0,
    color: disabled ? C.n300 : C.n700,
    border: `1px solid ${C.n200}`,
    cursor: disabled ? "default" : "pointer",
  });

  return (
    <nav
      className="flex items-center justify-center gap-2 flex-wrap pt-12"
      /* Named for a screen reader, which otherwise announces a bare row of numbers. */
      aria-label="Faqet e lajmeve"
    >
      <button
        type="button"
        onClick={() => onSelect(page - 1)}
        disabled={isFirst}
        className="px-4 py-2 rounded-full text-sm font-medium transition-all"
        style={arrowStyle(isFirst)}
      >
        ← E mëparshme
      </button>

      {pages.map((value) => {
        const active = value === page;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            /* `aria-current` is what tells a screen reader WHICH number is the page you
               are on; colour alone says it only to people who can see it. */
            aria-current={active ? "page" : undefined}
            className="rounded-full text-sm font-medium transition-all"
            style={{
              minWidth: 40,
              height: 40,
              backgroundColor: active ? C.brand : C.n100,
              color: active ? "#fff" : C.n700,
              border: active ? `1px solid ${C.brand}` : `1px solid ${C.n200}`,
              cursor: active ? "default" : "pointer",
            }}
          >
            {value}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onSelect(page + 1)}
        disabled={isLast}
        className="px-4 py-2 rounded-full text-sm font-medium transition-all"
        style={arrowStyle(isLast)}
      >
        Tjetra →
      </button>
    </nav>
  );
}
