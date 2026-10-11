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
 // misiones
 await p.evaluate(() => { S.stack = []; tab('train'); }); await p.waitForTimeout(600);
 const m = await p.evaluate(() => [...document.querySelectorAll('.vx-mrow')].map(r => r.innerText.replace(/\n/g, ' ')));
 ok(m.length === 5 && m.filter(x => /Del día/.test(x)).length === 2, 'misiones: 3 fijas + 2 del día: ' + m.join(' · ').slice(0, 220));
 const picks = await p.evaluate(() => { const r = []; for (let d = 0; d < 14; d++) { const dt = new Date(Date.now() + d * 864e5); r.push(dt.getDate()); } return r; });
 // cambian según la fecha
 const days = await p.evaluate(() => { const real = Date.now; const out = new Set(); for (let d = 0; d < 10; d++) { Date.now = () => real() + d * 864e5; out.add([...document.createElement('div').classList].length + (window.vxMissions ? vxMissions().filter(x => x.daily).map(x => x.id).join('+') : '')); } Date.now = real; return [...out]; });
 ok(days.length >= 4, 'las misiones del día cambian de un día a otro: ' + days.join(', '));
 await p.locator('.vx-missions').screenshot({ path: 'shots/misiones.png' });
 ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs.slice(0, 3)));
 await b.close(); })();
