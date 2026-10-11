#!/usr/bin/env node
/* Comprueba los diccionarios de idiomas (public/assets/i18n/<idioma>.json) frente a i18n/source-en.json:
   - que estén todos los textos y patrones, sin valores vacíos;
   - que cada traducción conserve los mismos huecos ({0}, {1}, {s1}…);
   - cuántos textos largos se han quedado igual que en inglés (posible texto sin traducir).
   Uso: node scripts/i18n-check.js [idioma…]   (sale con error si algo falla) */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'source-en.json'), 'utf8'));
const DIR = path.join(ROOT, 'public', 'assets', 'i18n');
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['de', 'it', 'ru', 'ar', 'tr', 'ja', 'ko', 'zh', 'hi'];
const holes = (s) => (String(s).match(/\{s?\d\}/g) || []).sort().join(',');
// marcas y nombres que se dejan igual
const SAME_OK = /^(Volta|VOLTA|Zeus|Kratos|Hermes|Atlas|OK|1RM|RIR|RPE|kcal|Pro|Wrapped|Instagram|Strava|Hevy|Open Food Facts|Smith|TRX|HIIT|Tabata|EMOM|AMRAP)$/;

let bad = 0;
for (const lang of LANGS) {
  const f = path.join(DIR, lang + '.json');
  if (!fs.existsSync(f)) { console.log(`✗ ${lang}: falta ${path.relative(ROOT, f)}`); bad++; continue; }
  let j;
  try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`✗ ${lang}: JSON no válido (${e.message})`); bad++; continue; }
  const S = j.strings || {}, P = j.patterns || {};
  const miss = SRC.strings.filter((k) => typeof S[k] !== 'string' || !S[k].trim());
  const missP = SRC.patterns.filter((k) => typeof P[k] !== 'string' || !P[k].trim());
  const hole = SRC.strings.concat(SRC.patterns).filter((k) => { const v = S[k] != null ? S[k] : P[k]; return v != null && holes(v) !== holes(k); });
  const same = SRC.strings.filter((k) => S[k] === k && /\p{L}{4,}.*\s.*\p{L}{4,}/u.test(k) && !SAME_OK.test(k));
  const ok = !miss.length && !missP.length && !hole.length;
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${lang}: ${SRC.strings.length - miss.length}/${SRC.strings.length} textos · ${SRC.patterns.length - missP.length}/${SRC.patterns.length} patrones · huecos mal: ${hole.length} · iguales al inglés: ${same.length}`);
  const show = (t, xs) => { if (xs.length) console.log(`   ${t}: ` + xs.slice(0, 8).map((x) => JSON.stringify(x)).join(' | ') + (xs.length > 8 ? ` … (+${xs.length - 8})` : '')); };
  show('faltan', miss); show('faltan patrones', missP); show('huecos distintos', hole); show('sin traducir (revisar)', same.slice(0, 8));
}
process.exitCode = bad ? 1 : 0;
