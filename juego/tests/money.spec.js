// Bloque B · Etapa 1: separación del dinero (efectivo sucio / dinero limpio).
// Se comprueban las reglas con los módulos reales del juego y el reloj del juego,
// con la partida en pausa para que el tiempo solo avance cuando la prueba lo pide.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, press, frames, newGame, shopAdd } from './helpers.js';

const EC = '/src/systems/economy.js';
const KEY = 'bloque9_save_v3';
const bal = (page) => ev(page, () => ({ dirty: __G.state.money, clean: __G.state.clean }));
const ledgerN = (page) => ev(page, () => __G.state.ledger.length);
const advance = (page, min) => ev(page, (m) => __debug.advanceTime(m), min);
const at = (page, day, minute) => ev(page, ([d, m]) => { __G.state.day = d; __G.state.minute = m; for (const e of __G.state.employees || []) { e.clock = (d - 1) * 1440 + m; e.wake = null; } }, [day, minute]);
async function reloadGame(page, testInfo) {
  await page.reload();
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
  await press(page, testInfo, '#m-continue');
  await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
  await ev(page, () => { __G.paused = true; });
}

test.describe.serial('Dinero sucio y limpio', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva: versión 4, 350 $ de efectivo, 0 $ limpio, sin historial', async ({}, testInfo) => {
    await newGame(page, testInfo);
    await ev(page, () => { __G.paused = true; });
    expect(await ev(page, () => [__G.state.version, __G.state.money, __G.state.clean, __G.state.ledger.length])).toEqual([4, 350, 0, 0]);
    await frames(page, 2);
    await expect(page.locator('#h-clean')).toHaveText('0');
  });

  test('migración v3 → v4: el dinero pasa entero a efectivo y no se pierde nada', async ({}, testInfo) => {
    // partida «antigua» con de todo: bungalow, caja fuerte con efectivo, empleado con deuda,
    // vehículo, muebles, inventario y una mezcladora retirada (se reembolsa 400 $ una vez)
    const v3 = await ev(page, async () => {
      const O = await import('/src/systems/objects.js');
      const R = await import('/src/systems/riding.js');
      const S = await import('/src/systems/staff.js');
      const s = __G.state;
      s.money = 100000; s.rank = 2;
      R.buyVehicle('bici');
      S.hire('ines', 'nave');
      const safe = O.placeObject('safe', -69, -52, 0); safe.entry.data.cash = 300;
      O.placeObject('shelf', -72, -60, 0).entry.data.slots[0] = { id: 'tierra', q: 7 };
      s.employees[0].debt = 160; s.employees[0].owed = 1;
      s.props.bungalow = true; s.home = 'bungalow';
      s.inv[3] = { id: 'bolsa', q: 4, p: 'brisa' };
      s.money = 1234;
      const old = JSON.parse(JSON.stringify(s));
      old.version = 3; delete old.clean; delete old.ledger; delete old.txKeys; delete old.txSeq;
      old.objects.push({ uid: 9999, type: 'mixer', x: -75, z: -50, r: 0, data: {} });
      __G.paused = true;
      localStorage.setItem('bloque9_save_v3', JSON.stringify(old));
      return old;
    });
    await reloadGame(page, testInfo);
    const s = await ev(page, () => JSON.parse(JSON.stringify(__G.state)));
    expect([s.version, s.money, s.clean]).toEqual([4, 1234 + 400, 0]);
    expect(s.migratedV4).toMatchObject({ from: 3, money: 1234 });
    // el único apunte es el reembolso real de la mezcladora (no se inventa historial)
    expect(s.ledger.map((e) => [e.reason, e.amt, e.acc])).toEqual([['reembolso mezcladora', 400, 'dirty']]);
    expect(s.props.bungalow).toBe(true);
    expect(s.objects.find((o) => o.type === 'safe').data.cash).toBe(300);
    expect(s.objects.find((o) => o.type === 'shelf').data.slots[0]).toEqual({ id: 'tierra', q: 7 });
    expect(s.objects.some((o) => o.type === 'mixer')).toBe(false);
    expect(s.employees.map((e) => [e.cid, e.debt, e.owed])).toEqual([['ines', 160, 1]]);
    expect(s.vehicles.map((v) => v.type)).toEqual(['bici']);
    expect(s.inv[3]).toEqual({ id: 'bolsa', q: 4, p: 'brisa' });
    for (const k of ['day', 'rank', 'xp', 'quest', 'stats', 'wardrobe', 'style', 'customers']) expect(s[k]).toEqual(v3[k]);
    // la hora se conserva (solo corre lo que pasa entre cargar y pausar la prueba)
    expect(s.minute - v3.minute).toBeGreaterThanOrEqual(0);
    expect(s.minute - v3.minute).toBeLessThan(5);
    // guardar y cargar otra vez: ni se repite la migración ni el reembolso
    await mod(page, '/src/core/state.js', (m) => m.save());
    await reloadGame(page, testInfo);
    expect(await ev(page, () => [__G.state.version, __G.state.money, __G.state.clean, __G.state.ledger.length])).toEqual([4, 1634, 0, 1]);
    await mod(page, '/src/core/state.js', (m) => m.save());
    await reloadGame(page, testInfo);
    expect(await ev(page, () => [__G.state.money, __G.state.ledger.length])).toEqual([1634, 1]);
  });

  test('saldo dañado en la partida: se repara a 0 y queda anotado (nunca se inventa)', async ({}, testInfo) => {
    await ev(page, () => { const s = JSON.parse(localStorage.getItem('bloque9_save_v3')); s.clean = 'mucho'; localStorage.setItem('bloque9_save_v3', JSON.stringify(s)); });
    await reloadGame(page, testInfo);
    const r = await ev(page, () => [__G.state.money, __G.state.clean, __G.state.ledger.at(-1).kind, __G.state.ledger.at(-1).acc]);
    expect(r).toEqual([1634, 0, 'ajuste', 'clean']);
  });

  test('importes inválidos, decimales y saldo insuficiente no tocan nada', async () => {
    const r = await mod(page, EC, (m) => {
      const s = __G.state; s.money = 100; s.clean = 50;
      const n0 = s.ledger.length, earned = s.stats.earned;
      const bad = [NaN, Infinity, -Infinity, -5, 0, 0.4, '10', null].map((v) => m.earn('dirty', v, 'prueba').ok);
      const after = [s.money, s.clean, s.ledger.length - n0, s.stats.earned - earned];
      const dec = m.earn('dirty', 1.6, 'prueba'); // se redondea a 2
      const over = m.spend('dirty', 1000, 'prueba');
      const negOther = m.spend('dirty', 1000, 'semillas', { allowNegative: true }); // la excepción es SOLO el alquiler
      const cleanForDirty = m.spend('clean', 60, 'prueba');
      return { bad, after, dec: [dec.ok, dec.amount], money: s.money, over: over.ok, negOther: negOther.ok, cleanForDirty: cleanForDirty.ok, clean: s.clean };
    });
    expect(r.bad).toEqual([false, false, false, false, false, false, false, false]);
    expect(r.after).toEqual([100, 50, 0, 0]);
    expect(r.dec).toEqual([true, 2]);
    expect(r.money).toBe(102);
    expect([r.over, r.negOther, r.cleanForDirty, r.clean]).toEqual([false, false, false, 50]);
  });

  test('historial limitado a 100 y claves que siguen protegiendo', async () => {
    const r = await mod(page, EC, (m) => {
      for (let i = 0; i < 150; i++) m.earn('dirty', 1, 'prueba', { key: `prueba:${i}` });
      const inLedger = __G.state.ledger.some((e) => e.key === 'prueba:0');
      const again = m.earn('dirty', 1, 'prueba', { key: 'prueba:0' });
      return { n: __G.state.ledger.length, inLedger, again: again.ok, code: again.code };
    });
    expect(r).toEqual({ n: 100, inLedger: false, again: false, code: 'duplicada' });
  });

  test('cada compra sale del efectivo y nunca del dinero limpio', async ({}, testInfo) => {
    await ev(page, () => { const s = __G.state; s.money = 5000; s.clean = 7000; s.minute = 12 * 60; s.rank = 3; });
    const r = await ev(page, async () => {
      const A = await import('/src/systems/appearance.js');
      const R = await import('/src/systems/riding.js');
      const E = await import('/src/systems/economy.js');
      const S = await import('/src/systems/staff.js');
      const out = [];
      const step = (name, fn) => { const m0 = __G.state.money; const ok = fn(); out.push([name, !!(ok?.ok ?? ok), m0 - __G.state.money, __G.state.ledger.at(-1).reason]); };
      step('ropa', () => A.buyClothes('chaqueta_camel'));
      step('peluquería', () => A.barberApply({ hair: 'rubio', beard: 'none' }));
      step('patinete', () => R.buyVehicle('patinete'));
      step('grúa', () => R.recoverVehicle('patinete'));
      step('semillas', () => E.orderSeeds('brisa', 2));
      step('contratación', () => S.hire('nerea', 'nave'));
      const inés = __G.state.employees.find((e) => e.cid === 'ines');
      step('deuda', () => S.payDebt(inés.uid));
      return { out, clean: __G.state.clean };
    });
    expect(r.out.map(([n, ok]) => [n, ok])).toEqual([['ropa', true], ['peluquería', true], ['patinete', true], ['grúa', true], ['semillas', true], ['contratación', true], ['deuda', true]]);
    expect(r.out.map(([, , d]) => d)).toEqual([80, 30, 1000, 15, 60, 900, 160]);
    expect(r.out.map(([, , , why]) => why)).toEqual(['ropa: Chaqueta camel', 'peluquería', 'vehículo: Patinete eléctrico', 'grúa', 'semillas', 'contratación: Nerea', 'deuda: Vero']);
    expect(r.clean).toBe(7000);
    // tienda con carrito (con el dedo): solo se cobra lo que te llevas
    const m0 = (await bal(page)).dirty;
    await ev(page, () => { __G.state.inv = __G.state.inv.map(() => null); __G.act.openShop('ferreteria'); });
    await shopAdd(page, testInfo, 'Saco de tierra');
    await press(page, testInfo, '.panel .foot .btn:has-text("Pagar")');
    await expect.poll(async () => (await bal(page)).dirty).toBe(m0 - 10);
    expect(await ev(page, () => __G.state.ledger.at(-1).reason)).toBe('tienda: Ferretería Tornillo');
    await press(page, testInfo, '.panel .x');
    // sin efectivo no se compra aunque haya dinero limpio
    await ev(page, () => { __G.state.money = 5; });
    expect((await mod(page, '/src/systems/appearance.js', (m) => m.buyClothes('sudadera_gris'))).ok).toBe(false);
    expect(await bal(page)).toEqual({ dirty: 5, clean: 7000 });
  });

  test('un trato se cobra una sola vez (repetido y con doble toque)', async ({}, testInfo) => {
    const setup = (id) => ev(page, async (id) => {
      const E = await import('/src/systems/economy.js');
      E.ensureBaseProduct('brisa');
      const s = __G.state;
      s.money = 1000; s.inv = s.inv.map(() => null); s.inv[0] = { id: 'bolsa', q: 3, p: 'brisa' };
      s.deals.push({ id, npc: 'chema', product: 'brisa', qty: 2, price: 80, spot: 'x', status: 'accepted', created: 0, expires: 1e9, form: 'bolsa' });
      return s.deals.at(-1);
    }, id);
    await setup('dtest1');
    const r = await ev(page, async () => {
      const E = await import('/src/systems/economy.js');
      const d = __G.state.deals.find((x) => x.id === 'dtest1');
      const give = [{ id: 'bolsa', p: 'brisa', q: 2 }];
      const res = [E.completeDeal(d, give), E.completeDeal(d, give), E.completeDeal(d, give)].map((x) => !!x.ok);
      return { res, money: __G.state.money, left: __G.state.inv[0]?.q, n: __G.state.ledger.filter((e) => e.key === 'deal:dtest1').length, status: d.status };
    });
    expect(r.res).toEqual([true, false, false]);
    expect(r.left).toBe(1);
    expect(r.n).toBe(1);
    expect(r.status).toBe('done');
    const paid = r.money - 1000;
    expect(paid).toBeGreaterThanOrEqual(80);
    // doble toque en «Entregar y cobrar»: dos clics seguidos en el mismo instante
    await setup('dtest2');
    await ev(page, async () => {
      const P = await import('/src/ui/panels.js');
      const npc = __G.npcs.find((n) => n.person.id === 'chema');
      P.openHandover(npc, __G.state.deals.find((x) => x.id === 'dtest2'));
    });
    await expect(page.locator('.panel .btn:has-text("Entregar y cobrar")')).toBeVisible();
    await page.waitForTimeout(700); // en móvil, el panel ignora los toques de sus primeros 400 ms (anti «toque fantasma»)
    await ev(page, () => { const b = [...document.querySelectorAll('.panel .btn')].find((x) => x.textContent.includes('Entregar y cobrar')); b.click(); b.click(); });
    await frames(page, 3);
    expect(await ev(page, () => [__G.state.inv[0]?.q, __G.state.ledger.filter((e) => e.key === 'deal:dtest2').length])).toEqual([1, 1]);
    expect(await ev(page, () => __G.state.money)).toBe(1000 + paid);
    await ev(page, () => __debug.panels.closePanel(true));
  });

  test('alquiler: 100 $ a las 7:00 del día que toca, una vez, puede dejar negativo', async ({}, testInfo) => {
    await ev(page, () => { const s = __G.state; s.money = 50; s.clean = 1000; s.rentPaidWeek = 1; s.employees = []; });
    await at(page, 8, 6 * 60 + 50);
    await advance(page, 5);
    expect(await bal(page)).toEqual({ dirty: 50, clean: 1000 });
    await advance(page, 10);
    expect(await bal(page)).toEqual({ dirty: -50, clean: 1000 }); // excepción autorizada
    expect(await ev(page, () => __G.state.ledger.at(-1))).toMatchObject({ reason: 'alquiler', amt: -100, key: 'rent:8', bal: -50 });
    await advance(page, 300);
    expect((await bal(page)).dirty).toBe(-50);
    // con saldo negativo no se puede gastar en otra cosa
    expect((await mod(page, EC, (m) => m.spend('dirty', 1, 'semillas'))).ok).toBe(false);
    // recargar no vuelve a cobrar
    await mod(page, '/src/core/state.js', (m) => m.save());
    await reloadGame(page, testInfo);
    await advance(page, 60);
    expect((await bal(page)).dirty).toBe(-50);
    // varios días: solo cae otra vez el día 15 a las 7:00
    await ev(page, () => { __G.state.money = 500; });
    await advance(page, 5 * 1440);
    expect(await ev(page, () => [__G.state.day, __G.state.money])).toEqual([13, 500]);
    await at(page, 14, 22 * 60);
    await ev(page, () => __G.act.sleep('nave'));
    await page.waitForFunction(() => document.querySelector('.panel'), null, { timeout: 60_000 });
    expect(await ev(page, () => [__G.state.day, __G.state.money])).toEqual([15, 400]);
    // el resumen del día enseña los dos saldos
    await expect(page.locator('.panel')).toContainText('Limpio');
    await ev(page, () => __debug.panels.closePanel(true));
    await advance(page, 120);
    expect((await bal(page)).dirty).toBe(400);
  });

  test('nómina sin efectivo: se apunta deuda y el dinero limpio no se toca', async () => {
    await ev(page, async () => { const S = await import('/src/systems/staff.js'); const s = __G.state; s.rank = 3; s.money = 900; S.hire('nerea', 'nave'); s.money = 0; s.clean = 5000; });
    await at(page, 16, 6 * 60 + 55);
    await advance(page, 10);
    const e = await ev(page, () => __G.state.employees.find((x) => x.cid === 'nerea'));
    expect([e.owed, e.debt, e.status]).toEqual([1, 180, 'sin_pago']);
    expect(await bal(page)).toEqual({ dirty: 0, clean: 5000 });
    await ev(page, () => { __G.state.employees = []; });
  });

  test('bungalow (A1): 2.500 $ en efectivo, sin dinero no se compra', async ({}, testInfo) => {
    await ev(page, () => { const s = __G.state; s.props.bungalow = false; s.home = 'nave'; s.money = 2400; s.clean = 9000; });
    await ev(page, async () => (await import('/src/ui/panels.js')).bungalowActions()[0].fn());
    await expect(page.locator('.panel')).toContainText('efectivo');
    await expect(page.locator('.panel')).not.toContainText('motel');
    await press(page, testInfo, '.panel .btn:not(.ghost)');
    expect(await ev(page, () => [__G.state.props.bungalow, __G.state.money, __G.state.clean])).toEqual([false, 2400, 9000]);
    await ev(page, () => { __G.state.money = 2600; });
    await ev(page, async () => (await import('/src/ui/panels.js')).bungalowActions()[0].fn());
    await press(page, testInfo, '.panel .btn:not(.ghost)');
    expect(await ev(page, () => [__G.state.props.bungalow, __G.state.money, __G.state.clean, __G.state.ledger.at(-1).reason])).toEqual([true, 100, 9000, 'bungalow']);
    // ya es tuyo: no se vuelve a ofrecer ni a cobrar
    expect(await ev(page, async () => (await import('/src/ui/panels.js')).bungalowActions()[0].label)).toBe('Tu bungalow');
    await ev(page, () => __debug.panels.closePanel(true));
  });

  test('detención: multa solo del efectivo, una por detención', async () => {
    const r = await ev(page, async () => {
      const P = await import('/src/systems/police.js');
      const O = await import('/src/systems/objects.js');
      const s = __G.state;
      const safe = [...__G.objects.values()].find((o) => o.entry.type === 'safe');
      s.money = 1000; s.clean = 700; s.rank = 3; s.inv = s.inv.map(() => null);
      P.arrest(null); // 150 + 3×75 = 375
      const one = [s.money, s.clean, safe.entry.data.cash];
      P.arrest(null); // misma detención (llega dos veces): nada
      const same = s.money;
      __debug.advanceTime(1);
      P.arrest(null); // otra detención: otra multa
      return { one, same, two: s.money };
    });
    expect(r.one).toEqual([625, 700, 300]);
    expect(r.same).toBe(625);
    expect(r.two).toBe(250);
    await ev(page, () => __debug.panels.closePanel(true));
  });

  test('desmayo: 10 % del efectivo, una vez por noche; el limpio y la caja no se tocan', async () => {
    const r = await ev(page, async () => {
      const T = await import('/src/systems/time.js');
      const s = __G.state;
      const safe = [...__G.objects.values()].find((o) => o.entry.type === 'safe');
      __G.player.teleport(0, 0, 0); // en la calle
      s.money = 1000; s.clean = 700; s.minute = 4 * 60;
      T.passOut();
      T.passOut(); // la misma noche
      return [s.money, s.clean, safe.entry.data.cash];
    });
    expect(r).toEqual([900, 700, 300]);
    await page.waitForFunction(() => document.querySelector('.panel'), null, { timeout: 60_000 });
    await ev(page, () => __debug.panels.closePanel(true));
    // la noche siguiente vuelve a poder pasar
    const next = await ev(page, async () => {
      const T = await import('/src/systems/time.js');
      await new Promise((r) => setTimeout(r, 2500)); // que acabe la transición del sueño anterior
      __G.player.teleport(0, 0, 0); __G.state.day += 1; __G.state.minute = 4 * 60;
      T.passOut();
      return __G.state.money;
    });
    expect(next).toBe(810);
    await page.waitForFunction(() => document.querySelector('.panel'), null, { timeout: 60_000 });
    await ev(page, () => __debug.panels.closePanel(true));
  });

  test('caja fuerte: transferencias que no cuentan como ingresos ni gastos', async () => {
    const r = await ev(page, async () => {
      const P = await import('/src/ui/panels.js');
      const s = __G.state;
      const safe = [...__G.objects.values()].find((o) => o.entry.type === 'safe');
      s.money = 500; s.clean = 700;
      const e0 = [s.stats.earned, s.today.earned];
      const a = P.moveCash(safe, 200);    // guardar 200
      const b = P.moveCash(safe, 1e9);    // «Todo»: solo lo que llevas
      const c = P.moveCash(safe, -1e9);   // sacar todo lo que hay
      const d = P.moveCash(safe, 50);     // guardar 50
      s.money = 0;
      const e = P.moveCash(safe, 100);    // sin efectivo: nada
      return { moves: [a, b, c, d, e], money: s.money, cash: safe.entry.data.cash, clean: s.clean, earned: [s.stats.earned, s.today.earned], e0, kinds: s.ledger.slice(-4).map((x) => x.kind) };
    });
    expect(r.moves).toEqual([200, 300, -800, 50, 0]);
    expect([r.money, r.cash, r.clean]).toEqual([0, 50, 700]);
    expect(r.earned).toEqual(r.e0);
    expect(r.kinds).toEqual(['transferencia', 'transferencia', 'transferencia', 'transferencia']);
  });

  test('guardar y cargar conserva los dos saldos, el historial y las claves', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 4321; __G.state.clean = 1234; });
    await mod(page, '/src/core/state.js', (m) => m.save());
    const before = await ev(page, () => JSON.stringify([__G.state.money, __G.state.clean, __G.state.ledger, __G.state.txKeys, __G.state.txSeq]));
    await reloadGame(page, testInfo);
    expect(await ev(page, () => JSON.stringify([__G.state.money, __G.state.clean, __G.state.ledger, __G.state.txKeys, __G.state.txSeq]))).toBe(before);
  });

  test('HUD y Perfil: billetes para el efectivo y tarjeta para el limpio', async ({}, testInfo) => {
    await ev(page, () => { __G.state.clean = 12345; __G.paused = false; });
    await frames(page, 3);
    await expect(page.locator('#bank')).toBeVisible();
    await expect(page.locator('#h-clean')).toHaveText('12.345');
    await expect(page.locator('#bank .cash-ic img')).toHaveCount(1);
    await expect(page.locator('#cash .cash-ic img')).toHaveCount(1);
    await ev(page, () => { __G.state.money = 1000; });
    await expect(page.locator('#h-money')).toHaveText('1.000'); // miles con punto también con 4 cifras
    await page.screenshot({ path: `tests/.results/money-${testInfo.project.name}-hud.png` });
    await ev(page, () => { __G.state.clean = 0; });
    await frames(page, 3);
    await expect(page.locator('#h-clean')).toHaveText('0');
    await ev(page, () => { __G.state.clean = 1234; __G.act.openPhone('stats'); });
    await expect(page.locator('#phone')).toContainText('Efectivo (sucio)');
    await expect(page.locator('#phone')).toContainText('Dinero limpio');
    await ev(page, async () => (await import('/src/ui/phone.js')).closePhone());
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
