
/**
 * `DD.MM.YYYY` — the Albanian convention.
 *
 * Built by hand rather than with `Intl.DateTimeFormat('sq-AL')`: browsers without
 * Albanian in their ICU data silently fall back to the default locale, which rendered
 * 15 April as `04/15/2026`. A date that reads as a different date depending on the
 * visitor's browser is worse than a hard-coded format.
 *
 * Read in UTC because start dates are stored as midnight UTC — using local getters
 * would show the previous day for anyone west of Greenwich.
 */
export function formatTrainingDate(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${day}.${month}.${date.getUTCFullYear()}`;
}


/**
 * `5 shkurt 2026` — the longer form, for article bylines.
 *
 * Separate from `formatTrainingDate` rather than a flag on it: a training's date is a
 * scheduling fact that must stay compact inside a meta row, an article's is prose. Month
 * names are a literal table for the reason given above — `Intl` cannot be trusted to have
 * Albanian, and a byline that reads "February" on some browsers is worse than no byline.
 *
 * Read in UTC to match the rest of this file, so the displayed day never shifts by one
 * for a visitor west of Greenwich.
 */
export const ALBANIAN_MONTHS = [
  "janar", "shkurt", "mars", "prill", "maj", "qershor",
  "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor",
];


export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return `${date.getUTCDate()} ${ALBANIAN_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
