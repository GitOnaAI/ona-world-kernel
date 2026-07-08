// Every flat locale-overlay key must be a real leaf path of the authoritative
// nested `en` (a member of Leaves<typeof en>). A typo'd or stale dotted key is a
// bug: the build (scripts/i18n_build.mjs) would unflatten it into a node that `en`
// never had, and the generated locale is typed `: EnTranslations`, so a phantom
// branch either bloats the resolved table or shadows a real value.
//
// The overlays ARE typed `Partial<Record<TranslationKey, string>>`
// (TranslationKey = Leaves<typeof en, 6>), so tsc rejects a structurally-wrong key.
// But that type does NOT fully replace this test: the entity sub-trees are
// `Record<string, ...>` / `Record<number, ...>`, so TranslationKey carries
// template-literal members like `entities.abilities.${string}.name` that accept
// ANY id. A typo'd entity id (e.g. `entities.abilities.firebal.name`) therefore
// type-checks but is not a real `en` leaf. This test is the runtime backstop that
// pins every overlay key to the ACTUAL `en` leaf set, catching the id typos the
// type cannot.
//
// This is a SUBSET check (every overlay key is in Leaves(en)). The overlays were
// relaxed from dense to sparse, so the former dense exact-equality companion
// (i18n_flat_overlay_dense.test.ts) was deleted; "no key outside Leaves(en)" is the
// PERMANENT invariant and survives the sparse relax, so this guard stays.

import { describe, expect, it } from 'vitest';
import type { TranslationKey } from '../src/ui/i18n.catalog';
import { en } from '../src/ui/i18n.catalog';
import { pt_BR } from '../src/ui/i18n.locales/pt_BR';

// Recurse into plain objects only (arrays/non-objects are leaves) - the same
// object-vs-leaf rule scripts/i18n_flatten.mjs and the build's deepMerge use.
function flatten(
  node: unknown,
  prefix = '',
  out: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const key of Object.keys(node as Record<string, unknown>)) {
    const value = (node as Record<string, unknown>)[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, out);
    } else {
      out[path] = value;
    }
  }
  return out;
}

const enLeaves = new Set(Object.keys(flatten(en)));

// The guard predicate: dotted keys present in the overlay that are NOT real `en`
// leaves. An empty result means every key is a member of Leaves(en).
function keysNotInEnLeaves(overlay: Record<string, unknown>): string[] {
  return Object.keys(overlay)
    .filter((k) => !enLeaves.has(k))
    .sort();
}

const overlays: Record<string, Partial<Record<TranslationKey, string>>> = {
  pt_BR,
};

describe('flat overlay keys are members of Leaves(en)', () => {
  for (const [lang, overlay] of Object.entries(overlays)) {
    it(`${lang}: has no dotted key outside Leaves(en)`, () => {
      expect(keysNotInEnLeaves(overlay)).toEqual([]);
    });
  }

  // Prove the guard has teeth: a typo'd or stale dotted key IS rejected. If this
  // ever passes vacuously (e.g. enLeaves accidentally contains everything), these
  // synthetic keys would slip through silently.
  it('rejects a typo of an existing key (extra trailing segment)', () => {
    const realKey = Object.keys(pt_BR)[0];
    const typo = `${realKey}.__typo__`;
    expect(enLeaves.has(typo)).toBe(false);
    const mutated = { ...pt_BR, [typo]: 'oops' };
    expect(keysNotInEnLeaves(mutated)).toEqual([typo]);
  });

  it('rejects a wholly invented dotted key', () => {
    const invented = 'this.key.does.not.exist.in.en';
    expect(enLeaves.has(invented)).toBe(false);
    const mutated = { ...pt_BR, [invented]: 'oops' };
    expect(keysNotInEnLeaves(mutated)).toEqual([invented]);
  });

  it('rejects a near-miss misspelling of a real key', () => {
    const realKey = Object.keys(pt_BR).find((k) => k.includes('.'))!;
    const misspelled = realKey.replace('.', '_'); // dot to underscore: a different, non-existent path
    expect(enLeaves.has(misspelled)).toBe(false);
    const mutated = { ...pt_BR, [misspelled]: 'oops' };
    expect(keysNotInEnLeaves(mutated)).toContain(misspelled);
  });
});
