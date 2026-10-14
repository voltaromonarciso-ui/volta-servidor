const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
 const p = await b.newPage({ viewport: { width: 390, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
 // usuario que ya tenía logros de la versión anterior (sin achVer): no debe recibir una avalancha de avisos
 await p.evaluate(() => { S.onboarded = true; S.lang = 'es'; S.demo = false; S.stack = [];
   const ex = EX.findIndex(e => e[0] === 'Press de banca'), now = Date.now();
   S.log = []; for (let d = 0; d < 30; d++) for (let s = 0; s < 6; s++) S.log.push({ ex: (ex + s) % EX.length, w: 60 + d, r: 8, t: now - d * 864e5 - s * 6e4 - 3600e3, ty: 'effective' });
   S.vx = { ach: { first: 1, w5: 1 }, achInit: 1, inbox: [] }; S.streakCount = 12; tab('home'); });
 await p.waitForTimeout(800);
 await p.evaluate(() => { tab('prof'); }); await p.waitForTimeout(1200);
 const inbox1 = await p.evaluate(() => (S.vx.inbox || []).filter(n => /Logro desbloqueado/.test(n.text)).length);
 const fam = await p.evaluate(() => vxAchFam().map(f => f.id + ':' + f.lvl + '/' + f.tiers.length));
 const L = await p.evaluate(() => vxAch());
 ok(L.length >= 100 && fam.length >= 18, `logros: ${L.length} en ${fam.length} familias con niveles`);
 ok(inbox1 === 0, 'al actualizar, lo ya conseguido se marca sin avalancha de avisos (' + inbox1 + ')');
 ok(await p.evaluate(() => vxAchFam().find(f => f.id === 'days').lvl === 4 && vxAchFam().find(f => f.id === 'streak').lvl === 2), 'niveles según los datos: 30 días → Constancia IV; racha 12 → Racha II');
 // subir de nivel: 5 días más de entreno → Constancia sigue IV (50 hace falta), sets 180 → Series II (100) ... añadimos hasta 250 series
 await p.evaluate(() => { const now = Date.now(); for (let s = 0; s < 80; s++) S.log.push({ ex: 0, w: 50, r: 10, t: now - 2 * 864e5 - s * 1e4, ty: 'effective' }); });
 await p.waitForTimeout(5200); await p.evaluate(() => { tab('home'); tab('prof'); }); await p.waitForTimeout(2500);
 const inbox2 = await p.evaluate(() => (S.vx.inbox || []).filter(n => /Logro desbloqueado/.test(n.text)).map(n => n.text));
 ok(inbox2.some(t => /Series III/.test(t)), 'al llegar a 250 series se desbloquea «Series III» y avisa: ' + inbox2.join(' | ').slice(0, 120));
 // pantalla de logros
 await p.evaluate(() => go('vx:ach')); await p.waitForTimeout(600);
 const v = await p.evaluate(() => ({ cards: document.querySelectorAll('.vx-fam').length, txt: document.getElementById('m').innerText.slice(0, 200) }));
 ok(v.cards === fam.length && /de \d+ desbloqueados/.test(v.txt), 'pantalla Logros: una tarjeta por familia con nivel, barra y puntos: ' + v.cards);
 await p.screenshot({ path: 'shots/logros.png', fullPage: false });
 // misiones: 3 fijas + 2 del día (una de entreno y otra de hábito), sin repetidas y alcanzables
 await p.evaluate(() => {
   const ex = EX.map((e, i) => i).filter((i) => ['Pecho', 'Espalda', 'Cuádriceps', 'Hombros'].includes(EX[i][1])).slice(0, 10);
   S.demo = false; S.log = []; S.wts = []; S.nlog = {};
   for (let d = 30; d >= 1; d -= 2) { const t0 = Date.now() - d * 864e5; ex.slice(0, 5).concat(ex.slice(5 + (d % 5), 6 + (d % 5))).forEach((e, j) => { for (let k = 0; k < 3; k++) S.log.push({ ex: e, w: 60 + j * 5, r: 10, rir: 2, ty: 'effective', t: t0 + j * 6e5 + k * 1e5 }); }); }
   for (let d = 1; d <= 6; d++) S.nlog[lk(Date.now() - d * 864e5)] = { e: [{ n: 'Pollo', k: 300, p: 40 }], w: 1000 };
   S.stack = []; tab('train');
 });
 await p.waitForTimeout(600);
 const M = await p.evaluate(() => vxMissions().map((x) => ({ id: x.id, daily: !!x.daily })));
 ok(M.length === 5 && M.filter((x) => x.daily).length === 2 && new Set(M.map((x) => x.id)).size === 5, 'misiones: 3 fijas + 2 del día, sin repetidas: ' + M.map((x) => x.id).join(' · '));
 const TRAIN = ['sets', 'vol', 'groups', 'newex', 'pr'], HABIT = ['protein', 'weigh'];
 const days = await p.evaluate(() => { const real = Date.now, out = []; for (let d = 0; d < 20; d++) { Date.now = () => real() + d * 864e5; out.push(vxMissions().filter((x) => x.daily).map((x) => x.id).join('+')); } Date.now = real; return out; });
 ok(days.every((x) => { const [a, b] = x.split('+'); return TRAIN.includes(a) && HABIT.includes(b); }), 'cada día: una misión de entreno y otra de hábito');
 ok(new Set(days).size >= 4, 'las misiones del día cambian de un día a otro: ' + [...new Set(days)].join(', '));
 ok(days.every((x) => !/meals3|water3|early|finish/.test(x)), 'sin misiones que repiten las fijas (3 comidas, 3 L, terminar entreno) ni imposibles por la hora');
 // plegable: cerrada solo se ve la cabecera; se abre y se cierra tocándola
 const fold = await p.evaluate(() => { const vis = () => [...document.querySelectorAll('.vx-mrow')].filter((r) => r.offsetParent).length; S.vxMisOpen = 0; R(); const a = vis(); document.querySelector('.vx-missions .vx-fold-h').click(); const b = vis(); document.querySelector('.vx-missions .vx-fold-h').click(); return [a, b, vis()]; });
 ok(fold[0] === 0 && fold[1] === 5 && fold[2] === 0, 'Misiones de hoy se abre y se cierra tocando la cabecera: ' + fold.join(' → '));
 const rec = await p.evaluate(() => { const vis = () => { const g = document.querySelector('.vx-rec .vx-recgrid'); return !!(g && g.offsetParent); }; S.vxRecOpen = 0; R(); const a = vis(); document.querySelector('.vx-rec .vx-fold-h').click(); const b = vis(); document.querySelector('.vx-rec .vx-fold-h').click(); return [a, b, vis()]; });
 ok(!rec[0] && rec[1] && !rec[2], 'Recuperación muscular se abre y se vuelve a cerrar: ' + rec.join(' → '));
 await p.evaluate(() => { S.vxMisOpen = 1; R(); });
 await p.locator('.vx-missions').screenshot({ path: 'shots/misiones.png' });
 ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
 await b.close(); })();
