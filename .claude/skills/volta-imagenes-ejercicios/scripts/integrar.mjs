#!/usr/bin/env node
/* Mete en la app las imágenes de public/assets/ejercicios/:
   1) convierte los PNG a WebP 960×720 (calidad 82) si hay Python con Pillow, para que pesen poco;
   2) escribe frontend/imagenes.js con la lista «ejercicio → archivo».
   Después: npm run build:app. La app muestra la imagen en la lista y en la ficha (la animación sigue debajo)
   y, si el archivo no carga (p. ej. sin conexión en el HTML suelto), vuelve al dibujo. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ejercicios, slug } from './generar.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const DIR = path.join(ROOT, 'public/assets/ejercicios');
const MOD = path.join(ROOT, 'frontend/imagenes.js');

fs.mkdirSync(DIR, { recursive: true });
const pngs = fs.readdirSync(DIR).filter((f) => f.endsWith('.png'));
if (pngs.length) {
  const py = `
import sys, os
from PIL import Image
d = sys.argv[1]
for f in sys.argv[2:]:
    p = os.path.join(d, f)
    im = Image.open(p).convert('RGB')
    w, h = im.size
    # recorte a 4:3 centrado y 960×720
    if w / h > 4 / 3:
        nw = int(h * 4 / 3); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    elif w / h < 4 / 3:
        nh = int(w * 3 / 4); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.resize((960, 720), Image.LANCZOS).save(p[:-4] + '.webp', 'WEBP', quality=82, method=6)
    os.remove(p)
`;
  const r = spawnSync('python3', ['-c', py, DIR, ...pngs], { encoding: 'utf8' });
  if (r.status === 0) console.log(`Convertidas a WebP: ${pngs.length}`);
  else console.log('Sin Python/Pillow: se usan los PNG tal cual.', (r.stderr || '').split('\n').slice(-2).join(' '));
}

const files = new Set(fs.readdirSync(DIR).filter((f) => /\.(webp|png|jpe?g|mp4|webm)$/.test(f)));
const map = {};
for (const e of ejercicios()) {
  const s = slug(e.nombre);
  const f = ['webp', 'png', 'jpg', 'jpeg'].map((x) => s + '.' + x).find((x) => files.has(x));
  if (f) map[e.nombre] = files.has(s + '.mp4') ? [f, s + '.mp4', files.has(s + '.webm') ? s + '.webm' : ''] : [f];
}
const js = `/* VOLTA · Imágenes de ejercicios generadas con la skill volta-imagenes-ejercicios (estilo «Press de banca»).
   Archivo generado por .claude/skills/volta-imagenes-ejercicios/scripts/integrar.mjs: no editar a mano.
   Cada ejercicio de la lista usa public/assets/ejercicios/<archivo> como imagen propia. */
(function () {
  if (typeof EX === 'undefined' || typeof EMB !== 'object') return;
  const M = ${JSON.stringify(map, null, 2).replace(/\n/g, '\n  ')};
  const done = [];
  EX.forEach((e) => {
    const m = M[e[0]];
    if (!m || (e.cid && EMB[e.cid])) return; // las fotos que ya trae la app tienen prioridad
    const f = m[0];
    done.push([e, e.cid, e.image]);
    e.cid = 'gen_' + f.replace(/\\.\\w+$/, '');
    EMB[e.cid] = 'assets/ejercicios/' + f;
    e.image = EMB[e.cid];
    if (m[1]) { e.vgen = 'assets/ejercicios/' + m[1]; if (m[2]) e.vgenW = 'assets/ejercicios/' + m[2]; } // vídeo en bucle (Veo) para la ficha
  });
  // Si las imágenes no están a mano (el HTML abierto suelto, sin la carpeta assets), se vuelve a los dibujos
  if (done.length) {
    const t = new Image();
    t.onerror = () => { done.forEach(([e, cid, img]) => { delete EMB[e.cid]; e.cid = cid; e.image = img; delete e.vgen; }); try { R(); } catch (x) { /* sin pantalla */ } };
    t.src = EMB[done[0][0].cid];
  }
})();
`;
fs.writeFileSync(MOD, js);
console.log(`frontend/imagenes.js: ${Object.keys(map).length} ejercicios con imagen, ${Object.values(map).filter((m) => m[1]).length} con vídeo. Ahora: npm run build:app`);
