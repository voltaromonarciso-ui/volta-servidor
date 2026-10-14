const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
const DIR = path.resolve(__dirname, '../../public/assets/i18n');
const LANGS = ['de', 'it', 'ru', 'ar', 'tr', 'ja', 'ko', 'zh', 'hi'];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1400 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  // selector de idioma con los 13 idiomas
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; S.stack = []; tab('prof'); go('s:lang'); });
  await p.waitForTimeout(200);
  const names = await p.evaluate(() => document.getElementById('m').innerText);
  ok(['Deutsch', 'Italiano', 'Русский', 'العربية', 'Türkçe', '日本語', '한국어', '中文', 'हिन्दी'].every((n) => names.includes(n)), 'el selector muestra los 13 idiomas con su nombre propio');
  for (const lang of LANGS) {
    const D = JSON.parse(fs.readFileSync(path.join(DIR, lang + '.json'), 'utf8')).strings;
    await p.evaluate((l) => { S.lang = l; S.stack = []; tab('home'); }, lang);
    await p.waitForFunction((l) => window.vxI18nReady && window.vxI18nReady(l), lang, { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ nav: document.getElementById('nav').innerText, m: document.getElementById('m').innerText, dir: document.documentElement.dir, hl: document.documentElement.lang }));
    const want = ['Home', 'Workouts', 'Progress', 'Nutrition'].map((k) => D[k]).filter(Boolean);
    ok(want.length === 4 && want.every((w) => r.nav.includes(w)), `${lang}: menú traducido (${want.join(' · ')})`);
    // textos en inglés que no deberían verse (salvo que la traducción sea la misma palabra, como «Workouts» en alemán)
    const word = (k) => new RegExp('(^|[^\\p{L}])' + k + '($|[^\\p{L}])', 'u');
    const en = ['Workouts', 'Nutrition', 'Your streak', 'Progress'].filter((k) => D[k] && D[k] !== k && word(k).test(r.m + r.nav));
    ok(!en.length, `${lang}: sin textos en inglés en Inicio ${en.join(', ')}`);
    ok(r.dir === (lang === 'ar' ? 'rtl' : 'ltr') && r.hl === lang, `${lang}: dirección ${r.dir} y lang=${r.hl}`);
  }
  // volver a español deja todo como estaba
  await p.evaluate(() => { S.lang = 'es'; S.stack = []; tab('home'); }); await p.waitForTimeout(300);
  const es = await p.evaluate(() => ({ nav: document.getElementById('nav').innerText, dir: document.documentElement.dir }));
  ok(/Inicio/.test(es.nav) && es.dir === 'ltr', 'al volver a español: menú en español y de izquierda a derecha');
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
