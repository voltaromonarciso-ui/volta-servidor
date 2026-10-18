// Fase 4, bloque A: empleados. Contratar/despedir con el dedo desde el móvil del juego;
// el trabajo, la nómina y el guardado se comprueban con los módulos reales y el reloj del
// juego (con la partida en pausa para que el tiempo solo avance cuando la prueba lo pide).
import { test, expect } from '@playwright/test';
import { watchErrors, ev, mod, press, frames, newGame } from './helpers.js';

const S = '/src/systems/staff.js';
const OB = '/src/systems/objects.js';
const money = (page) => ev(page, () => __G.state.money);
const emp = (page, cid) => ev(page, (cid) => __G.state.employees.find((e) => e.cid === cid) || null, cid);
const advance = (page, min) => ev(page, (m) => __debug.advanceTime(m), min);
// estantería de prueba: contenido por id (sumando productos)
const shelf = (page, uid) => ev(page, (uid) => { const t = {}; for (const s of __G.objects.get(uid).entry.data.slots) if (s) t[s.id + (s.p ? ':' + s.p : '')] = (t[s.id + (s.p ? ':' + s.p : '')] || 0) + s.q; return t; }, uid);
const setShelf = (page, uid, items) => ev(page, ([uid, items]) => { const sl = __G.objects.get(uid).entry.data.slots; sl.fill(null); items.forEach((x, i) => { sl[i] = x; }); }, [uid, items]);
const at = (page, day, minute) => ev(page, ([d, m]) => { __G.state.day = d; __G.state.minute = m; for (const e of __G.state.employees) { e.clock = (d - 1) * 1440 + m; e.wake = null; } }, [day, minute]);

