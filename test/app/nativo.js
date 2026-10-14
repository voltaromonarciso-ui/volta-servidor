const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const errs = [];
  // Capacitor simulado (como dentro de la app de Android)
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.addInitScript(() => {
    window.__cap = { exit: 0, listeners: {}, style: null };
    const L = (name) => ({ addListener: (ev, fn) => { window.__cap.listeners[name + ':' + ev] = fn; return Promise.resolve({ remove() {} }); } });
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: {
      App: Object.assign(L('App'), { exitApp: () => { window.__cap.exit++; } }),
      LocalNotifications: Object.assign(L('LN'), { getPending: async () => ({ notifications: [] }), cancel: async () => {}, schedule: async () => {}, checkPermissions: async () => ({ display: 'prompt' }), requestPermissions: async () => ({ display: 'granted' }) }),
      StatusBar: { setStyle: async (o) => { window.__cap.style = o.style; }, setBackgroundColor: async () => {} },
    } };
  });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1500);
  await p.evaluate(() => { S.onboarded = true; S.hasSeenOnboarding = true; S.vx = Object.assign(S.vx || {}, { proSeen: 1 }); S.demo = true; S.lang = 'es'; S.stack = []; tab('prof'); go('s:notif'); });
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.classList.contains('vx-native') && window.__cap.style === 'DARK'), 'dentro de la app: marca «vx-native» y barra de estado oscura');
  ok(await p.evaluate(() => !!window.__cap.listeners['App:backButton'] && !!window.__cap.listeners['LN:localNotificationActionPerformed']), 'escucha el botón atrás y el toque en las notificaciones');
  ok(await p.evaluate(() => !!document.querySelector('.vx-nt-perm button')), 'Ajustes › Notificaciones pide el permiso del móvil si aún no se ha dado');
  await p.click('.vx-nt-perm button'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !document.querySelector('.vx-nt-perm')), 'tras dar el permiso desaparece el aviso');
  // atrás: subpantalla → pestaña → Inicio → salir
  const steps = await p.evaluate(() => { S.stack = []; tab('prof'); go('p:settings'); go('s:notif'); const bb = window.__cap.listeners['App:backButton'], out = [];
    bb(); out.push(S.stack.length + ':' + S.tab); bb(); out.push(S.stack.length + ':' + S.tab); bb(); out.push(S.stack.length + ':' + S.tab + ':' + window.__cap.exit); bb(); out.push(window.__cap.exit); return out; });
  ok(steps[0] === '1:prof' && steps[1] === '0:prof' && steps[2] === '0:home:0' && steps[3] === 1, 'atrás: vuelve paso a paso, luego a Inicio y desde Inicio sale de la app · ' + steps.join(' → '));
  await p.evaluate(() => { go('s:notif'); window.__cap.listeners['LN:localNotificationActionPerformed']({}); });
  ok(await p.evaluate(() => S.tab === 'home' && !S.stack.length), 'tocar una notificación abre Inicio');
  await ctx.close();
  // en el navegador no hace nada
  const q = await b.newPage(); q.on('pageerror', (e) => errs.push(e.message));
  await q.goto(process.env.APP_URL); await q.waitForTimeout(900);
  ok(await q.evaluate(() => !document.documentElement.classList.contains('vx-native')), 'en el navegador no se activa');
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
