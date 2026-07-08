// The i18n Lazy Locales async loader seam (the async locale loader surface, made load-bearing by the lazy locale flip).
//
// ensureLocaleLoaded is the ONLY async surface in src/ui/i18n.ts; t() and setLanguage stay
// SYNCHRONOUS forever. After the lazy locale flip the non-en locales
// are no longer statically resident, so the await is now REAL: t() falls back to English for
// a not-yet-loaded locale (synchronous, never throws), and renders the localized table
// synchronously once ensureLocaleLoaded has made it resident. A failed chunk fetch rejects
// (the caller - bootstrap / picker - catches it) without crashing, leaving English in place
// and a retry possible.
//
// pt_BR is the single lazy (non-en) locale, so each test that needs a NON-RESIDENT
// starting state gets a fresh module graph via vi.resetModules() + dynamic import -
// residency is module state and would otherwise leak between tests.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '../src/ui/i18n.resolved.generated/en';
import { pt_BR } from '../src/ui/i18n.resolved.generated/pt_BR';

type I18nModule = typeof import('../src/ui/i18n');
type LoadersModule = typeof import('../src/ui/i18n.resolved.generated/loaders');

// A fresh, isolated i18n module graph: pt_BR starts NON-resident, language starts 'en',
// and the LOCALE_LOADERS instance is the one this graph's ensureLocaleLoaded consults
// (so spies on it are load-bearing).
async function freshI18n(): Promise<{ i18n: I18nModule; loaders: LoadersModule }> {
  vi.resetModules();
  const i18n = await import('../src/ui/i18n');
  const loaders = await import('../src/ui/i18n.resolved.generated/loaders');
  return { i18n, loaders };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('lazy-locale loader: t() stays synchronous around ensureLocaleLoaded', () => {
  it('falls back to English before the await, renders the locale synchronously after', async () => {
    const { i18n } = await freshI18n();
    // Non-vacuous floor: the locale genuinely differs from English, so the English-fallback
    // and the post-await localized read are distinguishable (not a trivially-passing equality).
    expect(pt_BR.nav.play).not.toBe(en.nav.play);
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);

    i18n.setLanguage('pt_BR');

    // Pre-await: the pt_BR chunk is not resident yet, so t() returns the synchronous English
    // fallback - it never blocks and never throws (the lazy flip's R-class guarantee).
    const before = i18n.t('nav.play');
    expect(typeof before).toBe('string');
    expect(before).toBe(en.nav.play);

    await i18n.ensureLocaleLoaded('pt_BR');
    expect(i18n.isLocaleResident('pt_BR')).toBe(true);

    // Post-await: still synchronous, now resolved against the resident Portuguese table.
    const after = i18n.t('nav.play');
    expect(typeof after).toBe('string');
    expect(after).toBe(pt_BR.nav.play);
  });

  it('rejects a failed locale chunk softly: t() stays English, no crash, retry possible', async () => {
    const { i18n, loaders } = await freshI18n();
    // Keep the active language English so a failed background load never disturbs the UI.
    i18n.setLanguage('en');
    // Non-vacuous floor: pt_BR genuinely differs from English, so the English-fallback
    // assertion below (t("nav.play") === en.nav.play) proves the fallback fired - not a
    // coincidental equality that would also pass if pt_BR.nav.play happened to equal
    // en.nav.play.
    expect(pt_BR.nav.play).not.toBe(en.nav.play);
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);

    // Simulate a 404 / network failure on the pt_BR chunk. ensureLocaleLoaded rejects (so the
    // picker/bootstrap can react - the picker renders settings.languageLoadFailed), but the
    // app does not crash and pt_BR stays non-resident.
    const failSpy = vi
      .spyOn(loaders.LOCALE_LOADERS, 'pt_BR')
      .mockRejectedValueOnce(new Error('simulated 404'));
    await expect(i18n.ensureLocaleLoaded('pt_BR')).rejects.toThrow(/simulated 404/);
    failSpy.mockRestore();
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);

    // A synchronous read against the failed locale falls back to English - never throws.
    i18n.setLanguage('pt_BR');
    expect(i18n.t('nav.play')).toBe(en.nav.play);
    i18n.setLanguage('en');

    // The failed load cleared `inflight`, so a subsequent real load can still succeed.
    await i18n.ensureLocaleLoaded('pt_BR');
    expect(i18n.isLocaleResident('pt_BR')).toBe(true);
  });

  it('treats English as always resident and instant', async () => {
    const { i18n } = await freshI18n();
    expect(i18n.isLocaleResident('en')).toBe(true);
    await expect(i18n.ensureLocaleLoaded('en')).resolves.toBeUndefined();
  });

  it('coalesces two concurrent loads of the same locale onto one import', async () => {
    const { i18n, loaders } = await freshI18n();
    // Precondition: pt_BR is not yet resident (fresh module graph), so we exercise the real
    // load path (the inflight branch) rather than the resident short-circuit. If a
    // reordering ever made it resident first, this fails loudly instead of silently
    // vacuating the proof below.
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);

    // ensureLocaleLoaded is async, so each call returns a fresh wrapper promise - outer
    // promise identity (p1 === p2) can NEVER hold and would not prove coalescing. The real
    // proof is that the underlying loader thunk runs exactly ONCE for two concurrent calls:
    // the first call sets `inflight` synchronously (no await before inflight.set), so the
    // second call short-circuits onto it. Spy-through (the real import still resolves, so
    // pt_BR becomes resident); delete the inflight.get short-circuit and this count becomes 2.
    const loadSpy = vi.spyOn(loaders.LOCALE_LOADERS, 'pt_BR');
    try {
      await Promise.all([i18n.ensureLocaleLoaded('pt_BR'), i18n.ensureLocaleLoaded('pt_BR')]);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    } finally {
      loadSpy.mockRestore();
    }
    expect(i18n.isLocaleResident('pt_BR')).toBe(true);

    // Once resident, t() renders that locale synchronously.
    i18n.setLanguage('pt_BR');
    expect(i18n.t('nav.play')).toBe(pt_BR.nav.play);
  });

  it('loading a locale does not change the active language (load is decoupled from select)', async () => {
    const { i18n } = await freshI18n();
    // ensureLocaleLoaded only makes a locale's table resident; SELECTING it is setLanguage's
    // job. A real fresh load (pt_BR) while still on en must NOT change what t() renders -
    // this pins the separation that lets the bootstrap await the load behind the loading
    // screen without prematurely switching the language (t() stays driven
    // by setLanguage, never by a load).
    i18n.setLanguage('en');
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);
    await i18n.ensureLocaleLoaded('pt_BR');
    expect(i18n.isLocaleResident('pt_BR')).toBe(true);
    expect(i18n.t('nav.play')).toBe(en.nav.play);
  });

  it('renders the 3 language-load status keys via t() (en)', async () => {
    const { i18n } = await freshI18n();
    i18n.setLanguage('en');
    expect(i18n.t('settings.languageLoading')).toBe(en.settings.languageLoading);
    expect(i18n.t('settings.languageLoadFailed')).toBe(en.settings.languageLoadFailed);
    expect(i18n.t('settings.languageLoadUnavailable')).toBe(en.settings.languageLoadUnavailable);
  });
});

