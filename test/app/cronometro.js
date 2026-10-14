const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; S.done = {}; S.vx = { ws: { d: lk(Date.now()), t: Date.now() - 125000 } }; S.stack = ['work']; R(); });
  await p.waitForTimeout(300);
  const a = await p.textContent('#vxclk'); await p.waitForTimeout(2300); const c = await p.textContent('#vxclk');
  ok(/2:0\d/.test(a) && a !== c, 'cronómetro de sesión en marcha: ' + a + ' → ' + c);
  const nx = await p.evaluate(() => (document.querySelector('.vx-next') || {}).innerText);
  ok(!!nx && /Siguiente/.test(nx), 'adelanto del siguiente ejercicio: ' + (nx || '').replace(/\n/g, ' '));
  await p.screenshot({ path: 'shots/clock.png' });
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await b.close();
})();
