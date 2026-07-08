# Estimation Log: Ona World Kernel

Reference class for the **`game-effort-estimator`** agent. One row per estimated item.
Times are **Claude execution time** in minutes (active wall-clock Claude spends building;
excludes idle waits, CI, deploy propagation, user review).

## How it is used
- **On estimate:** the agent appends a row with O/M/P/Expected and `Real = (pending)`.
- **On finish:** fill `Real` with the actual Claude-time plus a one-line post-mortem.
- **Calibration:** bias factor `k` = geometric mean(Real / Expected) over rows that have a
  Real (same Type when >= 3 rows, else all). Cold start default: k = 1.3.

## Schema
`Date | Item | Type | O | M | P | Expected | Confidence | Real | PR | Notes`
with O/M/P/Expected/Real in **minutes** (Claude-time). Type: feature, story, task, sub-task.

## Entries

| Date | Item | Type | O | M | P | Expected | Confidence | Real | PR | Notes |
|------|------|------|---:|---:|---:|---:|------|---:|----|-------|
| 2026-07-07 | Author 4 game-dev agents (.claude/agents/*.md in the template) | task | 20 | 38 | 66 | 40 | Low-Medium (~45%) | (not isolated) | - | Anchor imported from the Ona log (op10 TK-C2). Delivered in this kernel; actual Claude-time not separable from the bundled commit history. Personas with no inherited analog: authoring agent prompts from scratch. |
| 2026-07-07 | Game CI gate (determinism + IWorld parity) as the template phase-check | task | 15 | 30 | 55 | 32 | Medium (~55%) | (not isolated) | - | Anchor imported from the Ona log (op10 TK-C4). Delivered (npm run gate + phase-check skill); leveraged the pre-existing tests/architecture.test.ts. |
| 2026-07-07 | TK-106 Duskfang Prowler: one gameplay feature end to end through the board (GDD -> discovery -> FT/TK -> agents -> CI -> playtest) | task | 40 | 108 | 240 | 119 | Low (~30%) | (not isolated) | - | THE reference anchor for a full GDD-to-playtest slice in this kernel (imported from the Ona log, op10 TK-C5). Delivered as the Duskfang Prowler validation feature (docs/prd/gdd-duskfang-prowler.md): mob template + item + loot + i18n + parity-golden refreshes. Expected ~119 min; treat this as the anchor for "small content feature, full board cycle" until rows with a recorded Real exist. |
