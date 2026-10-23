// La Mansión y el blanqueo: comprar la mansión en la app Inmobiliaria (pestaña de casas de
// lujo), su caja fuerte, los negocios tapadera que blanquean cada mañana con comisión (una sola
// vez por día), las fiestas privadas y los tratos con los socios pagados en dinero limpio.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, press } from './helpers.js';

const F = '/src/systems/fronts.js', J = '/src/systems/mansionjobs.js';
const cash = (page) => ev(page, () => ({ dirty: __G.state.money, clean: __G.state.clean }));
const at = (page, day, minute) => ev(page, ([d, m]) => { __G.state.day = d; __G.state.minute = m; }, [day, minute]);

test.describe.serial('Mansión y blanqueo', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva en la isla', async ({}, testInfo) => {
    test.setTimeout(20 * 60_000);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 600_000 });
    await press(page, testInfo, '#m-new');
    await press(page, testInfo, '.cr-go');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 600_000 });
    await press(page, testInfo, '.panel .btn');
    await ev(page, () => { __G.police.forEach((c) => c.pos.set(900, 0, 900)); __G.paused = true; });
    const m = await ev(page, () => { const p = __G.world.props.mansion; return p && { luxury: p.luxury, price: p.price, owned: !!__G.state.props.mansion }; });
    expect(m).toEqual({ luxury: true, price: 60000, owned: false });
  });

  test('Inmobiliaria: la mansión en la pestaña de casas de lujo y se compra con dinero limpio', async ({}, testInfo) => {
    await ev(page, () => { __G.state.clean = 1000; __G.act.openPhone('realty'); });
    await press(page, testInfo, '.re-tabs .chip:has-text("Casas de lujo")');
    await expect(page.locator('.re-card .re-title')).toHaveText(['La Mansión']);
    await press(page, testInfo, '.re-card');
    // sin saldo no deja
    await expect(page.locator('.re-bar .btn:not(.ghost)')).toBeDisabled();
    await ev(page, () => { __G.state.clean = 70000; });
    await ev(page, async () => { const ph = await import('/src/ui/phone.js'); ph.closePhone(); __G.act.openPhone('realty', 'mansion'); });
    await press(page, testInfo, '.re-bar .btn:not(.ghost)');
    await press(page, testInfo, '.panel .btn:has-text("Comprar")');
    expect(await ev(page, () => !!__G.state.props.mansion)).toBe(true);
    expect((await cash(page)).clean).toBe(10000);
    await ev(page, async () => (await import('/src/ui/phone.js')).closePhone());
  });

  test('la caja fuerte de la mansión guarda efectivo', async () => {
    const r = await ev(page, () => {
      __G.state.money = 900;
      const box = (__G.state.mansionSafe ||= { cash: 0 });
      return box;
    });
    expect(r.cash).toBe(0);
    // abre el panel de la caja (el mismo que el de las cajas fuertes de los muebles)
    await ev(page, () => __G.act.openSafe({ entry: { type: 'safe', data: (__G.state.mansionSafe ||= { cash: 0 }) } }));
    await page.locator('.safe-row').first().locator('.btn', { hasText: '500 $' }).click();
    expect(await ev(page, () => [__G.state.money, __G.state.mansionSafe.cash])).toEqual([400, 500]);
    await ev(page, async () => (await import('/src/ui/panels.js')).closePanel());
  });

  test('la escalera del recibidor se sube andando (por el costado de los primeros peldaños)', async () => {
    const r = await ev(page, async () => {
      const { input } = await import('/src/core/input.js');
      const P = __G.player, MN = __G.world.mansion, cx = (MN.x0 + MN.x1) / 2, cz = (MN.z0 + MN.z1) / 2;
      const walk = (n, yaw) => { P.yaw = yaw; for (let i = 0; i < n; i++) { input.my = 1; input.mx = 0; P.update(1 / 30); } input.my = 0; };
      P.teleport(cx - 2.2, cz - 4.2, 0);
      const g0 = P.pos.y;
      walk(37, 0);             // hacia el fondo: se pisa el primer peldaño
      const foot = P.pos.y - g0;
      walk(140, -Math.PI / 2); // escalera arriba
      const top = P.pos.y - g0;
      walk(40, Math.PI);       // al rellano de la galería
      return { foot, top, landing: P.pos.y - g0, z: P.pos.z - cz };
    });
    expect(r.foot).toBeGreaterThan(0.1);
    expect(r.foot).toBeLessThan(0.6);
    expect(r.top).toBeCloseTo(3.6, 1);
    expect(r.landing).toBeCloseTo(3.6, 1);
    expect(r.z).toBeGreaterThan(-4.9);
  });

  test('negocios tapadera: se compran y sólo blanquean a mano desde el ordenador, con comisión y tope diario', async ({}, testInfo) => {
    await ev(page, () => { __G.state.clean = 15000; __G.state.money = 5000; });
    await at(page, 2, 8 * 60);
    expect((await mod(page, F, (m) => m.buyFront('lavanderia'))).ok).toBe(true);
    expect((await mod(page, F, (m) => m.buyFront('lavanderia'))).ok).toBe(false); // (ya es tuya)
    expect((await cash(page)).clean).toBe(3000);
    // pasa el día y no se blanquea nada solo
    await at(page, 3, 12 * 60);
    expect(await cash(page)).toEqual({ dirty: 5000, clean: 3000 });
    // en el ordenador: 1.000 → 900 limpios (10 % de comisión)
    expect((await mod(page, F, (m) => m.launder('lavanderia', 1000))).ok).toBe(true);
    expect(await cash(page)).toEqual({ dirty: 4000, clean: 3900 });
    // el tope del día (1.500): quedan 500
    expect(await mod(page, F, (m) => m.leftToday('lavanderia'))).toBe(500);
    expect((await mod(page, F, (m) => m.launder('lavanderia', 600))).ok).toBe(false);
    expect((await mod(page, F, (m) => m.launder('lavadero', 100))).ok).toBe(false); // (no es tuyo)
    // al día siguiente el tope se renueva
    await at(page, 4, 10 * 60);
    expect(await mod(page, F, (m) => m.leftToday('lavanderia'))).toBe(1500);
    // sin efectivo no se blanquea
    await ev(page, () => { __G.state.money = 200; });
    expect((await mod(page, F, (m) => m.launder('lavanderia', 300))).ok).toBe(false);
    // el ordenador del despacho de la mansión ofrece el blanqueo
    const pc = await ev(page, () => __G.interactables.some((m) => { const a = m.userData.ia?.actions; const l = typeof a === 'function' ? a() : a || []; return l.some((x) => /ordenador/.test(x.label)); }));
    expect(pc).toBe(true);
    // el programa del ordenador: botón "Todo" y blanquear
    await ev(page, () => { __G.state.money = 2000; __G.act.launder(); });
    await press(page, testInfo, '.panel .chip:has-text("Todo")');
    await press(page, testInfo, '.panel .btn:has-text("Blanquear")');
    expect(await cash(page)).toEqual({ dirty: 500, clean: 3900 + 1350 });
    await ev(page, async () => (await import('/src/ui/panels.js')).closePanel());
  });

  test('Inmobiliaria: los negocios aparecen en su pestaña y la tuya sale como tuya', async ({}, testInfo) => {
    await ev(page, () => __G.act.openPhone('realty'));
    await press(page, testInfo, '.re-tabs .chip:has-text("Negocios")');
    await expect(page.locator('.re-card')).toHaveCount(2);
    await expect(page.locator('.re-card.owned .re-title')).toHaveText(['Lavandería Espuma']);
    await ev(page, async () => (await import('/src/ui/phone.js')).closePhone());
  });

  test('fiesta privada: catering, los invitados llegan a las 22:00 y pagan un 60 % más', async () => {
    // producto envasado para vender
    await ev(page, async () => {
      const e = await import('/src/systems/economy.js');
      e.ensureBaseProduct('brisa');
      __G.state.inv = __G.state.inv.map(() => null);
      __G.state.inv[0] = { id: 'bolsa', q: 10, p: 'brisa' };
      __G.state.money = 1000;
    });
    await at(page, 6, 18 * 60);
    const o = await mod(page, J, (m) => m.organizeParty());
    expect(o.ok).toBe(true);
    expect((await cash(page)).dirty).toBe(600);
    expect((await mod(page, J, (m) => m.organizeParty())).ok).toBe(false); // (una al día)
    // antes de las 22:00 no hay invitados
    const sp = await ev(page, () => __G.world.props.mansion.spawn);
    await ev(page, (sp) => __G.player.teleport(sp.x, sp.z, sp.yaw), sp);
    expect((await mod(page, J, (m) => m.sellToGuests())).ok).toBe(false);
    await at(page, 6, 22 * 60 + 30);
    const value = await ev(page, async () => { const e = await import('/src/systems/economy.js'); return e.prodValue(e.product('brisa')); });
    const r = await mod(page, J, (m) => m.sellToGuests());
    expect(r.ok).toBe(true);
    expect(r.units).toBe(10);
    expect(r.pay).toBe(Math.round(value * 10 * 1.6));
    expect((await cash(page)).dirty).toBe(600 + r.pay);
    expect(await ev(page, () => __G.state.inv.filter(Boolean).length)).toBe(0);
  });

  test('socios: trato al por mayor pagado en dinero limpio, una vez al día', async () => {
    await at(page, 7, 11 * 60);
    const o = await mod(page, J, (m) => m.partnerOffer());
    expect(o && o.units).toBeGreaterThan(0);
    // sin el producto no se cierra
    expect((await mod(page, J, (m) => m.closeDeal())).ok).toBe(false);
    await ev(page, (o) => { __G.state.inv[0] = { id: 'bolsa', q: o.units, p: o.pid }; }, o);
    const before = await cash(page);
    const r = await mod(page, J, (m) => m.closeDeal());
    expect(r.ok).toBe(true);
    const after = await cash(page);
    expect(after.clean - before.clean).toBe(o.total);
    expect(after.dirty).toBe(before.dirty);
    expect(await mod(page, J, (m) => m.partnerOffer())).toBe(null); // (hoy ya se cerró)
  });

  test('guardar y cargar conserva la mansión, los negocios y la caja', async () => {
    const r = await ev(page, async () => {
      const st = await import('/src/core/state.js');
      st.save();
      const s = JSON.parse(localStorage.getItem('bloque9_save_v3'));
      return { mansion: !!s.props?.mansion, fronts: s.fronts, safe: s.mansionSafe?.cash };
    });
    expect(r).toEqual({ mansion: true, fronts: { lavanderia: true }, safe: 500 });
  });

  test('sin errores en la página', async () => {
    expect(errors.filter((e) => !/Failed to fetch|No se pudo cargar/.test(e))).toEqual([]);
  });
});
