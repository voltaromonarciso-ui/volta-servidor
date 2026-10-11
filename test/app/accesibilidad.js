const { chromium } = require('playwright'); const fs = require('fs');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
const nav = (p, v, th) => p.evaluate(([v, th]) => { S.onboarded = true; S.demo = true; S.theme = th; S.stack = []; S.lang = 'es'; if (['home','train','prog','nut','prof'].includes(v)) tab(v); else { tab('home'); go(v); } }, [v, th]).then(() => p.waitForTimeout(350));
const axeRun = (p) => p.waitForTimeout(700).then(() => p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => v.id + "×" + v.nodes.length)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const errs = [];
  for (const [acc, th] of [['none', 'light'], ['amarillo', 'light'], ['rojo', 'dark']]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript((a) => { try { if (a !== 'none') localStorage.setItem('vx:accent', a); } catch (e) {} }, acc);
    await p.goto(process.env.APP_URL); await p.waitForTimeout(1200); await p.addScriptTag({ content: AXE });
    const bad = [];
    for (const v of ['home', 'train', 'prog', 'nut', 'prof', 'lib', 'p:profile', 'ai', 'pg:body', 'vx:arena']) { await nav(p, v, th); const r = await axeRun(p); if (r.length) bad.push(v + ':' + r.join(',')); }
    ok(!bad.length, `${acc}/${th}: sin fallos WCAG 2.2 AA en 10 pantallas ${bad.join(' ')}`);
    await p.close();
  }
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1200); await p.addScriptTag({ content: AXE });
  // teclado: un chip de filtro se alcanza con Tab y se activa con Intro
  await nav(p, 'lib', 'dark');
  const chip = await p.evaluate(() => { const c = [...document.querySelectorAll('.chips .chip')].find(x => !x.classList.contains('on')); c.id = 'tchip'; return { role: c.getAttribute('role'), tab: c.tabIndex, pressed: c.getAttribute('aria-pressed'), txt: c.textContent }; });
  ok(chip.role === 'button' && chip.tab === 0 && chip.pressed === 'false', 'los chips son botones enfocables con estado: ' + JSON.stringify(chip));
  await p.focus('#tchip'); await p.keyboard.press('Enter'); await p.waitForTimeout(350);
  ok(await p.evaluate((t) => { const c = [...document.querySelectorAll('.chips .chip')].find(x => x.textContent === t); return !!c && c.classList.contains('on') && c.getAttribute('aria-pressed') === 'true'; }, chip.txt), 'Intro activa el chip «' + chip.txt + '»');
  await p.evaluate(() => { S.xfo = {}; S.cat = 'Todos'; S.xf = {}; }); await nav(p, 'lib', 'dark');
  const space = await p.evaluate(() => { const c = document.querySelector('[onclick^="go(\'ex"]'); c.id = 'tcard'; return !!c; });
  await p.focus('#tcard'); await p.keyboard.press(' '); await p.waitForTimeout(350);
  const top = await p.evaluate(() => S.stack[S.stack.length - 1]);
  ok(space && /^ex\d/.test(top || ''), 'Espacio abre la ficha de un ejercicio: ' + top);
  // nombre del icono de búsqueda
  await nav(p, 'train', 'dark');
  ok(await p.evaluate(() => (document.querySelector('.ib[onclick*="focus"]') || {}).getAttribute?.('aria-label') === 'Buscar'), 'la lupa se anuncia como «Buscar»');
  // etiquetas
  await nav(p, 'p:profile', 'dark');
  ok(await p.evaluate(() => { const i = document.querySelector('input[oninput="S.name=this.value"]'); return !!i && i.labels.length === 1 && /nombre|name/i.test(i.labels[0].textContent); }), 'el campo Nombre tiene su etiqueta asociada');
  // cambio de modo: lo corregido en claro se deshace en oscuro
  await nav(p, 'home', 'light');
  const nFix = await p.evaluate(() => document.querySelectorAll('[style*="color"][style*="important"]').length);
  await nav(p, 'home', 'dark');
  ok((await axeRun(p)).length === 0, 'al pasar de claro a oscuro no queda ningún fallo (ajustes en claro: ' + nFix + ')');
  // no se "corrige" de más: los títulos y textos normales conservan su color (solo se ajustan los que no se leen)
  for (const v of ['train', 'home', 'prog']) {
    await nav(p, v, 'light'); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const fx = [...document.querySelectorAll('#m [style*="color"]')].filter(e => /important/.test(e.getAttribute('style')) && e.__vxc); return { n: fx.length, bw: fx.filter(e => /rgb\((0, 0, 0|255, 255, 255)\)/.test(e.style.color)).map(e => e.textContent.trim().slice(0, 20)), h: [...document.querySelectorAll('#m h1,#m h2')].some(h => h.__vxc) }; });
    ok(r.n <= 12 && !r.h && r.bw.length <= 2, `${v} en claro: ${r.n} textos ajustados, títulos intactos, a negro/blanco: ${JSON.stringify(r.bw)}`);
  }
  // foco visible
  await p.focus('.chip, [role=button]');
  ok(await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), 'el elemento con foco muestra un contorno');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await p.screenshot({ path: 'shots/a11y-focus.png' });
  for (const [acc, v] of [['none', 'home'], ['none', 'train'], ['amarillo', 'home'], ['amarillo', 'prog']]) {
    const q = await b.newPage({ viewport: { width: 390, height: 844 } });
    await q.addInitScript((a) => { try { if (a !== 'none') localStorage.setItem('vx:accent', a); } catch (e) {} }, acc);
    await q.goto(process.env.APP_URL); await q.waitForTimeout(1200); await nav(q, v, 'light'); await q.waitForTimeout(300);
    await q.screenshot({ path: `shots/a11y-${acc}-${v}.png` }); await q.close();
  }
  await b.close();
})();
