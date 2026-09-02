
/**
 * Fold a city name for COMPARISON only: trim, lowercase, drop diacritics.
 *
 * The chips are built from the distinct `city` values on the trainings, so one record
 * typed "Prishtine" and another "Prishtinë" produced two chips for one city — which is
 * exactly what happened in production. The data itself has been normalised, and that is
 * the real fix; this is the guard that stops the next stray entry from doing it again.
 */
export function cityKey(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}


/**
 * Collapse spelling variants of one city down to a single chip.
 *
 * Keeps the ACCENTED spelling when both exist: after `normalize("NFD")` an accented
 * letter is two code points to the plain letter's one, so the longer decomposition is
 * the one carrying the diacritics — "Prishtinë" wins over "Prishtine" rather than the
 * chip label depending on which record happened to be created first.
 */
export function dedupeCities(values: readonly (string | null | undefined)[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of values) {
    // A training with no city (an online one) contributes no chip at all.
    const value = (raw ?? "").trim();
    if (!value) continue;
    const key = cityKey(value);
    const kept = byKey.get(key);
    if (!kept || value.normalize("NFD").length > kept.normalize("NFD").length) byKey.set(key, value);
  }
  return [...byKey.values()];
}
