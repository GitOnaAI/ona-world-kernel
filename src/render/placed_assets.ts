// Renderer for the map editor's freely placed GLB assets (WorldContent.placements).
// Cosmetic and play-test-only: each placement names a public GLB path; we load it
// once, clone it per placement, normalize its size, and seat it on the terrain.
// Loads are async (the initial batch is registered as preloads); models pop in
// when ready, which is fine because placements never affect gameplay.
//
// The view is a small live instancer keyed by the editor's placement index:
// addPlacement / updatePlacement / removePlacement mutate one entry, reSeat()
// re-samples the ground for every entry after a sculpt, setSelected() drapes a
// gold ring under one asset, and showFootprints() drapes the collideRadius
// circle under every colliding placement. Everything editor-facing is opt-in;
// the shipped game only ever runs the constructor build.

import * as THREE from 'three';
import type { PlacedAsset } from '../sim/types';
import { terrainHeight } from '../sim/world';
import { loadGltf } from './assets/loader';
import { registerPreload } from './assets/preload';

// Height (yards) a placed model is normalized to before its per-placement scale,
// so arbitrary catalogue GLBs (which vary wildly in source units) land sanely.
const TARGET_HEIGHT = 2.2;
const RING_SEGMENTS = 40;
const RING_LIFT = 0.08; // yards above the sampled ground, against z-fighting
const SELECTION_COLOR = 0xd4af37; // the classic target-reticle gold
const FOOTPRINT_COLOR = 0xe0503c;

// One template per GLB path: the cached scene (cloned per placement, per the
// loader's cache-immutability rule) plus its source-unit bounds.
interface TemplateInfo {
  object: THREE.Object3D;
  norm: number; // source units -> TARGET_HEIGHT normalization factor
  minY: number; // source-unit base offset (seat the lowest point on the ground)
  radiusSrc: number; // source-unit horizontal half-extent (selection ring)
}

interface Entry {
  placement: PlacedAsset;
  model: THREE.Object3D | null; // null until the GLB resolves (async pop-in)
  info: TemplateInfo | null;
  footprint: THREE.Mesh | null;
}

