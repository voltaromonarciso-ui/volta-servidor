// Armería, casino y bandas rivales: compras, apuestas y atracos sin duplicar dinero.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, frames, newGame, lookAt, act, prompt, press } from './helpers.js';

const CZ = '/src/systems/casino.js';
const GG = '/src/systems/gangs.js';

test.describe.serial('Armería, casino y bandas', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva', async ({}, testInfo) => {
    await newGame(page, testInfo);
  });

  test('armería: se entra por la puerta, se compra con el efectivo y respeta el rango', async ({}, testInfo) => {
    await ev(page, () => { __G.state.minute = 12 * 60; __G.state.money = 300; __G.state.rank = 0; });
    const door = await ev(page, () => __G.world.pois.armeria);
    await lookAt(page, door.x, door.z + 1.2, 0, -0.05);
    await expect.poll(() => prompt(page)).toContain('Armería');
    await act(page, testInfo);
    await expect(page.locator('.panel')).toContainText('Armería Lomas');
    // la pistola necesita rango (candado) y el spray se puede comprar
    await expect(page.locator('.shop .card:has-text("Pistola")')).toContainText('🔒');
    await press(page, testInfo, '.shop .card:has-text("Spray") .qb:last-child');
    await press(page, testInfo, '.panel .foot .btn:has-text("Pagar")');
    await expect.poll(() => ev(page, () => __G.state.money)).toBe(240);
    expect(await ev(page, () => __G.state.inv.filter((s) => s && s.id === 'spray').reduce((a, s) => a + s.q, 0))).toBe(1);
    await ev(page, async () => (await import('/src/ui/panels.js')).closePanel(true));
  });

  test('casino: cerrado de día; cada jugada se cobra y se paga una sola vez', async () => {
    const r = await mod(page, CZ, (m) => {
      const s = __G.state;
      s.minute = 12 * 60;
      const closed = m.play('slots', 10);
      s.minute = 22 * 60; s.money = 100;
      const bad = [m.play('slots', 7), m.play('roulette', 10, 'azul'), m.play('slots', 250)];
      const m0 = s.money, l0 = s.ledger.length;
      // tragaperras: 7 7 7 (el último hueco del rodillo) → ×25
      const jack = m.play('slots', 10, null, () => 0.999);
      const afterJack = s.money;
      // ruleta: el 0 hace perder a rojo
      const zero = m.play('roulette', 10, 'rojo', () => 0);
      // ruleta: número exacto ×36
      const num = m.play('roulette', 5, '17', () => 17 / 37 + 0.001);
      return { closed, bad: bad.map((x) => x.ok), jack, gainJack: afterJack - m0, zero, num, money: s.money, m0, ledger: s.ledger.length - l0, keys: s.ledger.slice(-5).map((l) => l.key) };
    });
    expect(r.closed.ok).toBe(false);
    expect(r.bad).toEqual([false, false, false]);
    expect(r.jack.result).toEqual(['7️⃣', '7️⃣', '7️⃣']);
    expect(r.jack.win).toBe(250);
    expect(r.gainJack).toBe(240);
    expect(r.zero.result).toBe(0);
    expect(r.zero.win).toBe(0);
    expect(r.num.result).toBe(17);
    expect(r.num.win).toBe(180);
    expect(r.money).toBe(r.m0 + 240 - 10 + 175);
    expect(r.ledger).toBe(5); // 3 apuestas + 2 premios
    expect(new Set(r.keys).size).toBe(5);
    // el retorno medio de la tragaperras está por debajo del 100 %
    const rtp = await mod(page, CZ, (m) => {
      let bet = 0, won = 0; const s = __G.state;
      for (let i = 0; i < 20000; i++) { s.money = 1000; const x = m.play('slots', 5); bet += 5; won += x.win; }
      return won / bet;
    });
    expect(rtp).toBeGreaterThan(0.8);
    expect(rtp).toBeLessThan(1.0);
  });

  test('casino: el panel se usa en el móvil y un doble toque no juega dos veces', async ({}, testInfo) => {
    await ev(page, () => { __G.state.minute = 22 * 60; __G.state.money = 100; __G.act.openCasino(); });
    await expect(page.locator('.panel')).toContainText('Casino Royal');
    const n0 = await ev(page, () => __G.state.casinoSeq);
    await page.waitForTimeout(500);
    // dos toques seguidos en el mismo instante
    await ev(page, () => { const b = document.querySelector('.panel .foot .btn'); b.click(); b.click(); });
    await page.waitForTimeout(900);
    expect(await ev(page, () => __G.state.casinoSeq)).toBe(n0 + 1);
    await page.screenshot({ path: testInfo.outputPath('casino.png') });
    await ev(page, async () => (await import('/src/ui/panels.js')).closePanel(true));
  });

  test('bandas: nunca de día, ni los primeros días, ni con poca pasta, ni dos veces seguidas', async () => {
    const r = await mod(page, GG, (m) => {
      const s = __G.state;
      const p = __G.world.props.nave.spawn;
      __G.player.teleport(30 + 6, 0, 0); // en la calle
      __G.police.forEach((c) => c.pos.set(300, 0, 300));
      const out = {};
      s.day = 1; s.minute = 23 * 60; s.money = 500; delete s.lastRobbery;
      out.firstDays = m.canStart();
      s.day = 5; s.minute = 12 * 60; out.day = m.canStart();
      s.minute = 23 * 60; s.money = 30; out.poor = m.canStart();
      s.money = 500; out.ok = m.canStart();
      s.lastRobbery = (s.day - 1) * 1440 + s.minute - 600; out.cooldown = m.canStart();
      delete s.lastRobbery;
      out.demand = [m.demand(0), m.demand(30), m.demand(500), m.demand(5000)];
      return out;
    });
    expect(r).toEqual({ firstDays: false, day: false, poor: false, ok: true, cooldown: false, demand: [0, 20, 175, 500] });
  });

  test('bandas: aparecen lejos, avisan y se puede huir', async () => {
    const r = await mod(page, GG, (m) => {
      __G.paused = true;
      const toasts = []; const t0 = __G.act.toast; __G.act.toast = (t) => toasts.push(t);
      const started = m.startRobbery();
      const st0 = m.gangState();
      // se acercan hasta el aviso
      let k = 0; while (m.gangState()?.d > 21 && k++ < 2000) m.updateGangs(0.05);
      const warned = toasts.some((t) => /vienen hacia ti/.test(t));
      // huir: el jugador se va lejos
      __G.player.teleport(__G.player.pos.x + 80, __G.player.pos.z, 0);
      m.updateGangs(0.05);
      const fled = m.gangState()?.phase;
      const again = m.canStart(); // ya no puede volver a pasar enseguida
      for (let i = 0; i < 800; i++) m.updateGangs(0.05);
      __G.act.toast = t0; __G.paused = false;
      return { started, spawnD: st0.d, warned, fled, again, gone: m.gangState() };
    });
    expect(r.started).toBe(true);
    expect(r.spawnD).toBeGreaterThan(25); // no aparecen encima
    expect(r.warned).toBe(true);
    expect(r.fled).toBe('leave');
    expect(r.again).toBe(false);
    expect(r.gone).toBe(null);
  });

  test('bandas: si te alcanzan eliges; lo que se llevan sale una sola vez', async ({}, testInfo) => {
    await mod(page, GG, (m) => {
      const s = __G.state;
      delete s.lastRobbery; s.money = 400; s.minute = 23 * 60;
      __G.player.teleport(36, 0, 0);
      m.startRobbery(true);
      // te alcanzan (el emulador va a 1–2 fps: se les pone al lado en vez de esperar)
      const at = m.gangState().at;
      __G.player.teleport(at.x + 1, at.z, 0);
      m.updateGangs(0.05);
    });
    await expect.poll(() => ev(page, () => document.querySelector('.panel.robbery') !== null)).toBe(true);
    await expect(page.locator('.panel.robbery')).toContainText('Spray de pimienta'); // compraste uno en la armería
    await page.screenshot({ path: testInfo.outputPath('atraco.png') });
    const m0 = await ev(page, () => __G.state.money);
    await page.waitForTimeout(500);
    await press(page, testInfo, '.panel.robbery .btn:has-text("Darles")');
    await expect.poll(() => ev(page, () => __G.state.money)).toBe(m0 - 140);
    const r = await mod(page, GG, (m) => [m.resolveRobbery('pay').ok, __G.state.money, __G.state.ledger.filter((l) => /^rob:/.test(l.key || '')).length]);
    expect(r).toEqual([false, m0 - 140, 1]);
  });

  test('bandas: con spray no te quitan nada y se gasta el spray', async () => {
    const r = await mod(page, GG, async (m) => {
      const s = __G.state;
      m.clearGangs(); delete s.lastRobbery; s.money = 400;
      s.inv[8] = { id: 'spray', q: 2 };
      __G.paused = true;
      m.startRobbery(true);
      const at = m.gangState().at;
      __G.player.teleport(at.x + 1, at.z, 0); // te alcanzan
      m.updateGangs(0.05);
      const phase = m.gangState().phase;
      const res = m.resolveRobbery('spray');
      const again = m.resolveRobbery('pay');
      (await import('/src/ui/panels.js')).closePanel(true);
      __G.paused = false;
      return { phase, res, again: again.ok, money: s.money, spray: s.inv[8]?.q };
    });
    expect(r.phase).toBe('confront');
    expect(r.res.ok).toBe(true);
    expect(r.res.lost).toBe(0);
    expect(r.again).toBe(false);
    expect(r.money).toBe(400);
    expect(r.spray).toBe(1);
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
