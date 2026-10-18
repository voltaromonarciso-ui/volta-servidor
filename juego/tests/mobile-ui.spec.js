// Auditoría de la interfaz en pantallas de móvil reales (tamaños en puntos CSS).
// Comprueba en cada pantalla del juego que los botones se pueden tocar (≥ 44 pt,
// la guía de Apple; Android pide 48 dp), que no se solapan, que no se salen de la
// pantalla y que respetan las zonas seguras (muesca / isla dinámica / barra de gestos).
// Guarda capturas en tests/.results/ui/.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, newGame, frames } from './helpers.js';

const SCREENS = [
  // nombre, ancho × alto (horizontal), zonas seguras {top,right,bottom,left}
  { name: 'iphone-se', w: 667, h: 375, safe: { top: 0, right: 0, bottom: 0, left: 0 } },
  { name: 'iphone-15-pro', w: 852, h: 393, safe: { top: 0, right: 59, bottom: 21, left: 59 } },
  { name: 'iphone-15-pro-max', w: 932, h: 430, safe: { top: 0, right: 59, bottom: 21, left: 59 } },
  { name: 'android-pequeno', w: 640, h: 360, safe: { top: 0, right: 0, bottom: 0, left: 0 } },
  { name: 'pixel-7', w: 915, h: 412, safe: { top: 0, right: 0, bottom: 0, left: 32 } },
  { name: 'tablet', w: 1180, h: 820, safe: { top: 24, right: 0, bottom: 20, left: 0 } },
];

const MIN = 44;

// Mide los controles visibles y devuelve los problemas encontrados.
function audit(sel, safe) {
  const MIN = 44;
  const out = [];
  const W = innerWidth, H = innerHeight;
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const name = (e) => (e.id ? '#' + e.id : e.className ? '.' + String(e.className).split(' ').filter(Boolean).join('.') : e.tagName) + (e.textContent.trim() ? ` «${e.textContent.trim().slice(0, 18)}»` : '');
  // parte visible: recortada por los contenedores con desplazamiento (lo que queda
  // más abajo en una lista no está «fuera de pantalla», solo hay que desplazarse)
  const clip = (e) => {
    let r = e.getBoundingClientRect();
    let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    for (let p = e.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(auto|scroll|hidden)/.test(cs.overflow + cs.overflowY + cs.overflowX)) {
        const q = p.getBoundingClientRect();
        x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom);
      }
    }
    return x1 - x0 > 2 && y1 - y0 > 2 ? { left: x0, top: y0, right: x1, bottom: y1 } : null;
  };
  const els = [...document.querySelectorAll(sel)].filter(vis);
  const rects = els.map((e) => [e, clip(e), e.getBoundingClientRect()]).filter(([, c]) => c);
  for (const [e, r, full] of rects) {
    if (full.width < MIN - 0.5 || full.height < MIN - 0.5) out.push(`pequeño ${name(e)} ${Math.round(full.width)}×${Math.round(full.height)}`);
    if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) out.push(`fuera de pantalla ${name(e)}`);
    else if (r.left < safe.left - 1 || r.right > W - safe.right + 1 || r.top < safe.top - 1 || r.bottom > H - safe.bottom + 1) out.push(`en zona no segura ${name(e)}`);
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [b, rb] = rects[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 4 && oy > 4) out.push(`solape ${name(a)} / ${name(b)}`);
  }
  return out;
}

const HUD = '#prompt .pp, #cash, #bank, #btn-jump, #btn-run, #btn-crouch, #btn-phone, #btn-pause, #joy, #hotbar .slot, #minimap';
const RIDE = '#btn-brake, #btn-dismount, #cash, #bank, #btn-phone, #btn-pause, #joy, #hotbar .slot, #minimap';
const MOVE = '#prompt .pp, #btn-rotl, #btn-rotr, #btn-cancel, #btn-store, #btn-run, #btn-crouch, #btn-jump, #btn-phone, #btn-pause, #joy, #hotbar .slot, #minimap';
const PANEL = '.panel button, .panel .qb, .panel input, #phone button, #station button, .dress button';

