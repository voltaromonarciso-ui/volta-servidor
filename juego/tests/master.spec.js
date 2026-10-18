// Encargo maestro: sobres de semillas, entregas programadas con plus de toque de queda,
// cantidades de compra variadas y muestras que no todos aceptan.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, frames, newGame, lookAt, act, prompt, selectSlot } from './helpers.js';

const ST = '/src/core/state.js';
const EC = '/src/systems/economy.js';

test.describe.serial('Encargo maestro', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva', async ({}, testInfo) => {
    await newGame(page, testInfo);
    await ev(page, () => { __G.state.minute = 10 * 60; __G.state.inv = Array(__G.state.inv.length).fill(null); });
  });

  test('sobres de semillas: se vacían, no dan semillas infinitas y se rellenan', async () => {
    const r = await mod(page, ST, (m) => {
      const inv = __G.state.inv;
      inv[0] = { id: 'semilla', q: 2, p: 'brisa' };
      inv[1] = { id: 'sobre_vacio', q: 1, p: 'niebla' };
      const out = [];
      out.push(m.takeSeed(inv, 0), JSON.stringify(inv[0]));
      out.push(m.takeSeed(inv, 0), JSON.stringify(inv[0])); // la última: queda el sobre vacío
      out.push(m.takeSeed(inv, 0), JSON.stringify(inv[0])); // un sobre vacío no da nada
      out.push(m.inv.count('semilla'));
      // recibir semillas de la misma variedad rellena su sobre vacío (y no el de otra)
      out.push(m.inv.add('semilla', 3, 'brisa'), JSON.stringify(inv[0]), JSON.stringify(inv[1]));
      return out;
    });
    expect(r).toEqual([
      'brisa', '{"id":"semilla","q":1,"p":"brisa"}',
      'brisa', '{"id":"sobre_vacio","q":1,"p":"brisa"}',
      null, '{"id":"sobre_vacio","q":1,"p":"brisa"}',
      0,
      0, '{"id":"semilla","q":3,"p":"brisa"}', '{"id":"sobre_vacio","q":1,"p":"niebla"}',
    ]);
    // la barra distingue el sobre vacío y su nombre lo dice
    await frames(page, 3);
    expect(await ev(page, () => document.querySelectorAll('#hotbar .slot')[1].classList.contains('vacio'))).toBe(true);
    const labels = await mod(page, '/src/ui/hud.js', (m) => [m.itemLabel(__G.state.inv[0]), m.itemLabel(__G.state.inv[1])]);
    expect(labels).toEqual(['Sobre de Lumaflor Verde (3/10 semillas)', 'Sobre de Lumaflor Violeta vacío']);
  });

  test('plantar con un sobre vacío en la mano no planta nada', async ({}, testInfo) => {
    await ev(page, () => {
      const inv = __G.state.inv;
      inv[0] = { id: 'maceta', q: 1 }; inv[2] = { id: 'tierra', q: 1 }; inv[3] = { id: 'semilla', q: 1, p: 'brisa' };
    });
    await lookAt(page, -70, -55, Math.PI / 2, -0.75);
    await selectSlot(page, testInfo, 0);
    await expect.poll(() => prompt(page)).toContain('Colocar');
    await act(page, testInfo);
    await selectSlot(page, testInfo, 2);
    await expect.poll(() => prompt(page)).toContain('tierra');
    await act(page, testInfo);
    // sobre vacío en la mano
    await selectSlot(page, testInfo, 1);
    await expect.poll(() => prompt(page)).toContain('Sobre vacío');
    await act(page, testInfo);
    const pot = () => ev(page, () => __G.state.objects.find((o) => o.type === 'pot').data);
    expect((await pot()).strain).toBeFalsy();
    // con el sobre de 1 semilla sí planta, y el sobre se queda vacío en su hueco
    await selectSlot(page, testInfo, 3);
    await expect.poll(() => prompt(page)).toContain('Plantar');
    await act(page, testInfo);
    expect((await pot()).strain).toBe('brisa');
    expect(await ev(page, () => JSON.stringify(__G.state.inv[3]))).toBe('{"id":"sobre_vacio","q":1,"p":"brisa"}');
  });

  test('entregas programadas: hora acordada, el cliente no acude antes y no se cobra antes de tiempo', async () => {
    const r = await mod(page, EC, (m) => {
      const s = __G.state;
      m.ensureBaseProduct('brisa');
      m.unlockStartingCustomers();
      s.minute = 10 * 60;
      const rnd = Math.random; Math.random = () => 0.01;
      m.onHour(10);
      Math.random = rnd;
      const d = s.deals.find((x) => x.status === 'offer');
      const now = (s.day - 1) * 1440 + s.minute;
      m.acceptDeal(d, true);
      const npc = __G.npcs.find((n) => n.id === d.npc);
      const early = { at: d.at - now, expires: d.expires - d.at, npcDeal: !!npc.deal };
      s.inv[5] = { id: 'bolsa', q: 40, p: 'brisa' };
      const tooSoon = m.completeDeal(d, [{ id: 'bolsa', p: 'brisa', q: d.qty }]);
      return { early, tooSoon, status: d.status };
    });
    expect(r.early.at).toBeGreaterThanOrEqual(60);   // al menos 1 h de margen para prepararlo
    expect(r.early.expires).toBe(60);               // una hora para entregar desde la hora acordada
    expect(r.early.npcDeal).toBe(false);            // antes de tiempo sigue con su vida
    expect(r.tooSoon.ok).toBe(false);
    expect(r.tooSoon.msg).toContain('Aún no es la hora');
    expect(r.status).toBe('accepted');
  });

  test('entrega en horario normal: sin plus; aviso media hora antes; se cobra una sola vez', async () => {
    const r = await mod(page, EC, (m) => {
      const s = __G.state;
      const d = s.deals.find((x) => x.status === 'accepted');
      const now = (s.day - 1) * 1440 + s.minute;
      s.minute += d.at - 30 - now; // media hora antes
      m.onMinute();
      const reminded = d.reminded;
      const npcDeal = !!__G.npcs.find((n) => n.id === d.npc).deal;
      const money0 = s.money;
      const give = [{ id: 'bolsa', p: 'brisa', q: d.qty }];
      const a = m.completeDeal(d, give);
      const b = m.completeDeal(d, give); // doble toque
      return { reminded, npcDeal, a, b, gained: s.money - money0, price: d.price, bonus: d.bonus, hud: document.getElementById('h-next').textContent };
    });
    expect(r.reminded).toBe(true);
    expect(r.npcDeal).toBe(true);
    expect(r.a.ok).toBe(true);
    expect(r.a.bonus).toBe(0);
    expect(r.b.ok).toBe(false);
    expect(r.gained).toBe(r.a.pay);
  });

  test('entrega durante el toque de queda: +25 % una sola vez, visible en el móvil', async () => {
    const r = await mod(page, EC, (m) => {
      const s = __G.state;
      // trato acordado para las 22:30 de hoy
      s.minute = 20 * 60;
      const day0 = (s.day - 1) * 1440;
      const d = { id: 'dnight', npc: 'chema', product: 'brisa', qty: 3, price: 120, spot: __G.world.spots[0].id, status: 'offer', created: day0 + 20 * 60, expires: day0 + 22 * 60, form: 'bolsa', at: day0 + 22 * 60 + 30 };
      s.deals.push(d);
      m.acceptDeal(d, true);
      s.minute = 22 * 60 + 35;
      const money0 = s.money;
      const give = [{ id: 'bolsa', p: 'brisa', q: 3 }];
      const a = m.completeDeal(d, give);
      const b = m.completeDeal(d, give);
      const after = s.money;
      return { a, b, gained: after - money0, bonus: d.bonus, ledger: s.ledger.filter((l) => l.key === 'deal:dnight').length };
    });
    expect(r.a.ok).toBe(true);
    expect(r.a.bonus).toBeGreaterThanOrEqual(10);
    expect(r.a.bonus).toBe(Math.max(10, Math.round((r.a.pay - r.a.bonus) * 0.25)));
    expect(r.b.ok).toBe(false);
    expect(r.gained).toBe(r.a.pay);  // plus incluido, cobrado una vez
    expect(r.ledger).toBe(1);        // un solo movimiento en el historial
    await ev(page, () => __G.act.openPhone('deliveries'));
    await expect(page.locator('#phone')).toContainText('Entregadas hoy');
    await expect(page.locator('#phone')).toContainText('plus toque de queda');
    await mod(page, '/src/ui/phone.js', (m) => m.closePhone());
  });

  test('los compradores piden cantidades variadas y nunca más de lo que pueden pagar', async () => {
    const r = await mod(page, EC, (m) => {
      const s = __G.state;
      s.minute = 10 * 60;
      const qs = [];
      for (let i = 0; i < 300; i++) {
        s.deals = s.deals.filter((d) => d.status === 'done');
        m.onHour(10);
        for (const d of s.deals) if (d.status === 'offer') { qs.push([d.qty, d.price, d.npc]); d.status = 'rejected'; }
      }
      return qs;
    });
    const people = await mod(page, '/src/data/people.js', (m) => Object.fromEntries(m.PEOPLE.map((p) => [p.id, p.budget[1]])));
    const qtys = r.map((x) => x[0]);
    expect(qtys.length).toBeGreaterThan(20);
    expect(new Set(qtys).size).toBeGreaterThanOrEqual(3); // no siempre la misma cantidad
    expect(qtys.filter((q) => q === 1).length).toBeGreaterThan(0);
    for (const q of qtys) expect(q).toBeGreaterThanOrEqual(1);
    // presupuesto máximo con confianza y adicción al tope: budget × 1,8 × 1,34 aprox.
    for (const [q, price, npc] of r) expect(price).toBeLessThanOrEqual(people[npc] * 2.5);
  });

  test('muestras: unos las aceptan y otros no (y si no, no se gasta nada); frases variadas', async () => {
    const r = await mod(page, EC, (m) => {
      const s = __G.state;
      const npc = __G.npcs.find((n) => !m.customer(n.id).unlocked);
      const c = m.customer(npc.id);
      s.inv[6] = { id: 'bolsa', q: 5, p: 'brisa' };
      const msgs = [];
      const toast = __G.act.toast;
      __G.act.toast = (t) => msgs.push(t);
      const rnd = Math.random;
      // rechazo: no gasta la muestra
      Math.random = () => 0;
      const before = s.inv[6].q;
      const refused = m.giveSample(npc, s.inv[6]);
      const afterRefuse = s.inv[6].q;
      // otro día lo prueba y no le convence, varias veces: no repite la misma frase seguida
      const meh = [];
      for (let i = 0; i < 4; i++) {
        c.sampleDay = -1;
        let k = 0; Math.random = () => (k++ === 0 ? 0.99 : 0.99);
        msgs.length = 0;
        m.giveSample(npc, s.inv[6]);
        meh.push(msgs[0]);
      }
      Math.random = rnd;
      __G.act.toast = toast;
      return { refused, before, afterRefuse, meh, left: s.inv[6]?.q };
    });
    expect(r.refused).toBe(false);
    expect(r.afterRefuse).toBe(r.before); // rechazada: no se gasta
    for (let i = 1; i < r.meh.length; i++) expect(r.meh[i]).not.toBe(r.meh[i - 1]);
    expect(r.left).toBe(r.before - 4);
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
