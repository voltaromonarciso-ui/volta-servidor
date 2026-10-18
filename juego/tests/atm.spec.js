// Cajeros: efectivo ↔ tarjeta, límite semanal de 10.000 $ y aviso del banco por ingresos grandes.
import { test, expect } from '@playwright/test';
import { newGame, watchErrors, mod, ev } from './helpers.js';

test('cajero: ingresos, retiradas, límite semanal y aviso a la policía', async ({ page }, testInfo) => {
  test.setTimeout(10 * 60_000);
  const errors = watchErrors(page);
  await newGame(page, testInfo);
  await ev(page, () => { __G.state.money = 15000; __G.state.clean = 0; __G.state.atm = null; });

  // ingreso pequeño: sin riesgo de aviso
  let r = await mod(page, '/src/systems/atm.js', (m) => m.atmMove('in', 1500, () => 0));
  expect(r).toMatchObject({ ok: true, amount: 1500, alert: false });
  // «Todo» se recorta al límite que queda (8.500)
  r = await mod(page, '/src/systems/atm.js', (m) => m.atmMove('in', 1e9, () => 1));
  expect(r).toMatchObject({ ok: true, amount: 8500 });
  expect(await ev(page, () => [__G.state.money, __G.state.clean])).toEqual([5000, 10000]);
  // límite alcanzado: ni ingresos ni retiradas
  r = await mod(page, '/src/systems/atm.js', (m) => m.atmMove('out', 100));
  expect(r.ok).toBe(false);
  expect(r.msg).toContain('límite');

  // semana nueva: se puede sacar otra vez
  await ev(page, () => { __G.state.day += 7; });
  r = await mod(page, '/src/systems/atm.js', (m) => m.atmMove('out', 600));
  expect(r).toMatchObject({ ok: true, amount: 600 });
  expect(await ev(page, () => [__G.state.money, __G.state.clean])).toEqual([5600, 9400]);
  expect(await mod(page, '/src/systems/atm.js', (m) => m.atmLeft())).toBe(9400);

  // sin dinero no hay operación (y nada cambia)
  await ev(page, () => { __G.state.money = 0; });
  r = await mod(page, '/src/systems/atm.js', (m) => m.atmMove('in', 100));
  expect(r.ok).toBe(false);
  expect(await ev(page, () => __G.state.clean)).toBe(9400);

  // probabilidad de aviso: 0 por debajo de 2.000 y creciente después
  const p = await mod(page, '/src/systems/atm.js', (m) => [m.suspicionChance(1999), m.suspicionChance(2000), m.suspicionChance(6000), m.suspicionChance(50000)]);
  expect(p[0]).toBe(0);
  expect(p[1]).toBeGreaterThan(0);
  expect(p[2]).toBeGreaterThan(p[1]);
  expect(p[3]).toBeLessThanOrEqual(0.85);

  // ingreso grande con aviso: una patrulla viene a por ti
  await ev(page, () => { __G.state.money = 5000; __G.police.forEach((c) => { c.mode = 'patrol'; }); });
  r = await mod(page, '/src/systems/atm.js', (m) => m.atmMove('in', 4000, () => 0));
  expect(r).toMatchObject({ ok: true, amount: 4000, alert: true });
  expect(await ev(page, () => __G.police.some((c) => c.mode === 'approach'))).toBe(true);

  // los movimientos quedan en el historial
  const led = await ev(page, () => __G.state.ledger.filter((e) => /cajero/.test(e.reason)).length);
  expect(led).toBeGreaterThanOrEqual(8);
  expect(errors).toEqual([]);
});
