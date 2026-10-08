#!/usr/bin/env node
/* Anima las imágenes de los ejercicios con Veo (Google): cada imagen de public/assets/ejercicios/<slug>.webp|png se
   convierte en un vídeo corto en bucle del ejercicio con el mismo estilo. Después ffmpeg lo deja en 4:3, 640×480,
   sin audio y ligero (<slug>.mp4). Luego: integrar.mjs y npm run build:app.

   Uso:
     GEMINI_API_KEY=… node .claude/skills/volta-imagenes-ejercicios/scripts/animar.mjs --lista
     GEMINI_API_KEY=… node …/animar.mjs --ejercicio "Sentadilla"
     GEMINI_API_KEY=… node …/animar.mjs --todos [--max 5] [--rehacer]
   Opciones: --modelo <id> (o VEO_MODEL), --prueba (muestra el prompt sin llamar a la API). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ejercicios, slug } from './generar.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const DIR = path.join(ROOT, 'public/assets/ejercicios');
const MODEL = arg('--modelo') || process.env.VEO_MODEL || 'veo-3.0-fast-generate-001';
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const API = 'https://generativelanguage.googleapis.com/v1beta';

function arg(name) { const i = process.argv.indexOf(name); return i !== -1 ? process.argv[i + 1] : null; }
const has = (name) => process.argv.includes(name);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function promptVideo(e) {
  return [
    `Anima esta ilustración: el maniquí anatómico gris hace 2 repeticiones lentas y completas de «${e.nombre}» con técnica correcta`,
    `(${e.material.toLowerCase()}, recorrido completo, espalda neutra, articulaciones alineadas). El músculo ${e.musculo} sigue resaltado en verde suave.`,
    'Cámara totalmente fija, mismo encuadre, mismo fondo liso gris verdoso #c4cfc9, mismo estilo de ilustración médica con fibras.',
    'El vídeo empieza y termina en la misma postura para que se pueda repetir en bucle. Sin texto, sin personas reales, sin cambios de escena.',
  ].join(' ');
}

function imagenDe(s) {
  for (const x of ['png', 'webp', 'jpg']) { const f = path.join(DIR, s + '.' + x); if (fs.existsSync(f)) return f; }
  return null;
}
function aPng(f) { // Veo recibe PNG/JPEG
  if (f.endsWith('.png')) return fs.readFileSync(f);
  const out = path.join(os.tmpdir(), 'vx-' + path.basename(f) + '.png');
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, out]);
  if (r.status !== 0) throw new Error('ffmpeg no pudo convertir ' + path.basename(f));
  return fs.readFileSync(out);
}

async function veo(e, png) {
  const h = { 'Content-Type': 'application/json', 'x-goog-api-key': KEY };
  const body = {
    instances: [{ prompt: promptVideo(e), image: { bytesBase64Encoded: png.toString('base64'), mimeType: 'image/png' } }],
    parameters: { aspectRatio: '16:9' },
  };
  let res = await fetch(`${API}/models/${encodeURIComponent(MODEL)}:predictLongRunning`, { method: 'POST', headers: h, body: JSON.stringify(body) });
  let d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${d.error ? d.error.message : ''}`.trim());
  const op = d.name;
  for (let i = 0; i < 60; i++) { // hasta ~10 min
    await sleep(10000);
    res = await fetch(`${API}/${op}`, { headers: h });
    d = await res.json().catch(() => ({}));
    if (d.error) throw new Error(d.error.message || 'error de Veo');
    if (d.done) break;
    if (i % 3 === 2) console.log('   …generando');
  }
  if (!d.done) throw new Error('Veo tarda demasiado; vuelve a intentarlo');
  const r = d.response || {};
  const sample = (r.generateVideoResponse && r.generateVideoResponse.generatedSamples || r.generatedVideos || r.videos || [])[0];
  const v = sample && (sample.video || sample);
  if (!v) throw new Error('la respuesta no trae vídeo (puede haberlo filtrado la política de contenido)');
  if (v.bytesBase64Encoded) return Buffer.from(v.bytesBase64Encoded, 'base64');
  const dl = await fetch(v.uri, { headers: { 'x-goog-api-key': KEY } });
  if (!dl.ok) throw new Error('no se pudo descargar el vídeo: ' + dl.status);
  return Buffer.from(await dl.arrayBuffer());
}

// 16:9 → recorte central 4:3, 640×480, sin audio, H.264 ligero y listo para reproducir en streaming
export function optimizar(raw, out) {
  const tmp = path.join(os.tmpdir(), 'vx-raw-' + Date.now() + '.mp4');
  fs.writeFileSync(tmp, raw);
  const vf = "crop='min(iw,ih*4/3)':ih,scale=640:480,fps=24";
  // MP4 (H.264) para iPhone y la mayoría de móviles; WebM (VP9) para los navegadores que no traen H.264
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  const w = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-an', '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', out.replace(/\.mp4$/, '.webm')]);
  fs.rmSync(tmp, { force: true });
  if (r.status !== 0 || w.status !== 0) throw new Error('ffmpeg: ' + String(r.stderr || w.stderr).slice(0, 200));
}

async function main() {
  const L = ejercicios().filter((e) => imagenDe(slug(e.nombre)));
  if (has('--lista')) {
    if (!L.length) console.log('Aún no hay imágenes: primero generar.mjs e integrar.mjs.');
    L.forEach((e) => console.log(`${fs.existsSync(path.join(DIR, slug(e.nombre) + '.mp4')) ? '✓' : '·'} ${e.nombre}`));
    return;
  }
  let sel = [];
  if (arg('--ejercicio')) { const q = slug(arg('--ejercicio')); sel = L.filter((e) => slug(e.nombre) === q); if (!sel.length) throw new Error('Ese ejercicio aún no tiene imagen: ' + arg('--ejercicio')); }
  else if (has('--todos')) sel = L;
  else { console.log('Indica --lista, --ejercicio "<nombre>" o --todos.'); process.exit(1); }
  if (!has('--rehacer')) sel = sel.filter((e) => !fs.existsSync(path.join(DIR, slug(e.nombre) + '.mp4')));
  sel = sel.slice(0, +arg('--max') || sel.length);
  if (has('--prueba')) { sel.forEach((e) => console.log(`\n# ${e.nombre}\n${promptVideo(e)}`)); return; }
  if (!KEY) { console.error('Falta GEMINI_API_KEY (https://aistudio.google.com/apikey).'); process.exit(2); }
  console.log(`Modelo ${MODEL} · ${sel.length} vídeos`);
  let ok = 0;
  for (const e of sel) {
    try {
      const s = slug(e.nombre);
      const raw = await veo(e, aPng(imagenDe(s)));
      optimizar(raw, path.join(DIR, s + '.mp4'));
      ok++; console.log(`✓ ${e.nombre} (${Math.round(fs.statSync(path.join(DIR, s + '.mp4')).size / 1024)} KB)`);
    } catch (err) { console.log(`✗ ${e.nombre}: ${err.message}`); }
  }
  console.log(`\nHechos ${ok}/${sel.length}. Revisa cada vídeo y luego ejecuta integrar.mjs.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
