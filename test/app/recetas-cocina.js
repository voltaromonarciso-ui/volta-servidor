const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  await p.evaluate(() => { localStorage.removeItem('vx:srv'); S.onboarded = true; S.demo = true; S.lang = 'es'; S.mk = {}; });
  const open = (id) => p.evaluate((id) => { const i = MEALS.findIndex(m => m.id === id); S.stack = ['meal' + i]; R(); document.getElementById('m').scrollTop = 0; }, id);
  await open('paella_marisco'); await p.waitForTimeout(300);
  let t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Paella ligera de marisco/.test(t) && /Preparación · 0\/5/.test(t), 'receta nueva con 5 pasos');
  ok(/Raciones/.test(t) && !/se completarán desde la base/.test(t), 'selector de raciones y sin la promesa vacía de cantidades');
  const nt = await p.locator('.vx-tmr').count();
  ok(nt >= 3, 'botones de temporizador en los pasos con tiempo: ' + nt);
  await p.click('.vx-srv button[aria-label="+"]'); await p.waitForTimeout(200);
  t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Total ×2: 1120 kcal · 72 g prot/.test(t), 'raciones ×2 multiplica macros');
  ok(await p.evaluate(() => vxSrvGet('paella_marisco')) === 2, 'raciones guardadas');
  ok(/Ingredientes · 2 raciones/.test(t) && /guisantes · 380 g/.test(t), 'cantidades de ingredientes ×2: ' + (t.match(/guisantes[^\n]*/) || [''])[0]);
  await p.locator('.vx-tmr').first().click(); await p.waitForTimeout(1200);
  const tm = await p.evaluate(() => document.getElementById('vx-cook') && document.getElementById('vx-cook').innerText);
  ok(tm && /Paso 1/.test(tm) && /4:5\d/.test(tm), 'temporizador en marcha: ' + (tm || '').replace(/\n/g, ' '));
  await p.evaluate(() => R()); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.getElementById('vx-cook')), 'el temporizador sobrevive al redibujado');
  await p.screenshot({ path: 'shots/cook.png' });
  await p.evaluate(() => vxCook(10, 2)); await p.waitForTimeout(10600);
  ok(await p.evaluate(() => document.getElementById('vx-cook').classList.contains('done')), 'aviso al terminar el tiempo');
  await p.evaluate(() => vxCookStop());
  ok(await p.evaluate(() => !document.getElementById('vx-cook')), 'se puede cerrar');
  // nevera 2 h → sin temporizador; "4 h" no
  await open('pudin_chia'); await p.waitForTimeout(200);
  ok(await p.locator('.vx-tmr').count() === 1, 'reposos de horas sin temporizador (solo el de 5 min)');
  // arte de todas las recetas nuevas
  const bad = await p.evaluate(() => MEALS.slice(57).filter(m => { const h = foodArt(m); return !h || h.length < 400 || /undefined|NaN/.test(h); }).map(m => m.id));
  ok(bad.length === 0, 'todas las recetas nuevas tienen imagen válida ' + JSON.stringify(bad));
  const svgBad = await p.evaluate(() => MEALS.filter(m => { const d = new DOMParser().parseFromString(foodArt(m).replace(/^[^<]*/, ''), 'image/svg+xml'); return d.querySelector('parsererror'); }).map(m => m.id));
  ok(svgBad.length === 0, 'SVG bien formado en las 97 ' + JSON.stringify(svgBad.slice(0, 5)));
  await p.evaluate(() => { S.lang = 'en'; }); await open('pad_thai'); await p.waitForTimeout(200);
  t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Chicken pad thai/.test(t) && /Soak the rice noodles/.test(t) && /Servings/.test(t), 'inglés: nombre, pasos y raciones');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
  // galería
  await p.evaluate(() => { S.lang = 'es'; }); await p.setViewportSize({ width: 1200, height: 900 });
  await p.evaluate(() => { document.body.innerHTML = '<div id=g style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;background:#111;padding:6px">' + MEALS.slice(57).map(m => `<div style="color:#ccc;font:10px sans-serif"><div style="border-radius:10px;overflow:hidden">${foodArt(m)}</div>${m.n}</div>`).join('') + '</div>'; });
  await p.waitForTimeout(300); await p.screenshot({ path: 'shots/meals3.png', fullPage: true });
  await b.close();
})();
