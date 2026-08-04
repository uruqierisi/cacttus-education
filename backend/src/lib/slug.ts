/**
 * Slug generation.
 *
 * ALBANIAN CORRECTNESS
 * --------------------
 * `ë` and `ç` are the two characters that matter for Cacttus content, and they are
 * handled EXPLICITLY rather than being left to Unicode normalisation.
 *
 * NFD decomposition happens to split both into a base letter plus a combining mark,
 * so stripping marks would appear to work — but only for the precomposed code points.
 * Text pasted from Word or a CMS frequently already contains the decomposed form, and
 * a few sources use `e` + U+0308 vs the precomposed `ë` inconsistently. Mapping first
 * makes the behaviour identical either way and, more importantly, makes the intent
 * legible to the next person: "Aplikimi për Shkollë" must always become
 * `aplikimi-per-shkolle`, never `aplikimi-pr-shkoll`.
 *
 * The NFD pass afterwards still runs, to cover the rest of Latin-1 (é, à, ü, š …)
 * that may appear in a title without warning.
 */
import { FIELD_LIMITS } from '../config/constants';

/** Explicit first-pass map. Order matters: applied before Unicode normalisation. */
const CHARACTER_MAP: ReadonlyMap<string, string> = new Map([
  ['ë', 'e'],
  ['Ë', 'e'],
  ['ç', 'c'],
  ['Ç', 'c'],
  // Common in pasted copy; NFD would drop these rather than transliterate them.
  ['ä', 'a'],
  ['ö', 'o'],
  ['ü', 'u'],
  ['ß', 'ss'],
  ['đ', 'd'],
  ['Đ', 'd'],
  ['ø', 'o'],
  ['æ', 'ae'],
  ['œ', 'oe'],
]);

/** Fallback when a title contains nothing sluggable (e.g. only punctuation or emoji). */
const FALLBACK_SLUG = 'form';

/** Leaves room for a `-99` collision suffix inside the column limit. */
const COLLISION_SUFFIX_RESERVE = 4;
const MAX_BASE_LENGTH = FIELD_LIMITS.SLUG_MAX - COLLISION_SUFFIX_RESERVE;

function applyCharacterMap(input: string): string {
  let output = '';

  for (const character of input) {
    output += CHARACTER_MAP.get(character) ?? character;
  }

  return output;
}

/**
 * Convert arbitrary text into a URL-safe slug.
 *
 * Guarantees the result matches SLUG_PATTERN (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) — the same
 * shape `slugParamSchema` enforces on the public route — or returns the fallback.
 */
export function slugify(input: string): string {
  const slug = applyCharacterMap(input)
    // Split remaining accented characters into base + combining mark...
    .normalize('NFD')
    // ...then discard the marks.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // Anything that is not a-z0-9 becomes a separator.
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse runs and trim the ends.
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    // Slicing can leave a trailing hyphen.
    .replace(/-+$/g, '');

  return slug || FALLBACK_SLUG;
}

/**
 * Pick the first free slug in the `base`, `base-2`, `base-3` … sequence.
 *
 * `taken` is the set of slugs already present that could collide. Resolution is pure
 * and synchronous so it can be unit-tested without a database; the caller is
 * responsible for loading the candidate set (see `forms.service`).
 */
export function resolveSlugCollision(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) {
    return base;
  }

  // Starts at 2 so the human-readable sequence is `slug`, `slug-2`, `slug-3`.
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${base}-${suffix}`;

    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  // 98 forms sharing one title is a data-entry accident, not a use case.
  throw new Error(`Unable to derive a unique slug from "${base}" after 98 attempts.`);
}
