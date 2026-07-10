// Batch preview renderer: one hero-angle webp per GLB under public/models/,
// mirrored at public/previews/<same relative path>.webp for catalog
// consumption (composited over a gradient stage downstream, so backgrounds
// are transparent). Reuses the asset pipeline's headless three renderer
// (scripts/asset_pipeline/lib/preview.mjs) — same meshopt-aware GLTFLoader
// the game uses; no new renderer here.
//
//   npm run previews:render            render missing previews only
//   npm run previews:render -- --force re-render everything
//   ... --size=384                     smaller output (default 512)
//
// Runs sequentially (one shared headless Chrome page; low-memory friendly).
// A model that fails to render is logged and skipped; the run continues and
// exits nonzero at the end listing every failure.
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  closePreview,
  previewBrowserAvailable,
  renderThumb,
} from './asset_pipeline/lib/preview.mjs';

const root = process.cwd();
const modelsDir = path.join(root, 'public', 'models');
const previewsDir = path.join(root, 'public', 'previews');

const force = process.argv.includes('--force');
const sizeArg = process.argv.find((a) => a.startsWith('--size='));
const size = sizeArg ? Number.parseInt(sizeArg.slice('--size='.length), 10) : 512;
if (!Number.isFinite(size) || size <= 0) {
  console.error(`invalid --size: ${sizeArg}`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && ent.name.endsWith('.glb')) out.push(p);
  }
  return out;
}

async function main() {
  if (!previewBrowserAvailable()) {
    console.error('no headless browser found (see scripts/browser_path_resolve.mjs)');
    process.exit(1);
  }
  const sharp = (await import('sharp')).default;
  const glbs = walk(modelsDir).sort();
  console.log(`${glbs.length} models under public/models (size=${size}px, force=${force})`);

  let rendered = 0;
  let skipped = 0;
  let totalBytes = 0;
  const failures = [];
  const tmpPng = path.join(tmpdir(), `asset_preview_${process.pid}.png`);

  for (let i = 0; i < glbs.length; i++) {
    const glb = glbs[i];
    const rel = path.relative(modelsDir, glb).split(path.sep).join('/');
    const dest = path.join(previewsDir, rel.replace(/\.glb$/, '.webp'));
    if (!force && existsSync(dest)) {
      skipped++;
    } else {
      try {
        await renderThumb(glb, tmpPng, { size, transparent: true });
        mkdirSync(path.dirname(dest), { recursive: true });
        await sharp(tmpPng).webp({ quality: 80 }).toFile(dest);
        totalBytes += statSync(dest).size;
        rendered++;
      } catch (err) {
        failures.push({ rel, message: err?.message ?? String(err) });
        console.error(`FAIL ${rel}: ${err?.message ?? err}`);
      }
    }
    if ((i + 1) % 50 === 0 || i + 1 === glbs.length) {
      console.log(
        `[${i + 1}/${glbs.length}] rendered=${rendered} skipped=${skipped} failed=${failures.length}`,
      );
    }
  }

  rmSync(tmpPng, { force: true });
  await closePreview();

  console.log(
    `done: ${rendered} rendered (${(totalBytes / 1024 / 1024).toFixed(1)} MB new), ` +
      `${skipped} skipped, ${failures.length} failed`,
  );
  if (failures.length) {
    console.error('\nfailed models:');
    for (const f of failures) console.error(`  ${f.rel}: ${f.message}`);
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await closePreview();
  process.exit(1);
});
