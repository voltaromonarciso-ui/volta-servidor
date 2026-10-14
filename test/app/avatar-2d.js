const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; });
  for (const n of ['Sentadilla', 'Press de banca', 'Curl Bayesian']) {
    await p.evaluate((n) => { S.stack = ['ex' + EX.findIndex(e => e[0] === n)]; R(); }, n); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ video: !!document.querySelector('#m video'), av: !!document.querySelector('#m .vx-avatar svg animate, #m .vx-avatar svg animateTransform'), img: !!document.querySelector('#m > div > .card img') }));
    ok(!r.video && r.av, n + ': sin reproductor vacío y con avatar animado' + (r.img ? ' + ilustración real' : ''));
  }
  await p.evaluate(() => { S.stack = ['ex' + EX.findIndex(e => e[0] === 'Sentadilla')]; R(); }); await p.waitForTimeout(1300);
  await p.screenshot({ path: 'shots/av-detail.png' });
  await p.evaluate(() => { S.stack = ['lib']; R(); }); await p.waitForTimeout(500);
  await p.evaluate(() => document.getElementById('m').scrollTop = 500); await p.waitForTimeout(300);
  await p.screenshot({ path: 'shots/av-list.png' });
  const brokenImgs = await p.evaluate(() => [...document.querySelectorAll('#m img')].filter(i => i.complete && i.naturalWidth === 0).length);
  ok(brokenImgs === 0, 'miniaturas de la biblioteca cargan (rotas: ' + brokenImgs + ')');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
