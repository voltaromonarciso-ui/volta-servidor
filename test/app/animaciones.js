const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
await p.evaluate(() => { S.onboarded = true; S.demo = true; S.lang = 'es'; S.cat = 'Todos'; S.q = ''; S.stack = []; tab('home'); go('lib'); });
await p.waitForTimeout(600);
const n = await p.evaluate(() => [...document.querySelectorAll('.vx-av-thumb img')].filter(i => decodeURIComponent(i.src).includes('<animate')).length);
ok(n >= 10, 'miniaturas animadas en la biblioteca: ' + n);
// la miniatura cambia con el tiempo
const el = (await p.$$('.vx-av-thumb'))[0];
const a1 = await el.screenshot(); await p.waitForTimeout(1100); const a2 = await el.screenshot();
ok(Buffer.compare(a1, a2) !== 0, 'la miniatura se mueve (dos capturas distintas)');
// todas válidas
const bad = await p.evaluate(() => { const out = []; EX.forEach((e, i) => { try { if (typeof vxAvatar !== 'function') return; } catch (x) {} }); return out; });
const bad2 = await p.evaluate(() => { const els = []; vxSwapThumbs && 0; const L = []; EX.forEach((e) => { if (!e.imageAnim) { const d = document.createElement('div'); d.className = 'ex-img'; d.setAttribute('aria-label', e[0]); document.body.appendChild(d); els.push(d); } }); vxSwapThumbs(document.body); els.forEach(d => d.remove()); EX.forEach((e) => { if (e.imageAnim) { const doc = new DOMParser().parseFromString(decodeURIComponent(e.imageAnim.split(',')[1]), 'image/svg+xml'); if (doc.querySelector('parsererror')) L.push(e[0]); } }); return [L, EX.filter(e => e.imageAnim).length]; });
ok(bad2[0].length === 0, 'SVG animados válidos en ' + bad2[1] + ' ejercicios ' + JSON.stringify(bad2[0].slice(0, 3)));
// ficha: controles
const i = await p.evaluate(() => EX.findIndex(e => e[0] === 'Sentadilla'));
await p.evaluate((i) => { S.stack = ['ex' + i]; R(); }, i); await p.waitForTimeout(400);
ok(await p.locator('.vx-av-ctl button').count() === 3, 'controles pausa / lento / 1× en la ficha');
await p.evaluate(() => document.querySelectorAll('.vx-av-ctl button')[0].click()); await p.waitForTimeout(200);
ok(await p.evaluate(() => document.querySelector('.vx-avatar svg').animationsPaused()), 'pausa detiene la animación');
await p.evaluate(() => document.querySelectorAll('.vx-av-ctl button')[0].click()); await p.waitForTimeout(100);
ok(await p.evaluate(() => !document.querySelector('.vx-avatar svg').animationsPaused()), 'y vuelve a seguir');
await p.evaluate(() => document.querySelectorAll('.vx-av-ctl button')[1].click()); await p.waitForTimeout(200);
ok(await p.evaluate(() => /dur="5.6s"/.test(document.querySelector('.vx-avatar').innerHTML) && document.querySelector('.vx-av-ctl button:nth-child(2)').classList.contains('on')), 'cámara lenta 0,5×');
await p.evaluate(() => document.querySelectorAll('.vx-av-ctl button')[2].click()); await p.waitForTimeout(200);
ok(await p.evaluate(() => /dur="2.6s"/.test(document.querySelector('.vx-avatar').innerHTML)), 'velocidad normal');
ok(/Ritmo recomendado/.test(await p.evaluate(() => document.getElementById('m').innerText)), 'indicación de ritmo');
await p.screenshot({ path: 'shots/anim-ex.png' });
ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
// movimiento reducido: miniaturas fijas y sin controles
const c2 = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 900 } }); const q = await c2.newPage();
await q.goto(process.env.APP_URL); await q.waitForTimeout(900);
await q.evaluate((i) => { S.onboarded = true; S.demo = true; S.stack = ['ex' + i]; R(); }, i); await q.waitForTimeout(300);
ok(await q.locator('.vx-av-ctl').count() === 0, 'con "reducir movimiento" no hay animación ni controles');
await b.close(); })();
