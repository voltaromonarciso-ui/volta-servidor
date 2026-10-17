// Bloque B de la fase 3: tienda de vehículos, bici, patinete y conducción.
// Se juega con el dedo en los perfiles táctiles (joystick y botones reales) y
// con el teclado en escritorio; las reglas se comprueban con los módulos del juego.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, press, frames, newGame, lookAt, act, prompt, isTouch } from './helpers.js';

const RD = '/src/systems/riding.js';
const money = (page) => ev(page, () => __G.state.money);
const speed = (page) => mod(page, RD, (m) => m.riding()?.speed ?? null);
const veh = (page, type) => ev(page, (t) => __G.state.vehicles.find((v) => v.type === t) || null, type);
const owned3D = (page) => ev(page, () => __G.scene.children.filter((o) => o.userData.wheels && !o.userData.display).length);
const shot = (page, testInfo, name) => page.screenshot({ path: `tests/.results/veh-${testInfo.project.name}-${name}.png` });

// Mantener el joystick (dedo real) o una tecla (escritorio) mientras se cumple algo.
async function hold(page, testInfo, dir, until, timeout = 120_000) {
  let cdp = null;
  if (isTouch(testInfo)) {
    const r = await page.locator('#joy').boundingBox();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const dx = dir === 'left' ? -60 : dir === 'right' ? 60 : 0, dy = dir === 'up' ? -60 : dir === 'down' ? 60 : 0;
    cdp = await page.context().newCDPSession(page);
    const pt = (x, y) => [{ x, y, id: 7, radiusX: 8, radiusY: 8, force: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(cx, cy) });
    for (let i = 1; i <= 3; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(cx + dx * i / 3, cy + dy * i / 3) });
  } else {
    await page.keyboard.down({ up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }[dir]);
  }
  try { await expect.poll(until, { timeout, intervals: [100] }).toBe(true); }
  finally {
    if (cdp) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); }
    else await page.keyboard.up({ up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }[dir]);
  }
}

// Frenar: botón grande mantenido con el dedo, o Espacio en escritorio.
async function brakeHold(page, testInfo, until) {
  if (isTouch(testInfo)) {
    const r = await page.locator('#btn-brake').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const pt = [{ x: r.x + r.width / 2, y: r.y + r.height / 2, id: 9, radiusX: 8, radiusY: 8, force: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt });
    try { await expect.poll(until, { timeout: 60_000, intervals: [100] }).toBe(true); }
    finally { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); }
  } else {
    await page.keyboard.down('Space');
    try { await expect.poll(until, { timeout: 60_000, intervals: [100] }).toBe(true); }
    finally { await page.keyboard.up('Space'); }
  }
}

async function dismountBtn(page, testInfo) {
  if (isTouch(testInfo)) await press(page, testInfo, '#btn-dismount');
  else await page.keyboard.press('KeyE');
  await frames(page, 3);
}

// Mirar un vehículo aparcado y montar con la acción real.
async function mountAt(page, testInfo, type) {
  const e = await veh(page, type);
  // de pie a 2 m a su izquierda, mirándolo
  const sx = e.x - Math.cos(e.yaw) * 2, sz = e.z + Math.sin(e.yaw) * 2;
  const yaw = Math.atan2(-(e.x - sx), -(e.z - sz));
  await lookAt(page, sx, sz, yaw, -0.4);
  await expect.poll(() => prompt(page)).toContain('Montar');
  await act(page, testInfo);
  await expect.poll(() => ev(page, () => document.body.classList.contains('riding'))).toBe(true);
}

