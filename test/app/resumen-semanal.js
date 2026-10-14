const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES', acceptDownloads: true }); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; S.stack = []; tab('prog'); });
  await p.waitForTimeout(300);
  const st = await p.evaluate(() => vxWeekStats());
  ok(st.sets > 0 && st.days > 0, 'estadísticas de la semana: ' + JSON.stringify({ d: st.days, s: st.sets, v: Math.round(st.vol), delta: st.delta, prs: st.prs, top: st.top }));
  await p.click('.vx-weekcard'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelectorAll('.vx-st-bars i').length) === 5, 'historia con 5 diapositivas');
  for (let i = 0; i < 4; i++) { await p.screenshot({ path: `shots/week${i}.png` }); await p.mouse.click(330, 420); await p.waitForTimeout(450); }
  await p.screenshot({ path: 'shots/week4.png' });
  ok(await p.evaluate(() => document.querySelectorAll('.vx-st-bars i.done').length) === 4, 'avanza al tocar');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.vx-st-body .btn')]);
  await dl.saveAs('shots/week-share.png'); ok(dl.suggestedFilename() === 'volta-semana.png', 'imagen de la semana para compartir');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !document.querySelector('.vx-story')), 'se cierra con Escape');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await b.close();
})();
