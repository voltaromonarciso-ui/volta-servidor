// Los negocios tapadera por dentro: la Lavandería Espuma y el Lavadero son locales huecos a los
// que se entra andando desde la calle; al fondo, la oficina del dueño (cerrada si no es tuyo) con
// el ordenador desde el que se blanquea el dinero.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, press } from './helpers.js';

test.describe.serial('Negocios tapadera por dentro', () => {
  let page, errors;
  test.beforeAll(async ({ browser }, testInfo) => {
    const ctx = await browser.newContext(testInfo.project.use);
    page = await ctx.newPage();
    errors = watchErrors(page);
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('partida nueva: los dos locales están montados', async ({}, testInfo) => {
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
    const ids = await ev(page, () => (__G.world.fronts || []).map((f) => f.id).sort());
    expect(ids).toEqual(['lavadero', 'lavanderia']);
  });

  for (const id of ['lavanderia', 'lavadero']) {
    test(`${id}: se entra andando por la puerta de la calle`, async () => {
      const r = await ev(page, async (id) => {
        const { input } = await import('/src/core/input.js');
        const P = __G.player, F = __G.world.fronts.find((f) => f.id === id), poi = __G.world.pois[id];
        // abrir la puerta de la calle (la más cercana al punto de entrada)
        const door = __G.world.doors.reduce((a, d) => (Math.hypot(d.pivot.position.x - poi.x, d.pivot.position.z - poi.z) < Math.hypot(a.pivot.position.x - poi.x, a.pivot.position.z - poi.z) ? d : a));
        door.open = true; door.col.on = false;
        P.teleport(poi.x, poi.z + 1.5, Math.PI);
        P.yaw = 0; // hacia −z: hacia dentro
        for (let i = 0; i < 90; i++) { input.my = 1; input.mx = 0; P.update(1 / 30); }
        input.my = 0;
        return { inside: P.pos.x > F.x0 && P.pos.x < F.x1 && P.pos.z > F.z0 && P.pos.z < F.z1, z: P.pos.z - F.z1 };
      }, id);
      expect(r.inside).toBe(true);
    });
  }

  test('la oficina está cerrada si el negocio no es tuyo y se abre al comprarlo', async () => {
    const lock = await ev(page, () => {
      const F = __G.world.fronts.find((f) => f.id === 'lavanderia');
      const d = __G.world.doors.reduce((a, q) => (Math.hypot(q.pivot.position.x - F.office.x, q.pivot.position.z - F.office.z) < Math.hypot(a.pivot.position.x - F.office.x, a.pivot.position.z - F.office.z) ? q : a));
      window.__ofDoor = d;
      return d.locked();
    });
    expect(lock).toBe(true);
    const r = await ev(page, async () => {
      __G.state.clean = 20000;
      const f = await import('/src/systems/fronts.js');
      return f.buyFront('lavanderia').ok;
    });
    expect(r).toBe(true);
    expect(await ev(page, () => window.__ofDoor.locked())).toBe(false);
  });

  test('el ordenador de la oficina abre el programa de blanqueo (sólo en tu negocio)', async ({}, testInfo) => {
    const acts = await ev(page, () => {
      const out = {};
      for (const F of __G.world.fronts) {
        const hb = __G.interactables.find((m) => Math.hypot(m.position.x - F.pc.x, m.position.z - F.pc.z) < 0.05);
        const a = hb?.userData.ia?.actions; out[F.id] = (typeof a === 'function' ? a() : a || []).map((x) => x.label);
      }
      return out;
    });
    expect(acts.lavanderia).toEqual(['Usar el ordenador (blanqueo)']);
    expect(acts.lavadero).toEqual([]);
    await ev(page, () => { __G.state.money = 1000; const F = __G.world.fronts.find((f) => f.id === 'lavanderia'); const hb = __G.interactables.find((m) => Math.hypot(m.position.x - F.pc.x, m.position.z - F.pc.z) < 0.05); hb.userData.ia.actions()[0].fn(); });
    await press(page, testInfo, '.panel .chip:has-text("Todo")');
    await press(page, testInfo, '.panel .btn:has-text("Blanquear")');
    expect(await ev(page, () => [__G.state.money, __G.state.clean])).toEqual([0, 20000 - 12000 + 900]);
  });

  test('sin errores en la página', async () => {
    expect(errors.filter((e) => !/Failed to fetch|No se pudo cargar/.test(e))).toEqual([]);
  });
});
