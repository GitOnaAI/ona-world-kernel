// The rename state-hash PROOF (operator ruling addendum, 2026-07-02).
//
// A display rename is sanctioned to shift a golden's per-frame `state` hashes
// ONLY if this proof passes: re-record every changed scenario, reverse-map every
// string leaf of the fresh samples new -> old via the LOCKED NAME-MAP, re-digest,
// and require byte equality with the PRE-SLICE hashes (`git show HEAD:...`). That
// demonstrates the state delta is EXACTLY the locked display-token substitution —
// no numeric field, no array shape, no rng draw, no id moved.
//
// Env-gated: RENAME_PROOF=1 npx vitest run tests/parity/rename_state_proof.test.ts
// Run it BEFORE committing the re-minted goldens (it proves the working-tree
// goldens against the still-committed pre-slice HEAD; once the re-mint is
// committed there is nothing left to prove and the suite passes vacuously).
// Deterministic: HEAD content via `git show` (static), no wall-clock, no
// Math.random, no network.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SAMPLE_EVERY, Recorder, type Scenario } from './record';
import { SCENARIOS } from './scenarios';
import { digest, eventDigest, type Frame } from './trace';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const GOLDEN_DIR = join(HERE, 'golden');
const RUN = process.env.RENAME_PROOF === '1';

type Pair = readonly [oldName: string, newName: string];

// ---- locked NAME-MAP display pairs (same row filter as golden_token_inspector.mjs)
function loadDisplayPairs(): Pair[] {
  const mapPath = join(ROOT, 'ip-refactor', 'NAME-MAP.md');
  const pairs: Pair[] = [];
  for (const line of readFileSync(mapPath, 'utf8').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const c = line.split('|').map((x) => x.trim());
    if (c.length !== 7) continue;
    const [, , oldName, newName, , flag] = c;
    if (!['rename', 'coined-id', 'pairing'].includes(flag)) continue;
    if (!oldName || oldName === 'old' || /^[-: ]+$/.test(oldName)) continue;
    if (oldName.includes('(') || oldName.includes('"')) continue;
    if (oldName === newName) continue;
    if (oldName.startsWith('`')) continue; // backticked = code-id row (C1/C2 sweep)
    pairs.push([oldName, newName]);
  }
  return pairs;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (text: string, word: string) => new RegExp(`\\b${esc(word)}\\b`).test(text);

// Reverse-apply (new -> old) the active pairs to one string, longest NEW first so
// an overlapping shorter token can never split a longer one.
function reverseString(s: string, pairs: Pair[]): string {
  let out = s;
  for (const [o, n] of pairs) out = out.replace(new RegExp(`\\b${esc(n)}\\b`, 'g'), o);
  return out;
}

// Deep VALUE COPY with every string leaf reverse-mapped. Pass pairs = [] for a
// plain mutation-proof deep copy. Non-plain values (Map/Set/class instances)
// pass through by reference — `canonical()` inside digest() handles them, and the
// per-frame fidelity assertion below turns any resulting drift loudly red.
function reverseMap(v: unknown, pairs: Pair[]): unknown {
  if (typeof v === 'string') return reverseString(v, pairs);
  if (Array.isArray(v)) return v.map((x) => reverseMap(x, pairs));
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>)) {
      out[k] = reverseMap((v as Record<string, unknown>)[k], pairs);
    }
    return out;
  }
  return v;
}

function headGoldenText(fileName: string): string | null {
  try {
    return execFileSync('git', ['-C', ROOT, 'show', `HEAD:tests/parity/golden/${fileName}`], {
      encoding: 'utf8',
      maxBuffer: 1 << 28,
    });
  } catch {
    return null; // not in HEAD (a brand-new golden is the inspector's problem, not this proof's)
  }
}

// Re-record a scenario with (a) EVERY frame carrying the verbose player/entity
// samples and (b) each frame's raw event window captured as a value copy. Pure
// observation: the sampling cadence, drive script, and rng observation are
// exactly the stock Recorder's — we only force `full` on and copy the window.
function recordWithFullFrames(scenario: Scenario): {
  frames: Frame[];
  windows: unknown[][];
  draws: number;
  drawDigest: string;
  ticks: number;
} {
  const sim = scenario.build();
  const rec = new Recorder(sim, scenario.sampleEvery ?? DEFAULT_SAMPLE_EVERY);
  const loose = rec as unknown as {
    windowEvents: unknown[];
    pushFrame(label?: string, full?: boolean): void;
  };
  const origPush = (Object.getPrototypeOf(rec) as { pushFrame(label?: string, full?: boolean): void })
    .pushFrame;
  const windows: unknown[][] = [];
  loose.pushFrame = function (this: typeof loose, label?: string, _full?: boolean): void {
    // Deep VALUE COPY of the event window at digest time (mutation-proof).
    windows.push(loose.windowEvents.map((e) => reverseMap(e, [])) as unknown[]);
    origPush.call(this, label, true);
  };
  rec.begin();
  scenario.drive(rec);
  const trace = rec.finish(scenario);
  return {
    frames: trace.frames,
    windows,
    draws: trace.draws,
    drawDigest: trace.drawDigest,
    ticks: trace.ticks,
  };
}

