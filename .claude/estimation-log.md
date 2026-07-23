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
| 2026-07-23 | OP-1 Rootwarden TK-A1: enumerate rootwarden across compiler-forced sites + class/kit def (hunter reskin) | sub-task | 15 | 36 | 72 | 39 | Low-Medium (~40%) | (pending) | - | k=1.3 cold start. ~8 enum sites; tsc-guided; pins: progression/equipment_proficiency/starter_items/quest_rewards. risk.high. |
| 2026-07-23 | OP-1 Rootwarden TK-A2: ROOTWARDEN_TALENTS tree (copy HUNTER_TALENTS, new ids/3 specs) | sub-task | 18 | 42 | 78 | 44 | Low-Medium (~40%) | (pending) | - | k=1.3. Large data-table copy in talents_classic.ts (4061 ln); id-rename hazard; talent + talent_primitives pins. |
| 2026-07-23 | OP-1 Rootwarden TK-A3: conditional class spawn in addPlayer (born in Kharzoth) | sub-task | 8 | 21 | 46 | 23 | Low (~30%) | (pending) | - | k=1.3. Small sim.ts change but parity-sensitive + depends on TK-B1 existing. risk.high. |
| 2026-07-23 | OP-1 Rootwarden TK-B1: Kharzoth origin zone module (data-as-code) + data.ts merge | sub-task | 40 | 111 | 234 | 119 | Low (~28%) | (pending) | - | k=1.3. New ~1.2-2k ln zone (cf zone1 1229 / zone2 2039). Parity golden REFRESH (spawn rolls shift). alta, risk.high. Largest content TK. |
| 2026-07-23 | OP-1 Rootwarden TK-B2: Vharaeth scripted encounter (Nythraxis pattern, instanced) | sub-task | 45 | 124 | 260 | 133 | Low (~28%) | (pending) | - | k=1.3. Nythraxis is 1213 ln; new entity type + sim_context callbacks + sim wiring + onBossDeath + new test + NEW parity scenario/golden + architecture test. agentic, alta, risk.high. |
| 2026-07-23 | OP-1 Rootwarden TK-B3: Rootwarden origin quest chain (ritual/relic/vision) + ROG rewards | sub-task | 18 | 46 | 91 | 49 | Low-Medium (~38%) | (pending) | - | k=1.3. QUESTS/QUEST_ORDER in kharzoth.ts; progression + quest_reward pins. |
| 2026-07-23 | OP-1 Rootwarden TK-B4: i18n matchers for origin content (zone/mobs/npcs/quests/Vharaeth/talents) | sub-task | 15 | 36 | 72 | 39 | Medium (~48%) | (pending) | - | k=1.3. world_entity_i18n/sim_i18n/talent_i18n; S3 guard + coverage + tooltip accuracy. Mechanical but volume-heavy. |
| 2026-07-23 | OP-1 Rootwarden TK-C1: 3D model (hunter-derived) + 4 color skins via asset pipeline + manifest wiring | sub-task | 25 | 65 | 143 | 71 | Low (~30%) | (pending) | - | k=1.3. Generated GLB/textures + manifest.ts (1154 ln) SKINS/VISUALS; skin_event/held_weapon/appearance/character_appearance pins. agentic, alta. |
| 2026-07-23 | OP-1 Rootwarden TK-C2: class showcase in client (name/desc/talents/appearance) + i18n catalog | sub-task | 15 | 36 | 72 | 39 | Medium (~48%) | (pending) | - | k=1.3. class_details_data/entity_i18n/i18n.catalog; charselect + i18n_completeness pins. |
| 2026-07-23 | OP-1 Rootwarden TK-C3: server class enablement (VALID_CLASSES + avatar/sheet/card) | sub-task | 10 | 23 | 52 | 26 | Medium (~45%) | (pending) | - | k=1.3. Small 4-file change but auth/create surface + persisted data -> risk.high. |
| 2026-07-23 | OP-1 Rootwarden TK-D1: cross-host + functional validation (full gate, reviewers, real-browser smoke) | sub-task | 25 | 72 | 169 | 80 | Low (~30%) | (pending) | - | k=1.3. Full npm run gate + architecture/privacy reviewers + browser smoke; iteration-heavy (chasing late golden/gate failures). agentic. |
| 2026-07-23 | OP-1 Rootwarden: 10th playable class END TO END (roll-up of 11 TKs, FT-A/B/C/D) | feature | 234 | 611 | 1287 | 795 | Low (~28%) | (pending) | - | k=1.3 cold start + first-of-its-kind (no prior full-class addition with a recorded Real). Roll-up: sum TK E=662, +12% feature integration tax +~10% OP cross-feature tax (parity/i18n-hash rebaselines, A3->B1 dep) -> E~795. 68% band ~725-870. Combined sd~70. |
