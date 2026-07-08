import { describe, expect, it } from 'vitest';
import { CAMPS, ITEMS, MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';

describe('Duskfang Prowler - dusk wolf variant (Eastbrook Vale north woods)', () => {
  it('is registered as a normal beast in the 4-5 band, no rare flag', () => {
    const m = MOBS.duskfang_prowler;
    expect(m).toBeTruthy();
    expect(m.name).toBe('Duskfang Prowler');
    expect(m.family).toBe('beast');
    expect(m.rare).toBeUndefined();
    expect(m.elite).toBeUndefined();
    expect(m.minLevel).toBe(4);
    expect(m.maxLevel).toBe(5);
  });

  it('inherits the wolf-family kit (pack frenzy + hide/fang harvesting)', () => {
    const m = MOBS.duskfang_prowler;
    expect(m.packFrenzy).toMatchObject({ radius: 12, hasteMult: 1.3, duration: 8 });
    expect(m.componentTags).toEqual(['hide', 'fang']);
  });

  it('drops the Duskfang Pelt at high chance and every loot itemId resolves', () => {
    const m = MOBS.duskfang_prowler;
    const drop = m.loot.find((l) => l.itemId === 'duskfang_pelt');
    expect(drop).toBeTruthy();
    expect(drop?.chance).toBe(0.7);
    expect(drop?.questId).toBeUndefined();
    for (const l of m.loot) {
      if (l.itemId) expect(ITEMS[l.itemId], `loot item ${l.itemId} must exist`).toBeTruthy();
    }
  });

  it('pays out as a white vendor trade pelt, never a quest blocker', () => {
    const pelt = ITEMS.duskfang_pelt;
    expect(pelt).toBeTruthy();
    expect(pelt.name).toBe('Duskfang Pelt');
    expect(pelt).toMatchObject({ kind: 'junk', quality: 'common' });
    expect(pelt.sellValue).toBeGreaterThan(0);
    expect(pelt.questId).toBeUndefined();
  });

  it('has one small camp in the north woods wolf territory', () => {
    const camps = CAMPS.filter((c) => c.mobId === 'duskfang_prowler');
    expect(camps).toHaveLength(1);
    expect(camps[0].count).toBe(3);
    expect(camps[0].center.z).toBeGreaterThan(55); // north woods, past the forest wolf packs
  });

  it('spawns into a live sim as a tougher cousin of the forest wolf', () => {
    const prowler = createMob(1, MOBS.duskfang_prowler, 5, { x: 10, y: 0, z: 85 });
    const wolf = createMob(2, MOBS.forest_wolf, 2, { x: 14, y: 0, z: 85 });
    expect(prowler.maxHp).toBeGreaterThan(wolf.maxHp);
  });
});
