// Live 3D viewer module for the asset library. Served (with three.bundle.js and
// /repo/*) by `pipeline.mjs library --serve`. Renders the REAL GLB for the
// selected asset with orbit controls (drag to rotate, scroll to zoom), a ground
// plane + grid for context, a per-animation clip selector with playback, and
// live skin-atlas application for skin assets. A "vs player" toggle drops the
// knight in beside the asset at true in-game heights for scale.
//
// Exposes window.LiveViewer.{open(asset, ui), close()} for the page's grid
// script to drive on detail open/close.
import { GLTFLoader, MeshoptDecoder, OrbitControls, THREE } from '/three.bundle.js';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader();
const KNIGHT = 'public/models/chars/players/knight.glb';

function loadGlb(url) {
  return new Promise((res, rej) => loader.load(url, res, undefined, rej));
}
function loadTex(url) {
  return new Promise((res, rej) => texLoader.load(url, res, undefined, rej));
}

// Per-asset display height (world units), matching the game's normalization so
// scale mode is honest. Falls back to a sensible default per kind.
function displayHeight(asset) {
  if (asset.kind === 'skin') return 2.6;
  if (asset.category === 'weapons')
    return asset.family === 'staff' ? 2.3 : asset.family === 'dagger' ? 1.3 : 2.0;
  if (
    asset.category?.startsWith('chars') ||
    asset.category === 'creatures' ||
    asset.category === 'generated'
  ) {
    const h = asset.inspect?.bounds ? asset.inspect.bounds.max[1] - asset.inspect.bounds.min[1] : 0;
    return 2.6; // humanoid default; creatures vary but 2.6 reads well in the viewer
  }
  if (asset.category === 'props') {
    const b = asset.inspect?.bounds;
    return b ? Math.max(0.5, b.max[1] - b.min[1]) : 2;
  }
  return 2;
}

function makeLights(scene) {
  const key = new THREE.DirectionalLight(0xfff0dc, 2.3);
  key.position.set(4, 6, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fb6e0, 0.9);
  fill.position.set(-5, 2, -2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(0, 3, -6);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
}

function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
}

// Normalize a loaded scene to a target height, feet on y=0, centered on XZ.
function normalize(obj, targetH) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const h = box.max.y - box.min.y || 1;
  const s = targetH / h;
  obj.scale.setScalar(s);
  obj.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(obj);
  const c = b2.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= b2.min.y;
  obj.updateMatrixWorld(true);
}

function applyAtlas(obj, tex) {
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  obj.traverse((o) => {
    if (!o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (m.map) {
        m.map = tex;
        m.needsUpdate = true;
      }
    }
  });
}

let session = null;

function teardown() {
  if (!session) return;
  cancelAnimationFrame(session.raf);
  session.controls.dispose();
  for (const root of session.roots) {
    session.scene.remove(root);
    disposeObject(root);
  }
  session.renderer.dispose();
  window.removeEventListener('resize', session.onResize);
  session = null;
}

