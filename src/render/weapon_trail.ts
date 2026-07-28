import * as THREE from 'three';
import { loadTexture } from './assets/loader';
import { registerPreload } from './assets/preload';

// ponytail: prototype only. ONE big arc per weapon swing, drawn as a textured
// quad placed in front of the attacker.
//
// This cannot live in the pooled THREE.Points system (`vfx.ts`): that shader
// clamps gl_PointSize to 110px, so the visible crescent caps out around half a
// character tall no matter what size is asked for. A quad has no such cap.
//
// The quad BILLBOARDS to the camera and is rolled within the screen plane
// (upright for a chop, flat for a slice) rather than being planted in the
// swing's true world plane. That was the first attempt and it is unusable in a
// third-person game: a chop's plane contains the attacker's forward axis, so
// with the camera behind the player (the normal case) the quad is seen exactly
// edge-on and vanishes. Billboarding keeps the arc readable from every camera
// angle, at the cost of the trail not foreshortening as the attacker turns.
//
// Ceiling: a flat quad, not a swept ribbon, so the arc pops in whole rather
// than being carved out over the swing. An animated trail would need per-frame
// geometry rebuilt from the weapon bone's path.

const POOL = 8; // concurrent swings on screen; oldest is recycled past this
const LIFETIME = 0.26;
const SIZE = 3.6; // world units; the sprite's crescent fills maybe half its quad
const FORWARD = 1.2; // a stride out, so the arc covers the melee area
const HEIGHT = 1.3; // mid-torso, the centre the swing pivots around
// slash_02.png draws its crescent in the LOWER part of the image, not centred,
// so the quad is nudged along its own local +Y to bring the visible arc back
// onto the anchor. Without this the slice sits at knee height and the chop
// drifts off to one side.
const CRESCENT_OFFSET = SIZE * 0.12;

let slashTexture: THREE.Texture | null = null;
registerPreload(
  loadTexture('/vfx/slash_02.png', { srgb: true }).then((tex) => {
    slashTexture = tex;
    return tex;
  }),
);

type TrailQuad = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

export class WeaponTrail {
  private quads: TrailQuad[] = [];
  private life: number[] = [];
  // in-plane roll per quad: a quarter turn stands the crescent up for a chop
  private roll: number[] = [];
  // where the arc is pinned in the world; the quad's own position is derived
  // from it every frame, since the crescent nudge is in quad-local space
  private anchors: THREE.Vector3[] = [];
  private head = 0;

  constructor(
    scene: THREE.Scene,
    private camera: THREE.Camera,
  ) {
    // one shared geometry; each quad needs its own material only because the
    // fade is per-instance opacity
    const geo = new THREE.PlaneGeometry(SIZE, SIZE);
    for (let i = 0; i < POOL; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: slashTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        // the particle system's raw shader skips three's injected tonemapping,
        // so skip it here too or the same HDR color reads differently
        toneMapped: false,
        opacity: 0,
      });
      // The Kenney slash PNG is black-background with no usable alpha, so an
      // additive quad shows a faint lit RECTANGLE around the crescent. The
      // particle shader solves this with a near-zero-luminance discard; do the
      // same here rather than shipping a second, alpha-cut copy of the art.
      mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#include <map_fragment>
           if (dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)) < 0.06) discard;`,
        );
      };
      const quad = new THREE.Mesh(geo, mat) as TrailQuad;
      quad.visible = false;
      quad.frustumCulled = false;
      scene.add(quad);
      this.quads.push(quad);
      this.life.push(0);
      this.roll.push(0);
      this.anchors.push(new THREE.Vector3());
    }
  }

  /** `origin` is the attacker's feet, `facing` its rendered yaw (0 = +Z, the
   *  sim convention). `vertical` stands the arc up for an overhead chop;
   *  otherwise it reads as a side-to-side slice. */
  spawn(origin: THREE.Vector3, facing: number, vertical: boolean, color: THREE.Color): void {
    const i = this.head;
    this.head = (this.head + 1) % POOL;
    const quad = this.quads[i];
    this.anchors[i].set(
      origin.x + Math.sin(facing) * FORWARD,
      origin.y + HEIGHT,
      origin.z + Math.cos(facing) * FORWARD,
    );
    // the texture's crescent spans its local X and opens toward local Y, so
    // unrolled it already reads as a side-to-side sweep; a quarter turn puts
    // its span on the vertical for a chop
    this.roll[i] = vertical ? Math.PI / 2 : 0;
    quad.material.color.copy(color);
    quad.material.opacity = 1;
    quad.visible = true;
    this.life[i] = LIFETIME;
    this.place(i);
  }

  update(dt: number): void {
    for (let i = 0; i < POOL; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const quad = this.quads[i];
      if (this.life[i] <= 0) {
        quad.visible = false;
        quad.material.opacity = 0;
        continue;
      }
      // linear fade: the arc is a flash, so a curve buys nothing here
      quad.material.opacity = this.life[i] / LIFETIME;
      // re-billboard every frame: the camera orbits during the swing
      this.place(i);
    }
  }

  private place(i: number): void {
    const quad = this.quads[i];
    quad.quaternion.copy(this.camera.quaternion);
    if (this.roll[i] !== 0) quad.rotateZ(this.roll[i]);
    quad.position.copy(this.anchors[i]);
    // local, so it follows the billboard + roll and always pushes the
    // off-centre crescent back onto the anchor
    quad.translateY(CRESCENT_OFFSET);
  }
}
