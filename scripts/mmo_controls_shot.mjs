// Visual capture for the MMO-themed native form controls.
// Boots the game offline and screenshots:
//   1. Options > Interface — themed range sliders + closed language dropdown
//   2. the language dropdown OPEN (gold listbox replacing the native <select> menu)
//   3. the report dialog — themed textarea resize grip + custom reason dropdown
// Saves to docs/pr-assets/mmo-controls/.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { BROWSER_PATH as EDGE } from './browser_path.mjs';

const URL = process.env.GAME_URL ?? 'http://localhost:5173';
const OUT = 'docs/pr-assets/mmo-controls';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--window-size=1600,900', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE.error:', m.text()); });

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
// #btn-offline is a hidden (aria-hidden, off-screen) compat trigger — drive it via evaluate.
await page.evaluate(() => document.querySelector('#btn-offline')?.click());
await sleep(400);
await page.type('#char-name', 'Tinkerer');
await page.evaluate(() => document.querySelector('#offline-select .mini-class[data-class="warrior"]')?.click());
await sleep(200);
await page.evaluate(() => document.querySelector('#btn-start-offline')?.click());
await page.waitForFunction(() => window.__game?.hud, { timeout: 30000 });
await sleep(800);

// 1. Interface panel — sliders (HUD opacity, UI scale, FOV, volumes) + language picker.
await page.evaluate(() => { const h = window.__game.hud; h.toggleOptionsMenu(); h.optionsView = 'interface'; h.renderOptions(); });
await sleep(400);
await (await page.$('#options-menu')).screenshot({ path: `${OUT}/01-interface-sliders.png` });

// 2. Open the language dropdown to show the gold themed listbox.
await page.evaluate(() => document.querySelector('.set-lang-select .ui-dd-btn')?.click());
await sleep(300);
await (await page.$('#options-menu')).screenshot({ path: `${OUT}/02-language-dropdown-open.png` });

// 3. Report dialog — textarea (themed resize grip) + reason dropdown.
// A multiline inputDialog renders the .cd-input textarea (themed resize grip),
// reachable offline (it backs the talents build-name/export prompts).
await page.evaluate(() => {
  const h = window.__game.hud;
  if (h.optionsOpen) h.toggleOptionsMenu();
  h.inputDialog({
    title: 'Name This Build',
    label: 'Drag the bottom-right grip to resize. Note the gold corner — no native handle.',
    value: 'Frostfire Bastion — solo / open-world spec',
    multiline: true,
    onOk: () => {},
  });
});
await page.waitForSelector('#confirm-dialog textarea.cd-input', { visible: true, timeout: 5000 });
await sleep(300);
await (await page.$('#confirm-dialog')).screenshot({ path: `${OUT}/03-textarea-grip.png` });

await browser.close();
console.log('saved screenshots to', OUT);
