const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' });
  await ctx.addInitScript(() => { window.__wl = 0; Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => { window.__wl++; const t = new EventTarget(); t.release = async () => { window.__wlr = (window.__wlr || 0) + 1 }; return t; } } }); });
  const p = await ctx.newPage();
  const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().slice(0, 100)); });
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1200);
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.name = 'Alex'; S.lang = 'es'; S.stack = []; tab('home'); });
  // abrir el entreno rápido
  await p.click('text=Empezar'); await p.waitForTimeout(600);
  const vals = await p.$$eval('.w9c input', els => els.map(e => e.value));
  ok(vals[0] === '77.5' && vals[1] === '9', 'peso y reps prerrellenados con el objetivo de hoy: ' + JSON.stringify(vals));
  ok(await p.evaluate(() => window.__wl) >= 1, 'pantalla encendida solicitada al entrar al entreno');
  // récord: subir el peso por encima del máximo y completar la serie
  await p.evaluate(() => { S.wk.w = '200'; S.wk.r = '5'; });
  const before = await p.evaluate(() => S.log.length);
  await p.evaluate(() => doneSet()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !!document.querySelector('.vx-confetti')), 'confeti al batir un récord personal');
  ok(await p.evaluate(() => S.log.length) === before + 1, 'la serie se guarda igual que antes');
  await p.waitForTimeout(1800);
  ok(await p.evaluate(() => !document.querySelector('.vx-confetti')), 'el confeti se retira solo');
  // salir del entreno libera la pantalla
  await p.evaluate(() => { S.stack = []; tab('home'); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__wlr || 0) >= 1, 'al salir del entreno se libera la pantalla');
  // etiquetas accesibles
  const unl = await p.evaluate(() => [...document.querySelectorAll('#app button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length);
  ok(unl === 0, 'botones solo-icono con nombre accesible (sin nombre: ' + unl + ')');
  ok(await p.evaluate(() => !!document.querySelector('#nav button[aria-current="page"]')), 'pestaña activa marcada con aria-current');
  // inglés
  await p.evaluate(() => { S.lang = 'en'; tab('train'); }); await p.waitForTimeout(300);
  const txt = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Exercise library/.test(txt) && !/Biblioteca de ejercicios/.test(txt), 'pantalla de entrenos en inglés');
  ok(!/Bench press/.test(txt) && !(await p.evaluate(() => !!document.querySelector('#lst'))), 'la lista larga ya no está en Entrenos');
  await p.click('#q'); await p.waitForTimeout(400);
  const lib = await p.evaluate(() => ({ top: S.stack[S.stack.length - 1], t: document.getElementById('m').innerText, f: document.activeElement && document.activeElement.tagName }));
  ok(lib.top === 'lib' && /Bench press/.test(lib.t) && lib.f === 'INPUT', 'el buscador de Entrenos abre la Biblioteca (en inglés) con el cursor listo');
  await p.evaluate(() => { S.stack = []; tab('train'); }); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/en-train-new.png' });
  await p.evaluate(() => { tab('home'); }); await p.waitForTimeout(300);
  await p.screenshot({ path: 'shots/en-home-new.png' });
  await p.evaluate(() => { S.lang = 'es'; tab('home'); }); await p.waitForTimeout(300);
  ok(/(Buenos días|Buenas tardes|Buenas noches)/.test(await p.evaluate(() => document.getElementById('m').innerText)), 'en español sigue igual');
  ok(bad.length === 0, 'sin recursos 404: ' + JSON.stringify(bad.slice(0, 3)));
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
