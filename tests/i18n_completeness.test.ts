import { beforeAll, describe, expect, it } from 'vitest';
import {
  en,
  ensureLocaleLoaded,
  formatMoney,
  hasTranslation,
  languageTag,
  pt_BR,
  type SupportedLanguage,
  setLanguage,
  supportedLanguages,
  tPlural,
} from '../src/ui/i18n';

// Whole-catalog i18n completeness guards that the per-key sample tests in
// localization_coverage.test.ts do not cover: full interpolation-token parity
// across EVERY leaf and locale, per-locale lazy loadability, locale-aware money
// grouping, and the CLDR pluralization subsystem (tPlural + the
// hudChrome.plurals.* keys).

const TABLES: Record<SupportedLanguage, unknown> = {
  en,
  pt_BR,
};

function flatten(
  obj: unknown,
  prefix = '',
  out: Record<string, string> = {},
): Record<string, string> {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') flatten(v, key, out);
      else if (typeof v === 'string') out[key] = v;
    }
  }
  return out;
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((m) => m[1]).sort();
}

const enFlat = flatten(en);

describe('i18n whole-catalog completeness', () => {
  beforeAll(async () => {
    await Promise.all(supportedLanguages.map((lang) => ensureLocaleLoaded(lang)));
  });

  // H10: every locale must carry the EXACT {placeholder} set of `en` for every
  // leaf - across the whole catalog, not just hud/abilityUi/questUi/itemUi. A drift
  // here breaks interpolate() (a dropped/renamed token renders a literal {brace} or
  // silently omits a value) and the type system cannot see it.
  it('every locale preserves the exact interpolation tokens of en for every leaf', () => {
    const mismatches: string[] = [];
    for (const lang of supportedLanguages) {
      if (lang === 'en') continue;
      const flat = flatten(TABLES[lang]);
      for (const [key, enValue] of Object.entries(enFlat)) {
        const localeValue = flat[key];
        if (typeof localeValue !== 'string') continue;
        const a = placeholders(enValue).join(',');
        const b = placeholders(localeValue).join(',');
        if (a !== b) mismatches.push(`${lang} ${key}: en{${a}} vs {${b}}`);
      }
    }
    expect(mismatches, mismatches.slice(0, 25).join('\n')).toEqual([]);
  });

  // L6: every advertised locale must lazy-load, become resident, and resolve real
  // localized text.
  it('every supportedLanguage loads and resolves a localized, non-empty sample', async () => {
    for (const lang of supportedLanguages) {
      await ensureLocaleLoaded(lang);
      setLanguage(lang);
      // A key every locale translates; must be present and non-empty.
      expect(hasTranslation('classes.warrior', lang), `${lang} missing classes.warrior`).toBe(true);
      const flat = flatten(TABLES[lang]);
      expect(
        (flat['classes.warrior'] ?? '').length,
        `${lang} empty classes.warrior`,
      ).toBeGreaterThan(0);
      // Intl tag must be well-formed (no underscore RangeError).
      expect(() => new Intl.NumberFormat(languageTag(lang)), `${lang} bad tag`).not.toThrow();
    }
    setLanguage('en');
  });

  // M17: money grouping must follow the active locale (the compact-money path runs
  // each amount through formatNumber). 12,345 gold exercises a thousands separator:
  // en groups with a comma, pt_BR with a period.
  it('formatMoney groups thousands by the active locale', async () => {
    const bigGold = 12_345 * 10_000; // copper -> 12,345g
    await ensureLocaleLoaded('pt_BR');
    setLanguage('en');
    const enMoney = formatMoney(bigGold);
    setLanguage('pt_BR');
    const ptMoney = formatMoney(bigGold);
    setLanguage('en');
    expect(enMoney).toContain('12,345');
    expect(ptMoney).toContain('12.345');
    expect(ptMoney).not.toContain('12,345');
  });
});

describe('i18n CLDR pluralization', () => {
  const CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;

  beforeAll(async () => {
    await Promise.all(supportedLanguages.map((lang) => ensureLocaleLoaded(lang)));
  });

  // The plural bases declared in the catalog (under hudChrome.plurals).
  const enPlurals = (en as { hudChrome: { plurals: Record<string, Record<string, string>> } })
    .hudChrome.plurals;
  const bases = Object.keys(enPlurals);

  it('declares the expected plural bases with all four CLDR categories in en', () => {
    expect(bases.sort()).toEqual([
      'characterCount',
      'guildMembers',
      'playersMatching',
      'playersOnline',
      'secondsRemaining',
    ]);
    for (const base of bases) {
      for (const cat of ['one', 'few', 'many', 'other']) {
        expect(typeof enPlurals[base][cat], `en plurals.${base}.${cat}`).toBe('string');
      }
    }
  });

  it('every locale supplies a non-empty leaf for each CLDR category its plural rules can select', () => {
    const missing: string[] = [];
    for (const lang of supportedLanguages) {
      const need = new Intl.PluralRules(languageTag(lang)).resolvedOptions().pluralCategories;
      const flat = flatten(TABLES[lang]);
      for (const base of bases) {
        for (const cat of need) {
          if (!CATEGORIES.includes(cat as (typeof CATEGORIES)[number])) continue;
          const v = flat[`hudChrome.plurals.${base}.${cat}`];
          if (typeof v !== 'string' || v.length === 0) missing.push(`${lang} ${base}.${cat}`);
        }
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('tPlural selects the correct Portuguese one/other forms', async () => {
    await ensureLocaleLoaded('pt_BR');
    setLanguage('pt_BR');
    // personagem (1) / personagens (2+)
    expect(tPlural('hudChrome.plurals.characterCount', 1)).toBe('1 personagem');
    expect(tPlural('hudChrome.plurals.characterCount', 7)).toBe('7 personagens');
    setLanguage('en');
  });

  it('tPlural selects one/other for English and is count-substituted', async () => {
    setLanguage('en');
    expect(tPlural('hudChrome.plurals.characterCount', 1)).toBe('1 character');
    expect(tPlural('hudChrome.plurals.characterCount', 7)).toBe('7 characters');
  });
});
