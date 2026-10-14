const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  const n = await p.evaluate(() => MEALS.length);
  ok(n === 97, 'comidas totales: ' + n);
  const missing = await p.evaluate(() => [...new Set(MEALS.flatMap(m => m.ing))].filter(i => !FDB[i]));
  ok(missing.filter(x => x !== 'edulcorante').length === 0, 'todos los ingredientes nuevos existen en la base de alimentos ' + JSON.stringify(missing));
  ok(await p.evaluate(() => MEALS.every(m => vxSteps(m) && vxSteps(m).length >= 3)), 'todas las comidas tienen pasos reales');
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; S.mk = {}; });
  // ficha de una comida nueva y una antigua
  for (const id of ['poke_atun', 'pasta_pollo']) {
    await p.evaluate((id) => { const i = MEALS.findIndex(m => m.id === id); S.stack = ['meal' + i]; R(); }, id);
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.getElementById('m').innerText);
    ok(/Preparación · 0\/\d/.test(t) && !/Pasos generales/.test(t) && !/Lava, pela y corta/.test(t), id + ': pasos reales en la ficha');
    ok(!/NaN|undefined/.test(t), id + ': cantidades y macros sin NaN');
  }
  await p.screenshot({ path: 'shots/meal-old.png' });
  await p.click('.vx-step .ck'); await p.waitForTimeout(200);
  ok(/Preparación · 1\//.test(await p.evaluate(() => document.getElementById('m').innerText)), 'marcar un paso actualiza el progreso');
  await p.evaluate(() => { const i = MEALS.findIndex(m => m.id === 'poke_atun'); S.lang = 'en'; S.stack = ['meal' + i]; R(); });
  await p.waitForTimeout(300);
  const en = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Tuna poke bowl/.test(en) && /Method/.test(en) && /Dice the tuna/.test(en), 'en inglés: nombre y pasos');
  await p.evaluate(() => { const i = MEALS.findIndex(m => m.id === 'poke_atun'); S.lang = 'es'; S.stack = ['meal' + i]; R(); document.getElementById('m').scrollTop = 0; });
  await p.waitForTimeout(300); await p.screenshot({ path: 'shots/meal-new.png' });
  await p.evaluate(() => { S.stack = ['explore']; R(); }); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelectorAll('#m svg[role=img]').length) >= 6, 'Explorar muestra las comidas con sus imágenes');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
