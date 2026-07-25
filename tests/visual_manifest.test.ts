import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { describe, expect, it } from 'vitest';
import {
  type ClipMap,
  manifestUrls,
  manifestUrlsForGraphics,
  VISUALS,
  visibleAttachmentsForGraphics,
} from '../src/render/characters/manifest';

function expectedClipNames(clips: ClipMap): string[] {
  return [
    clips.idle,
    clips.walk,
    clips.run,
    clips.death,
    clips.cast,
    clips.sitDown,
    clips.sitIdle,
    clips.swim,
    clips.jump,
    clips.walkBack,
    clips.flourish,
    clips.roll,
    ...clips.attack,
    ...(clips.hit ?? []),
    ...Object.values(clips.emote ?? {}).flatMap((spec) => spec.clips),
  ].filter((name): name is string => !!name);
}

async function glbAnimationNames(path: string): Promise<Set<string>> {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(path);
  return new Set(
    doc
      .getRoot()
      .listAnimations()
      .map((animation) => animation.getName()),
  );
}

describe('character visual manifest', () => {
  it('uses the custom boar death clip without relying on a speed override', () => {
    expect(VISUALS.mob_boar.clips.death).toBe('Dying');
    expect(VISUALS.mob_boar.deathTimeScale).toBeUndefined();
  });

  it('points the Combat Mech manifest at animation clips baked into the GLB', async () => {
    const visual = VISUALS.player_mech;
    const animationNames = await glbAnimationNames(`public/${visual.url}`);

    expect(animationNames.size).toBeGreaterThan(0);
    expect(
      [...new Set(expectedClipNames(visual.clips))].filter((name) => !animationNames.has(name)),
    ).toEqual([]);
  });

  it('points the Stone Cantor manifest at clips present in the GLB (including the synthesized Hit)', async () => {
    const visual = VISUALS.mob_reedbound_acolyte;
    const animationNames = await glbAnimationNames(`public/${visual.url}`);

    expect(animationNames.size).toBeGreaterThan(0);
    expect(
      [...new Set(expectedClipNames(visual.clips))].filter((name) => !animationNames.has(name)),
    ).toEqual([]);
  });

  it('resolves the Rootwarden dodge-roll clip from its separate animUrls GLB', async () => {
    const visual = VISUALS.player_rootwarden;
    const rollClip = visual.clips.roll;
    expect(rollClip).toBeTruthy();
    expect(visual.animUrls?.length).toBeGreaterThan(0);
    const animationNames = new Set<string>();
    for (const url of visual.animUrls ?? []) {
      for (const name of await glbAnimationNames(`public/${url}`)) animationNames.add(name);
    }
    expect(animationNames.has(rollClip ?? '')).toBe(true);
  });

  it('keeps held weapons and props available on low graphics', () => {
    const allWeaponUrls = manifestUrls().filter((url) => url.startsWith('models/weapons/'));
    expect(allWeaponUrls.length).toBeGreaterThan(0);
    expect(manifestUrlsForGraphics(false)).toEqual(expect.arrayContaining(allWeaponUrls));
    expect(visibleAttachmentsForGraphics(VISUALS.player_warrior).map((a) => a.url)).toContain(
      'models/weapons/sword_1handed.glb',
    );
    expect(visibleAttachmentsForGraphics(VISUALS.player_rogue).map((a) => a.url)).toEqual([
      'models/weapons/dagger.glb',
      'models/weapons/dagger.glb',
    ]);
  });
});
