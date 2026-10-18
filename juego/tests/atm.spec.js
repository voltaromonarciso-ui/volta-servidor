// Cajeros: efectivo ↔ tarjeta; los ingresos tienen un tope de 10.000 $ por semana de juego
// que no se puede pasar; sacar es libre; sin avisos a la policía.
import { test, expect } from '@playwright/test';
import { newGame, watchErrors, mod, ev } from './helpers.js';

const atm = (page, dir, n) => mod(page, '/src/systems/atm.js', (m, a) => m.atmMove(a[0], a[1]), [dir, n]);

test('cajero: ingresos con tope semanal, retiradas libres', async ({ page }, testInfo) => {
  test.setTimeout(10 * 60_000);
  const errors = watchErrors(page);
  await newGame(page, testInfo);
  await ev(page, () => { __G.state.money = 15000; __G.state.clean = 0; __G.state.atm = null; });

  expect(await atm(page, 'in', 1500)).toMatchObject({ ok: true, amount: 1500 });
  // «Todo» se recorta a lo que queda del tope (8.500)
  expect(await atm(page, 'in', 1e9)).toMatchObject({ ok: true, amount: 8500 });
  expect(await ev(page, () => [__G.state.money, __G.state.clean])).toEqual([5000, 10000]);
  // tope alcanzado: no se puede ingresar ni un dólar más
  const r = await atm(page, 'in', 1);
  expect(r.ok).toBe(false);
  expect(r.msg).toContain('máximo');
  expect(await ev(page, () => [__G.state.money, __G.state.clean])).toEqual([5000, 10000]);
  // sacar no tiene tope, ni siquiera con el de ingresos agotado
  expect(await atm(page, 'out', 7000)).toMatchObject({ ok: true, amount: 7000 });
  expect(await atm(page, 'out', 1e9)).toMatchObject({ ok: true, amount: 3000 });
  expect(await ev(page, () => [__G.state.money, __G.state.clean])).toEqual([15000, 0]);
  // y sacar no devuelve hueco para ingresar
  expect((await atm(page, 'in', 100)).ok).toBe(false);

  // semana nueva: el tope vuelve a 10.000
  await ev(page, () => { __G.state.day += 7; });
  expect(await mod(page, '/src/systems/atm.js', (m) => m.atmLeft())).toBe(10000);
  expect(await atm(page, 'in', 600)).toMatchObject({ ok: true, amount: 600 });

  // sin dinero no hay operación
  await ev(page, () => { __G.state.clean = 0; });
  expect((await atm(page, 'out', 100)).ok).toBe(false);

  // ninguna patrulla se mueve por usar el cajero
  expect(await ev(page, () => __G.police.some((c) => c.mode === 'approach' || c.mode === 'chase'))).toBe(false);
  // los movimientos quedan en el historial
  expect(await ev(page, () => __G.state.ledger.filter((e) => /cajero/.test(e.reason)).length)).toBe(10);
  expect(errors).toEqual([]);
});
