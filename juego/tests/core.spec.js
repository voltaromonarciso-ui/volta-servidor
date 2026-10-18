// Referencia del comportamiento actual: el ciclo completo del juego jugado como lo
// haría un jugador (botones táctiles en los perfiles móviles, teclado en escritorio).
// Si una de estas pruebas falla tras un cambio, se ha roto un sistema existente.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, invSummary, press, drag, frames, newGame, lookAt, act, prompt, selectSlot, spotOnScreen, isTouch } from './helpers.js';

const count = (page, id, p) => ev(page, ([id, p]) => __G.state.inv.reduce((a, s) => a + (s && s.id === id && (p === undefined || s.p === p) ? s.q : 0), 0), [id, p]);
const slotOf = (page, id) => ev(page, (id) => __G.state.inv.findIndex((s) => s && s.id === id), id);

test.describe.serial('Ciclo completo', () => {
  let page, errors;

  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('menú principal: sin joystick ni botones de partida', async ({}, testInfo) => {
    await page.goto('/');
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await expect(page.locator('#menu')).toBeVisible();
    for (const id of ['#joy', '#btn-jump', '#btn-run', '#btn-crouch', '#btn-phone', '#cash']) await expect(page.locator(id)).toBeHidden();
  });

  test('arranque y partida nueva', async ({}, testInfo) => {
    await newGame(page, testInfo);
    const s = await ev(page, () => ({ money: __G.state.money, quest: __G.state.quest, rep: __G.state.rep, day: __G.state.day, inv: __G.state.inv.filter(Boolean).map((x) => x.id), touch: __G.touch }));
    expect(s).toMatchObject({ money: 350, quest: 0, rep: 0, day: 1, inv: ['caja'] });
    if (isTouch(testInfo)) {
      expect(s.touch).toBe(true);
      for (const id of ['#btn-jump', '#btn-run', '#btn-crouch', '#joy', '#btn-phone', '#cash', '#bank']) await expect(page.locator(id)).toBeVisible();
    }
  });

  test('abrir la caja de Leo dentro de la nave', async ({}, testInfo) => {
    await lookAt(page, -66, -48, 0, -0.3);
    await selectSlot(page, testInfo, 0);
    await expect.poll(() => prompt(page)).toContain('Abrir la caja');
    await act(page, testInfo);
    expect(await ev(page, () => __G.state.flags.boxOpened)).toBe(true);
    expect(await invSummary(page)).toContain('maceta');
    expect(await count(page, 'bolsita')).toBe(10);
  });

  test('inventario: apilar, hueco y quitar', async () => {
    const r = await mod(page, '/src/core/state.js', (m) => {
      const slots = Array(3).fill(null);
      const left = m.slotsAdd(slots, 'bolsita', 120);      // pila máx. 50 → 3 huecos = 150
      const room = m.slotsRoom(slots, 'bolsita');
      const ok = m.slotsRemove(slots, 'bolsita', 70);
      const left2 = m.slotsAdd(slots, 'tierra', 25);         // pila máx. 10, quedan 2 huecos libres... o no
      return { left, room, ok, c: m.slotsCount(slots, 'bolsita'), left2, tierra: m.slotsCount(slots, 'tierra') };
    });
    expect(r).toEqual({ left: 0, room: 30, ok: true, c: 50, left2: 5, tierra: 20 });
  });

  test('comprar en la ferretería', async ({}, testInfo) => {
    await ev(page, () => { __G.state.minute = 10 * 60; __G.act.openShop('ferreteria'); });
    const card = page.locator('.card', { hasText: 'Saco de tierra' });
    await press(page, testInfo, '.card:has-text("Saco de tierra") .qty .qb:last-child');
    await expect(card.locator('.qv')).toHaveText('1');
    await press(page, testInfo, '.panel .foot .btn:not(.ghost)');
    await expect.poll(() => count(page, 'tierra')).toBe(1);
    expect(await ev(page, () => __G.state.money)).toBe(340);
    await ev(page, () => __debug.panels.closePanel(true));
  });

  test('pedir semillas y recogerlas', async () => {
    const r = await ev(page, () => __debug.econ.orderSeeds('brisa', 2));
    expect(r.ok).toBe(true);
    expect(await ev(page, () => __G.state.money)).toBe(280);
    await ev(page, () => __debug.advanceTime(60));
    await ev(page, () => __debug.econ.deadDropActions()[0].fn());
    expect(await count(page, 'semilla', 'brisa')).toBe(2);
  });

  test('plantar, regar, crecer y cosechar', async ({}, testInfo) => {
    await ev(page, () => { __G.state.minute = 10 * 60; });
    await lookAt(page, -70, -55, Math.PI / 2, -0.75);
    await selectSlot(page, testInfo, await slotOf(page, 'maceta'));
    await expect.poll(() => prompt(page)).toContain('Colocar');
    await act(page, testInfo);
    expect(await ev(page, () => __G.state.objects.filter((o) => o.type === 'pot').length)).toBe(1);
    const pot = () => ev(page, () => __G.state.objects.find((o) => o.type === 'pot').data);

    await selectSlot(page, testInfo, await slotOf(page, 'tierra'));
    await expect.poll(() => prompt(page)).toContain('tierra');
    await act(page, testInfo);
    expect((await pot()).soil).toBe(1);

    await selectSlot(page, testInfo, await slotOf(page, 'semilla'));
    await expect.poll(() => prompt(page)).toContain('Plantar');
    await act(page, testInfo);
    expect((await pot()).strain).toBe('brisa');

    await selectSlot(page, testInfo, await slotOf(page, 'regadera'));
    await expect.poll(() => prompt(page)).toContain('Regar');
    await act(page, testInfo);
    expect((await pot()).water).toBeGreaterThan(0.9);

    await ev(page, () => __debug.advanceTime(8 * 60));
    await lookAt(page, -70, -55, Math.PI / 2, -0.75);
    await act(page, testInfo); // regar otra vez
    await ev(page, () => { __G.state.minute = 9 * 60; __debug.advanceTime(10 * 60); });
    await lookAt(page, -70, -55, Math.PI / 2, -0.75);
    expect((await pot()).growth).toBe(1);
    await expect.poll(() => prompt(page)).toContain('Cosechar');
    await act(page, testInfo);
    expect(await count(page, 'cogollo', 'brisa')).toBeGreaterThanOrEqual(8);
    expect(await ev(page, () => !!__G.state.products.brisa)).toBe(true);
  });

  test('envasar a mano en la mesa de empaquetado', async ({}, testInfo) => {
    await ev(page, () => __G.state.inv[9] = { id: 'mesa_emp', q: 1 });
    await lookAt(page, -70, -51, Math.PI / 2, -0.7);
    await selectSlot(page, testInfo, 9);
    await expect.poll(() => prompt(page)).toContain('Colocar');
    await act(page, testInfo);
    await lookAt(page, -70, -51, Math.PI / 2, -0.55);
    await expect.poll(() => prompt(page)).toContain('Usar mesa');
    await act(page, testInfo);
    await press(page, testInfo, '.panel .foot .btn');
    await expect(page.locator('#station.on')).toBeVisible();
    await frames(page, 30);
    const buds0 = await count(page, 'cogollo', 'brisa');
    const step = () => page.locator('#station .st-step').textContent();
    await drag(page, testInfo, await spotOnScreen(page, 'packer', 'pack'), await spotOnScreen(page, 'packer', 'work'));
    await expect.poll(step).toContain('2.');
    await frames(page, 10);
    await drag(page, testInfo, await spotOnScreen(page, 'packer', 'supply'), await spotOnScreen(page, 'packer', 'work'));
    await expect.poll(step).toContain('3.');
    const [wx, wy] = await spotOnScreen(page, 'packer', 'work');
    if (isTouch(testInfo)) await page.touchscreen.tap(wx, wy); else await page.mouse.click(wx, wy);
    await expect.poll(() => count(page, 'bolsa', 'brisa'), { timeout: 60_000 }).toBe(1);
    expect(await count(page, 'cogollo', 'brisa')).toBe(buds0 - 1);
    expect(await count(page, 'bolsita')).toBe(9);
    // el resto, de golpe (misma lógica de inventario)
    await ev(page, () => { while (__G.state.inv.some((s) => s && s.id === 'cogollo') && __debug.stationAuto()); });
    await press(page, testInfo, '#station .st-exit');
    await expect.poll(() => ev(page, () => !__G.station && !__G.uiOpen), { timeout: 120_000 }).toBe(true);
    // se envasa lo que dé de sí lo menor: cogollos o sobres vacíos (empezamos con 10)
    expect(await count(page, 'bolsa', 'brisa')).toBe(Math.min(buds0, 10));
    expect(await count(page, 'cogollo', 'brisa')).toBe(Math.max(0, buds0 - 10));
    expect(await ev(page, () => __G.state.flags.packed)).toBe(true);
  });

  test('economía: precio, aceptación y reputación', async () => {
    const r = await ev(page, () => {
      const E = __debug.econ, prod = __G.state.products.brisa, v = E.prodValue(prod);
      const ch = [0.5, 1, 1.5, 2.5].map((k) => E.acceptChance('chema', prod, v * k));
      const rep0 = __G.state.rep; E.addRep(500); const hi = __G.state.rep; E.addRep(-1000); const lo = __G.state.rep; __G.state.rep = rep0;
      return { ch, hi, lo };
    });
    for (let i = 1; i < r.ch.length; i++) expect(r.ch[i]).toBeLessThan(r.ch[i - 1]);
    expect(r.ch[0]).toBeGreaterThan(0.8);
    expect(r.ch[3]).toBeLessThan(0.3);
    expect([r.hi, r.lo]).toEqual([100, 0]);
  });

  test('vender a un cliente en mano', async ({}, testInfo) => {
    await ev(page, () => { __G.state.minute = 10 * 60; const r = Math.random; Math.random = () => 0.01; __debug.econ.onHour(10); Math.random = r; });
    const deal = await ev(page, () => __G.state.deals.find((d) => d.status === 'offer'));
    expect(deal).toBeTruthy();
    await ev(page, () => __debug.econ.acceptDeal(__G.state.deals.find((d) => d.status === 'offer')));
    await expect.poll(async () => {
      return ev(page, () => { const d = __G.state.deals.find((x) => x.status === 'accepted'); const n = __G.npcs.find((x) => x.id === d.npc); for (let k = 0; k < 200; k++) n.update(0.05, 0.05); return n.mode; });
    }, { timeout: 120_000 }).toBe('wait');
    await ev(page, () => { const d = __G.state.deals.find((x) => x.status === 'accepted'); const n = __G.npcs.find((x) => x.id === d.npc); __G.player.teleport(n.pos.x, n.pos.z + 2.2, 0); __G.player.pitch = -0.1; });
    await frames(page, 4);
    const money0 = await ev(page, () => __G.state.money);
    await act(page, testInfo);
    await press(page, testInfo, 'text=Entregar y cobrar');
    await expect.poll(() => ev(page, () => __G.state.stats.deals)).toBe(1);
    expect(await ev(page, () => __G.state.money)).toBeGreaterThan(money0);
    await ev(page, () => __debug.panels.closePanel(true));
  });

  test('guardar y cargar la partida', async ({}, testInfo) => {
    const snap = () => ev(page, () => {
      const s = __G.state;
      return { money: s.money, day: s.day, rank: s.rank, xp: s.xp, rep: s.rep, quest: s.quest, inv: JSON.stringify(s.inv), objects: s.objects.map((o) => o.type + JSON.stringify(o.data)).join('|'), products: Object.keys(s.products).sort().join(','), stats: JSON.stringify(s.stats), flags: JSON.stringify(s.flags), customers: Object.keys(s.customers).length };
    });
    await ev(page, () => __G.state.minute = 11 * 60);
    // los objetivos se comprueban de vez en cuando: que estén al día antes de comparar
    for (let i = 0; i < 12; i++) await mod(page, '/src/systems/time.js', (m) => m.checkQuests());
    const before = await snap();
    await mod(page, '/src/core/state.js', (m) => m.save());
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await expect(page.locator('#m-continue')).toBeVisible();
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    expect(await snap()).toEqual(before);
    expect(await ev(page, () => __G.objects.size)).toBe(2);
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