export class PlacedAssetsView {
  readonly group: THREE.Group;
  private readonly seed: number;
  private readonly entries = new Map<number, Entry>();
  private readonly templates = new Map<string, Promise<TemplateInfo | null>>();
  private footprintsOn = false;
  private selected: number | null = null;
  private selectionRing: THREE.Mesh | null = null;
  private readonly selectionMat = new THREE.MeshBasicMaterial({
    color: SELECTION_COLOR,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private readonly footprintMat = new THREE.MeshBasicMaterial({
    color: FOOTPRINT_COLOR,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  constructor(placements: readonly PlacedAsset[], seed: number) {
    this.group = new THREE.Group();
    this.group.name = 'placed-assets';
    this.seed = seed;
    this.rebuildAll(placements, true);
  }

  /** Insert (or replace) the placement rendered at this editor index. */
  addPlacement(index: number, placedAsset: PlacedAsset, preload = false): void {
    this.removePlacement(index);
    const entry: Entry = {
      placement: { ...placedAsset },
      model: null,
      info: null,
      footprint: null,
    };
    this.entries.set(index, entry);
    // The collide footprint only needs the record, not the GLB: show it now.
    this.refreshFootprint(entry);
    const task = this.template(entry.placement.path).then((info) => {
      // Removed or replaced while the GLB was in flight: drop the clone.
      if (!info || this.entries.get(index) !== entry) return;
      const model = info.object.clone(true);
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      entry.model = model;
      entry.info = info;
      this.group.add(model);
      this.applyTransform(entry);
      this.refreshFootprint(entry);
      if (this.selected === index) this.refreshSelection();
    });
    // Boot-time builds gate the loading screen; live editor adds do not.
    if (preload) registerPreload(task);
  }

  /** Move/rotate/rescale the placement at `index` (fields left undefined keep). */
  updatePlacement(
    index: number,
    change: { x?: number; z?: number; rotY?: number; scale?: number },
  ): void {
    const entry = this.entries.get(index);
    if (!entry) return;
    const p = entry.placement;
    if (change.x !== undefined) p.x = change.x;
    if (change.z !== undefined) p.z = change.z;
    if (change.rotY !== undefined) p.rotY = change.rotY;
    if (change.scale !== undefined) p.scale = change.scale;
    this.applyTransform(entry);
    this.refreshFootprint(entry);
    if (this.selected === index) this.refreshSelection();
  }

  removePlacement(index: number): void {
    const entry = this.entries.get(index);
    if (!entry) return;
    this.entries.delete(index);
    if (entry.model) this.group.remove(entry.model);
    // Clones share the loader-cached template geometry/materials: never dispose
    // them here. The draped rings are per-entry allocations, so those we do.
    this.dropFootprint(entry);
    if (this.selected === index) this.setSelected(null);
  }

  /** Drape a gold ring under one placement (null clears). */
  setSelected(index: number | null): void {
    this.selected = index;
    this.refreshSelection();
  }

  /** Editor-only: show/hide every colliding placement's collideRadius circle. */
  showFootprints(on: boolean): void {
    if (this.footprintsOn === on) return;
    this.footprintsOn = on;
    for (const entry of this.entries.values()) this.refreshFootprint(entry);
  }

  /** Re-seat every placement on the CURRENT terrainHeight (after a sculpt). */
  reSeat(): void {
    for (const entry of this.entries.values()) {
      this.applyTransform(entry);
      this.refreshFootprint(entry);
    }
    this.refreshSelection();
  }

  /** Replace the whole placement set (map load / undo). */
  rebuildAll(placements: readonly PlacedAsset[], preload = false): void {
    for (const index of [...this.entries.keys()]) this.removePlacement(index);
    this.setSelected(null);
    for (let index = 0; index < placements.length; index++) {
      this.addPlacement(index, placements[index], preload);
    }
  }

  private template(path: string): Promise<TemplateInfo | null> {
    let cached = this.templates.get(path);
    if (!cached) {
      cached = loadGltf(path)
        .then((gltf) => {
          const object = gltf.scene;
          const box = new THREE.Box3().setFromObject(object);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          return {
            object,
            norm: TARGET_HEIGHT / maxDim,
            minY: box.min.y,
            radiusSrc: Math.max(size.x, size.z) / 2 || 1,
          };
        })
        .catch(() => {
          // Missing or unreadable GLB: skip. The editor catalogue may list a
          // model that is not present in a given build; one bad asset must not
          // blank the whole scene.
          return null;
        });
      this.templates.set(path, cached);
    }
    return cached;
  }

  private worldScale(entry: Entry): number {
    const p = entry.placement;
    return (entry.info?.norm ?? 1) * (p.scale > 0 ? p.scale : 1);
  }

  private applyTransform(entry: Entry): void {
    if (!entry.model || !entry.info) return;
    const p = entry.placement;
    const s = this.worldScale(entry);
    entry.model.scale.setScalar(s);
    // Seat the model base on the ground: lift by -minY*scale so its lowest
    // point rests at terrainHeight.
    const groundY = terrainHeight(p.x, p.z, this.seed);
    entry.model.position.set(p.x, groundY - entry.info.minY * s, p.z);
    entry.model.rotation.y = p.rotY;
  }

  // A flat ring whose vertices are draped onto the terrain: each vertex takes
  // the ground height under it, so the ring hugs slopes instead of clipping.
  private drapedRingGeometry(x: number, z: number, radius: number): THREE.RingGeometry {
    const width = Math.max(0.06, radius * 0.08);
    const geo = new THREE.RingGeometry(Math.max(0.05, radius - width), radius, RING_SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(x + pos.getX(i), z + pos.getZ(i), this.seed) + RING_LIFT);
    }
    geo.computeBoundingSphere();
    return geo;
  }

  private refreshFootprint(entry: Entry): void {
    const r = entry.placement.collideRadius ?? 0;
    if (!this.footprintsOn || r <= 0) {
      this.dropFootprint(entry);
      return;
    }
    const geo = this.drapedRingGeometry(entry.placement.x, entry.placement.z, r);
    if (entry.footprint) {
      entry.footprint.geometry.dispose();
      entry.footprint.geometry = geo;
    } else {
      entry.footprint = new THREE.Mesh(geo, this.footprintMat);
      this.group.add(entry.footprint);
    }
    entry.footprint.position.set(entry.placement.x, 0, entry.placement.z);
  }

  private dropFootprint(entry: Entry): void {
    if (!entry.footprint) return;
    this.group.remove(entry.footprint);
    entry.footprint.geometry.dispose();
    entry.footprint = null;
  }

  private refreshSelection(): void {
    const entry = this.selected === null ? undefined : this.entries.get(this.selected);
    if (!entry) {
      if (this.selectionRing) {
        this.group.remove(this.selectionRing);
        this.selectionRing.geometry.dispose();
        this.selectionRing = null;
      }
      return;
    }
    const p = entry.placement;
    // Before the GLB resolves the footprint radius is unknown: use a stand-in.
    const radius = entry.info
      ? Math.max(0.6, entry.info.radiusSrc * this.worldScale(entry) * 1.15)
      : 1;
    const geo = this.drapedRingGeometry(p.x, p.z, radius);
    if (this.selectionRing) {
      this.selectionRing.geometry.dispose();
      this.selectionRing.geometry = geo;
    } else {
      this.selectionRing = new THREE.Mesh(geo, this.selectionMat);
      this.selectionRing.renderOrder = 2;
      this.group.add(this.selectionRing);
    }
    this.selectionRing.position.set(p.x, 0, p.z);
  }
}

/**
 * Back-compat build-once factory (the pre-live-editing shape): builds a
 * PlacedAssetsView and hands back just its group. Initial GLB loads register
 * with the boot preload gate, matching the old behavior.
 */
export function buildPlacedAssets(placements: readonly PlacedAsset[], seed: number): THREE.Group {
  return new PlacedAssetsView(placements, seed).group;
}
