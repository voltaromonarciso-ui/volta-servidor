const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1400 }, locale: 'es-ES' });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  // rutina de prueba: banca, sentadilla, press militar, curl, elevaciones laterales, plancha
  const ids = await p.evaluate(() => {
    const f = (n) => EX.findIndex((e) => e[0] === n);
    const names = ['Press de banca', 'Sentadilla', 'Press militar', 'Curl de bíceps', 'Elevaciones laterales', 'Plancha'];
    const ex = names.map((n) => ({ i: f(n), sets: 3, reps: '8-10', rest: 90 }));
    S.onboarded = true; S.hasSeenOnboarding = true; S.vx = Object.assign(S.vx || {}, { proSeen: 1 }); S.demo = false; S.lang = 'es'; S.done = {};
    S.routines = [{ id: 5, name: 'Full body', focus: 'Fuerza', days: 3, ex }]; S.cur = 5; S.stack = []; tab('home');
    return ex.map((c) => c.i);
  });
  ok(ids.every((i) => i >= 0), 'rutina de prueba con ejercicios reales');
  await p.evaluate(() => playToday()); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.stack[S.stack.length - 1] === 'vx:check'), '«Empezar entreno» abre el check-in de Zeus');
  const t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(['tiempo', 'dormido', 'duele', 'entrenas'].every((k) => t.includes(k)), 'una pantalla con las 4 preguntas (tiempo, sueño, dolor, lugar)');
  ok(/Sin cambios/.test(t), 'sin respuestas especiales: «Sin cambios»');

  // reglas
  const R1 = await p.evaluate(() => {
    const L = S.routines[0].ex, pat = (i) => vxPattern(EX[i]), eq = (i) => EX[i][4];
    const time = vxAdapt(L, { t: '20', s: 'ok', d: 'no', l: 'gym' });
    const sleep = vxAdapt(L, { t: '60', s: 'bad', d: 'no', l: 'gym' });
    const home = vxAdapt(L, { t: '60', s: 'ok', d: 'no', l: 'none' });
    const knee = vxAdapt(L, { t: '60', s: 'ok', d: 'knee', l: 'gym' });
    const shoulder = vxAdapt(L, { t: '60', s: 'ok', d: 'shoulder', l: 'gym' });
    return {
      timeN: time.ex.length, timeSets: time.ex.every((c) => c.sets === 3), timeKeep: ['Press de banca', 'Sentadilla', 'Press militar'].every((n) => time.ex.some((c) => EX[c.i][0] === n)),
      sleep: sleep.load, sleepN: sleep.ex.length,
      home: home.ex.every((c) => eq(c.i) === 'Peso corporal'), homeGroups: home.ex.map((c) => EX[c.i][1]).join(','),
      knee: knee.ex.every((c) => !['squat', 'lunge', 'legext', 'jump', 'legpress'].includes(pat(c.i))), kneeN: knee.ex.length,
      shoulder: shoulder.ex.every((c) => !['ohp', 'lateral', 'front'].includes(pat(c.i))),
      uniq: [time, sleep, home, knee, shoulder].every((x) => new Set(x.ex.map((c) => c.i)).size === x.ex.length),
    };
  });
  ok(R1.timeN < 6 && R1.timeSets && R1.timeKeep, `poco tiempo: menos ejercicios (${R1.timeN}), mismas series y se quedan los compuestos`);
  ok(R1.sleep === 0.9 && R1.sleepN === 6, 'dormí mal: mismos ejercicios con −10 % de peso');
  ok(R1.home, 'sin material: todo con peso corporal (' + R1.homeGroups + ')');
  ok(R1.knee && R1.kneeN === 6, 'dolor de rodilla: la sentadilla se cambia por un ejercicio que no carga la rodilla');
  ok(R1.shoulder, 'dolor de hombro: fuera press militar y elevaciones');
  ok(R1.uniq, 'sin ejercicios repetidos tras adaptar');

  // flujo: dormí mal + rodilla → sesión adaptada con aviso y peso propuesto más bajo
  await p.evaluate(() => {
    const sq = EX.findIndex((e) => e[0] === 'Press de banca');
    S.log = [{ ex: sq, w: 100, r: 8, t: Date.now() - 3 * 864e5, ty: 'normal' }];
    vxCkSet('s', 'bad'); vxCkSet('d', 'knee');
  });
  await p.waitForTimeout(200);
  const prev = await p.evaluate(() => document.querySelector('.vx-ck-prev').innerText);
  ok(/Sentadilla/.test(prev) && /10 %/.test(prev) && /profesional/.test(prev), 'la vista previa muestra los cambios y el aviso de consultar a un profesional');
  await p.click('.vx-ck-go'); await p.waitForTimeout(500);
  const w = await p.evaluate(() => ({ top: S.stack[S.stack.length - 1], cur: S.cur, r: S.routines.find((x) => x.id == S.cur), note: !!document.querySelector('.vx-ck-note'), base: S.routines.find((x) => x.id === 5).ex.length, kg: (document.querySelector('.vx-sr-row:not(.warm) input') || {}).value }));
  ok(w.top === 'work' && w.r && w.r.vxAdapt && w.note, 'empieza la sesión adaptada con el aviso «Zeus ha adaptado tu entreno»');
  ok(w.base === 6 && w.r.ex.length === 6, 'tu rutina original no cambia');
  ok(w.kg === '90', 'peso propuesto con −10 % (100 → 90 kg): ' + w.kg);
  ok(await p.evaluate(() => { const r = S.routines; return !V.routines().includes('777000'); }), '«Mis rutinas» no muestra la sesión adaptada');
  // empezar otra rutina borra la adaptada
  await p.evaluate(() => { startR(5); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !S.routines.some((x) => x.vxAdapt) && S.cur === 5), 'al empezar otra rutina, la sesión adaptada desaparece');

  // Saltar: entreno normal
  await p.evaluate(() => { S.stack = []; tab('home'); playToday(); }); await p.waitForTimeout(250);
  await p.click('.vx-ck-skip'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.stack[S.stack.length - 1] === 'work' && S.cur === 5), '«Saltar» empieza tu entreno de siempre');

  // Ajustes › General: desactivar
  await p.evaluate(() => { S.stack = []; tab('prof'); go('s:general'); }); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !!document.querySelector('.vx-ck-set .tg.on[role="switch"]')), 'Ajustes › General: interruptor «Preguntas de Zeus antes de entrenar»');
  await p.click('.vx-ck-set .tg'); await p.waitForTimeout(200);
  await p.evaluate(() => { S.stack = []; tab('home'); playToday(); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.stack[S.stack.length - 1] === 'work'), 'desactivado: «Empezar entreno» va directo al entreno');

  // inglés
  await p.evaluate(() => { S.vx.ckOff = 0; S.lang = 'en'; S.stack = []; tab('home'); playToday(); }); await p.waitForTimeout(300);
  const en = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/How much time/.test(en) && /Skip/.test(en), 'check-in en inglés');
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
