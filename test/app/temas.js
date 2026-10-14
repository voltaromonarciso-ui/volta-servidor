const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const p = await b.newPage({ viewport: { width: 390, height: 1100 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
await p.evaluate(() => { localStorage.removeItem('vx:accent'); S.onboarded = true; S.demo = true; S.lang = 'es'; S.stack = []; tab('prof'); }); await p.waitForTimeout(300);
ok(await p.evaluate(() => [...document.querySelectorAll('#m .li')].some(x => /Temas/.test(x.textContent) && /vx:themes/.test(x.getAttribute('onclick')))), 'Perfil → Temas es una opción de la lista');
await p.evaluate(() => go('vx:themes')); await p.waitForTimeout(300);
const t = await p.evaluate(() => document.getElementById('m').innerText);
ok((await p.locator('.vx-thr').count()) === 4 && /Verde/.test(t) && /Predeterminado/.test(t) && /Amarillo/.test(t) && /Azul/.test(t) && /Rojo/.test(t), 'pantalla Temas: Verde (predeterminado), Azul, Amarillo y Rojo');
const acc = () => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ac').trim().toLowerCase());
const green = await acc();
const greenLeft = () => p.evaluate(() => { const re = /#(9dff2e|22c55e|00ff66|4bd01a|58b800)/i; let n = 0; document.querySelectorAll('style').forEach(s => { if (re.test(s.textContent)) n++; }); const els = [...document.querySelectorAll('[style],[fill],[stroke]')].filter(e => re.test((e.getAttribute('style') || '') + (e.getAttribute('fill') || '') + (e.getAttribute('stroke') || ''))).length; return n + ' estilos, ' + els + ' elementos'; });
for (const [k, hex] of [['amarillo', '#ffd84d'], ['azul', '#5cb2ff'], ['rojo', '#ff6262']]) {
  await p.click(`.vx-thr:has-text("${{ amarillo: 'Amarillo', azul: 'Azul', rojo: 'Rojo' }[k]}")`); await p.waitForTimeout(300);
  ok((await acc()) === hex, k + ': color de acento ' + (await acc()));
  ok(await p.evaluate((k) => document.querySelector('.vx-thr.on') && document.querySelector('.vx-thr.on').getAttribute('onclick').includes(k), k), k + ': marcado como elegido');
  for (const v of ['home', 'train', 'prog', 'nut']) { await p.evaluate((v) => { S.stack = []; tab(v); }, v); await p.waitForTimeout(250); }
  ok(/^0 estilos, 0 elementos$/.test(await greenLeft()), k + ': sin verdes de la interfaz en ninguna pantalla (' + await greenLeft() + ')');
  await p.screenshot({ path: `shots/theme-${k}-prog.png` });
  await p.evaluate(() => { S.stack = []; tab('home'); }); await p.waitForTimeout(250); await p.screenshot({ path: `shots/theme-${k}-home.png` });
  await p.evaluate(() => { S.stack = []; tab('prof'); go('vx:themes'); }); await p.waitForTimeout(250);
}
// las verduras de los platos siguen verdes
const veg = await p.evaluate(() => { S.stack = ['meal' + MEALS.findIndex(m => m.id === 'ensalada_lentejas')]; R(); return document.querySelector('#m svg[role=img]').outerHTML.match(/#(3f8a2a|5fae3a|3f7f2a|8fbf4a|2f6e1e)/gi) || []; });
ok(veg.length > 0, 'los verdes de la comida no cambian: ' + veg.length);
// persiste al recargar
await p.reload(); await p.waitForTimeout(1000);
ok((await acc()) === '#ff6262', 'el tema se recuerda al volver a abrir la app');
await p.evaluate(() => { S.onboarded = true; S.theme = 'light'; S.stack = []; tab('home'); }); await p.waitForTimeout(300);
ok((await acc()) === '#c41e1e', 'en tema claro usa un rojo más oscuro y legible: ' + await acc());
await p.screenshot({ path: 'shots/theme-rojo-light.png' });
ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
await b.close(); })();
