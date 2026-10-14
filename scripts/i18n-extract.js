#!/usr/bin/env node
/* Extrae todos los textos de la app en inglés (idioma puente para los idiomas nuevos) → i18n/source-en.json
   1. Estático: diccionarios «es|en|fr|pt», tablas «clave|es|en|fr|pt» y listas ['es','en','fr','pt'] de los módulos.
   2. Dinámico: recorre todas las pantallas con la app en inglés (también cada ejercicio y cada receta) y guarda los textos.
   Las cifras se cambian por {0}, {1}… para que «Exercise 3 of 8» y «Exercise 4 of 8» sean un solo texto.
   Uso: npm run build:app && node scripts/i18n-extract.js   (CHROMIUM_PATH si hace falta) */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'i18n', 'source-en.json');
const NUM = /\d+(?:[.,]\d+)*/g;
const mask = (s) => { let i = 0; return s.replace(NUM, () => '{' + i++ + '}'); };
const letters = (s) => (s.match(/\p{L}/gu) || []).length;
// nombres de idioma en su propio idioma: no se traducen
const NATIVE = new Set(['Español', 'English', 'Français', 'Português', 'Deutsch', 'Italiano', 'Русский', 'العربية', 'Türkçe', '日本語', '한국어', '中文', 'हिन्दी', 'Idioma / Language']);
const keep = (s) => s && !NATIVE.has(s) && s.length <= 900 && letters(s) >= 2 && !/^[{}\d\s.,:;%+\-–—·/×x()]*$/.test(s);
const SPANISH = /[ñáíóú¿¡]|\b(de|del|los|las|para|con|una|tus?|sin|más|semana|hoy)\b/i;

function staticStrings() {
  const out = new Set();
  const add = (s) => { s = String(s || '').trim(); if (keep(s) && !/\$\{/.test(s)) out.add(s); };
  // tablas con barras (diccionarios de traducción)
  const app = fs.readFileSync(path.join(ROOT, 'Volta-app.html'), 'utf8');
  const files = [app].concat(fs.readdirSync(path.join(ROOT, 'frontend')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(ROOT, 'frontend', f), 'utf8')));
  files.forEach((src) => {
    src.split('\n').forEach((l) => {
      if (/[<>`]|=>|function|\bconst\b|;\s*$/.test(l)) return;
      const a = l.split('|');
      if (a.length === 4) add(a[1]);
      else if (a.length === 5 && /^[a-zA-Z0-9_]+$/.test(a[0].trim())) add(a[2]);
    });
    // listas de 4 textos: ['es', 'en', 'fr', 'pt']
    const S1 = `'(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*"`;
    const re = new RegExp(`\\[\\s*(${S1})\\s*,\\s*(${S1})\\s*,\\s*(${S1})\\s*,\\s*(${S1})\\s*\\]`, 'g');
    let m;
    while ((m = re.exec(src))) { try { add(Function('return ' + m[2])()); } catch (e) { /* texto raro */ } }
  });
  return out;
}

function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const file = u === '/' ? path.join(ROOT, 'Volta-app.html') : path.join(ROOT, 'public', path.normalize(u).replace(/^([.][.][/\\])+/, ''));
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200); fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

async function crawl() {
  const srv = await serve();
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 900 }, locale: 'en-US' });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await p.goto(`http://127.0.0.1:${srv.address().port}/`); await p.waitForTimeout(1200);
  const res = await p.evaluate(async () => {
    const seen = new Set(), wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const grab = () => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const el = n.parentElement; if (el && /^(SCRIPT|STYLE)$/.test(el.tagName)) continue; const v = n.nodeValue.replace(/\s+/g, ' ').trim(); if (v) seen.add(v); }
      document.querySelectorAll('[placeholder],[aria-label],[title]').forEach((e) => ['placeholder', 'aria-label', 'title'].forEach((a) => { const v = e.getAttribute(a); if (v) seen.add(v.trim()); }));
    };
    const _t = window.toast; window.toast = function (m) { seen.add(String(m)); };
    const show = async (fn) => { try { fn(); await wait(30); grab(); } catch (e) { /* pantalla que necesita datos */ } };
    const D = window.vxTrDump ? window.vxTrDump() : { D: {}, P: [] };
    const dict = Object.values(D.D).map((a) => a[1]).filter(Boolean);
    const pats = D.P.map((x) => x[1][0]);
    for (const demo of [true, false]) {
      S.onboarded = true; S.demo = demo; S.lang = 'en'; S.stack = [];
      for (const t of ['home', 'train', 'prog', 'nut', 'prof']) {
        await show(() => { S.stack = []; tab(t); });
        if (t === 'nut') for (const s of ['day', 'week', 'month', 'cook', 'shop']) await show(() => { S.nsub = s; R(); });
        if (t === 'prog') for (const s of ['pg:ex', 'pg:mus', 'pg:body', 'pg:rec', 'pg:cmp', 'pg:cfg']) await show(() => { S.ptab = s; R(); });
      }
      S.nsub = 'day';
      for (const k of Object.keys(V)) { if (['ex', 'meal', 'anat', 'home', 'train', 'prog', 'nut', 'prof'].includes(k)) continue; await show(() => { S.stack = []; S.tab = 'home'; go(k); }); }
    }
    for (let i = 0; i < EX.length; i++) await show(() => { S.stack = []; go('ex' + i); });
    if (typeof MEALS !== 'undefined') for (let i = 0; i < MEALS.length; i++) await show(() => { S.stack = []; go('meal' + i); });
    for (let i = 0; i < 12; i++) await show(() => { S.stack = []; go('anat' + i); });
    window.toast = _t;
    return { seen: [...seen], dict, pats };
  });
  await b.close(); srv.close();
  return res;
}

(async () => {
  const st = staticStrings();
  const dyn = await crawl();
  const all = new Set();
  const left = new Set();
  // lo que parece español no es inglés: se aparta (si sale en pantalla en inglés, es un texto por traducir al inglés)
  const isEs = (k) => SPANISH.test(k) && !/\b(the|and|your|you|with|of)\b/i.test(k);
  const addM = (s, screen) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (!keep(s)) return; const k = mask(s); if (isEs(k)) { if (screen) left.add(k); return; } all.add(k); };
  st.forEach((x) => addM(x)); dyn.dict.forEach((x) => addM(x)); dyn.seen.forEach((x) => addM(x, true));
  const pats = [...new Set(dyn.pats.map((s) => s.replace(/\$(\d)/g, '{s$1}')))];
  const list = [...all].sort((a, b) => a.localeCompare(b));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ note: 'Textos de Volta en inglés (idioma puente). {0},{1}… = cifras; {s1}… = texto variable. Generado por scripts/i18n-extract.js', strings: list, patterns: pats }, null, 1));
  const chars = list.reduce((a, s) => a + s.length, 0);
  console.log(`${list.length} textos (${chars} caracteres) + ${pats.length} patrones → ${path.relative(ROOT, OUT)}`);
  console.log(`Español visto en pantalla con la app en inglés: ${left.size} (i18n/pending-es.txt)`);
  fs.writeFileSync(path.join(ROOT, 'i18n', 'pending-es.txt'), [...left].sort().join('\n'));
})();
