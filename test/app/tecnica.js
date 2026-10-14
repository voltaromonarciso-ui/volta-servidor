const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => EX.every((e, i) => DET[i] && DET[i][0] && DET[i][0].length > 24)), 'los 178 ejercicios tienen preparación y ejecución');
  await p.evaluate(() => { S.onboarded = true; S.lang = 'es'; S.stack = ['ex' + EX.findIndex(e => e[0] === 'Press declinado con barra')]; R(); });
  await p.waitForTimeout(300);
  const t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Técnica correcta/.test(t) && /Colócate/i.test(t) && /Errores que debes evitar/i.test(t) && /Consejo pro/.test(t), 'tarjeta de técnica completa');
  ok(!/No especificado/.test(t), 'ya no aparece "No especificado"');
  await p.evaluate(() => document.querySelector('.vx-tech').scrollIntoView()); await p.screenshot({ path: 'shots/tech.png' });
  await p.evaluate(() => { S.lang = 'en'; S.stack = ['ex' + EX.findIndex(e => e[0] === 'Sentadilla')]; R(); }); await p.waitForTimeout(300);
  ok(/Proper technique/.test(await p.evaluate(() => document.getElementById('m').innerText)), 'técnica en inglés');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
