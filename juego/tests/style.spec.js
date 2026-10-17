// Bloque A de la fase 3: peluquería, tienda de ropa, disfraz y reconocimiento.
// Los flujos de tienda se juegan con el dedo (perfiles táctiles); las reglas se
// comprueban llamando a los módulos reales del juego.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, press, frames, newGame, lookAt, act, prompt } from './helpers.js';

const A = '/src/systems/appearance.js';
const money = (page) => ev(page, () => __G.state.money);

test.describe.serial('Peluquería, ropa y disfraz', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva con aspecto por defecto', async ({}, testInfo) => {
    await newGame(page, testInfo);
    const st = await mod(page, A, (m) => m.style());
    expect(st).toEqual({ hair: 'orig', beard: 'none', worn: {} });
    expect(await ev(page, () => !!__G.avatar)).toBe(true);
    expect(await ev(page, () => __G.state.inv.length)).toBe(10);
  });

  test('ropa: sin dinero no se compra', async () => {
    await ev(page, () => { __G.state.money = 10; });
    const r = await mod(page, A, (m) => m.buyClothes('chaqueta_camel'));
    expect(r.ok).toBe(false);
    expect(await money(page)).toBe(10);
    expect(await ev(page, () => __G.state.wardrobe.owned)).toEqual([]);
  });

  test('ropa: comprar, ponerse y no cobrar dos veces (probador táctil)', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 1000; __G.state.minute = 12 * 60; });
    await lookAt(page, 104.2, 20.3, -Math.PI / 2, -0.1);
    await expect.poll(() => prompt(page)).toContain('probador');
    await act(page, testInfo);
    await expect(page.locator('.dress-sheet')).toBeVisible();
    await frames(page, 10);
    await press(page, testInfo, '.dress .opt:has-text("Chaqueta camel")');
    await press(page, testInfo, '.dress-foot .btn:not(.ghost)');
    await expect.poll(() => money(page)).toBe(920);
    expect(await mod(page, A, (m) => m.style().worn.top)).toBe('chaqueta_camel');
    // repetir la compra no cobra
    const again = await mod(page, A, (m) => m.buyClothes('chaqueta_camel'));
    expect(again.ok).toBe(false);
    expect(await money(page)).toBe(920);
    expect(await ev(page, () => __G.state.wardrobe.owned.filter((x) => x === 'chaqueta_camel').length)).toBe(1);
    // la manga en primera persona toma el color de la prenda (si el modelo lleva manga)
    expect(await ev(page, () => __G.avatar.uniforms.uTopOn.value)).toBe(1);
  });

  test('mochila: +4 huecos y no se quita con cosas dentro', async ({}, testInfo) => {
    await press(page, testInfo, '.dress .tab:has-text("Espalda")');
    await press(page, testInfo, '.dress .opt:has-text("Mochila")');
    await press(page, testInfo, '.dress-foot .btn:not(.ghost)');
    await expect.poll(() => ev(page, () => __G.state.inv.length)).toBe(14);
    expect(await money(page)).toBe(800);
    await ev(page, () => { __G.state.inv[13] = { id: 'tierra', q: 1 }; });
    const blocked = await mod(page, A, (m) => m.unequip('back'));
    expect(blocked.ok).toBe(false);
    expect(await ev(page, () => __G.state.inv.length)).toBe(14);
    await ev(page, () => { __G.state.inv[13] = null; });
    // quitar y volver a poner desde el probador
    await press(page, testInfo, '.dress .opt:has-text("Mochila")');
    await press(page, testInfo, '.dress-foot .btn:has-text("Quitármela")');
    await expect.poll(() => ev(page, () => __G.state.inv.length)).toBe(10);
    await press(page, testInfo, '.dress .opt:has-text("Mochila")');
    await press(page, testInfo, '.dress-foot .btn:has-text("Ponérmela")');
    await expect.poll(() => ev(page, () => __G.state.inv.length)).toBe(14);
    expect(await money(page)).toBe(800);
    await press(page, testInfo, '.dress-foot .btn.ghost');
    await expect.poll(() => ev(page, () => !__G.uiOpen), { timeout: 60_000 }).toBe(true);
  });

  test('peluquería: vista previa, salir sin pagar y pagar (sillón táctil)', async ({}, testInfo) => {
    await lookAt(page, 101.2, -20.6, 0, -0.5);
    await expect.poll(() => prompt(page)).toContain('Sentarse');
    await act(page, testInfo);
    await expect(page.locator('.dress-sheet')).toBeVisible();
    await frames(page, 10);
    await press(page, testInfo, '.dress .opt:has-text("Azul")');
    expect(await ev(page, () => __G.avatar.uniforms.uHairOn.value)).toBe(1);
    // salir sin pagar: ni cobra ni se queda el tinte
    await press(page, testInfo, '.dress-foot .btn.ghost');
    await expect.poll(() => ev(page, () => !__G.uiOpen), { timeout: 60_000 }).toBe(true);
    expect(await money(page)).toBe(800);
    expect(await mod(page, A, (m) => m.style().hair)).toBe('orig');
    expect(await ev(page, () => __G.avatar.uniforms.uHairOn.value)).toBe(0);
    // sin dinero no se aplica
    await ev(page, () => { __G.state.money = 5; });
    const poor = await mod(page, A, (m) => m.barberApply({ hair: 'rubio', beard: 'none' }));
    expect(poor.ok).toBe(false);
    expect(await mod(page, A, (m) => m.style().hair)).toBe('orig');
    // pagar de verdad
    await ev(page, () => { __G.state.money = 800; });
    await lookAt(page, 101.2, -20.6, 0, -0.5);
    await act(page, testInfo);
    await expect(page.locator('.dress-sheet')).toBeVisible();
    await frames(page, 10);
    await press(page, testInfo, '.dress .opt:has-text("Rubio")');
    await press(page, testInfo, '.dress-foot .btn:not(.ghost)');
    await expect.poll(() => money(page)).toBe(770);
    expect(await mod(page, A, (m) => m.style().hair)).toBe('rubio');
    await press(page, testInfo, '.dress-foot .btn.ghost');
    await expect.poll(() => ev(page, () => !__G.uiOpen), { timeout: 60_000 }).toBe(true);
    expect(await ev(page, () => __G.avatar.uniforms.uHairOn.value)).toBe(1);
  });

  test('reconocimiento: una prenda no basta, un cambio grande sí, y caduca', async () => {
    const r = await mod(page, A, (m) => {
      m.rememberIncident();
      const full = m.recognition();
      m.equip('chaqueta_camel');
      return { full, level: m.RECOG_LEVEL };
    });
    expect(r.full).toBeGreaterThan(0.95);
    // cambiar solo la prenda de arriba: sigue fichado
    await ev(page, () => { __G.state.wardrobe.owned.push('sudadera_gris', 'cargo_verde', 'gafas_sol'); });
    const one = await mod(page, A, (m) => { m.equip('sudadera_gris'); return m.recognition(); });
    expect(one).toBeGreaterThanOrEqual(r.level);
    // pelo + arriba + pantalón + gafas: ya no encaja
    const big = await mod(page, A, (m) => { __G.state.style.hair = 'negro'; m.equip('cargo_verde'); m.equip('gafas_sol'); return m.recognition(); });
    expect(big).toBeLessThan(r.level);
    // la memoria caduca con el tiempo de juego
    await mod(page, A, (m) => { __G.state.style.hair = 'rubio'; m.unequip('top'); m.unequip('legs'); m.unequip('face'); m.equip('chaqueta_camel'); m.rememberIncident(); });
    await ev(page, () => __debug.advanceTime(3 * 24 * 60 + 10));
    expect(await mod(page, A, (m) => m.recognition())).toBe(0);
  });

  test('reconocimiento: la patrulla te para más y cambiarse no corta una persecución', async () => {
    const p = await mod(page, '/src/systems/police.js', (m) => ({ known: m.friskChance(0.8, false, 0), unknown: m.friskChance(0.3, false, 0) }));
    expect(p.known).toBeGreaterThan(p.unknown + 0.4);
    const chase = await ev(page, async () => {
      const P = await import('/src/systems/police.js');
      const Ap = await import('/src/systems/appearance.js');
      P.startChase(null, 'Alto');
      __G.state.style.hair = 'negro';
      Ap.equip('cargo_verde');
      const lvl = P.wanted.level;
      P.resetPolice();
      return lvl;
    });
    expect(chase).toBeGreaterThan(0);
  });

  test('clientes: el estilo da una ventaja pequeña', async () => {
    const r = await ev(page, async () => {
      const Ap = await import('/src/systems/appearance.js');
      const marisa = (await import('/src/data/people.js')).PEOPLE.find((x) => x.id === 'marisa');
      const worn = __G.state.wardrobe.worn;
      for (const k of Object.keys(worn)) delete worn[k];
      worn.top = 'chaqueta_camel'; worn.face = 'gafas_sol';
      const elegant = Ap.styleBonus(marisa);
      worn.top = 'sudadera_gris'; worn.legs = 'cargo_verde'; delete worn.face;
      const street = Ap.styleBonus(marisa);
      return { elegant, street };
    });
    expect(r.elegant).toBeGreaterThan(0);
    expect(r.elegant).toBeLessThanOrEqual(0.07);
    expect(r.street).toBeLessThan(0);
  });

  test('guardar y cargar conserva aspecto, ropa, mochila y memoria policial', async ({}, testInfo) => {
    await mod(page, A, (m) => { const w = __G.state.wardrobe.worn; for (const k of Object.keys(w)) delete w[k]; m.equip('chaqueta_camel'); m.equip('mochila'); m.rememberIncident(); });
    await ev(page, () => { __G.state.inv[12] = { id: 'tierra', q: 2 }; });
    const before = await ev(page, () => JSON.stringify({ st: __G.state.style, w: __G.state.wardrobe, m: !!__G.state.policeMemory, inv: __G.state.inv.length, t: __G.state.inv[12], money: __G.state.money }));
    await mod(page, '/src/core/state.js', (m) => m.save());
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    const after = await ev(page, () => JSON.stringify({ st: __G.state.style, w: __G.state.wardrobe, m: !!__G.state.policeMemory, inv: __G.state.inv.length, t: __G.state.inv[12], money: __G.state.money }));
    expect(after).toEqual(before);
    expect(await ev(page, () => [__G.avatar.uniforms.uHairOn.value, __G.avatar.uniforms.uTopOn.value])).toEqual([1, 1]);
  });

  test('partidas antiguas (sin datos de aspecto) siguen cargando', async ({}, testInfo) => {
    await ev(page, () => {
      __G.paused = true; // que al recargar no se guarde encima la partida en curso
      const k = 'bloque9_save_v3', s = JSON.parse(localStorage.getItem(k));
      delete s.style; delete s.wardrobe; delete s.policeMemory;
      localStorage.setItem(k, JSON.stringify(s));
    });
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    expect(await mod(page, A, (m) => m.style())).toEqual({ hair: 'orig', beard: 'none', worn: {} });
    // sin la mochila sobran huecos, pero el que tenía tierra no se borra nunca
    expect(await ev(page, () => __G.state.inv.length)).toBe(13);
    expect(await ev(page, () => __G.state.inv[12]?.id)).toBe('tierra');
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