test.describe.serial('Vehículos: tienda, bici y patinete', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva sin vehículos', async ({}, testInfo) => {
    await newGame(page, testInfo);
    expect(await ev(page, () => __G.state.vehicles)).toEqual([]);
    expect(await owned3D(page)).toBe(0);
  });

  test('tienda: sin dinero no se compra (táctil)', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 50; __G.state.minute = 12 * 60; });
    await lookAt(page, 105.6, 45.1, -Math.PI / 2, -0.25);
    await expect.poll(() => prompt(page)).toContain('bicis');
    await act(page, testInfo);
    await expect(page.locator('.vshop')).toBeVisible();
    await press(page, testInfo, '.vshop .card:has-text("Bicicleta") .btn');
    expect(await money(page)).toBe(50);
    expect(await ev(page, () => __G.state.vehicles.length)).toBe(0);
  });

  test('tienda: comprar la bici una sola vez', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 1000; });
    await press(page, testInfo, '.panel .x');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
    await frames(page, 5); // la mira vuelve a detectar el mostrador
    await act(page, testInfo);
    await expect(page.locator('.vshop')).toBeVisible();
    await press(page, testInfo, '.vshop .card:has-text("Bicicleta") .btn');
    await expect.poll(() => money(page)).toBe(820);
    await expect(page.locator('.vshop .card:has-text("Bicicleta")')).toContainText('Ya es tuyo');
    const again = await mod(page, RD, (m) => m.buyVehicle('bici'));
    expect(again.ok).toBe(false);
    expect(await money(page)).toBe(820);
    expect(await ev(page, () => __G.state.vehicles.filter((v) => v.type === 'bici').length)).toBe(1);
    expect(await owned3D(page)).toBe(1);
    await press(page, testInfo, '.panel .x');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
  });

  test('bici: montar, acelerar, girar, frenar y bajar', async ({}, testInfo) => {
    await mountAt(page, testInfo, 'bici');
    if (isTouch(testInfo)) {
      await expect(page.locator('#btn-brake')).toBeVisible();
      await expect(page.locator('#btn-dismount')).toBeVisible();
      await expect(page.locator('#btn-use')).toBeHidden();
    }
    // tercera persona: la cámara está detrás y por encima de la bici
    await frames(page, 40);
    const cam = await ev(page, () => { const e = __G.state.vehicles[0]; const c = __G.camera.position; return { back: (e.z - c.z), up: c.y }; });
    expect(cam.back).toBeGreaterThan(1.2);
    expect(cam.up).toBeGreaterThan(1.7);
    expect(await ev(page, () => __G.avatar.group.visible)).toBe(true);
    // acelerar con el joystick
    const z0 = (await veh(page, 'bici')).z;
    await hold(page, testInfo, 'up', async () => (await speed(page)) > 4);
    await shot(page, testInfo, 'bici');
    expect((await veh(page, 'bici')).z).toBeGreaterThan(z0 + 0.5);
    // nunca supera su velocidad máxima
    expect(await speed(page)).toBeLessThanOrEqual(8.61);
    // girar
    const y0 = (await veh(page, 'bici')).yaw;
    await hold(page, testInfo, 'right', async () => Math.abs((await veh(page, 'bici')).yaw - y0) > 0.15);
    // frenar hasta parar
    await brakeHold(page, testInfo, async () => (await speed(page)) === 0);
    // bajar
    await dismountBtn(page, testInfo);
    await expect.poll(() => mod(page, RD, (m) => m.riding() === null), { timeout: 60_000 }).toBe(true);
    const r = await ev(page, () => { const e = __G.state.vehicles[0], p = __G.player.pos; return { d: Math.hypot(e.x - p.x, e.z - p.z), riding: document.body.classList.contains('riding'), av: __G.avatar.group.visible }; });
    expect(r.d).toBeGreaterThan(0.5);
    expect(r.d).toBeLessThan(2);
    expect(r.riding).toBe(false);
    expect(r.av).toBe(false);
    // el vehículo se queda donde lo dejaste
    const e = await veh(page, 'bici');
    expect(await ev(page, (e) => { const g = __G.scene.children.find((o) => o.userData.wheels && !o.userData.display); return Math.hypot(g.position.x - e.x, g.position.z - e.z); }, e)).toBeLessThan(0.01);
  });

  test('bici: no atraviesa paredes y no te bajas sin sitio', async ({}, testInfo) => {
    // apuntando al escaparate de la tienda (pared en x = 97,75)
    await mod(page, RD, (m) => m.moveVehicle('bici', { x: 94, z: 41.2, yaw: Math.PI / 2 }));
    await mountAt(page, testInfo, 'bici');
    const t0 = await ev(page, () => __G.time);
    await hold(page, testInfo, 'up', async () => (await ev(page, () => __G.time)) > t0 + 3, 300_000);
    const x = (await veh(page, 'bici')).x;
    expect(x).toBeLessThan(97.75 - 0.3);
    await brakeHold(page, testInfo, async () => (await speed(page)) === 0);
    // si no hay hueco a ningún lado, no se baja
    const blocked = await mod(page, RD, (m) => { const r = __G.world.resolve; __G.world.resolve = (p) => { p.x += 1; return true; }; const ok = m.dismount(); __G.world.resolve = r; return ok; });
    expect(blocked).toBe(false);
    expect(await mod(page, RD, (m) => !!m.riding())).toBe(true);
    await dismountBtn(page, testInfo);
    await expect.poll(() => mod(page, RD, (m) => m.riding() === null), { timeout: 60_000 }).toBe(true);
  });

  test('recuperar: grúa de pago y no mientras la usas', async ({}, testInfo) => {
    const m0 = await money(page);
    await ev(page, () => { const e = __G.state.vehicles[0]; e.x = -40; e.z = 70; });
    await ev(page, () => { __G.state.money = 10; });
    expect((await mod(page, RD, (m) => m.recoverVehicle('bici'))).ok).toBe(false);
    await ev(page, (m0) => { __G.state.money = m0; }, m0);
    expect((await mod(page, RD, (m) => m.recoverVehicle('bici'))).ok).toBe(true);
    expect(await money(page)).toBe(m0 - 15);
    const e = await veh(page, 'bici');
    expect([e.x, e.z]).toEqual([95.4, 41.2]);
    await mountAt(page, testInfo, 'bici');
    expect((await mod(page, RD, (m) => m.recoverVehicle('bici'))).ok).toBe(false);
    expect(await money(page)).toBe(m0 - 15);
    await dismountBtn(page, testInfo);
    await expect.poll(() => mod(page, RD, (m) => m.riding() === null), { timeout: 60_000 }).toBe(true);
  });

  test('patinete: comprar, gastar batería hasta quedarse sin ella', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 600; __G.state.minute = 12 * 60; });
    await lookAt(page, 105.6, 45.1, -Math.PI / 2, -0.25);
    await act(page, testInfo);
    await press(page, testInfo, '.vshop .card:has-text("Patinete") .btn');
    await expect.poll(() => money(page)).toBe(80);
    expect((await veh(page, 'patinete')).battery).toBe(1);
    await press(page, testInfo, '.panel .x');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
    await mountAt(page, testInfo, 'patinete');
    await expect(page.locator('#ride-bat')).toBeVisible();
    // gastar: con carga para unos pocos metros
    await ev(page, () => { __G.state.vehicles.find((v) => v.type === 'patinete').battery = 0.002; });
    await hold(page, testInfo, 'up', async () => (await veh(page, 'patinete')).battery === 0);
    await shot(page, testInfo, 'patinete');
    await expect(page.locator('#ride-bat span')).toHaveText('Sin batería');
    // sin batería no acelera: se va parando aunque sigas dando gas
    await hold(page, testInfo, 'up', async () => (await speed(page)) < 0.05, 120_000);
    await dismountBtn(page, testInfo);
    await expect.poll(() => mod(page, RD, (m) => m.riding() === null), { timeout: 60_000 }).toBe(true);
    // y ya no deja montar para conducir
    const e = await veh(page, 'patinete');
    const sx = e.x - Math.cos(e.yaw) * 2, sz = e.z + Math.sin(e.yaw) * 2;
    await lookAt(page, sx, sz, Math.atan2(-(e.x - sx), -(e.z - sz)), -0.4);
    await expect.poll(() => prompt(page)).toContain('Sin batería');
  });

  test('patinete: carga en tu nave y no en la calle', async () => {
    const out = await ev(page, async () => {
      const e = __G.state.vehicles.find((v) => v.type === 'patinete');
      __debug.advanceTime(60);
      await new Promise((r) => setTimeout(r, 2500));
      return e.battery;
    });
    expect(out).toBe(0);
    const inside = await ev(page, async () => {
      const e = __G.state.vehicles.find((v) => v.type === 'patinete');
      const sp = __G.world.props.nave.spawn;
      (await import('/src/systems/riding.js')).moveVehicle('patinete', { x: sp.x + 1, z: sp.z });
      await new Promise((r) => setTimeout(r, 1500));
      __debug.advanceTime(60);
      await new Promise((r) => setTimeout(r, 2500));
      return e.battery;
    });
    expect(inside).toBeGreaterThan(0.45);
    expect(inside).toBeLessThan(0.6);
    // vuelve a la acera de la tienda para el resto de pruebas
    await mod(page, RD, async (m) => { __G.state.money += 15; m.recoverVehicle('patinete'); });
  });

  test('policía: el alto en bici y salir pedaleando es una fuga', async ({}, testInfo) => {
    await ev(page, () => { __G.state.minute = 12 * 60; });
    await mod(page, RD, (m) => m.moveVehicle('bici', { x: 95.4, z: 58, yaw: 0 }));
    await mountAt(page, testInfo, 'bici');
    // parado en la bici: una patrulla detrás, mirándote; el azar fuerza el alto
    await ev(page, () => {
      const p = __G.player.pos, c = __G.police[0];
      c.pos.set(p.x, 0, p.z - 7); c.g.position.copy(c.pos);
      c.mode = 'patrol'; c.friskCooldown = 0;
      c.__notices = c.notices; c.notices = () => true; // el cono de visión no es lo que se prueba aquí
      window.__rnd = Math.random; Math.random = () => 0;
    });
    await expect.poll(() => ev(page, () => __G.police[0].mode), { timeout: 60_000 }).toBe('approach');
    await ev(page, () => { Math.random = window.__rnd; const c = __G.police[0]; c.notices = c.__notices; });
    expect(await ev(page, () => __G.uiOpen)).toBe(false);
    await hold(page, testInfo, 'up', async () => (await mod(page, '/src/systems/police.js', (m) => m.wanted.level)) > 0, 120_000);
    expect(await ev(page, () => __G.uiOpen)).toBe(false);
    // si te pillan, el vehículo se queda donde estaba y tú vas a comisaría
    const at = await veh(page, 'bici');
    await mod(page, '/src/systems/police.js', (m) => m.arrest(null));
    expect(await mod(page, RD, (m) => m.riding())).toBe(null);
    expect(await ev(page, () => document.body.classList.contains('riding'))).toBe(false);
    const after = await veh(page, 'bici');
    expect(Math.hypot(after.x - at.x, after.z - at.z)).toBeLessThan(1.5);
    await press(page, testInfo, '.panel .btn');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
    await ev(page, () => __G.police.forEach((c) => c.pos.set(300, 0, 300)));
    // correr en bici hace que te paren más que ir andando
    const f = await mod(page, '/src/systems/police.js', (m) => [m.friskChance(0, true, 0), m.friskChance(0, false, 0)]);
    expect(f[0]).toBeGreaterThan(f[1]);
  });

  test('guardar y cargar: vehículos, batería y sin duplicados', async ({}, testInfo) => {
    await ev(page, () => { __G.state.vehicles.find((v) => v.type === 'patinete').battery = 0.37; });
    await mod(page, '/src/core/state.js', (m) => m.save());
    const before = await ev(page, () => JSON.stringify(__G.state.vehicles.map(({ t, ...v }) => v)));
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    const after = await ev(page, () => JSON.stringify(__G.state.vehicles.map(({ t, ...v }) => v)));
    expect(after).toEqual(before);
    expect(await owned3D(page)).toBe(2);
    expect(await mod(page, RD, (m) => m.riding())).toBe(null);
  });

  test('cargar con un vehículo en un sitio imposible lo devuelve a la tienda', async ({}, testInfo) => {
    await ev(page, () => {
      __G.paused = true;
      const k = 'bloque9_save_v3', s = JSON.parse(localStorage.getItem(k));
      const b = s.vehicles.find((v) => v.type === 'bici'); b.x = 110.1; b.z = 46; // dentro de la pared de la tienda
      const p = s.vehicles.find((v) => v.type === 'patinete'); p.x = null;
      s.vehicles.push({ ...b, uid: 999 }); // un duplicado no se carga
      localStorage.setItem(k, JSON.stringify(s));
    });
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    expect(await ev(page, () => __G.state.vehicles.map((v) => [v.type, v.x, v.z]))).toEqual([['bici', 95.4, 41.2], ['patinete', 95.4, 50.8]]);
    expect(await owned3D(page)).toBe(2);
  });

  test('partidas antiguas sin vehículos siguen cargando', async ({}, testInfo) => {
    await ev(page, () => {
      __G.paused = true;
      const k = 'bloque9_save_v3', s = JSON.parse(localStorage.getItem(k));
      delete s.vehicles;
      localStorage.setItem(k, JSON.stringify(s));
    });
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    expect(await ev(page, () => __G.state.vehicles)).toEqual([]);
    expect(await owned3D(page)).toBe(0);
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