describe('prefetchLocale (stored-locale modulepreload runtime prefetch)', () => {
  it('fires the loader exactly once for a non-en, non-resident locale', async () => {
    const { i18n, loaders } = await freshI18n();
    i18n.setLanguage('en');
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);
    const spy = vi.spyOn(loaders.LOCALE_LOADERS, 'pt_BR');
    try {
      // ensureLocaleLoaded sets inflight (and invokes the thunk) synchronously, so a single
      // fire-and-forget prefetch issues exactly one import; the await coalesces onto it.
      i18n.prefetchLocale('pt_BR');
      expect(spy).toHaveBeenCalledTimes(1);
      await i18n.ensureLocaleLoaded('pt_BR');
    } finally {
      spy.mockRestore();
    }
    expect(i18n.isLocaleResident('pt_BR')).toBe(true);
  });

  it('is a no-op for English (preserves the zero-non-en-bytes guarantee)', async () => {
    const { i18n } = await freshI18n();
    i18n.setLanguage('en');
    // English has no LOCALE_LOADERS entry; prefetchLocale must return early without firing.
    expect(() => i18n.prefetchLocale('en')).not.toThrow();
    expect(i18n.isLocaleResident('en')).toBe(true);
  });

  it('is a no-op for an already-resident locale (never re-fetches)', async () => {
    const { i18n, loaders } = await freshI18n();
    await i18n.ensureLocaleLoaded('pt_BR');
    expect(i18n.isLocaleResident('pt_BR')).toBe(true);
    const spy = vi.spyOn(loaders.LOCALE_LOADERS, 'pt_BR');
    try {
      i18n.prefetchLocale('pt_BR');
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('swallows a rejected prefetch (no unhandled rejection; a retry still succeeds)', async () => {
    const { i18n, loaders } = await freshI18n();
    i18n.setLanguage('en');
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);
    const failSpy = vi
      .spyOn(loaders.LOCALE_LOADERS, 'pt_BR')
      .mockRejectedValueOnce(new Error('simulated 404'));
    // prefetchLocale returns void and swallows the rejection; if it did not, the rejected
    // microtask would surface as an unhandledRejection and fail the run.
    i18n.prefetchLocale('pt_BR');
    await new Promise((r) => setTimeout(r, 0));
    failSpy.mockRestore();
    expect(i18n.isLocaleResident('pt_BR')).toBe(false);
    // The failed load cleared inflight, so a fresh real load still succeeds.
    await i18n.ensureLocaleLoaded('pt_BR');
    expect(i18n.isLocaleResident('pt_BR')).toBe(true);
  });
});
