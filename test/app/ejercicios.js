const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => vxExAdded) === 73, 'ejercicios añadidos: ' + await p.evaluate(() => vxExAdded));
  ok(await p.evaluate(() => EX.length) === 252, 'total de ejercicios: ' + await p.evaluate(() => EX.length));
  await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; S.stack = ['lib']; R(); });
  await p.waitForTimeout(300);
  const lib = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/252 ejercicios/.test(lib), 'la biblioteca cuenta 252: ' + (lib.match(/\d+ ejercicios[^\n]*/) || [''])[0]);
  // ficha de un ejercicio nuevo
  const i = await p.evaluate(() => EX.findIndex(e => e[0] === 'Curl Bayesian'));
  await p.evaluate((i) => { S.stack = ['ex' + i]; R(); }, i); await p.waitForTimeout(300);
  const t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Curl Bayesian/.test(t) && /De espaldas a la polea/.test(t), 'ficha del ejercicio nuevo con su técnica');
  await p.screenshot({ path: 'shots/ex-new.png' });
  await p.evaluate((i) => { S.lang = 'en'; S.stack = ['ex' + i]; R(); }, await p.evaluate(() => EX.findIndex(e => e[0] === 'Zancada inversa')));
  await p.waitForTimeout(300);
  ok(/Reverse lunge/.test(await p.evaluate(() => document.getElementById('m').innerText)), 'nombre traducido al inglés');
  // filtro por grupo en Entrenos
  await p.evaluate(() => { S.lang = 'es'; S.stack = []; tab('train'); }); await p.waitForTimeout(300);
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
