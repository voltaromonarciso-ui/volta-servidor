const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(30000);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.route(/three\.min\.js/, r => r.fulfill({ path: require.resolve('three/build/three.min.js'), contentType: 'text/javascript' }));
  await p.route(/GLTFLoader\.js/, r => r.fulfill({ path: require.resolve('three/examples/js/loaders/GLTFLoader.js'), contentType: 'text/javascript' }));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; });
  for (const n of ['Sentadilla', 'Press de banca']) {
    const i = await p.evaluate((n) => EX.findIndex(e => e[0] === n), n);
    await p.evaluate((i) => { S.stack = ['ex' + i]; R(); }, i);
    await p.waitForSelector('.vx3 canvas', { timeout: 60000 });
    await p.waitForTimeout(1500);
    const st = await p.evaluate(() => ({ av: getComputedStyle(document.querySelector('.vx-avatar')).display, n: document.querySelectorAll('.vx3').length, bar: document.querySelector('.vx3-bar').innerText }));
    ok(st.av === 'none' && st.n === 1, n + ': el 3D sustituye a la animación 2D ' + JSON.stringify(st));
    await p.screenshot({ path: 'shots/fic3d-' + i + '.png' });
  }
  // pausa
  await p.click('.vx3-bar [data-a="p"]'); ok(await p.evaluate(() => document.querySelector('.vx3-bar [data-a="p"]').textContent) === 'Reproducir', 'botón de pausa');
  await p.click('.vx3-bar [data-a="l"]'); await p.click('.vx3-bar [data-a="s"]');
  ok(await p.evaluate(() => document.querySelector('.vx3-bar [data-a="s"]').getAttribute('aria-pressed')) === 'true', 'modo lento');
  // al salir de la ficha se libera
  await p.evaluate(() => { S.stack = ['lib']; R(); }); await p.waitForTimeout(500);
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await b.close();
})();