test.describe.serial('Empleados: contratar, trabajar, cobrar y guardar', () => {
  let page, errors, sh, packer, stove;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva sin empleados y app Personal en el móvil', async ({}, testInfo) => {
    await newGame(page, testInfo);
    await ev(page, () => { __G.state.inv = __G.state.inv.map((s) => (s && s.id === 'caja' ? null : s)); __G.state.minute = 9 * 60; });
    expect(await ev(page, () => __G.state.employees)).toEqual([]);
    await ev(page, () => __G.act.openPhone());
    await press(page, testInfo, '.ph-app:has-text("Personal")');
    await expect(page.locator('.staff .cand')).toHaveCount(5);
  });

  test('contratar sin dinero no hace nada', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 50; });
    await press(page, testInfo, '.cand[data-cid="ines"] .btn');
    expect(await money(page)).toBe(50);
    expect(await ev(page, () => __G.state.employees.length)).toBe(0);
  });

  test('contratar con dinero cobra una sola vez', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 1000; });
    await press(page, testInfo, '.cand[data-cid="ines"] .btn');
    await expect.poll(() => money(page)).toBe(900);
    await expect(page.locator('.staff .emp[data-cid="ines"]')).toBeVisible();
    await page.screenshot({ path: `tests/.results/emp-${testInfo.project.name}-personal.png` });
    const again = await mod(page, S, (m) => m.hire('ines', 'nave'));
    expect(again.ok).toBe(false);
    expect(await money(page)).toBe(900);
    const e = await emp(page, 'ines');
    expect([e.role, e.prop, e.paidDay, e.debt]).toEqual(['envasado', 'nave', 1, 0]);
    await ev(page, async () => (await import('/src/ui/phone.js')).closePhone());
  });

  test('asignaciones inválidas se rechazan', async () => {
    const r = await mod(page, S, (m) => {
      const e = __G.state.employees[0];
      return { other: m.assign(e.uid, 'bungalow').ok, hireOther: m.hire('nerea', 'bungalow').ok, prop: e.prop, n: __G.state.employees.length };
    });
    expect(r).toEqual({ other: false, hireOther: false, prop: 'nave', n: 1 });
  });

  test('envasado: usa la mesa y las estanterías de su propiedad, sin duplicar', async () => {
    await ev(page, () => { __G.paused = true; });
    const ids = await mod(page, OB, (m) => ({ sh: m.placeObject('shelf', -72, -60, 0).entry.uid, packer: m.placeObject('packer', -72, -56, 0).entry.uid }));
    sh = ids.sh; packer = ids.packer;
    await setShelf(page, sh, [{ id: 'cogollo', q: 3, p: 'brisa' }, { id: 'bolsita', q: 2 }]);
    await at(page, 1, 9 * 60);
    await advance(page, 30);
    expect(await shelf(page, sh)).toEqual({ 'cogollo:brisa': 1, 'bolsa:brisa': 2 });
    const e = await emp(page, 'ines');
    expect(e.status).toBe('material');
    expect(e.reason).toContain('sobres');
    expect(e.made).toBe(2);
    // sin materiales no pasa nada más, por mucho tiempo que pase
    await advance(page, 120);
    expect(await shelf(page, sh)).toEqual({ 'cogollo:brisa': 1, 'bolsa:brisa': 2 });
  });

  test('envasado: sin hueco para el resultado se para sin gastar nada', async () => {
    const full = [{ id: 'cogollo', q: 1, p: 'brisa' }, { id: 'bolsita', q: 1 }, ...Array(10).fill(0).map(() => ({ id: 'tierra', q: 10 }))];
    await setShelf(page, sh, full);
    await ev(page, () => { const e = __G.state.employees[0]; e.wake = null; e.task = null; });
    await advance(page, 30);
    expect(await shelf(page, sh)).toEqual({ 'cogollo:brisa': 1, bolsita: 1, tierra: 100 });
    expect((await emp(page, 'ines')).status).toBe('espacio');
  });

  test('cultivo: riega y cosecha con recursos reales', async () => {
    await setShelf(page, sh, []);
    await ev(page, () => { __G.state.money = 1000; });
    expect((await mod(page, S, (m) => m.hire('nerea', 'nave'))).ok).toBe(true);
    const pots = await mod(page, OB, (m) => {
      const a = m.placeObject('pot', -75, -60, 0), b = m.placeObject('pot', -75, -57, 0);
      Object.assign(a.entry.data, { soil: 1, strain: 'brisa', growth: 1, water: 0.5, fert: 0 });
      Object.assign(b.entry.data, { soil: 1, strain: 'brisa', growth: 0.3, water: 0, fert: 0 });
      return [a.entry.uid, b.entry.uid];
    });
    await at(page, 1, 10 * 60);
    await advance(page, 30);
    const [a, b] = await ev(page, (u) => u.map((x) => __G.objects.get(x).entry.data), pots);
    expect(a.strain).toBe(null);           // cosechada y vacía
    expect(b.water).toBeGreaterThan(0.9);  // regada
    const got = (await shelf(page, sh))['cogollo:brisa'];
    expect(got).toBeGreaterThanOrEqual(8);
    expect(got).toBeLessThanOrEqual(11);
    expect((await emp(page, 'nerea')).made).toBe(got);
    // ya no hay nada que cosechar: no aparecen más cogollos
    await advance(page, 60);
    expect((await shelf(page, sh))['cogollo:brisa']).toBe(got);
    await ev(page, (u) => u.forEach((x) => __debug.panels && __G.objects.get(x) && (__G.objects.get(x).entry.data.strain = null)), pots);
  });

  test('cocina: tanda real del hornillo y cristales a la estantería', async () => {
    await ev(page, () => { __G.state.rank = 2; __G.state.money = 1000; });
    expect((await mod(page, S, (m) => m.hire('mateo', 'nave'))).ok).toBe(true);
    stove = await mod(page, OB, (m) => m.placeObject('stove', -69, -60, 0).entry.uid);
    // faltan ingredientes: espera
    await setShelf(page, sh, [{ id: 'azucar', q: 1 }]);
    await at(page, 1, 10 * 60);
    await advance(page, 15);
    expect((await emp(page, 'mateo')).status).toBe('material');
    // con la receta completa: pone la tanda y gasta justo la receta
    await setShelf(page, sh, [{ id: 'azucar', q: 3 }, { id: 'colorante', q: 1 }, { id: 'catalizador', q: 1 }]);
    await mod(page, S, (m) => m.pokeStaff());
    await advance(page, 15);
    expect(await shelf(page, sh)).toEqual({ azucar: 1 });
    expect(await ev(page, (u) => !!__G.objects.get(u).entry.data.batch, stove)).toBe(true);
    // 2 h de cocción después, los 6 cristales están en la estantería
    await advance(page, 130);
    expect(await shelf(page, sh)).toEqual({ azucar: 1, 'cristal:shards': 6 });
    expect(await ev(page, (u) => __G.objects.get(u).entry.data.batch, stove)).toBe(null);
    await advance(page, 120);
    expect((await shelf(page, sh))['cristal:shards']).toBe(6);
  });

  test('despedir a media tarea: no produce ni gasta nada', async () => {
    await setShelf(page, sh, [{ id: 'cogollo', q: 2, p: 'brisa' }, { id: 'bolsita', q: 2 }]);
    await mod(page, S, (m) => m.pokeStaff());
    await at(page, 1, 12 * 60);
    await advance(page, 3); // a mitad de un sobre (6 min)
    expect(!!(await emp(page, 'ines')).task).toBe(true);
    const r = await mod(page, S, (m) => m.fire(__G.state.employees.find((e) => e.cid === 'ines').uid));
    expect(r.ok).toBe(true);
    await advance(page, 60);
    expect(await shelf(page, sh)).toEqual({ 'cogollo:brisa': 2, bolsita: 2 });
    expect(await emp(page, 'ines')).toBe(null);
  });

  test('nómina: a las 7:00, una vez por día, también al dormir', async () => {
    const wages = 55 + 90; // Nerea + Mateo
    await ev(page, () => { __G.state.money = 1000; });
    await at(page, 2, 6 * 60 + 50);
    await advance(page, 5);
    expect(await money(page)).toBe(1000);       // aún no son las 7
    await advance(page, 10);
    expect(await money(page)).toBe(1000 - wages);
    await advance(page, 180);
    expect(await money(page)).toBe(1000 - wages); // no se cobra dos veces el mismo día
    // dormir hasta el día siguiente cobra una vez
    await ev(page, () => { __G.state.minute = 22 * 60; });
    await ev(page, () => __G.act.sleep('nave'));
    await page.waitForFunction(() => document.querySelector('.panel'), null, { timeout: 60_000 });
    expect(await ev(page, () => __G.state.day)).toBe(3);
    expect(await money(page)).toBe(1000 - 2 * wages);
    await ev(page, () => __debug.panels.closePanel(true));
  });

  test('sin dinero: no cobra, deja de trabajar, se paga la deuda y vuelve', async () => {
    await ev(page, () => { __G.state.money = 40; });
    await at(page, 4, 6 * 60 + 55);
    await advance(page, 10);
    expect(await money(page)).toBe(40);             // todo o nada: no se cobra a medias
    const m = await emp(page, 'mateo');
    expect([m.status, m.owed, m.debt]).toEqual(['sin_pago', 1, 90]);
    const n = await emp(page, 'nerea');
    expect([n.owed, n.debt]).toEqual([1, 55]);
    // sin cobrar no trabaja: deja sus cosas tal cual
    await setShelf(page, sh, [{ id: 'azucar', q: 2 }, { id: 'colorante', q: 1 }, { id: 'catalizador', q: 1 }]);
    await advance(page, 60);
    expect(await shelf(page, sh)).toEqual({ azucar: 2, colorante: 1, catalizador: 1 });
    // pagar la deuda desde el móvil (con el dedo)
    await ev(page, () => { __G.state.money = 500; });
    await ev(page, () => __G.act.openPhone('staff'));
    await frames(page, 2);
  });

  test('pagar la deuda en el móvil reactiva al empleado', async ({}, testInfo) => {
    await press(page, testInfo, '.emp[data-cid="mateo"] .btn:has-text("Pagar deuda")');
    expect(await money(page)).toBe(410);
    expect((await emp(page, 'mateo')).debt).toBe(0);
    await ev(page, async () => (await import('/src/ui/phone.js')).closePhone());
    await advance(page, 20);
    expect(await shelf(page, sh)).toEqual({});
    expect(await ev(page, (u) => !!__G.objects.get(u).entry.data.batch, stove)).toBe(true);
  });

  test('dos días sin cobrar: se va; si es poco discreto, da tu descripción', async () => {
    // Nerea sigue debiendo 1 día; al siguiente sin dinero se marcha
    await ev(page, () => { __G.state.money = 0; __G.state.policeMemory = null; window.__rnd = Math.random; Math.random = () => 0; });
    await at(page, 5, 6 * 60 + 55);
    await advance(page, 10);
    await ev(page, () => { Math.random = window.__rnd; });
    expect(await emp(page, 'nerea')).toBe(null);
    expect(await ev(page, () => !!__G.state.policeMemory)).toBe(true);
    // Mateo (1 día debido) sigue contratado y sin trabajar
    expect((await emp(page, 'mateo')).status).toBe('sin_pago');
    // con suerte (o lealtad), irse no siempre trae consecuencias
    await ev(page, () => { __G.state.policeMemory = null; window.__rnd = Math.random; Math.random = () => 0.99; });
    await at(page, 6, 6 * 60 + 55);
    await advance(page, 10);
    await ev(page, () => { Math.random = window.__rnd; });
    expect(await emp(page, 'mateo')).toBe(null);
    expect(await ev(page, () => __G.state.policeMemory)).toBe(null);
  });

  test('guardar antes del pago y cargar: se cobra una vez; cerrar no lo evita', async ({}, testInfo) => {
    await ev(page, () => { __G.state.money = 1000; });
    expect((await mod(page, S, (m) => m.hire('ines', 'nave'))).ok).toBe(true);
    await at(page, 7, 6 * 60 + 45);
    await advance(page, 1);
    await mod(page, '/src/core/state.js', (m) => m.save());
    const before = await ev(page, () => JSON.stringify(__G.state.employees.map(({ clock, wake, ...e }) => e)));
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    await ev(page, () => { __G.paused = true; });
    const after = await ev(page, () => JSON.stringify(__G.state.employees.map(({ clock, wake, ...e }) => e)));
    expect(after).toEqual(before);
    expect(await money(page)).toBe(900);
    // con la partida cerrada el reloj no avanzó: el pago sigue pendiente y llega al jugar
    expect(await ev(page, () => __G.state.minute < 7 * 60)).toBe(true);
    await advance(page, 20);
    expect(await money(page)).toBe(850);
    // guardar después del pago y cargar no vuelve a cobrar
    await mod(page, '/src/core/state.js', (m) => m.save());
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    await ev(page, () => { __G.paused = true; });
    await advance(page, 60);
    expect(await money(page)).toBe(850);
  });

  test('cargar: sin duplicados y con propiedades inválidas marcadas', async ({}, testInfo) => {
    await ev(page, () => {
      const k = 'bloque9_save_v3', s = JSON.parse(localStorage.getItem(k));
      s.employees.push({ ...s.employees[0], uid: 999 });                                   // duplicado
      s.employees.push({ uid: 998, cid: 'nadie', role: 'cultivo', prop: 'nave' });         // candidato inexistente
      s.employees.push({ ...s.employees[0], uid: 997, cid: 'dani', prop: 'bungalow' });     // propiedad que no tienes
      localStorage.setItem(k, JSON.stringify(s));
    });
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    await ev(page, () => { __G.paused = true; });
    expect(await ev(page, () => __G.state.employees.map((e) => e.cid))).toEqual(['ines', 'dani']);
    expect((await emp(page, 'dani')).status).toBe('sin_propiedad');
    // y no trabaja ni toca nada de la nave
    await setShelf(page, sh, [{ id: 'cogollo', q: 1, p: 'brisa' }, { id: 'bolsita', q: 1 }]);
    await mod(page, S, (m) => { const d = __G.state.employees.find((e) => e.cid === 'dani'); m.fire(__G.state.employees.find((e) => e.cid === 'ines').uid); return d; });
    await at(page, 7, 12 * 60);
    await advance(page, 60);
    expect(await shelf(page, sh)).toEqual({ 'cogollo:brisa': 1, bolsita: 1 });
  });

  test('partidas antiguas sin empleados cargan', async ({}, testInfo) => {
    await ev(page, () => {
      const k = 'bloque9_save_v3', s = JSON.parse(localStorage.getItem(k));
      delete s.employees;
      localStorage.setItem(k, JSON.stringify(s));
    });
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
    await press(page, testInfo, '#m-continue');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
    expect(await ev(page, () => __G.state.employees)).toEqual([]);
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
