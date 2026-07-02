#!/usr/bin/env node
// Golden token inspector (operator-authorized re-mint policy, 2026-07-02).
//
// Verifies that a re-minted tests/parity/golden/*.json differs from its
// committed (HEAD) version ONLY in the sanctioned ways:
//   (a) `events` digest fields (opaque hashes of the event-text window; event
//       text embeds display names by design, so these legitimately move on a
//       display rename - the surrounding state hashes / RNG fingerprints /
//       draw counts / nextId fields MUST stay byte-identical, which is what
//       bounds the digest opacity), and
//   (b) string leaves whose change is EXACTLY a locked NAME-MAP old->new
//       substitution (display names token-wise, code ids exact-match for the
//       sanctioned C1/C2 coined-id rows).
// Anything else - a numeric change, an array-length change, an unmapped
// string change - is a violation: the slice changed behavior. STOP.
//
// --allow-state-hashes (ruling addendum, 2026-07-02): a display name embedded in
// a sampled aura/entity leaf also shifts that frame's `state` digest. With this
// flag, a changed `frames.<i>.state` hash is COUNTED (reported as a state-hash
// delta) instead of flagged - but it is sanctioned ONLY when the reverse-map
// re-digest proof passes: RENAME_PROOF=1 npx vitest run
// tests/parity/rename_state_proof.test.ts (must be green BEFORE relying on this
// flag). rng digests, draw counts, nextId, and every non-frame-state hash stay
// strict either way.
//
// Usage: node ip-refactor/golden_token_inspector.mjs [worktreeRoot] [baseRef] [--allow-state-hashes]
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const args = process.argv.slice(2);
const allowStateHashes = args.includes("--allow-state-hashes");
const positional = args.filter((a) => !a.startsWith("--"));
const root = positional[0] || process.cwd();
const baseRef = positional[1] || "HEAD";
const mapPath = join(root, "ip-refactor", "NAME-MAP.md");

// ---- load locked old->new pairs ----
const displayPairs = [];
const idPairs = [];
for (const line of readFileSync(mapPath, "utf8").split("\n")) {
  if (!line.trim().startsWith("|")) continue;
  const c = line.split("|").map((x) => x.trim());
  if (c.length !== 7) continue;
  let [, rid, oldName, newName, kind, flag] = c;
  if (!["rename", "coined-id", "pairing"].includes(flag)) continue;
  if (!oldName || oldName === "old" || /^[-: ]+$/.test(oldName)) continue;
  if (oldName.includes("(") || oldName.includes('"')) continue;
  if (oldName === newName) continue;
  if (oldName.startsWith("`")) continue; // backticked = code id row (family ids)
  displayPairs.push([oldName, newName]);
}
// sanctioned code-id swaps (C1 family ids + C2 pet ids), exact-match only
idPairs.push(["murloc", "mudfin"], ["kobold", "burrower"]);
idPairs.push(["imp", "emberkin"], ["voidwalker", "gloomshade"], ["succubus", "duskborn"],
  ["felhunter", "spellhound"], ["felguard", "warfiend"], ["infernal", "pyre_colossus"],
  ["doomguard", "wraithborn"]);
displayPairs.sort((a, b) => b[0].length - a[0].length); // longest-first

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function applyDisplayMap(s) {
  let out = s;
  for (const [o, n] of displayPairs) out = out.replace(new RegExp(`\\b${esc(o)}\\b`, "g"), n);
  return out;
}

// ---- diff engine ----
const violations = [];
let digestChanges = 0, tokenChanges = 0, filesChanged = 0, stateHashChanges = 0;
const HASH8 = /^[0-9a-f]{8}$/;
function walk(file, a, b, path) {
  if (typeof a === "string" && typeof b === "string") {
    if (a === b) return;
    const last = path[path.length - 1];
    if (String(last) === "events" || /(^|\.)events$/.test(path.join("."))) { digestChanges++; return; }
    if (
      allowStateHashes &&
      path.length === 3 && path[0] === "frames" && String(last) === "state" &&
      HASH8.test(a) && HASH8.test(b)
    ) { stateHashChanges++; return; }
    const idHit = idPairs.find(([o]) => a === o);
    if (idHit && b === idHit[1]) { tokenChanges++; return; }
    if (applyDisplayMap(a) === b) { tokenChanges++; return; }
    violations.push(`${file} @ ${path.join(".")}: '${a}' -> '${b}' (not a locked token swap)`);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) { violations.push(`${file} @ ${path.join(".")}: array length ${a.length} -> ${b.length}`); return; }
    a.forEach((v, i) => walk(file, v, b[i], [...path, i]));
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (!(k in a) || !(k in b)) { violations.push(`${file} @ ${[...path, k].join(".")}: key added/removed`); continue; }
      walk(file, a[k], b[k], [...path, k]);
    }
    return;
  }
  if (a !== b) violations.push(`${file} @ ${path.join(".")}: ${JSON.stringify(a)} -> ${JSON.stringify(b)} (non-string change)`);
}

const goldenDir = join(root, "tests", "parity", "golden");
for (const name of readdirSync(goldenDir)) {
  if (!name.endsWith(".json")) continue;
  const abs = join(goldenDir, name);
  const rel = relative(root, abs).replace(/\\/g, "/");
  let headText;
  try {
    headText = execFileSync("git", ["-C", root, "show", `${baseRef}:${rel}`], { encoding: "utf8", maxBuffer: 1 << 28 });
  } catch { violations.push(`${name}: not in ${baseRef} (new golden file - not sanctioned)`); continue; }
  const workText = readFileSync(abs, "utf8");
  if (headText === workText) continue;
  filesChanged++;
  walk(name, JSON.parse(headText), JSON.parse(workText), []);
}

console.log(`goldens changed: ${filesChanged} | events-digest deltas: ${digestChanges} | state-hash deltas: ${stateHashChanges}${allowStateHashes ? " (allowed; requires a green RENAME_PROOF=1 rename_state_proof run)" : ""} | sanctioned token swaps: ${tokenChanges} | violations: ${violations.length}`);
for (const v of violations.slice(0, 40)) console.log("VIOLATION:", v);
process.exit(violations.length ? 1 : 0);
