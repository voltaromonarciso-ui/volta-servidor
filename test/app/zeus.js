const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1000 }, locale: 'es-ES' });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
  const msg = () => p.evaluate(() => vxZeusMessage());
  await p.evaluate(() => { S.onboarded = true; S.demo = false; S.lang = 'es'; S.userProfile = Object.assign(S.userProfile || {}, { name: 'Lucía', days: 4 }); S.log = []; S.zeusTone = 'auto'; S.tab = 'home'; S.stack = []; R(); });
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('.vx-zeus-card img') && /Lucía/.test(document.querySelector('.vx-zeus-card').innerText)), 'Inicio: Zeus saluda por tu nombre');
  ok(await p.evaluate(() => !document.querySelector('.lion') || getComputedStyle(document.querySelector('.lion')).backgroundImage.includes('webp')), 'el león ya no aparece: Zeus en su lugar');
  // llevas días sin entrenar → preocupado y tono amigo
  await p.evaluate(() => { const t0 = Date.now() - 6 * 864e5; for (let k = 0; k < 5; k++) S.log.push({ ex: 0, w: 60, r: 8, t: t0 + k * 6e4, ty: 'effective' }); R(); });
  let m = await msg(); ok(m.k === 'back' && m.mood === 'preocupado' && m.tone === 'amigo', 'tras días sin entrenar: Zeus preocupado y en tono amigo');
  // entrenó hoy → anima
  await p.evaluate(() => { for (let k = 0; k < 4; k++) S.log.push({ ex: 7, w: 40, r: 8, t: Date.now() - k * 6e4, ty: 'effective' }); R(); });
  m = await msg(); ok(['done', 'pr', 'goal'].includes(m.k) && ['anima', 'guino'].includes(m.mood), 'entrenaste hoy: Zeus lo celebra (' + m.k + ')');
  // tono elegido por el usuario
  await p.evaluate(() => vxZeusTone('exigente'));
  m = await msg(); ok(m.tone === 'exigente', 'tono exigente elegido');
  ok(/exigente/i.test(await p.evaluate(() => vxZeusTonePrompt())) && /insultos/.test(await p.evaluate(() => vxZeusTonePrompt())), 'la IA recibe el tono y la norma de no insultar');
  // botón flotante
  await p.evaluate(() => { S.stack = []; tab('home'); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const f = document.querySelector('.vx-zeus-fab'); return !f.hidden && getComputedStyle(f).display !== 'none'; }), 'botón flotante de Zeus en las pestañas');
  await p.click('.vx-zeus-fab', { force: true }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.stack[S.stack.length - 1] === 'coach' && getComputedStyle(document.querySelector('.vx-zeus-fab')).display === 'none'), 'abre el chat de Zeus y se oculta dentro');
  const t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Zeus, tu coach/.test(t) && /Tono de Zeus/.test(t) && /Automático/.test(t), 'chat: cabecera de Zeus y selector de tono');
  // límite de IA del plan gratis: 1 al día
  const q = await p.evaluate(() => { S.pro = false; S.zeusAI = null; return [vxZeusQuota(), vxZeusQuota()]; });
  ok(q[0] === true && q[1] === false, 'plan gratis: 1 mensaje con IA al día');
  ok(await p.evaluate(() => { S.pro = true; const r = vxZeusQuota() && vxZeusQuota(); S.pro = false; return r; }), 'con Pro, sin límite');
  await p.evaluate(() => { S.lang = 'en'; S.stack = []; tab('home'); }); await p.waitForTimeout(300);
  ok(/Talk to Zeus/.test(await p.evaluate(() => document.getElementById('m').innerText)), 'en inglés');
  ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
  await b.close();
})();
