// Bloque C de la fase 3: tienda de muebles, colocar/girar/cancelar y mover
// objetos colocados sin perder nada, y el efecto real de cada mueble.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, press, frames, newGame, lookAt, act, prompt, selectSlot, isTouch } from './helpers.js';

const OB = '/src/systems/objects.js';
const money = (page) => ev(page, () => __G.state.money);
const slotOf = (page, id) => ev(page, (id) => __G.state.inv.findIndex((s) => s && s.id === id), id);
const count = (page, id) => ev(page, (id) => __G.state.inv.reduce((a, s) => a + (s && s.id === id ? s.q : 0), 0), id);
const objs = (page, type) => ev(page, (t) => __G.state.objects.filter((o) => o.type === t), type);
const mode = (page) => mod(page, OB, (m) => m.placingMode());
const shot = (page, testInfo, name) => page.screenshot({ path: `tests/.results/mue-${testInfo.project.name}-${name}.png` });

// Botón grande (táctil) o tecla (escritorio)
async function btn(page, testInfo, sel, key) {
  if (isTouch(testInfo)) await press(page, testInfo, sel);
  else await page.keyboard.press(key);
  await frames(page, 3);
}

test.describe.serial('Muebles: tienda, colocar y mover', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva', async ({}, testInfo) => {
    await newGame(page, testInfo);
    // fuera la caja de Leo para tener la mano libre
    await ev(page, () => { __G.state.inv = __G.state.inv.map((s) => (s && s.id === 'caja' ? null : s)); __G.state.minute = 12 * 60; });
    expect(await ev(page, () => __G.state.objects.length)).toBe(0);
  });

  test('tienda: sin dinero no se compra', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 100; });
    await lookAt(page, 105.6, 69.1, -Math.PI / 2, -0.25);
    await expect.poll(() => prompt(page)).toContain('catálogo');
    await act(page, testInfo);
    await expect(page.locator('.panel.shop')).toBeVisible();
    await press(page, testInfo, '.shop .card:has-text("Cama buena") .qb:has-text("+")');
    await press(page, testInfo, '.panel .foot .btn:has-text("Pagar")');
    expect(await money(page)).toBe(100);
    expect(await count(page, 'cama')).toBe(0);
  });

  test('tienda: comprar los cuatro muebles y no cobrar dos veces', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 2000; });
    for (const n of ['Armario', 'Caja fuerte', 'Humidificador']) await press(page, testInfo, `.shop .card:has-text("${n}") .qb:has-text("+")`);
    await press(page, testInfo, '.panel .foot .btn:has-text("Pagar")');
    await expect.poll(() => money(page)).toBe(2000 - 380 - 320 - 450 - 220);
    for (const id of ['cama', 'armario', 'caja_fuerte', 'humidificador']) expect(await count(page, id)).toBe(1);
    // el carrito queda vacío: volver a pagar no cobra
    await press(page, testInfo, '.panel .foot .btn:has-text("Pagar")');
    expect(await money(page)).toBe(630);
    await press(page, testInfo, '.panel .x');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
  });

  test('colocar la cama: vista previa, girar, cancelar sin perderla y colocar', async ({}, testInfo) => {
    await lookAt(page, -64, -56, Math.PI / 2, -0.55);
    await selectSlot(page, testInfo, await slotOf(page, 'cama'));
    await expect.poll(() => prompt(page)).toContain('Colocar cama');
    expect(await mode(page)).toBe('place');
    if (isTouch(testInfo)) for (const b of ['#btn-rotl', '#btn-rotr', '#btn-cancel']) await expect(page.locator(b)).toBeVisible();
    await shot(page, testInfo, 'colocar');
    // vista previa: un fantasma verde donde va la cama
    const ghost = () => ev(page, () => { const g = __G.scene.children.find((o) => o.isMesh && o.material?.transparent && o.material.color?.getHex() === 0x2ecc71 && o.userData.h); return g ? { y: +g.rotation.y.toFixed(3), x: g.position.x } : null; });
    await expect.poll(ghost).not.toBe(null);
    // girar con los botones grandes (a la derecha y a la izquierda)
    await btn(page, testInfo, '#btn-rotr', 'KeyR');
    expect(await mod(page, OB, (m) => +m.placement.rot.toFixed(3))).toBe(+(Math.PI / 2).toFixed(3));
    await btn(page, testInfo, '#btn-rotl', 'KeyQ');
    await btn(page, testInfo, '#btn-rotl', 'KeyQ');
    expect(await mod(page, OB, (m) => +m.placement.rot.toFixed(3))).toBe(+(Math.PI * 1.5).toFixed(3));
    await btn(page, testInfo, '#btn-rotr', 'KeyR');
    // cancelar: no se coloca, no se cobra y sigue en el inventario
    await btn(page, testInfo, '#btn-cancel', 'KeyX');
    expect(await mode(page)).toBe(null);
    await expect.poll(ghost).toBe(null);
    expect(await count(page, 'cama')).toBe(1);
    expect(await objs(page, 'bed')).toEqual([]);
    expect(await money(page)).toBe(630);
    // volver a cogerla en la mano reactiva la colocación
    await selectSlot(page, testInfo, (await slotOf(page, 'cama')) === 0 ? 1 : 0);
    await selectSlot(page, testInfo, await slotOf(page, 'cama'));
    await expect.poll(() => prompt(page)).toContain('Colocar cama');
    await act(page, testInfo);
    await expect.poll(() => objs(page, 'bed').then((l) => l.length)).toBe(1);
    expect(await count(page, 'cama')).toBe(0);
  });

  test('mover una maceta con planta conserva la planta (botones grandes)', async ({}, testInfo) => {
    // maceta con planta a medio crecer, colocada como en una partida real
    const uid = await mod(page, OB, (m) => { const o = m.placeObject('pot', -68, -59.5, 0); Object.assign(o.entry.data, { soil: 2, strain: 'brisa', growth: 0.4, water: 0.8, fert: 1 }); return o.entry.uid; });
    const before = await ev(page, (uid) => JSON.stringify(__G.state.objects.find((o) => o.uid === uid).data), uid);
    await lookAt(page, -65.6, -59.5, Math.PI / 2, -0.62);
    await expect.poll(() => prompt(page)).toContain('Mover');
    await act(page, testInfo, true);
    expect(await mode(page)).toBe('move');
    if (isTouch(testInfo)) await expect(page.locator('#btn-store')).toBeVisible();
    await shot(page, testInfo, 'mover');
    // guardarla con tierra no se permite: se perdería
    await btn(page, testInfo, '#btn-store', 'KeyG');
    expect(await mode(page)).toBe('move');
    expect(await count(page, 'maceta')).toBe(0);
    // a otro sitio, girada
    await lookAt(page, -65.6, -61.5, Math.PI / 2, -0.62);
    await btn(page, testInfo, '#btn-rotr', 'KeyR');
    await expect.poll(() => prompt(page)).toContain('Dejar aquí');
    await act(page, testInfo);
    expect(await mode(page)).toBe(null);
    const after = await ev(page, (uid) => __G.state.objects.find((o) => o.uid === uid), uid);
    expect(JSON.stringify(after.data)).toBe(before);
    expect(after.z).toBeLessThan(-60.6);
    expect(+after.r.toFixed(3)).toBe(+(Math.PI / 2).toFixed(3));
    expect(await ev(page, () => __G.state.objects.filter((o) => o.type === 'pot').length)).toBe(1);
    // la planta y su colisión se han movido de verdad
    const ok = await ev(page, (uid) => { const o = __G.objects.get(uid); return { vis: o.group.visible, gz: o.group.position.z, col: o.col.on && o.col.z0 < o.entry.z && o.col.z1 > o.entry.z, ia: __G.interactables.includes(o.hit) }; }, uid);
    expect(ok).toEqual({ vis: true, gz: after.z, col: true, ia: true });
  });

  test('mover y cancelar deja el objeto exactamente donde estaba', async ({}, testInfo) => {
    const bed = (await objs(page, 'bed'))[0];
    await mod(page, OB, (m, uid) => m.startMove(__G.objects.get(uid)), bed.uid);
    await frames(page, 3);
    await btn(page, testInfo, '#btn-rotr', 'KeyR');
    await btn(page, testInfo, '#btn-cancel', 'KeyX');
    const now = (await objs(page, 'bed'))[0];
    expect(now).toEqual(bed);
    expect(await ev(page, (uid) => __G.objects.get(uid).group.visible, bed.uid)).toBe(true);
  });

  test('validación: fuera de la propiedad o encima de otro objeto no cabe', async () => {
    const r = await mod(page, OB, (m) => {
      const pot = __G.state.objects.find((o) => o.type === 'pot');
      return {
        free: m.canPlace('safe', -69, -52, 0, 'nave'),
        overlap: m.canPlace('safe', pot.x, pot.z, 0, 'nave'),
        outside: m.canPlace('safe', 0, 0, 0, 'nave'),
        notOwned: m.canPlace('safe', -45, 60, 0, 'bungalow'),
      };
    });
    expect(r).toEqual({ free: true, overlap: false, outside: false, notOwned: false });
  });

  test('caja fuerte: guardar dinero y que la multa no lo toque', async ({}, testInfo) => {
    const uid = await mod(page, OB, (m) => { __G.state.inv = __G.state.inv.map((s) => (s && s.id === 'caja_fuerte' ? null : s)); return m.placeObject('safe', -69, -52, 0).entry.uid; });
    await ev(page, (uid) => __G.act.openSafe(__G.objects.get(uid)), uid);
    await press(page, testInfo, '.safe-row:has-text("Guardar") .btn:has-text("Todo")');
    expect(await money(page)).toBe(0);
    expect(await ev(page, (uid) => __G.objects.get(uid).entry.data.cash, uid)).toBe(630);
    await press(page, testInfo, '.safe-row:has-text("Sacar") .btn:has-text("100")');
    expect(await money(page)).toBe(100);
    await press(page, testInfo, '.panel .x');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
    await mod(page, '/src/systems/police.js', (m) => m.arrest(null));
    expect(await money(page)).toBe(0);
    expect(await ev(page, (uid) => __G.objects.get(uid).entry.data.cash, uid)).toBe(530);
    await press(page, testInfo, '.panel .btn');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
    // con dinero dentro no se puede guardar en el inventario
    expect(await mod(page, OB, (m, uid) => m.pickBlock(__G.objects.get(uid)), uid)).toContain('Saca el dinero');
  });

  test('armario: 24 huecos de verdad', async ({}, testInfo) => {
    const uid = await mod(page, OB, (m) => { __G.state.inv = __G.state.inv.map((s) => (s && s.id === 'armario' ? null : s)); return m.placeObject('locker', -69, -54.5, 0).entry.uid; });
    expect(await ev(page, (uid) => __G.objects.get(uid).entry.data.slots.length, uid)).toBe(24);
    await ev(page, () => { __G.state.inv[9] = { id: 'tierra', q: 3 }; });
    await ev(page, (uid) => __G.act.openShelf(__G.objects.get(uid)), uid);
    await expect(page.locator('.panel h2')).toHaveText('Armario de almacenaje');
    await press(page, testInfo, '.mix-col:first-child .inv-cell:not(.empty) >> nth=-1');
    expect(await ev(page, (uid) => __G.objects.get(uid).entry.data.slots.filter(Boolean).length, uid)).toBe(1);
    await press(page, testInfo, '.panel .x');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
  });

  test('humidificador: el agua dura más cerca de él', async () => {
    const r = await mod(page, OB, (m) => {
      __G.state.inv = __G.state.inv.map((s) => (s && s.id === 'humidificador' ? null : s));
      const near = m.placeObject('pot', -72, -60, 0), far = m.placeObject('pot', -72, -52, 0);
      m.placeObject('humid', -73.5, -60, 0);
      for (const o of [near, far]) Object.assign(o.entry.data, { soil: 1, water: 1 });
      m.simulateObjects(300);
      return { near: near.entry.data.water, far: far.entry.data.water };
    });
    expect(r.far).toBeCloseTo(0.5, 2);
    expect(r.near).toBeCloseTo(1 - 300 * 0.6 / 600, 2);
  });

  test('cama: duermes y despiertas a las 6:00', async ({}, testInfo) => {
    const bed = (await objs(page, 'bed'))[0];
    const day = await ev(page, () => __G.state.day);
    await ev(page, () => { __G.state.minute = 22 * 60; });
    await ev(page, (uid) => { const o = __G.objects.get(uid); o.hit.userData.ia.actions().find((a) => a.label === 'Dormir').fn(); }, bed.uid);
    await expect(page.locator('.panel')).toBeVisible({ timeout: 60_000 });
    expect(await ev(page, () => [__G.state.day, __G.state.minute])).toEqual([day + 1, 6 * 60]);
    await press(page, testInfo, '.panel .btn');
    await expect.poll(() => ev(page, () => !__G.uiOpen)).toBe(true);
  });

  test('guardar y cargar conserva muebles, posiciones y contenido', async ({}, testInfo) => {
    await mod(page, '/src/core/state.js', (m) => m.save());
    const before = await ev(page, () => JSON.stringify(__G.state.objects));
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    const after = await ev(page, () => JSON.stringify(__G.state.objects));
    expect(after).toEqual(before);
    expect(await ev(page, () => __G.objects.size)).toBe(JSON.parse(before).length);
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
