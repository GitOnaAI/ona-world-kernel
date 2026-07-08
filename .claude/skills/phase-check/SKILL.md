---
name: phase-check
description: >
  Run the end-of-phase verification protocol for the Ona World Kernel before committing or
  merging a slice of work. Use when finishing any implementation phase (a feature slice, a
  content drop, a bug fix batch) or when asked to "run phase-check", "check this phase", or
  "is this ready to merge". Scales the checks to the diff (targeted vitest + guard tests
  during development, the full 9-step npm run gate pre-merge), plus an optional playable
  smoke and the review-agent dispatch suggestions.
user-invocable: true
---

# Phase check: staged verification before a change is called done

Every check reports PASS or FAIL with the exact command and, on FAIL, what to fix. Do not
stop at the first failure inside a stage: run the whole stage, then report. Never pipe test
output through `tail`/`head` (it masks the exit code); `scripts/gate.mjs` exists precisely
because ad-hoc chains get this wrong.

## Step 0: scope the diff

```bash
git status --porcelain
git diff --name-only            # or: git diff --name-only "$(git merge-base HEAD main)"..HEAD
```

Classify the touched surfaces (sim / content / server / net-wire / render-ui / scripts / docs).
A docs-or-comments-only diff needs no code gates: validate copy rules (no em dashes, en dashes,
emojis) and stop.

## Step 1: development-tier checks (fast, targeted; run these while iterating too)

1. **Touched tests**: `npx vitest run tests/<affected>.test.ts` for every suite covering the
   changed files.
2. **Guard tests by surface** (run each one whose surface the diff touches):
   - `src/sim/` or a `src/ui`/`src/render` pure core changed:
     `npx vitest run tests/architecture.test.ts` (sim purity + pure-core registry).
   - Sim behavior or anything that can shift rng draw order: `npx vitest run tests/parity`.
   - Any player-visible text or a sim/server emit changed:
     `npx vitest run tests/localization_fixes.test.ts` (the S3 guard).
   - Content records changed: `npx vitest run tests/progression.test.ts tests/talents.test.ts`
     (referential integrity).
   - Wire/snapshot protocol changed:
     `npx vitest run tests/snapshots.test.ts tests/env_protocol.test.ts tests/bandwidth.test.ts`.
3. **Typecheck**: `npx tsc --noEmit`.
4. **Format, scoped**: `npm run ci:changed` (Biome on changed files only). Fix findings with a
   per-file `npx @biomejs/biome check --write <file>`; NEVER a whole-tree `--write` (the global
   Biome debt is deferred; a tree-wide write buries the change in unrelated reformats).
5. **Copy rules**: no em dashes, en dashes, or emojis in anything added (the Stop hook
   `.claude/hooks/qa-stop.sh` also enforces this); no stray `.only(` or `debugger`.

## Step 2: pre-merge gate (the full CI equivalent)

```bash
npm run gate
```

The 9 steps, in order (mirrors `.github/workflows/ci.yml`; keep them in sync): i18n artifact
generation, i18n freshness diff, malware scan (`security:gate`), changed-files biome, the full
vitest suite with workers capped at half the cores, `tsc --noEmit`, env build, server build,
client build. Release-tier (`I18N_RELEASE_TIER=1`) switches on automatically on a `release/**`
branch.

Low-RAM note (the failure mode documented in `scripts/gate.mjs`): if the full-suite step shows
rotating per-file timeouts even with the worker cap, rerun that step as
`npx vitest run --maxWorkers=2` or run the gate in a quiet window; a file that fails under load
but passes in an isolated `npx vitest run <file>` is a load flake, not a regression.

## Step 3: playable smoke (optional but recommended for gameplay-visible changes)

If the diff has a runtime surface a player would see (HUD, combat, quests, content, movement),
do not call it done on green tests alone:

```bash
npm run dev          # :5173 (plus npm run server for online flows, :8787)
node scripts/smoke_browser.mjs
node scripts/visual_tour.mjs     # screenshots to tmp/
```

Or dispatch the `playtest-qa` agent to run the smokes, capture evidence screenshots, and write
the human playtest script. Zero console/page errors is part of the pass criterion.

## Step 4: review dispatch suggestions (name them; do not run them all by default)

Suggest only the reviewers whose surface the diff touches (the full matrix lives in the
`qa-checklist` agent):

- `src/sim/` change: `architecture-reviewer` (determinism, draw order, SimContext seam).
- `server/`, `src/net/`, SQL/auth/secrets, deploy files: `privacy-security-review`.
- `server/*_db.ts` DDL or persisted JSONB shapes: `migration-safety`.
- `src/world_api.ts`, wire/dispatch, sim/server i18n matchers, RL surface: `cross-platform-sync`.
- New or rewritten tests claiming coverage: `test-coverage-auditor`.
- A completed deliverable set: `qa-checklist` (the default end-of-contribution gate, also `/qa`).
- A release tag or `release/**` branch: `release-malware-audit` plus the release-tier gate.

## Step 5: report

End with a stage-by-stage table (check, command, PASS/FAIL), the list of suggested reviewers
with the reason each applies, and an explicit READY / NOT READY verdict. Commit only after
every applicable stage is green.