test('interfaz en pantallas de móvil', async ({ browser }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'solo en perfiles táctiles');
  test.setTimeout(45 * 60_000);
  const ctx = await browser.newContext({ ...testInfo.project.use, viewport: { width: 932, height: 430 } });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  const cdp = await ctx.newCDPSession(page);
  await newGame(page, testInfo);
  await ev(page, () => { __G.state.rank = 2; __G.state.minute = 12 * 60; __G.state.money = 1500; });
  await page.evaluate(async () => (await import('/src/systems/riding.js')).buyVehicle('patinete'));
  await page.evaluate(async () => { const m = await import('/src/systems/staff.js'); m.hire('ines', 'nave'); });
  const report = {};
  const dir = testInfo.outputPath('ui');
  for (const sc of SCREENS) {
    await page.setViewportSize({ width: sc.w, height: sc.h });
    try { await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: sc.safe }); } catch { /* Chromium sin soporte */ }
    await ev(page, () => window.dispatchEvent(new Event('resize')));
    await frames(page, 4);
    const issues = {};
    const shot = async (k, sel) => {
      await frames(page, 3);
      await page.screenshot({ path: `${dir}/${sc.name}-${k}.png` });
      const r = await page.evaluate(([s, safe, fn]) => new Function('return ' + fn)()(s, safe), [sel, sc.safe, audit.toString()]);
      if (r.length) issues[k] = r;
    };
    await shot('hud', HUD);
    // con dinero limpio (segunda línea dentro del contador de efectivo): misma auditoría,
    // incluido el propio contador, para ver que no empuja ni tapa ningún control
    await ev(page, () => { __G.state.clean = 123456; });
    await shot('hud-limpio', HUD);
    await ev(page, () => { __G.state.clean = 0; });
    await ev(page, () => __debug.panels.openBag()); await shot('mochila', PANEL); await ev(page, () => __debug.panels.closePanel(true));
    await ev(page, () => __G.act.openShop('ferreteria')); await shot('tienda', PANEL); await ev(page, () => __debug.panels.closePanel(true));
    await ev(page, () => __G.act.openPhone()); await shot('movil', PANEL); await page.evaluate(async () => (await import('/src/ui/phone.js')).closePhone());
    await ev(page, () => __G.act.openPhone('staff')); await shot('personal', PANEL); await page.evaluate(async () => (await import('/src/ui/phone.js')).closePhone());
    // peluquería y probador (vistas con el personaje y panel lateral)
    for (const [k, fn] of [['peluqueria', 'openBarber'], ['probador', 'openClothes']]) {
      await ev(page, (fn) => __G.act[fn](), fn);
      await frames(page, 12);
      await shot(k, PANEL);
      await page.evaluate(async () => (await import('/src/ui/dressing.js')).closeDressing());
      await page.waitForFunction(() => !__G.uiOpen, null, { timeout: 60_000 });
    }
    // tienda de vehículos y conducción (velocímetro, batería, frenar y bajar)
    await ev(page, () => __G.act.openVehicleShop()); await shot('vehiculos', PANEL); await ev(page, () => __debug.panels.closePanel(true));
    await ev(page, () => { const h = __G.interactables.find((o) => o.userData.ia?.actions?.()[0]?.label.startsWith('Montar')); h.userData.ia.actions()[0].fn(); });
    await frames(page, 12);
    await shot('conduciendo', RIDE);
    await ev(page, () => __G.act.forceDismount());
    await frames(page, 4);
    // moviendo un mueble: girar a los dos lados, cancelar y guardar
    await page.evaluate(async () => { const m = await import('/src/systems/objects.js'); __G.player.teleport(-64, -56, Math.PI / 2); __G.player.pitch = -0.55; const o = m.placeObject('safe', -69, -52, 0); m.startMove(o); });
    await frames(page, 6);
    await shot('mover', MOVE);
    await page.evaluate(async () => { const m = await import('/src/systems/objects.js'); const o = m.placement.moving.o; m.cancelPlacement(); m.storeMoving(); __G.objects.forEach((x) => { if (x === o) { m.startMove(o); m.storeMoving(); } }); });
    await frames(page, 4);
    report[sc.name] = issues;
  }
  await ctx.close();
  testInfo.attach('informe', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log(JSON.stringify(report, null, 2));
  expect(errors).toEqual([]);
});
