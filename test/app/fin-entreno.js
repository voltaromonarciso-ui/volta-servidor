const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1200);
  await p.evaluate(() => {
    S.onboarded = true; S.name = 'Alex'; S.lang = 'es'; S.demo = false;
    const now = Date.now(), d = 864e5;
    S.log = [{ ex: 0, s: 1, w: 80, r: 8, rir: 2, t: now - 3 * d }, { ex: 3, s: 1, w: 60, r: 10, rir: 2, t: now - 3 * d },
      { ex: 0, s: 1, w: 80, r: 9, rir: 2, t: now - 25 * 6e3 }, { ex: 0, s: 2, w: 82.5, r: 8, rir: 1, t: now - 20 * 6e3 }, { ex: 0, s: 3, w: 82.5, r: 7, rir: 1, t: now - 15 * 6e3 },
      { ex: 3, s: 1, w: 60, r: 10, rir: 2, t: now - 10 * 6e3 }, { ex: 3, s: 2, w: 60, r: 9, rir: 2, t: now - 5 * 6e3 }];
    S.done = S.done || {}; S.done[lk(now)] = { vol: 3000, sets: 5, xp: 120 }; S.edit = false; S.stack = ['work']; R();
  });
  await p.waitForTimeout(400);
  const s = await p.evaluate(() => vxSummary());
  ok(s && s.sets === 5 && s.prs === 1 && s.rows.length === 2, 'resumen: 5 series, 2 ejercicios, 1 récord ' + JSON.stringify({ sets: s && s.sets, prs: s && s.prs }));
  ok(Math.round(s.dur / 1000) === 210, 'duración calculada (2 min de series + 1,5 de descanso): ' + Math.round(s.dur / 1000) + ' s');
  ok(await p.evaluate(() => !!document.querySelector('.vx-sum') && /RÉCORD/.test(document.querySelector('.vx-sum').innerText)), 'tarjeta de resumen con insignia de récord');
  await p.screenshot({ path: 'shots/done.png', fullPage: false });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=Compartir resumen')]);
  await dl.saveAs('shots/share.png');
  ok(dl.suggestedFilename() === 'volta-entreno.png', 'imagen para compartir generada');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await b.close();
})();
