const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const errs = [];
  const setup = (S0) => { S.onboarded = true; S.hasSeenOnboarding = true; S.vx = Object.assign(S.vx || {}, { proSeen: 1 }); S.demo = false; S.lang = 'es'; S.done = {}; S.streakCount = 12;
    S.routines = [{ id: 3, name: 'Pierna', focus: 'Fuerza', days: 3, ex: [{ i: 0, sets: 3, reps: '8', rest: 90 }, { i: 1, sets: 3, reps: '8', rest: 90 }] }]; S.cur = 3; Object.assign(S, S0 || {}); };

  // ── Navegador ──
  const ctx = await b.newContext({ viewport: { width: 390, height: 1200 }, locale: 'es-ES' });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  await p.evaluate(setup);
  const m = await p.evaluate(() => vxNtMsgs());
  ok(/Pierna/.test(m.plan.body) && /2 ejercicios/.test(m.plan.body), 'plan del día: «Hoy toca: Pierna · 2 ejercicios» → ' + m.plan.body);
  ok(/12 días/.test(m.streak.body) && /peligro/.test(m.streak.title), 'racha en peligro con los días de racha → ' + m.streak.title + ' · ' + m.streak.body);
  // con la app a la vista, el aviso va al buzón (una sola vez al día)
  const inbox = await p.evaluate(() => {
    S.vx.ntSent = {}; const n0 = (S.vx.inbox || []).length;
    const d = new Date(); d.setHours(9, 5, 0, 0); vxNtTick(d); vxNtTick(d);
    const n1 = (S.vx.inbox || []).length;
    const e = new Date(); e.setHours(8, 0, 0, 0); S.vx.ntSent = {}; vxNtTick(e);
    return { added: n1 - n0, early: (S.vx.inbox || []).length - n1, sent: JSON.stringify(S.vx.ntSent) };
  });
  ok(inbox.added === 1, 'a las 9:05 llega el plan del día (una sola vez aunque se compruebe dos veces)');
  ok(inbox.early === 0, 'antes de la hora no sale nada');
  const streak = await p.evaluate(() => {
    const k = lk(Date.now()), n0 = (S.vx.inbox || []).length, d = new Date(); d.setHours(19, 10, 0, 0);
    S.vx.ntSent = {}; S.done = { [k]: 1 }; vxNtTick(d); const trained = (S.vx.inbox || []).length - n0;
    S.vx.ntSent = {}; S.done = {}; vxNtTick(d); const notTrained = (S.vx.inbox || []).length - n0 - trained;
    return { trained, notTrained };
  });
  ok(streak.trained === 0 && streak.notTrained >= 1, 'racha en peligro solo si hoy aún no has entrenado');
  // Ajustes › Notificaciones
  await p.evaluate(() => { S.stack = []; tab('prof'); go('s:notif'); }); await p.waitForTimeout(300);
  let t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Plan del día/.test(t) && /Racha en peligro/.test(t) && /Fin del descanso/.test(t) && /Liga y amigos/.test(t), 'Ajustes › Notificaciones: plan, racha, descanso y liga (próximamente)');
  const times = await p.$$eval('.vx-nt-time input', (els) => els.map((e) => e.value));
  ok(times[0] === '09:00' && times[1] === '19:00', 'horas por defecto 9:00 y 19:00: ' + times.join(' · '));
  await p.fill('.vx-nt-time input >> nth=1', '20:30'); await p.dispatchEvent('.vx-nt-time input >> nth=1', 'change'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.vx.nt.streakAt === '20:30'), 'se puede cambiar la hora (racha a las 20:30)');
  await p.click('.vx-nt-row .tg >> nth=0'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.vx.nt.plan === 0 && !!document.querySelector('.vx-nt-time.off input[disabled]')), 'se puede apagar el plan del día (su hora queda desactivada)');
  const off = await p.evaluate(() => { S.vx.ntSent = {}; const n0 = (S.vx.inbox || []).length; const d = new Date(); d.setHours(9, 5, 0, 0); vxNtTick(d); return (S.vx.inbox || []).length - n0; });
  ok(off === 0, 'apagado: no llega el plan del día');
  ok(await p.evaluate(() => !!document.querySelector('.vx-nt-perm')), 'aviso para activar los permisos del navegador');
  await ctx.close();

  // ── App de móvil (Capacitor simulado) ──
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx2.addInitScript(() => {
    window.__ln = { scheduled: [], cancelled: [] };
    window.Capacitor = { Plugins: { LocalNotifications: {
      getPending: async () => ({ notifications: window.__ln.scheduled.map((n) => ({ id: n.id })) }),
      cancel: async ({ notifications }) => { const ids = notifications.map((n) => n.id); window.__ln.cancelled.push(...ids); window.__ln.scheduled = window.__ln.scheduled.filter((n) => !ids.includes(n.id)); },
      schedule: async ({ notifications }) => { window.__ln.scheduled.push(...notifications); },
      requestPermissions: async () => ({ display: 'granted' }),
    } } };
  });
  const q = await ctx2.newPage(); q.on('pageerror', (e) => errs.push(e.message));
  await q.goto(process.env.APP_URL); await q.waitForTimeout(900);
  const nat = await q.evaluate(async () => {
    S.onboarded = true; S.demo = false; S.lang = 'es'; S.done = {}; S.streakCount = 5; S.vx = Object.assign(S.vx || {}, { nt: { plan: 1, planAt: '09:00', streak: 1, streakAt: '19:00', rest: 1 } });
    await vxNtSchedule(true);
    const a = window.__ln.scheduled.map((n) => ({ id: n.id, at: new Date(n.schedule.at), title: n.title }));
    const k = lk(Date.now()); S.done = { [k]: 1 }; await vxNtSchedule(true);
    const b2 = window.__ln.scheduled.map((n) => ({ id: n.id, at: new Date(n.schedule.at) }));
    const today = new Date().toDateString();
    return { n: a.length, future: a.every((x) => x.at > new Date()), plans: a.filter((x) => x.id < 9200).length, streaks: a.filter((x) => x.id >= 9200).length, hours: [...new Set(a.map((x) => x.at.getHours()))].sort().join(','), todayAfter: b2.filter((x) => x.at.toDateString() === today).length, dup: new Set(b2.map((x) => x.id)).size === b2.length };
  });
  ok(nat.n >= 12 && nat.future, `app: se programan los avisos de los próximos 7 días (${nat.n}), todos en el futuro`);
  ok(nat.hours === '19,9' || nat.hours === '9,19' || nat.hours === '19' || nat.hours === '9', 'app: a las 9:00 y a las 19:00 (' + nat.hours + ')');
  ok(nat.todayAfter === 0 && nat.dup, 'app: al entrenar hoy se quitan los avisos de hoy y no se duplican al reprogramar');
  ok(await q.evaluate(() => { tab('prof'); go('s:notif'); return !document.querySelector('.vx-nt-perm') && !/mientras Volta está abierta/.test(document.getElementById('m').innerText); }), 'app: sin aviso de permisos del navegador');
  await ctx2.close();
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
