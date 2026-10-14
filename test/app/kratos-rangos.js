const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; });
// comparador: barrido de 300 parejas
const bad = await p.evaluate(() => { const out = []; for (let k = 0; k < 300; k++) { S.xc = [k % EX.length, (k * 7 + 3) % EX.length]; const h = V.xcmp(); if (/No especificado/.test(h)) out.push(EX[S.xc[0]][0] + ' / ' + EX[S.xc[1]][0]); } return out; });
ok(bad.length === 0, 'comparador sin "No especificado" en 300 parejas ' + JSON.stringify(bad.slice(0, 3)));
const lt = await p.evaluate(() => { S.xc = [EX.findIndex(e => /^Zancadas caminando/.test(e[0])), 0]; S.stack = ['xcmp']; R(); return document.getElementById('m').innerText; });
ok(/Unilateral/.test(lt) && /Bilateral/.test(lt), 'lateralidad deducida (zancadas unilateral, press banca bilateral)');
// filtros
await p.evaluate(() => { S.stack = []; tab('home'); go('filters'); }); await p.waitForTimeout(300);
const ft = await p.evaluate(() => [S.stack.join(','), document.getElementById('m').innerText]);
ok(!/Opción A/.test(ft[1]) && /Material/.test(ft[1]) && /Nivel/.test(ft[1]) && ft[0].endsWith('lib'), 'Filtros abre el panel real de la biblioteca: ' + ft[0]);
// rango y pantalla inexistente
await p.evaluate(() => { S.stack = []; tab('home'); go('p:ranks'); }); await p.waitForTimeout(300);
ok(await p.evaluate(() => S.tab === 'prog' && /Guía de Rangos/.test(document.body.innerText)), 'la tarjeta de rango abre la guía de rangos');
await p.evaluate(() => { S.rkm = 0; S.stack = []; tab('home'); go('no:existe'); }); await p.waitForTimeout(300);
ok(await p.evaluate(() => document.getElementById('m').innerText.length > 100), 'una pantalla inexistente no deja la app en blanco');
ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
await b.close(); })();
