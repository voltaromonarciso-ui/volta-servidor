const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1200 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  for (const demo of [false, true]) {
    await p.evaluate((demo) => { S.onboarded = true; S.demo = demo; S.lang = 'es'; S.pgt = 0; S.stack = []; tab('home'); }, demo);
    await p.click('#nav button:has-text("Progreso")'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => S.tab === 'prog'), `Progreso se abre desde la barra (demo=${demo})`);
    await p.click('.ptabs div:has-text("Anatomía")'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ tab: S.tab, pgt: S.pgt, t: document.getElementById('m').innerText, body: !!document.querySelector('#m .vpane .vbc'), extra: document.querySelectorAll('#m .vpane > :not(.vbc)').length }));
    // decisión de los fundadores (14-10-2026): en Anatomía solo el cuerpo, sin leyenda ni rangos debajo
    ok(r.tab === 'prog' && r.pgt === 1 && r.body && r.extra === 0 && !/Hierro|Olímpico|ORO|PLATA/.test(r.t), `Anatomía muestra solo el cuerpo, sin etiquetas de rango (demo=${demo})`);
    // la pestaña elegida se guarda: al volver a Progreso tiene que abrir, no mandar a Inicio
    await p.evaluate(() => { tab('home'); tab('prog'); }); await p.waitForTimeout(200);
    ok(await p.evaluate(() => S.tab === 'prog'), `con Anatomía guardada, Progreso sigue abriendo (demo=${demo})`);
  }
  // Zeus: la ilustración nueva en Inicio y el busto en el botón flotante
  await p.evaluate(() => { S.pgt = 0; S.stack = []; tab('home'); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const a = document.querySelector('.vx-hero .vx-zeus-img'), f = document.querySelector('.vx-zeus-fab .vx-zeus-img'); return !!a && !!f && a.complete && a.naturalWidth > 300 && f.naturalWidth === 200; }), 'Zeus nuevo en Inicio y su busto en el botón flotante');
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
