// Vharaeth's Overlook trial (TK-5): a small, solo-scale scripted encounter for the
// Kharzoth Dominion (levels 1 to 8, the rootwarden origin zone).
//
// This module owns the Avatar of Vharaeth script: the per-tick encounter driver, a
// tiny dialogue/yell scheduler, the half-health Ancestral Judgment pulse (the ONE
// mechanic that draws rng), and the death recognition line. It deliberately follows
// the Nythraxis raid module's ENGINEERING pattern (a header, ctx-first functions, no
// `this`, a dialogue token guarding stale delayed yells) at a FRACTION of its scope:
// no instance lockout, no adds/summons, no relic/quest chain. The origin quest chain
// (TK-6) will key a `{type:'kill',targetMobId:'vharaeth_avatar'}` objective off the
// boss id and can trigger narrative credit from the yells emitted here.
//
// UNLIKE Nythraxis, this driver does NOT replace the mob's AI: mob/locomotion.ts runs
// the normal chase/attack/leash state machine and layers this scripted driver on top
// while Vharaeth is in combat, so he leashes/evades and swings like a normal elite.
//
// Determinism: the ONLY rng draw is `ctx.rng.range` inside the judgment pulse, called
// from the per-tick driver whose guard ladder is fixed, so the shared draw stream
// stays ordered. No Math.random/Date.now (enforced by tests/architecture.test.ts).
// Player-facing text is variable-routed English yells (the same pattern as the
// Nythraxis boss lines, which ship as an English backstop): nothing here is a literal
// `text:` emit, so the S3 sim_i18n guard has nothing new to register.

import type { SimContext } from '../sim_context';
import { DT, dist2d, type Entity, type SimEvent, VHARAETH_BOSS_ID, YELL_RANGE } from '../types';

// Half health: Vharaeth stops testing and begins the judgment in earnest.
const VHARAETH_TRIAL_HP = 0.5;
// Ancestral Judgment: the trial pulse cadence (seconds), its reach, and its rolled
// nature damage. Kept modest so a solo level-8 can endure the trial.
const VHARAETH_JUDGMENT_EVERY = 6;
const VHARAETH_JUDGMENT_RADIUS = 10;
const VHARAETH_JUDGMENT_MIN = 8;
const VHARAETH_JUDGMENT_MAX = 14;
// Seconds between the two lines of a paired yell (mirrors the Nythraxis line gap).
const VHARAETH_DIALOGUE_LINE_SECONDS = 2.6;
// The opener's second line trails the first by a beat.
const VHARAETH_OPENER_SECOND_DELAY = 3.5;

// ----- encounter lifecycle --------------------------------------------------------

export function initVharaethEncounter(boss: Entity): NonNullable<Entity['vharaeth']> {
  if (!boss.vharaeth) {
    boss.vharaeth = {
      phase: 'intro',
      introSpoken: false,
      trialSpoken: false,
      dialogueToken: 0,
      trialTimer: 0,
      deathSpoken: false,
    };
  }
  return boss.vharaeth;
}

// Per-tick driver, called from mob/locomotion.ts while Vharaeth is in combat (after
// the generic updateBossMechanics pass, before the normal AI state switch runs).
export function updateVharaethEncounter(ctx: SimContext, boss: Entity): void {
  const st = initVharaethEncounter(boss);
  if (st.phase === 'dead') return;

  // Phase 1 (intro): announce the ancestral trial on the first engaged tick.
  if (!st.introSpoken) {
    st.introSpoken = true;
    vharaethSay(ctx, boss, [
      { text: 'You wear the chains of a captive no longer, little spark.', delay: 0 },
      {
        text: 'Prove your kindled will. The old roots are watching.',
        delay: VHARAETH_OPENER_SECOND_DELAY,
      },
    ]);
  }

  // Phase 2 (trial): at half health the judgment begins.
  const hpFrac = boss.hp / Math.max(1, boss.maxHp);
  if (st.phase === 'intro' && hpFrac <= VHARAETH_TRIAL_HP) {
    st.phase = 'trial';
    st.trialTimer = VHARAETH_JUDGMENT_EVERY; // telegraph: first pulse one interval in
    if (!st.trialSpoken) {
      st.trialSpoken = true;
      vharaethSay(ctx, boss, [
        { text: 'Enough. Now the trial begins in earnest.', delay: 0 },
        {
          text: 'Endure the judgment of the ancestors, or fall.',
          delay: VHARAETH_DIALOGUE_LINE_SECONDS,
        },
      ]);
    }
    ctx.emit({
      type: 'spellfx',
      sourceId: boss.id,
      targetId: boss.id,
      school: 'nature',
      fx: 'nova',
    });
  }

  if (st.phase === 'trial') updateVharaethJudgment(ctx, boss, st);
}

