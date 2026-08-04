import { describe, expect, it } from 'vitest';
import { resolveSlugCollision, slugify } from '../../src/lib/slug';
import { FIELD_LIMITS } from '../../src/config/constants';

describe('slugify', () => {
  it('transliterates Albanian ë and ç instead of dropping them', () => {
    expect(slugify('Aplikimi për Shkollë')).toBe('aplikimi-per-shkolle');
    expect(slugify('Çështje Kibernetike')).toBe('ceshtje-kibernetike');
    expect(slugify('PËRQENDRIM ÇKA')).toBe('perqendrim-cka');
  });

  it('transliterates the other mapped characters', () => {
    expect(slugify('Straße')).toBe('strasse');
    expect(slugify('ærø œuvre ødegård')).toBe('aero-oeuvre-odegard');
    expect(slugify('Đakovica đ')).toBe('dakovica-d');
    expect(slugify('Grüße Öl Bär')).toBe('grusse-ol-bar');
  });

  /**
   * DOCUMENTED GAP, not an assertion of correctness.
   *
   * CHARACTER_MAP carries both cases of ë/ç/đ but only the lowercase æ/ø/œ, and those
   * three have no NFD decomposition — so an uppercase Æ/Ø/Œ is dropped rather than
   * transliterated. Harmless for Albanian (both cases of ë and ç are covered) and it
   * still yields a valid slug, but it is pinned here so a future change to the map is
   * a deliberate one.
   */
  it('drops uppercase Æ / Ø / Œ because only their lowercase forms are mapped', () => {
    expect(slugify('Ærø')).toBe('ro');
    expect(slugify('Œuvre')).toBe('uvre');
    expect(slugify('Ødegård')).toBe('degard');
    // The lowercase forms, by contrast, transliterate correctly.
    expect(slugify('ærø')).toBe('aero');
  });

  it('strips remaining accents through NFD normalisation', () => {
    expect(slugify('Café Résumé')).toBe('cafe-resume');
  });

  it('collapses separators and trims the ends', () => {
    expect(slugify('  Hello   ---  World!!  ')).toBe('hello-world');
    expect(slugify('a__b..c')).toBe('a-b-c');
  });

  it('falls back to "form" when nothing sluggable remains', () => {
    expect(slugify('!!!')).toBe('form');
    expect(slugify('   ')).toBe('form');
    expect(slugify('🎉🎉')).toBe('form');
  });

  it('reserves room for a collision suffix inside the column limit', () => {
    const slug = slugify('a'.repeat(400));

    expect(slug.length).toBe(FIELD_LIMITS.SLUG_MAX - 4);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('never leaves a trailing hyphen after truncation', () => {
    const title = `${'b'.repeat(FIELD_LIMITS.SLUG_MAX - 4 - 1)} tail`;

    expect(slugify(title).endsWith('-')).toBe(false);
  });
});

describe('resolveSlugCollision', () => {
  it('returns the base when it is free', () => {
    expect(resolveSlugCollision('aplikimi', new Set())).toBe('aplikimi');
  });

  it('appends -2 then -3 as collisions accumulate', () => {
    expect(resolveSlugCollision('aplikimi', new Set(['aplikimi']))).toBe('aplikimi-2');
    expect(resolveSlugCollision('aplikimi', new Set(['aplikimi', 'aplikimi-2']))).toBe(
      'aplikimi-3',
    );
  });

  it('skips gaps rather than reusing a taken suffix', () => {
    const taken = new Set(['x', 'x-2', 'x-4']);

    expect(resolveSlugCollision('x', taken)).toBe('x-3');
  });

  it('throws once 98 suffixes are exhausted', () => {
    const taken = new Set<string>(['x']);
    for (let index = 2; index < 100; index += 1) {
      taken.add(`x-${index}`);
    }

    expect(() => resolveSlugCollision('x', taken)).toThrow(/after 98 attempts/);
  });
});
