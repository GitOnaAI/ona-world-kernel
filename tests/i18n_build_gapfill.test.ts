import { describe, expect, it } from 'vitest';
import { en, pt_BR } from '../src/ui/i18n.resolved.generated';

// Build gap-fill semantics, asserted on the GENERATED resolved table
// (the per-locale slices under src/ui/i18n.resolved.generated/). scripts/i18n_build.mjs
// overlays each locale onto a deep copy of nested `en` (deepMerge), so a leaf the overlay
// PROVIDES is preserved and every emitted locale is DENSE (the full en leaf set, no gaps).
// The committed locale set is {en, pt_BR} and the pt_BR overlay is currently dense, so the
// fill-from-English branch has no committed sparse-overlay data to exercise; the
// preserve-present and dense-emit invariants below are what a merge regression would break.
// The byte-equivalence SHA gate locks these values too, but only as an opaque hash; this
// names the behavior on representative keys so a regression reports as a readable
// assertion failure rather than a re-baseline-able hash drift.

function get(obj: unknown, dotted: string): unknown {
  return dotted
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      obj,
    );
}

// Collect every leaf path (recurse objects AND arrays; a non-object value is a leaf).
function leafPaths(obj: unknown, prefix = '', out: string[] = []): string[] {
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj as Record<string, unknown>)) {
      leafPaths((obj as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.push(prefix);
  }
  return out;
}

describe('i18n build gap-fill (preserve-present / dense emit)', () => {
  it('preserves a present translated leaf rather than overwriting it with English', () => {
    // pt_BR is a dense locale; its real translation must survive the overlay-onto-en merge.
    expect(get(pt_BR, 'nav.home')).toBe('Início');
    expect(get(pt_BR, 'nav.home')).not.toBe(get(en, 'nav.home'));
  });

  it('emits a dense table: the locale resolves to the full English leaf set (no gaps)', () => {
    const enLeaves = leafPaths(en).sort();
    expect(enLeaves.length).toBeGreaterThan(1000);
    expect(leafPaths(pt_BR).sort()).toEqual(enLeaves);
  });
});
