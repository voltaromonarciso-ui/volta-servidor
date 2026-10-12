const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' });
  await ctx.grantPermissions(['notifications'], { origin: new URL(process.env.APP_URL).origin });
  await ctx.addInitScript(() => { window.__notes = []; const N = window.Notification; window.Notification = function (t, o) { window.__notes.push(t); return {}; }; window.Notification.permission = 'granted'; window.Notification.requestPermission = async () => 'granted'; });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1200);
  await p.evaluate(() => { S.onboarded = true; S.name = 'Alex'; S.lang = 'es'; S.demo = true; S.log = []; S.nlog = {}; S.vx = {}; S.done = {}; S.stack = []; tab('home'); });
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('.vx-streak') && !!document.querySelector('.vx-hero') && !document.querySelector('.vx-missions') && !document.querySelector('.vx-achcard')), 'Inicio: racha y mensaje de Zeus (sin misiones ni logros)');
  await p.evaluate(() => { S.stack = []; tab('train'); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('.vx-missions') && !!document.querySelector('.vx-rec')), 'Entrenos: misiones y recuperación');
  await p.screenshot({ path: 'shots/eng-home1.png' });
  // agua x8 = 2 L
  for (let i = 0; i < 8; i++) await p.click('.vx-water');
  ok(await p.evaluate(() => S.nlog[lk(Date.now())].w) === 2000, 'botón +250 ml suma agua (2 L)');
  // comidas y entreno → día perfecto
  await p.evaluate(() => { const k = lk(Date.now()); S.nlog[k].e = [{}, {}]; S.log.push({ ex: 0, s: 1, w: 60, r: 8, rir: 2, t: Date.now() }); R(); vxWater(0); });
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!S.vx.perfect[lk(Date.now())]), 'día perfecto registrado al completar las 3 misiones');
  ok(await p.evaluate(() => !!document.querySelector('.vx-missions.vx-perfect')), 'tarjeta de misiones en modo "día perfecto"');
  await p.waitForTimeout(2600);
  const ach = await p.evaluate(() => vxAch().filter(a => a.ok).map(a => a.id));
  ok(ach.includes('days_1') && ach.includes('perfect_1'), 'logros calculados: ' + ach.join(','));
  // nuevo logro con aviso (no es la primera comprobación)
  await p.evaluate(() => { for (let i = 0; i < 3; i++) S.log.push({ ex: 1, s: i + 1, w: 30 + i * 5, r: 8, rir: 2, t: Date.now() - (i + 1) * 864e5 }); });
  await p.evaluate(() => { S.wk = { k: 'x', w: '70', r: '8' }; }); // récord: 70 > 60
  await p.evaluate(() => { S.stack = ['work']; R(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const c = cfg(); S.wk.k = S.cur + ':' + S.wi + ':' + c.i; S.wk.w = '200'; doneSet(); });
  await p.waitForTimeout(800);
  const t = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.textContent).join(' | '));
  ok(/Logro desbloqueado/.test(t), 'aviso de logro desbloqueado: ' + t.slice(0, 120));
  // aviso de descanso en segundo plano (con −15 s aplicado después de la serie)
  await p.evaluate(() => { const c = cfg(); S.wk.k = S.cur + ':' + S.wi + ':' + c.i; S.wk.w = '10'; doneSet(); });
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); S.w.on = true; S.w.paused = false; S.w.end = Date.now() + 1500; });
  await p.waitForTimeout(3500);
  ok((await p.evaluate(() => window.__notes)).length >= 1, 'aviso de fin de descanso con la app en segundo plano');
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); });
  // pantallas
  await p.evaluate(() => { S.stack = ['vx:ach']; R(); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelectorAll('.vx-fam').length === 19 && vxAch().length === 112), 'pantalla de logros: 19 familias, 112 logros');
  await p.screenshot({ path: 'shots/eng-ach.png' });
  await p.evaluate(() => { S.stack = []; tab('prog'); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('#m .vx-heat')), 'calendario de actividad en Progreso');
  await p.evaluate(() => { tab('prof'); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('#m .vx-achcard')), 'tarjeta de logros en Perfil');
  await p.evaluate(() => { S.lang = 'en'; S.stack = []; tab('train'); }); await p.waitForTimeout(400);
  await p.screenshot({ path: 'shots/eng-home-en.png', fullPage: false });
  const txt = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Today's missions|Perfect day/.test(txt) && /Muscle recovery/.test(txt), 'en inglés');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