if (!RUN) {
  describe.skip('rename state-hash proof (set RENAME_PROOF=1 to run)', () => {
    it('skipped', () => {});
  });
} else {
  describe('rename state-hash proof (RENAME_PROOF=1)', () => {
    const displayPairs = loadDisplayPairs();
    // Every golden whose working-tree bytes differ from HEAD is in scope.
    const changed: Array<{ file: string; head: string }> = [];
    for (const file of readdirSync(GOLDEN_DIR)) {
      if (!file.endsWith('.json')) continue;
      const head = headGoldenText(file);
      if (head === null) continue;
      const work = readFileSync(join(GOLDEN_DIR, file), 'utf8');
      if (head !== work) changed.push({ file, head });
    }

    it('finds the changed goldens (vacuously green when the re-mint is already committed)', () => {
      expect(Array.isArray(changed)).toBe(true);
    });

    for (const { file, head } of changed) {
      const name = file.replace(/\.json$/, '');
      it(`${name}: reverse-mapped re-digest reproduces the pre-slice hashes`, () => {
        const scenario = SCENARIOS.find((s) => s.name === name);
        expect(scenario, `no scenario named ${name} for changed golden ${file}`).toBeDefined();
        const rerun = recordWithFullFrames(scenario as Scenario);
        const golden = JSON.parse(head) as {
          frames: Frame[];
          draws: number;
          drawDigest: string;
          ticks: number;
        };

        // ACTIVE pairs: old name present in the pre-slice golden AND new name
        // present in the fresh recording — i.e. the substitutions this slice
        // actually performed. Everything else is a no-op and stays out.
        const rerunText = JSON.stringify({ frames: rerun.frames, windows: rerun.windows });
        const active = displayPairs
          .filter(([o, n]) => hasWord(head, o) && hasWord(rerunText, n))
          .sort((a, b) => b[1].length - a[1].length);
        expect(active.length, `${name}: changed golden but no locked pair is active`).toBeGreaterThan(0);
        // Ambiguity guard: an active pair whose NEW name already existed pre-slice
        // cannot be reversed soundly — refuse to prove rather than prove wrongly.
        for (const [o, n] of active) {
          expect(hasWord(head, n), `ambiguous pair '${o}' -> '${n}': new name pre-exists in ${file}`).toBe(false);
        }

        // The rename may not move time, ids, draw order, or the frame count.
        expect(rerun.ticks).toBe(golden.ticks);
        expect(rerun.draws).toBe(golden.draws);
        expect(rerun.drawDigest).toBe(golden.drawDigest);
        expect(rerun.frames.length).toBe(golden.frames.length);

        rerun.frames.forEach((f, i) => {
          const g = golden.frames[i];
          expect(f.tick, `${name} frame ${i} tick`).toBe(g.tick);
          expect(f.time, `${name} frame ${i} time`).toEqual(g.time);
          expect(f.nextId, `${name} frame ${i} nextId`).toBe(g.nextId);
          expect(f.rng, `${name} frame ${i} rng`).toEqual(g.rng);
          expect(f.label, `${name} frame ${i} label`).toEqual(g.label);
          const sample = { players: f.players, entities: f.entities };
          // Fidelity: the captured full sample re-digests to this frame's own hash.
          expect(digest(sample), `${name} frame ${i} sample fidelity`).toBe(f.state);
          // THE PROOF: reverse-mapped sample digests to the PRE-SLICE state hash.
          expect(digest(reverseMap(sample, active)), `${name} frame ${i} reverse-mapped state`).toBe(
            g.state,
          );
          // And the reverse-mapped event window digests to the PRE-SLICE events digest.
          expect(
            eventDigest(reverseMap(windowsAt(rerun.windows, i), active) as unknown[]),
            `${name} frame ${i} reverse-mapped events`,
          ).toBe(g.events);
        });
      });
    }
  });
}

function windowsAt(windows: unknown[][], i: number): unknown[] {
  return windows[i] ?? [];
}
