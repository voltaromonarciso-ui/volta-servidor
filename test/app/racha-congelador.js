const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  await p.evaluate(() => { S.onboarded = true; S.name = 'A'; S.lang = 'es'; S.log = []; S.nlog = {}; const d = (n) => lk(Date.now() - n * 864e5); S.vx = { perfect: { [d(3)]: 1, [d(5)]: 1 }, achInit: 1, ach: {} }; S.stack = []; tab('home'); });
  // 3.er día perfecto → congelador
  await p.evaluate(() => { const k = lk(Date.now()); S.nlog[k] = { e: [{}, {}], w: 1750 }; S.log.push({ ex: 0, s: 1, w: 50, r: 8, rir: 2, t: Date.now() }); vxWater(250); });
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.vx.freezes) === 1, 'se gana un congelador al 3.er día perfecto');
  ok(await p.evaluate(() => /🧊 1/.test(document.querySelector('.vx-streak').innerText)), 'congelador visible en la racha de Inicio');
  const scen = (gapH, frz) => p.evaluate(([gapH, frz]) => { const now = Date.now(); S.vx.freezes = frz; S.vx.streakSnap = { count: 5, ts: now - gapH * 36e5, date: lk(now - gapH * 36e5) }; S.streakCount = 1; S.lastLoginDate = lk(now); vxGuardStreak(); return [S.streakCount, S.vx.freezes]; }, [gapH, frz]);
  ok(JSON.stringify(await scen(60, 1)) === '[6,0]', 'tras 60 h con congelador: racha 5 → 6 y se gasta');
  ok(JSON.stringify(await scen(80, 1)) === '[1,1]', 'pasadas 72 h no se gasta: la racha se pierde');
  ok(JSON.stringify(await scen(60, 0)) === '[1,0]', 'sin congelador, la racha se pierde');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await b.close();
})();
