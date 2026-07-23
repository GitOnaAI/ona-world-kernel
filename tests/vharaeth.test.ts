// Vharaeth's Overlook trial (TK-5): direct unit + determinism tests for the small
// overworld encounter. They spawn the Avatar of Vharaeth next to a player, engage it,
// drive it deterministically through all three phases (intro yell, half-health
// Ancestral Judgment pulse, death recognition line), and assert that two identical
// seeded drives produce byte-identical traces (the parity idiom `run() toEqual run()`).

import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/sim/data';
import * as vharaeth from '../src/sim/encounters/vharaeth';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import { type Entity, type SimEvent, VHARAETH_BOSS_ID } from '../src/sim/types';
import { terrainHeight } from '../src/sim/world';

type AnySim = Sim & Record<string, any>;
type AnyEntity = Entity & Record<string, any>;

const ctxOf = (sim: Sim): SimContext => (sim as unknown as { ctx: SimContext }).ctx;

function teleport(sim: AnySim, e: AnyEntity, x: number, z: number): void {
  e.pos.x = x;
  e.pos.z = z;
  e.pos.y = terrainHeight(x, z, sim.cfg.seed);
  e.prevPos = { ...e.pos };
  sim.rebucket(e);
}

// Keep the drive stable: a huge health pool the loop tops up each tick means the
// player survives every judgment pulse and boss swing, so the boss never loses its
// target or leashes home mid-drive (and the drive stays identical across seeds).
function keepAlive(player: AnyEntity): void {
  player.maxHp = 1_000_000;
  player.hp = 1_000_000;
}

// Spawn Vharaeth beside the player and lock the boss onto it, so
// updateVharaethEncounter runs every tick.
function setup(seed = 42): { sim: AnySim; ctx: SimContext; player: AnyEntity; boss: AnyEntity } {
  const sim = new Sim({ seed, playerClass: 'warrior', autoEquip: true }) as AnySim;
  const player = sim.player as AnyEntity;
  keepAlive(player);
  teleport(sim, player, 0, 0);
  const boss = createMob(sim.nextId++, MOBS[VHARAETH_BOSS_ID], 8, {
    x: 3,
    y: terrainHeight(3, 0, sim.cfg.seed),
    z: 0,
  }) as AnyEntity;
  boss.spawnPos = { ...boss.pos };
  sim.addEntity(boss);
  boss.inCombat = true;
  boss.aiState = 'attack';
  boss.aggroTargetId = player.id;
  boss.threat.set(player.id, 1000);
  return { sim, ctx: ctxOf(sim), player, boss };
}

// One scripted drive: chunk the boss across the 50% trial gate, then kill it, and
// record a compact per-tick trace (phase + hp + any yell texts) to compare runs.
function run(seed = 42): unknown[] {
  const { sim, ctx, player, boss } = setup(seed);
  const trace: unknown[] = [];
  for (let t = 0; t < 400 && !boss.dead; t++) {
    // Keep the boss pinned so it stays in combat and never leashes home mid-drive.
    if (!boss.dead) {
      keepAlive(player);
      boss.threat.set(player.id, 1000);
      boss.aggroTargetId = player.id;
    }
    if (t === 60) boss.hp = Math.floor(boss.maxHp * 0.49); // cross the half-health gate
    if (t === 220)
      ctx.dealDamage(player, boss, boss.hp + 1000, false, 'physical', 'test', 'hit', true);
    const evs: SimEvent[] = sim.tick();
    const yells = evs
      .filter((e): e is Extract<SimEvent, { type: 'chat' }> => e.type === 'chat')
      .map((e) => e.text);
    trace.push({ t, phase: boss.vharaeth?.phase ?? null, hp: boss.hp, yells });
  }
  return trace;
}

describe('Vharaeth trial (TK-5)', () => {
  it('registers a stable, memorable rare-elite ccImmune mob template', () => {
    const t = MOBS[VHARAETH_BOSS_ID];
    expect(VHARAETH_BOSS_ID).toBe('vharaeth_avatar');
    expect(t).toBeTruthy();
    expect(t.rare).toBe(true);
    expect(t.elite).toBe(true);
    expect(t.ccImmune).toBe(true);
    expect(t.family).toBe('elemental');
  });

  it('initVharaethEncounter seeds the intro phase and is idempotent', () => {
    const { boss } = setup();
    const st = vharaeth.initVharaethEncounter(boss);
    expect(st.phase).toBe('intro');
    expect(st.introSpoken).toBe(false);
    expect(st.deathSpoken).toBe(false);
    // Second call returns the SAME live state object (lazy init, like nythraxis).
    expect(vharaeth.initVharaethEncounter(boss)).toBe(st);
  });

  it('yells the opener on engage, enters the trial at half health, and speaks on death', () => {
    const { sim, ctx, player, boss } = setup();
    const seen: string[] = [];
    const drainYells = (evs: SimEvent[]) => {
      for (const e of evs) if (e.type === 'chat') seen.push(e.text);
    };
    // First engaged tick: the opener fires and the phase is still intro.
    drainYells(sim.tick());
    expect(boss.vharaeth?.phase).toBe('intro');
    expect(seen.some((s) => s.includes('captive'))).toBe(true);

    // Drop below 50% and tick: the trial announcement fires and the phase advances.
    boss.hp = Math.floor(boss.maxHp * 0.4);
    for (let i = 0; i < 5; i++) {
      keepAlive(player);
      drainYells(sim.tick());
    }
    expect(boss.vharaeth?.phase).toBe('trial');
    expect(seen.some((s) => s.includes('trial'))).toBe(true);

    // The judgment pulse actually rolls damage on the player (rng-drawing mechanic).
    let judged = false;
    for (let i = 0; i < 20 * 8 && !judged; i++) {
      keepAlive(player);
      boss.hp = Math.floor(boss.maxHp * 0.4); // hold in the trial band
      const evs = sim.tick();
      if (evs.some((e) => e.type === 'damage' && e.ability === 'Ancestral Judgment')) judged = true;
    }
    expect(judged).toBe(true);

    // Kill it: the death branch fires the recognition line once and marks phase dead.
    ctx.dealDamage(player, boss, boss.hp + 1000, false, 'physical', 'test', 'hit', true);
    seen.length = 0;
    for (let i = 0; i < 6; i++) drainYells(sim.tick());
    expect(boss.dead).toBe(true);
    expect(boss.vharaeth?.phase).toBe('dead');
    expect(seen.some((s) => s.includes('roots remember'))).toBe(true);
  });

  it('is fully deterministic: two identical seeded drives produce identical traces', () => {
    expect(run(42)).toEqual(run(42));
    expect(run(7)).toEqual(run(7));
  });
});
