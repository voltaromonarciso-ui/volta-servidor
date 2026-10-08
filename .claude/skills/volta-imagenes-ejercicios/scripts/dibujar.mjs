#!/usr/bin/env node
/* Dibuja las imágenes de los ejercicios SIN servicios externos: abre la app en un navegador (Playwright),
   inyecta ilustrador.js y guarda cada ejercicio como PNG 960×720 en public/assets/ejercicios/<slug>.png.
   Después: integrar.mjs (WebP y frontend/imagenes.js) y npm run build:app.

   Uso:
     node .claude/skills/volta-imagenes-ejercicios/scripts/dibujar.mjs --ejercicio "Sentadilla"
     node …/dibujar.mjs --todos [--rehacer]
   Necesita Playwright (npm i -g playwright, o NODE_PATH apuntando a él) y Chromium (CHROMIUM_PATH si no es el de serie). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ejercicios, slug } from './generar.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const OUT = path.join(ROOT, 'public/assets/ejercicios');
const APP = path.join(ROOT, 'Volta-app.html');
const arg = (n) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : null; };
const has = (n) => process.argv.includes(n);

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch (e) { console.error('Falta Playwright: npm i -g playwright (y ejecútalo con NODE_PATH=$(npm root -g)).'); process.exit(2); }

let sel = ejercicios();
if (arg('--ejercicio')) { const q = slug(arg('--ejercicio')); sel = sel.filter((e) => slug(e.nombre) === q); if (!sel.length) throw new Error('No está en la lista: ' + arg('--ejercicio')); }
else if (!has('--todos')) { console.log('Indica --ejercicio "<nombre>" o --todos.'); process.exit(1); }
if (!has('--rehacer')) sel = sel.filter((e) => !['png', 'webp'].some((x) => fs.existsSync(path.join(OUT, slug(e.nombre) + '.' + x))));
fs.mkdirSync(OUT, { recursive: true });

const exe = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p));
const b = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const page = await b.newPage();
await page.goto('file://' + APP); await page.waitForTimeout(1200);
await page.addScriptTag({ path: path.join(HERE, 'ilustrador.js') });
const shot = await b.newPage({ viewport: { width: 960, height: 720 } });
let ok = 0;
for (const e of sel) {
  const r = await page.evaluate((n) => { const i = EX.findIndex((x) => x[0] === n); if (i < 0) return { err: 'no está en la app' }; try { return { svg: vxIlustrar(i) }; } catch (x) { return { err: x.message }; } }, e.nombre);
  if (r.err) { console.log(`✗ ${e.nombre}: ${r.err}`); continue; }
  await shot.setContent('<body style="margin:0">' + r.svg + '</body>');
  await shot.screenshot({ path: path.join(OUT, slug(e.nombre) + '.png') });
  ok++;
}
await b.close();
console.log(`Dibujadas ${ok}/${sel.length} → ${path.relative(ROOT, OUT)}. Revísalas y ejecuta integrar.mjs.`);
