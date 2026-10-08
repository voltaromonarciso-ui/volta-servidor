#!/usr/bin/env node
/* Genera las imágenes de los ejercicios de Volta con el estilo de la imagen de «Press de banca».
   Usa la API de imágenes de Google Gemini: envía la imagen de referencia + la descripción de cada ejercicio
   (sacada de docs/IMAGENES_EJERCICIOS.md) y guarda el resultado en public/assets/ejercicios/<slug>.png.

   Uso:
     GEMINI_API_KEY=… node .claude/skills/volta-imagenes-ejercicios/scripts/generar.mjs --lista
     GEMINI_API_KEY=… node …/generar.mjs --ejercicio "Sentadilla"
     GEMINI_API_KEY=… node …/generar.mjs --todos [--max 20] [--rehacer]
   Opciones: --modelo <id> (o GEMINI_IMAGE_MODEL), --prueba (no llama a la API: muestra el prompt). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const DOC = path.join(ROOT, 'docs/IMAGENES_EJERCICIOS.md');
const OUT = path.join(ROOT, 'public/assets/ejercicios');
const REF = path.join(HERE, '../referencia/press_de_banca.png');
const MODEL = arg('--modelo') || process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

function arg(name) { const i = process.argv.indexOf(name); return i !== -1 ? process.argv[i + 1] : null; }
const has = (name) => process.argv.includes(name);
export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Lista de ejercicios sin imagen propia: la tabla final de docs/IMAGENES_EJERCICIOS.md
export function ejercicios() {
  const rows = fs.readFileSync(DOC, 'utf8').split('\n').filter((l) => /^\| \d+ \|/.test(l));
  return rows.map((l) => {
    const c = l.split('|').slice(1, -1).map((x) => x.trim());
    return { n: +c[0], nombre: c[1], grupo: c[2], musculo: c[3], material: c[4], movimiento: c[5], vista: c[6] };
  });
}

const MOMENTO = {
  squat: 'la parte baja de la sentadilla', thrust: 'la extensión completa de cadera', ohp: 'los brazos extendidos sobre la cabeza',
  curl: 'la máxima contracción del curl', overhead: 'los brazos extendidos', plank: 'la plancha estable', calf: 'la elevación máxima sobre las puntas',
  lateral: 'los brazos a la altura de los hombros', reardelt: 'los brazos abiertos a la altura de los hombros', legpress: 'las rodillas flexionadas a 90°',
  crunch: 'la máxima contracción abdominal', shrug: 'los hombros elevados al máximo',
};
export function prompt(e) {
  const momento = MOMENTO[e.movimiento] || 'la posición más reconocible del movimiento';
  return [
    `Ilustración anatómica médica de un maniquí humano gris sin ropa ni cara haciendo «${e.nombre}» con ${e.material.toLowerCase()},`,
    `vista ${e.vista}, en ${momento}. Fibras musculares dibujadas con trazo fino gris oscuro (#414c44).`,
    `Solo el músculo ${e.musculo} está resaltado en verde suave semitransparente (#82be97), sin brillo ni neón.`,
    'Fondo liso gris verdoso #c4cfc9 sin suelo, luz de estudio suave y una sombra de contacto muy difusa.',
    'Material gris pizarra mate (#4d5c55). Formato 4:3 apaisado, figura centrada ocupando el 80-90 % del ancho, nada cortado,',
    'sin texto, sin flechas, sin logotipos. Copia exactamente el estilo, la paleta, el trazo y la iluminación de la imagen de referencia adjunta',
    '(press de banca); cambia solo el ejercicio, la postura y el material. Técnica correcta: espalda neutra y articulaciones alineadas.',
  ].join(' ');
}

async function generar(e, refB64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/png', data: refB64 } }, { text: prompt(e) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '4:3' } },
  };
  for (let intento = 1; intento <= 4; intento++) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
    if (res.status === 429 || res.status >= 500) { const w = 2000 * 2 ** intento; console.log(`   ${res.status}: reintento en ${w / 1000} s`); await new Promise((r) => setTimeout(r, w)); continue; }
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${d.error ? d.error.message : ''}`.trim());
    const part = (d.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData || p.inline_data);
    if (!part) throw new Error('la respuesta no trae imagen (' + (d.candidates?.[0]?.finishReason || 'sin motivo') + ')');
    const img = part.inlineData || part.inline_data;
    return Buffer.from(img.data, 'base64');
  }
  throw new Error('demasiados reintentos');
}

async function main() {
  const L = ejercicios();
  if (has('--lista')) {
    L.forEach((e) => { const f = path.join(OUT, slug(e.nombre) + '.png'); console.log(`${String(e.n).padStart(3)} ${fs.existsSync(f) || fs.existsSync(f.replace(/\.png$/, '.webp')) ? '✓' : '·'} ${e.nombre} — ${e.grupo}`); });
    return;
  }
  let sel = [];
  if (arg('--ejercicio')) { const q = slug(arg('--ejercicio')); sel = L.filter((e) => slug(e.nombre) === q); if (!sel.length) throw new Error('No está en la lista: ' + arg('--ejercicio')); }
  else if (has('--todos')) sel = L;
  else { console.log('Indica --lista, --ejercicio "<nombre>" o --todos.'); process.exit(1); }
  if (!has('--rehacer')) sel = sel.filter((e) => !fs.existsSync(path.join(OUT, slug(e.nombre) + '.png')) && !fs.existsSync(path.join(OUT, slug(e.nombre) + '.webp')));
  const max = +arg('--max') || sel.length; sel = sel.slice(0, max);
  if (has('--prueba')) { sel.forEach((e) => console.log(`\n# ${e.nombre}\n${prompt(e)}`)); return; }
  if (!KEY) { console.error('Falta GEMINI_API_KEY (consíguela gratis en https://aistudio.google.com/apikey).'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  const ref = fs.readFileSync(REF).toString('base64');
  console.log(`Modelo ${MODEL} · ${sel.length} imágenes → ${path.relative(ROOT, OUT)}`);
  let ok = 0;
  for (const e of sel) {
    try {
      const png = await generar(e, ref);
      fs.writeFileSync(path.join(OUT, slug(e.nombre) + '.png'), png);
      ok++; console.log(`✓ ${e.nombre}`);
    } catch (err) { console.log(`✗ ${e.nombre}: ${err.message}`); }
  }
  console.log(`\nHechas ${ok}/${sel.length}. Revisa cada imagen y luego ejecuta integrar.mjs.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
