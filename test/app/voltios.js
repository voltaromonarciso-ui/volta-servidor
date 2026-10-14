const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1400 }, locale: 'es-ES' });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  const bp = await p.evaluate(() => EX.findIndex((e) => e[0] === 'Press de banca'));
  // usuario nuevo
  await p.evaluate(() => { S.onboarded = true; S.demo = false; S.lang = 'es'; S.log = []; S.done = {}; S.nlog = {}; S.vx = {}; S.userProfile = Object.assign(S.userProfile || {}, { days: 3, weight: 75 }); localStorage.removeItem('vx:labors'); S.stack = []; tab('home'); });
  await p.waitForTimeout(300);
  let t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Tu Olimpo/.test(t) && /Mortal I/.test(t) && /⚡\s*0\b/.test(t), 'Inicio: tarjeta Tu Olimpo con Mortal I y ⚡ 0');
  ok(!/Favor del Oráculo|Peregrino/.test(t), 'ya no hay un segundo sistema de XP (Favor del Oráculo)');
  // un día de entreno: 6 series efectivas
  const day = (d, w, n, wt) => p.evaluate(({ d, w, n, wt, bp }) => { const t0 = Date.now() - d * 864e5; for (let k = 0; k < n; k++) S.log.push({ ex: bp, w: wt, r: 8, t: t0 + k * 6e4, ty: 'effective' }); }, { d, w, n, wt, bp });
  await day(0, 0, 6, 60);
  let v = await p.evaluate(() => vxVolt());
  const tr1 = v.entries.filter((e) => e.kind === 'train');
  ok(tr1.length === 1 && tr1[0].v === 60 + 6 * 3, 'entreno de 6 series: +78 Voltios (' + (tr1[0] && tr1[0].v) + ')');
  ok(v.entries.some((e) => e.kind === 'mission' && e.v === 15), 'misión principal «entrenar» cumplida: +15');
  // récord personal al día siguiente (más peso)
  await p.evaluate(() => { S.log = []; }); await day(1, 0, 4, 60); await day(0, 0, 4, 70);
  v = await p.evaluate(() => vxVolt());
  const last = v.entries.filter((e) => e.kind === 'train').pop();
  ok(last.v === 60 + 4 * 3 + 20, 'récord personal: +20 (' + last.v + ')');
  // series imposibles no cuentan
  const before = (await p.evaluate(() => vxVolt())).total;
  await p.evaluate((bp) => { S.log.push({ ex: bp, w: 900, r: 5, t: Date.now() - 3 * 864e5, ty: 'effective' }, { ex: bp, w: 900, r: 5, t: Date.now() - 3 * 864e5 + 1, ty: 'effective' }, { ex: bp, w: 900, r: 5, t: Date.now() - 3 * 864e5 + 2, ty: 'effective' }); }, bp);
  ok((await p.evaluate(() => vxVolt())).total === before, 'series imposibles (900 kg) no dan Voltios');
  // racha semanal: la semana pasada cumplió 3 días → ×1,1 esta semana
  await p.evaluate(() => { S.log = []; });
  const mon = await p.evaluate(() => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return Math.round((Date.now() - d.getTime()) / 864e5); });
  for (const d of [mon + 6, mon + 5, mon + 4]) await day(d, 0, 5, 50);
  await day(0, 0, 5, 50);
  v = await p.evaluate(() => vxVolt());
  const cur = v.entries.filter((e) => e.kind === 'train').pop();
  ok(v.mult === 1.1 && cur.v === Math.round((60 + 15) * 1.1), 'objetivo semanal cumplido la semana pasada: ×1,1 (' + cur.v + ')');
  ok(v.entries.some((e) => e.kind === 'goal' && e.v === 150), 'cumplir el objetivo semanal: +150');
  // la liga solo cuenta actividad, no logros
  await p.evaluate(() => { S.vx.ach = { test_3: Date.now() }; });
  v = await p.evaluate(() => vxVolt());
  ok(v.entries.some((e) => e.kind === 'ach' && e.v === 75), 'logro de nivel III: +75');
  const weekAct = v.entries.filter((e) => e.t >= Date.now() - mon * 864e5 - 864e5 && ['train', 'goal', 'mission', 'perfect', 'daily'].includes(e.kind) && new Date(e.t) >= (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })()).reduce((a, e) => a + e.v, 0);
  ok(v.week === weekAct, 'la liga de la semana no suma logros (' + v.week + ' = ' + weekAct + ')');
  // grupo de práctica
  const g = await p.evaluate(() => vxPractice.group());
  ok(g.list.length === 30 && g.list.filter((x) => x.me).length === 1 && g.pos >= 1 && g.pos <= 30, 'liga de práctica: 30 puestos y estás tú (#' + g.pos + ')');
  // cierre de semana: con muchos Voltios la semana pasada, subes
  await p.evaluate(() => { const st = S.vx.lg; st.wk -= 7 * 864e5; st.i = 0; st.res = null; });
  const g2 = await p.evaluate(() => vxPractice.group());
  ok(g2.res && g2.i === (g2.res.pos <= 7 ? 1 : 0) && g2.res.from === 0, 'al cerrar la semana: suben los 7 primeros (#' + (g2.res && g2.res.pos) + ' → liga ' + g2.i + ')');
  await p.evaluate(() => { const st = S.vx.lg; st.wk -= 7 * 864e5; st.i = 3; st.res = null; });
  const g3 = await p.evaluate(() => vxPractice.group());
  ok(g3.res && g3.res.pos >= 26 && g3.i === 2, 'con pocos Voltios en Atenea, bajas a Ares (#' + (g3.res && g3.res.pos) + ')');
  // pantallas
  await p.evaluate(() => { S.stack = ['vx:arena']; R(); }); await p.waitForTimeout(300);
  t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Liga de práctica/.test(t) && /Zona de ascenso/i.test(t) && /Zona de descenso/i.test(t), 'Arena sin cuenta: liga de práctica con zonas de ascenso y descenso');
  await p.evaluate(() => { S.stack = ['vx:volt']; R(); }); await p.waitForTimeout(300);
  t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Cómo se ganan los Voltios/.test(t) && /Últimos Voltios/.test(t) && /\+150/.test(t), 'pantalla de Voltios: tabla y historial');
  await p.evaluate(() => { S.stack = []; tab('prog'); }); await p.waitForTimeout(300);
  t = await p.evaluate(() => document.getElementById('m').innerText);
  const tot = (await p.evaluate(() => vxVolt())).total;
  ok(t.includes(tot.toLocaleString('es') + ' Voltios') || t.includes(tot + ' Voltios'), 'Progreso muestra los mismos Voltios que Inicio (' + tot + ')');
  // subida de rango: aviso
  await p.evaluate(() => { S.vx.rankSeen = 0; S.vx.voltSeen = 0; S.vx.ach = Object.assign(S.vx.ach, { a_10: Date.now(), b_10: Date.now(), c_10: Date.now(), d_10: Date.now() }); R(); });
  await p.waitForTimeout(2500);
  const ib = await p.evaluate(() => (S.vx.inbox || []).map((n) => n.text).join(' | '));
  ok(/Has subido de rango/.test(ib) && /Has ganado \+/.test(ib), 'avisos de Voltios ganados y de subida de rango');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await b.close();
})();
