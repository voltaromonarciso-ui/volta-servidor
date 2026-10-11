const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const p = await b.newPage({ viewport: { width: 390, height: 1200 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
const I = await p.evaluate(() => { const f = (n) => EX.findIndex(e => e[0] === n); return { sq: f('Sentadilla'), bp: f('Press de banca'), row: f('Remo con barra'), pr: f('Prensa de piernas') }; });
await p.evaluate(() => { localStorage.removeItem('vx:oracle'); S.onboarded = true; S.demo = false; S.lang = 'es'; S.log = []; S.done = {}; S.routines = []; S.stack = []; tab('home'); });
await p.waitForTimeout(300);
let t = await p.evaluate(() => document.getElementById('m').innerText);
ok(/Favor del Oráculo/.test(t) && /Nivel 1/.test(t) && /Peregrino/.test(t) && /¿Cómo funciona\?/.test(t) && /100 XP para el nivel 2/.test(t), 'favor del Oráculo visible (nivel 1, cómo funciona, XP para el siguiente)');
ok(!/Entrenar esto|rutina con IA|Hoy los dioses te piden|Pecho|Espalda/.test(t.split('El Oráculo de Delfos')[1].split('¿Cómo funciona')[0]), 'sin rutinas: no propone ningún entrenamiento');
// dos rutinas: una de la IA y otra propia
await p.evaluate((I) => { S.routines = [{ id: 1, name: 'Pierna IA', days: 4, focus: 'Hipertrofia', ex: [{ i: I.sq, sets: 3, reps: '8', rest: 90 }, { i: I.pr, sets: 3, reps: '10', rest: 90 }] }, { id: 2, name: 'Mi torso', days: 4, focus: 'Fuerza', ex: [{ i: I.bp, sets: 3, reps: '6', rest: 120 }, { i: I.row, sets: 3, reps: '8', rest: 120 }] }]; S.planSrc = 'ai';
  // ayer pierna (rutina de la IA, finalizada)
  const y = Date.now() - 864e5; for (let s = 0; s < 6; s++) S.log.push({ ex: I.sq, w: 80, r: 8, t: y + s * 6e4, ty: 'effective' });
  S.done[lk(y)] = { sets: 6, vol: 3840, t: y + 4e5, rid: 1 }; S.stack = []; tab('home'); }, I);
await p.waitForTimeout(1300);
t = await p.evaluate(() => document.getElementById('m').innerText);
ok(!/Empezar esta rutina/.test(t) && !/Mi torso/.test(t.split('El Oráculo de Delfos')[1].split('¿Cómo funciona')[0]), 'con rutinas tampoco recomienda ninguna');
const f1 = await p.evaluate(() => vxFavor());
ok(f1.xp === 40 + 6 * 4 + Math.round(3840 / 250) && f1.n === 1, 'XP por la sesión de la rutina de la IA: ' + f1.xp);
// hoy: entreno de la rutina propia, lo que pedía el Oráculo → bonus
ok(await p.evaluate(() => !JSON.parse(localStorage.getItem('vx:oracle') || '{}').proph), 'ya no se guarda ninguna profecía de entreno');
await p.evaluate(() => { startR(2); }); await p.waitForTimeout(300);
for (let i = 0; i < 4; i++) { await p.evaluate(() => { const c = cfg(); S.wk = Object.assign({}, S.wk, { k: S.cur + ':' + S.wi + ':' + c.i, w: '60', r: '8' }); S.w.on = false; doneSet(); }); await p.waitForTimeout(150); }
await p.evaluate(() => finishSession()); await p.waitForTimeout(400);
await p.evaluate(() => { S.stack = []; tab('home'); }); await p.waitForTimeout(1300);
const f2 = await p.evaluate(() => vxFavor());
ok(f2.n === 2 && f2.last.xp === 40 + 4 * 4 + Math.round(4 * 480 / 250), 'sesión propia finalizada: XP sin bonus: ' + JSON.stringify(f2.last && { xp: f2.last.xp }));
const toasts = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.textContent).join(' | ') + ' || ' + (S.vx.inbox || []).map(n => n.text).join(' | '));
ok(/\+\d+ XP Favor del Oráculo/.test(toasts), 'aviso de XP ganada: ' + toasts.slice(0, 140));
t = await p.evaluate(() => document.getElementById('m').innerText);
ok(!/Descansa, guerrero/.test(t) && /Último entreno: \+\d+ XP/.test(t), 'tras entrenar: XP del último entreno');
// sesión libre (sin rutina) también cuenta
await p.evaluate((I) => { const d = Date.now() - 3 * 864e5; for (let s = 0; s < 3; s++) S.log.push({ ex: I.row, w: 50, r: 10, t: d + s * 6e4, ty: 'effective' }); S.done[lk(d)] = { sets: 3, vol: 1500, t: d + 2e5, rid: 0 }; }, I);
const f3 = await p.evaluate(() => vxFavor());
ok(f3.n === 3 && f3.xp > f2.xp, 'una sesión libre también da XP: ' + f3.xp);
// series sueltas sin finalizar no cuentan
await p.evaluate((I) => { S.log.push({ ex: I.bp, w: 50, r: 10, t: Date.now() - 5 * 864e5, ty: 'effective' }); }, I);
ok((await p.evaluate(() => vxFavor())).n === 3, 'solo cuentan los entrenamientos finalizados');
await p.screenshot({ path: 'shots/oracle2.png' });
ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
await b.close(); })();