window.LiveViewer = {
  close: teardown,

  async open(asset, ui) {
    teardown();
    const { canvas, clipSelect, statusEl, contextToggle } = ui;
    const setStatus = (t) => {
      if (statusEl) statusEl.textContent = t;
    };
    setStatus('loading model...');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    makeLights(scene);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(6, 48),
      new THREE.MeshStandardMaterial({ color: 0x262b34, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const grid = new THREE.GridHelper(12, 24, 0x3a414c, 0x2b313a);
    scene.add(grid);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 500);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    session = {
      renderer,
      scene,
      camera,
      controls,
      roots: [ground, grid],
      mixers: [],
      raf: 0,
      onResize: null,
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(2, r.width);
      const h = Math.max(2, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    session.onResize = resize;
    window.addEventListener('resize', resize);
    resize();

    let clips = [];
    try {
      // Primary asset: for skins the "glb" is the class model + an atlas swap.
      const targetH = displayHeight(asset);
      const gltf = await loadGlb(`/repo/${asset.repoGlb}`);
      const obj = gltf.scene;
      if (asset.repoAtlas) {
        try {
          applyAtlas(obj, await loadTex(`/repo/${asset.repoAtlas}`));
        } catch {
          setStatus('(atlas failed to load; showing base model)');
        }
      }
      normalize(obj, targetH);
      scene.add(obj);
      session.roots.push(obj);
      clips = gltf.animations ?? [];

      // Mixer + clip playback.
      let mixer = null;
      if (clips.length) {
        mixer = new THREE.AnimationMixer(obj);
        session.mixers.push(mixer);
      }
      const playClip = (name) => {
        if (!mixer) return;
        mixer.stopAllAction();
        const clip = clips.find((c) => c.name === name) ?? clips[0];
        if (clip) mixer.clipAction(clip).reset().play();
      };
      if (clipSelect) {
        clipSelect.innerHTML = clips.length
          ? clips
              .map(
                (c) => `<option value="${c.name}">${c.name} (${c.duration.toFixed(2)}s)</option>`,
              )
              .join('')
          : '<option>no animations</option>';
        clipSelect.disabled = clips.length === 0;
        clipSelect.onchange = () => playClip(clipSelect.value);
      }
      // Prefer an idle/walk clip to start.
      const start =
        clips.find((c) => /^idle$/i.test(c.name)) ??
        clips.find((c) => /idle/i.test(c.name)) ??
        clips.find((c) => /walk/i.test(c.name)) ??
        clips[0];
      if (start) {
        playClip(start.name);
        if (clipSelect) clipSelect.value = start.name;
      }

      // Optional scale context: the knight beside the asset, both at true height.
      let knightRoot = null;
      const addContext = async () => {
        if (knightRoot || asset.repoGlb.endsWith('knight.glb')) return;
        const kg = await loadGlb(`/repo/${KNIGHT}`);
        knightRoot = kg.scene;
        normalize(knightRoot, 2.6);
        knightRoot.position.x = -1.6;
        obj.position.x = 1.6;
        const km = new THREE.AnimationMixer(knightRoot);
        const kidle = (kg.animations ?? []).find((c) => /^idle$/i.test(c.name));
        if (kidle) km.clipAction(kidle).play();
        session.mixers.push(km);
        scene.add(knightRoot);
        session.roots.push(knightRoot);
        frame(true);
      };
      const removeContext = () => {
        if (!knightRoot) return;
        scene.remove(knightRoot);
        disposeObject(knightRoot);
        session.roots = session.roots.filter((r) => r !== knightRoot);
        knightRoot = null;
        obj.position.x = 0;
        frame(false);
      };
      if (contextToggle) {
        contextToggle.checked = false;
        contextToggle.onchange = () => (contextToggle.checked ? addContext() : removeContext());
      }

      // Frame the camera on current content.
      const frame = (wide) => {
        const box = new THREE.Box3();
        box.setFromObject(obj);
        if (knightRoot) box.expandByObject(knightRoot);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const r = sphere.radius || 1;
        const dist = (r / Math.sin((35 * Math.PI) / 360)) * (wide ? 1.15 : 1.25);
        controls.target.copy(sphere.center);
        camera.position.set(
          sphere.center.x + dist * 0.35,
          sphere.center.y + r * 0.3,
          sphere.center.z + dist,
        );
        camera.near = r / 100;
        camera.far = r * 100;
        camera.updateProjectionMatrix();
        controls.update();
      };
      frame(false);
      setStatus(
        clips.length
          ? `${clips.length} animations - drag to rotate, scroll to zoom`
          : 'static model - drag to rotate',
      );
    } catch (err) {
      setStatus(`failed to load: ${String(err.message ?? err).slice(0, 120)}`);
      return;
    }

    // Render loop.
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      for (const m of session.mixers) m.update(dt);
      controls.update();
      renderer.render(scene, camera);
      session.raf = requestAnimationFrame(tick);
    };
    tick();
  },
};
