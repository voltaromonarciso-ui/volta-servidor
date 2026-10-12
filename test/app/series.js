const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1300 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  p.on('dialog', (d) => d.accept());
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; S.done = {}; S.vx = { proSeen: 1 }; S.stack = []; tab('home'); go('work'); });
  await p.waitForTimeout(400);
  const n0 = await p.evaluate(() => ({ rows: document.querySelectorAll('.vx-sr-row').length, warm: !!document.querySelector('.vx-sr-row.warm.act'), sets: cfg().sets }));
  ok(n0.rows === n0.sets + 1 && n0.warm, `todas las series a la vista: calentamiento + ${n0.sets} series (${n0.rows} filas)`);
  ok(/Última: \d/.test(await p.evaluate(() => document.querySelector('.vx-sr-list').innerText)), 'cada serie muestra lo de la última vez');
  ok(await p.evaluate(() => !!document.querySelector('.vx-sr-rest') && /Descanso/.test(document.querySelector('.vx-sr-rest').innerText)), 'tarjeta de descanso arriba');
  // calentamiento: se guarda como warmup y no cuenta como serie
  await p.click('.vx-sr-row.act .vx-sr-ok'); await p.waitForTimeout(250);
  let s = await p.evaluate(() => ({ ty: S.log[S.log.length - 1].ty, set: S.w.set, on: S.w.on }));
  ok(s.ty === 'warmup' && s.on, 'el calentamiento se guarda como calentamiento y arranca el descanso');
  // primera serie efectiva con valores escritos a mano
  await p.evaluate(() => { const [w, r] = document.querySelectorAll('.vx-sr-row.act input'); w.value = '60'; r.value = '8'; w.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.click('.vx-sr-row.act .vx-sr-ok'); await p.waitForTimeout(250);
  s = await p.evaluate(() => { const l = S.log[S.log.length - 1]; return { ty: l.ty, w: l.w, r: l.r, done: document.querySelectorAll('.vx-sr-row.done').length }; });
  ok(s.ty === 'effective' && s.w === 60 && s.r === 8 && s.done === 2, 'serie efectiva registrada con lo escrito (60 kg × 8) y marcada como hecha');
  // añadir serie
  const before = await p.evaluate(() => cfg().sets);
  await p.click('.vx-sr-add'); await p.waitForTimeout(200);
  ok(await p.evaluate((b) => cfg().sets === b + 1 && document.querySelectorAll('.vx-sr-row:not(.warm)').length === b + 1, before), '«Añadir serie» suma una fila');
  // borrar una serie hecha
  const len = await p.evaluate(() => S.log.length);
  await p.click('.vx-sr-row.done:not(.warm) .vx-sr-ok'); await p.waitForTimeout(250);
  ok(await p.evaluate((n) => S.log.length === n - 1, len), 'tocar ✓ en una serie hecha la borra (con confirmación)');
  // completar todas → siguiente ejercicio
  for (let i = 0; i < 8; i++) { const more = await p.evaluate(() => { const b = document.querySelector('.vx-sr-row.act:not(.warm) .vx-sr-ok'); if (!b) return false; b.click(); return true; }); if (!more) break; await p.waitForTimeout(150); }
  ok(await p.evaluate(() => !!document.querySelector('.vx-sr-next')), 'al completar todas las series aparece «Siguiente ejercicio»');
  ok(await p.evaluate(() => !!document.querySelector('.vx-next') && document.querySelectorAll('.vx-sr-upc').length >= 1), 'los siguientes ejercicios se ven abajo');
  await p.screenshot({ path: 'shots/series.png' });
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
