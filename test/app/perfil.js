const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.env.APP_URL); await p.waitForTimeout(1000);
// usuario real con perfil, una rutina y entrenos
await p.evaluate(() => { S.onboarded = true; S.lang = 'es'; S.demo = false; S.name = 'Lucía'; S.userProfile = { name: 'Lucía', age: 29, gender: 'f', weight: 62, height: 168, level: 'Intermedio', goal: 'mus', goalLabel: 'Ganar masa muscular', days: 4, injuries: ['kn'], allergies: [], equipment: 'gym', lang: 'es', at: 1, plan: 'own' };
  S.routines = [{ id: 7, name: 'Mi rutina', ex: [{ i: 0, s: 3, r: '8-10' }] }]; S.log = S.log || []; S.stack = []; tab('prof'); }); await p.waitForTimeout(700);
const rows = await p.evaluate(() => [...document.querySelectorAll('#m .li .g')].map(g => g.firstChild.textContent.trim()));
ok(rows.includes('Temas') && rows.includes('Cuestionario') && !rows.some(r => /🎨|📝/.test(r)), 'Perfil: Temas y Cuestionario, sin iconos, como las demás opciones: ' + rows.join(' · '));
ok(!(await p.$('.vx-themes')), 'ya no hay tarjeta aparte de Temas');
await p.screenshot({ path: 'shots/perfil-lista.png' });
// Temas
await p.locator('#m .li', { hasText: 'Temas' }).tap(); await p.waitForTimeout(500);
const opts = await p.evaluate(() => [...document.querySelectorAll('.vx-thr')].map(x => x.innerText.replace(/\n/g, ' ') + (x.classList.contains('on') ? ' [✓]' : '')));
ok(opts.length === 4 && /Verde.*Predeterminado.*\[✓\]/.test(opts[0]), 'pantalla Temas con 4 opciones, Verde marcado por defecto: ' + opts.join(' | '));
await p.screenshot({ path: 'shots/perfil-temas.png' });
await p.locator('.vx-thr', { hasText: 'Azul' }).tap(); await p.waitForTimeout(500);
ok(await p.evaluate(() => document.documentElement.dataset.accent === 'azul' && document.querySelector('.vx-thr.on').innerText.includes('Azul')), 'al tocar Azul se aplica al momento y queda marcado');
await p.screenshot({ path: 'shots/perfil-temas-azul.png' });
await p.locator('.vx-thr', { hasText: 'Verde' }).tap(); await p.waitForTimeout(500);
ok(await p.evaluate(() => !document.documentElement.dataset.accent && localStorage.getItem('vx:accent') === null && getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() === '#9dff2e'), 'Verde vuelve al color de serie');
await p.evaluate(() => back()); await p.waitForTimeout(400);
ok(await p.evaluate(() => S.tab === 'prof' && !!document.querySelector('#m .li')), 'atrás vuelve a Perfil');
// Cuestionario
await p.locator('#m .li', { hasText: 'Cuestionario' }).tap(); await p.waitForTimeout(700);
const q = await p.evaluate(() => ({ open: !!document.getElementById('vob'), name: (document.querySelector('#obc input') || {}).value, cancel: !!document.querySelector('#vob [onclick="obEditCancel()"]') }));
ok(q.open && q.name === 'Lucía' && q.cancel, 'se abre el cuestionario con tus respuestas y con ✕ para cancelar: ' + JSON.stringify(q));
await p.screenshot({ path: 'shots/perfil-cuestionario.png' });
await p.tap('#vob [onclick="obEditCancel()"]'); await p.waitForTimeout(700);
ok(await p.evaluate(() => !document.getElementById('vob') && S.name === 'Lucía' && S.routines.length === 1), 'cancelar cierra sin tocar nada');
// editar y terminar
await p.locator('#m .li', { hasText: 'Cuestionario' }).tap(); await p.waitForTimeout(700);
await p.fill('#obc input', 'Lucía M'); await p.evaluate(() => { const i = document.querySelector('#obc input'); i.dispatchEvent(new Event('input', { bubbles: true })); });
for (let k = 0; k < 10; k++) { const dis = await p.evaluate(() => { const n = document.getElementById('obn'); return !n || n.disabled; }); if (dis) { console.log('   paso', k + 1, 'botón desactivado'); break; } await p.tap('#obn'); await p.waitForTimeout(450); }
await p.waitForTimeout(800);
const fin = await p.evaluate(() => ({ open: !!document.getElementById('vob'), name: S.name, up: S.userProfile && S.userProfile.name, inj: S.userProfile && S.userProfile.injuries, plan: S.userProfile && S.userProfile.plan, routines: S.routines.length, onb: S.onboarded, toast: (document.querySelector('.toast') || {}).textContent }));
ok(!fin.open && fin.name === 'Lucía M' && fin.up === 'Lucía M' && fin.routines === 1 && fin.plan === 'own' && fin.onb && JSON.stringify(fin.inj) === '["kn"]', 'al terminar se guardan los cambios y se conservan rutina, plan y lesiones: ' + JSON.stringify(fin));
ok(errs.length === 0, 'sin errores JS ' + JSON.stringify(errs));
await b.close(); })();