// ----- phase-two mechanic: Ancestral Judgment (the rng-drawing pulse) --------------

export function updateVharaethJudgment(
  ctx: SimContext,
  boss: Entity,
  st: NonNullable<Entity['vharaeth']>,
): void {
  st.trialTimer -= DT;
  if (st.trialTimer > 0) return;
  st.trialTimer = VHARAETH_JUDGMENT_EVERY;
  ctx.emit({ type: 'spellfx', sourceId: boss.id, targetId: boss.id, school: 'nature', fx: 'nova' });
  // Iterate players in the stable Map order (the same order the generic aoePulse
  // uses), rolling one damage value per player in range: a fixed number of draws
  // per pulse keeps the shared rng stream deterministic.
  for (const meta of ctx.players.values()) {
    const pe = ctx.entities.get(meta.entityId);
    if (!pe || pe.dead || dist2d(pe.pos, boss.pos) > VHARAETH_JUDGMENT_RADIUS) continue;
    const dmg = Math.round(ctx.rng.range(VHARAETH_JUDGMENT_MIN, VHARAETH_JUDGMENT_MAX));
    ctx.dealDamage(boss, pe, dmg, false, 'nature', 'Ancestral Judgment', 'hit', true);
  }
}

// ----- death recognition (fired from updateMob's dead-branch via ctx.onBossDeath) --

export function onVharaethDeath(ctx: SimContext, boss: Entity): void {
  if (boss.templateId !== VHARAETH_BOSS_ID) return;
  const st = initVharaethEncounter(boss);
  if (st.deathSpoken) return;
  st.deathSpoken = true;
  st.phase = 'dead';
  // The power/vision the origin grants is delivered narratively here: the ancestors
  // acknowledge the victor. TK-6 wires the mechanical grant off the kill objective.
  vharaethSay(ctx, boss, [
    { text: 'Well struck. The roots remember your name now.', delay: 0 },
    {
      text: 'Carry their sight, warden. Kharzoth will not hold.',
      delay: VHARAETH_DIALOGUE_LINE_SECONDS,
    },
  ]);
}

// ----- dialogue / yell scheduling (minimal token-guarded scheduler) ----------------

// Emit a paired yell: any line with delay 0 fires now (range-gated per player like
// the Nythraxis opener); later lines are scheduled as world-visible delayed events
// guarded by the dialogue token so a superseded set never double-speaks.
export function vharaethSay(
  ctx: SimContext,
  boss: Entity,
  lines: { text: string; delay: number }[],
): void {
  const st = initVharaethEncounter(boss);
  const token = (st.dialogueToken ?? 0) + 1;
  st.dialogueToken = token;
  for (const line of lines) {
    if (line.delay <= 0) {
      emitVharaethYell(ctx, boss, line.text);
      continue;
    }
    ctx.delayedEvents.push({
      at: ctx.time + line.delay,
      event: vharaethYellEvent(boss, line.text),
      guard: () => st.dialogueToken === token,
    });
  }
}

export function vharaethYellEvent(boss: Entity, text: string): SimEvent {
  return {
    type: 'chat',
    fromPid: boss.id,
    from: boss.name,
    text,
    channel: 'yell',
    entityId: boss.id,
  };
}

export function emitVharaethYell(ctx: SimContext, boss: Entity, text: string): void {
  const event = vharaethYellEvent(boss, text);
  for (const meta of ctx.players.values()) {
    const p = ctx.entities.get(meta.entityId);
    if (!p || dist2d(p.pos, boss.pos) > YELL_RANGE) continue;
    ctx.emit({ ...event, pid: meta.entityId });
  }
}
