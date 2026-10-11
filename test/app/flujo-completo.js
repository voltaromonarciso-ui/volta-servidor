const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: 'es-ES' }); p.setDefaultTimeout(5000);
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', (d) => d.accept());
await p.goto(process.env.APP_URL); await p.waitForTimeout(1200);
// Onboarding: rellena y avanza hasta el final
let steps = 0, last = '';
for (; steps < 30; steps++) { if (last.indexOf('Preparando') !== -1) await p.waitForTimeout(4000);
  if (await p.evaluate(() => S.onboarded)) break;
  const r = await p.evaluate(() => {
    const vis = (e) => e && e.offsetParent !== null;
    const root = document.getElementById('vob') || document.body; const txt = root.innerText.slice(0, 80).replace(/\n/g, ' | ');
    const inps = [...root.querySelectorAll('input, select')].filter(vis);
    for (const inp of inps) {
      if (inp.value) continue;
      if (inp.tagName === 'SELECT') { inp.selectedIndex = 1; inp.dispatchEvent(new Event('change', { bubbles: true })); continue; }
      const ph = (inp.placeholder + ' ' + inp.id + ' ' + (inp.closest('label,div') || {}).innerText).toLowerCase();
      inp.value = inp.type === 'number' || /\d/.test(inp.placeholder) ? (/alt|cm|height/.test(ph) ? '172' : /peso|kg|weight/.test(ph) ? '68' : /edad|años|age/.test(ph) ? '29' : String(Math.round(((+inp.min || 10) + (+inp.max || 100)) / 2))) : 'Lucía';
      inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const inp = inps[0];
    const btns = [...root.querySelectorAll('button, .chip, [onclick]')].filter(vis);
    const next = btns.find((x) => /^(Siguiente|Empezar|Continuar|Crear mi plan|Listo|Comenzar|Vamos)/i.test(x.innerText.trim()));
    const q = root.querySelector('#obc'); const opts = q ? [...q.querySelectorAll('[onclick]')].filter(vis) : [];
    const anyOn = opts.some((x) => x.classList.contains('on'));
    if (opts.length && !anyOn && !inps.some((i) => i.tagName === 'INPUT')) (opts[3] || opts[0]).click();
    if (next) { next.click(); return 'next · ' + txt; }
    return 'NOBTN · ' + txt + ' · btns=' + btns.slice(0, 8).map((x) => x.innerText.trim().slice(0, 15)).join('/');
  });
  process.stderr.write(steps + ' ' + r + '\n');
  if (r.startsWith('NOBTN') && r === last) break;
  last = r;
  await p.waitForTimeout(300);
}
ok(await p.evaluate(() => S.onboarded), 'onboarding completo en ' + steps + ' pasos');
await p.waitForTimeout(1500);
const tour = await p.evaluate(() => { const ob = document.getElementById('ob'); if (!ob || ob.offsetParent === null && getComputedStyle(ob).display === 'none') return 'sin guía'; const sk = [...ob.querySelectorAll('button,[onclick]')].find((x) => /Saltar|Omitir/i.test(x.innerText)); if (sk) { sk.click(); return 'guía saltada'; } return 'guía sin botón saltar: ' + ob.innerText.slice(0, 80); });
console.log('     ' + tour);
await p.screenshot({ path: 'shots/flow-home.png' });
const home = await p.evaluate(() => document.getElementById('m') && document.getElementById('m').innerText);
ok(home && home.length > 100, 'inicio tras el onboarding');
// Entrenar: empieza y registra 3 series
await p.evaluate(() => { S.stack = []; tab('work'); }); await p.waitForTimeout(400);
await p.screenshot({ path: 'shots/flow-work0.png' });
const start = await p.$('button:has-text("Empezar"), button:has-text("Entrenar"), button:has-text("Iniciar")');
if (start) { await start.click(); await p.waitForTimeout(400); }
await p.screenshot({ path: 'shots/flow-work.png' });
let logged = 0;
const before = await p.evaluate(() => (S.log || []).length);
await p.evaluate(() => { [...document.querySelectorAll('button')].find((b) => /Registrar serie/.test(b.innerText)).click(); });
await p.waitForTimeout(300);
ok(await p.evaluate(() => (S.log || []).length) === before && /repeticiones/.test(await p.evaluate(() => document.body.innerText)), 'una serie vacía (0 × 0) no se registra y se avisa');
for (let i = 0; i < 3; i++) {
  const done = await p.evaluate((i) => { const c = cfg(); S.wk = Object.assign({}, S.wk, { k: S.cur + ':' + S.wi + ':' + c.i, w: String(40 + i * 2.5), r: '10' }); const bt = [...document.querySelectorAll('button')].find((b) => /Registrar serie/.test(b.innerText)); if (!bt) return false; bt.click(); return true; }, i);
  if (!done) break; await p.waitForTimeout(300);
  await p.evaluate(() => { const sk = [...document.querySelectorAll('button')].find((b) => /^Saltar/.test(b.innerText.trim())); if (sk) sk.click(); });
  logged++;
}
ok(logged === 3, 'registra 3 series: ' + logged);
const nlog = await p.evaluate(() => (S.log || []).length);
ok(nlog >= 3, 'quedan guardadas en el registro: ' + nlog);
const fin = await p.$('button:has-text("Finalizar entrenamiento")');
if (fin) { await fin.click(); await p.waitForTimeout(600); const c = await p.$('button:has-text("Finalizar"), button:has-text("Sí"), button:has-text("Confirmar")'); if (c) { await c.click().catch(() => {}); await p.waitForTimeout(600); } }
await p.screenshot({ path: 'shots/flow-finish.png' });
await p.evaluate(() => { S.stack = []; tab('prof'); go('p:hist'); }); await p.waitForTimeout(400);
const hist = await p.evaluate(() => document.getElementById('m').innerText);
ok(!/Aún no hay entrenos finalizados/.test(hist), 'aparece en el historial');
await p.evaluate(() => { S.stack = []; go('vx:arena'); }); await p.waitForTimeout(400);
const ar = await p.evaluate(() => vxArenaMe());
ok(ar.score > 0, 'la Arena suma puntos del entreno: ' + ar.score);
await p.evaluate(() => { S.stack = []; tab('train'); }); await p.waitForTimeout(400);
const mis = await p.evaluate(() => (document.querySelector('.vx-missions') || {}).innerText || '');
ok(/[1-5]\/5/.test(mis), 'misión "entrena hoy" marcada: ' + mis.split('\n')[0]);
const cal = await p.evaluate(() => { const m = document.getElementById('m').innerText; const i = m.indexOf('Calorías de hoy'); return [m.slice(i, i + 140).replace(/\n/g, ' | '), JSON.stringify(S.ng) + ' prof=' + JSON.stringify(S.userProfile), JSON.stringify({ w: S.weight, h: S.height, age: S.age, goal: S.goal, kc: S.kc, ob: S.ob && Object.keys(S.ob) })]; });
console.log('     calorías:', cal.join('  ##  '));
ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
await b.close(); })();
