const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1600 }, locale: 'es-ES' });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  const show = (t, extra) => p.evaluate(([t, x]) => { S.onboarded = true; S.hasSeenOnboarding = true; S.vx = Object.assign(S.vx || {}, { proSeen: 1 }); S.demo = true; S.lang = 'es'; S.nsub = 'day'; S.pgt = 0; S.stack = []; Object.assign(S, x || {}); tab(t); }, [t, extra]);

  // Progreso: rango arriba, evolución y gráfica de evolución, sin gráfica repetida
  await show('prog'); await p.waitForTimeout(300);
  let r = await p.evaluate(() => {
    const vp = document.querySelector('#m .vp'), k = [...vp.children];
    const i = (sel) => k.findIndex((e) => e.matches(sel));
    return { rank: i('.vhero.vx-g-rank'), evo: i('.vx-g-evo'), chart: i('.vch.vx-g-chart'), sum: i('h2.t'), charts: vp.querySelectorAll('.vch').length, emb: !!vp.querySelector('.vx-g-emb svg'), txt: vp.querySelector('.vx-g-evo').innerText };
  });
  ok(r.rank >= 0 && r.evo === r.rank + 1, 'Progreso: el rango va arriba y justo debajo «Tu evolución»');
  ok(r.chart > r.evo && r.chart < r.sum, 'Progreso: la gráfica de evolución va antes del resumen de la semana');
  ok(r.charts === 1 && r.emb, 'Progreso: una sola gráfica (sin la repetida) y emblema del rango con rayo');
  ok(/Fuerza/.test(r.txt) && /Volumen/.test(r.txt) && /Entrenos/.test(r.txt), 'Progreso: evolución con fuerza, volumen y entrenos');
  // cambiar de métrica mantiene el orden
  await p.evaluate(() => { S.pmt = 2; R(); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll('#m .vp .vx-g-evo').length === 1 && !!document.querySelector('#m .vp .vch.vx-g-chart')), 'Progreso: al cambiar de métrica no se duplica nada');
  // Anatomía no se toca
  await p.evaluate(() => { S.pgt = 1; R(); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !document.querySelector('#m .vx-g-evo')), 'Progreso › Anatomía: sin cambios');

  // Nutrición: anillo + Registrar arriba, Explorar abajo
  await show('nut'); await p.waitForTimeout(300);
  r = await p.evaluate(() => {
    const vx = document.querySelector('#m .vx'), k = [...vx.children];
    const fuel = k.findIndex((e) => e.classList.contains('vx-g-fuelbox')), chips = k.findIndex((e) => e.classList.contains('chips'));
    const exp = k.findIndex((e) => /^go\('explore'\)/.test(e.getAttribute('onclick') || '')), days = k.findIndex((e) => e.classList.contains('days'));
    const log = vx.querySelector('.vx-g-log');
    return { fuel, chips, exp, days, ring: !!vx.querySelector('.vx-g-fuelbox circle[r="52"]'), log: log && log.textContent, onclick: log && log.getAttribute('onclick') };
  });
  ok(r.fuel === r.chips + 1 && r.ring, 'Nutrición: el anillo de calorías y macros va arriba, justo tras las pestañas');
  ok(/Registrar comida/.test(r.log || '') && r.onclick === 'vxFoodOpen()', 'Nutrición: botón «Registrar comida» que abre el buscador');
  ok(r.exp > r.days, 'Nutrición: «Explorar comidas» baja debajo de las comidas');
  await p.click('.vx-g-log'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => S.stack[S.stack.length - 1] === 'vx:food'), 'Nutrición: «Registrar comida» abre «Añadir alimento»');
  await show('nut', { nsub: 'week' }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !document.querySelector('#m .vx-g-fuelbox')), 'Nutrición › Semana: sin cambios');

  // Perfil: tarjeta de atleta
  await show('prof', { name: 'Ana', streakCount: 5 }); await p.waitForTimeout(300);
  r = await p.evaluate(() => {
    const c = document.querySelector('#m .vx-g-card');
    return c && { txt: c.innerText, av: !!c.querySelector('.vx-g-avring .th'), grid: !!c.querySelector('.grid2'), share: !!c.querySelector('.vx-g-share'), old: document.querySelectorAll('#m .th').length };
  });
  ok(!!r, 'Perfil: tarjeta de atleta');
  ok(r && r.av && r.grid && r.old === 1, 'Perfil: avatar y estadísticas dentro de la tarjeta (sin repetir)');
  ok(r && /Ana/.test(r.txt) && /Racha/.test(r.txt) && /Medallas/.test(r.txt) && /Liga/.test(r.txt) && /⚡/.test(r.txt), 'Perfil: nombre, rango, racha, medallas y liga');
  ok(r && r.share, 'Perfil: botón «Compartir mi tarjeta»');
  const img = await p.evaluate(() => { const c = window.vxAthleteCard(); return { w: c.width, h: c.height, url: c.toDataURL('image/png').length }; });
  ok(img.w === 1080 && img.h === 1350 && img.url > 20000, 'Perfil: la imagen para compartir se genera (1080×1350)');
  // compartir sin Web Share: descarga
  const dl = p.waitForEvent('download', { timeout: 4000 }).catch(() => null);
  await p.evaluate(() => { try { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); } catch (e) { /* sin cambio */ } vxAthleteShare(); });
  const d = await dl;
  ok(!!d && /volta-atleta\.png/.test(d.suggestedFilename()), 'Perfil: sin «compartir» del sistema, se descarga la imagen');

  // Progreso sin métricas rotas: sin entrenos reales no salen el resumen ni los contadores vacíos
  r = await p.evaluate(() => { S.demo = false; S.log = []; S.stack = []; S.pgt = 0; tab('prog'); const vp = document.querySelector('#m .vp'); return { rs: !!vp.querySelector('.rs'), cnt: !!vp.querySelector('.vcnt'), k: !!vp.querySelector('.vsm.k') }; });
  ok(!r.rs && !r.cnt && !r.k, 'Progreso sin entrenos: sin resumen semanal ni contadores a cero');
  r = await p.evaluate(() => {
    const ex = [0, 1, 2, 3]; S.log = [];
    for (let d = 20; d >= 0; d -= 2) ex.forEach((e, j) => { for (let k = 0; k < 3; k++) S.log.push({ ex: e, w: 50 + j * 5 + (20 - d), r: 8, rir: 2, ty: 'effective', t: Date.now() - d * 864e5 - (j * 3 + k) * 6e4 }); });
    R(); const vp = document.querySelector('#m .vp'); return { rs: !!vp.querySelector('.rs'), k: !!vp.querySelector('.vsm.k'), charts: vp.querySelectorAll('.vch').length };
  });
  ok(r.rs && !r.k && r.charts === 1, 'Progreso con entrenos: resumen por grupos, sin la fila repetida de fuerza/volumen y una sola gráfica');
  // Inicio: «Tu Olimpo» en esquema
  r = await p.evaluate(() => { S.demo = true; S.stack = []; tab('home'); const o = document.querySelector('.vx-oly'); return o && { s: o.classList.contains('vx-oly-s'), rk: !!o.querySelector('.vx-oly-rk'), li: o.querySelectorAll('.vx-oly-ls li').length, txt: o.innerText }; });
  ok(r && r.s && r.rk && r.li >= 1 && /⚡/.test(r.txt), 'Inicio: «Tu Olimpo» en esquema (rango, barra y datos en viñetas) · ' + (r && r.txt.replace(/\n/g, ' | ')));
  // inglés
  await p.evaluate(() => { S.lang = 'en'; S.stack = []; tab('prof'); }); await p.waitForTimeout(300);
  const en = await p.evaluate(() => document.querySelector('#m .vx-g-card').innerText);
  ok(/Streak/.test(en) && /Medals/.test(en) && /League/.test(en) && /Share my card/.test(en), 'Perfil en inglés: tarjeta traducida');
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
