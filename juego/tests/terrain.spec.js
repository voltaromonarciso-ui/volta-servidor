// Isla de Rooktown con relieve: el suelo sube y baja, y todo (jugador, gente, coches,
// edificios, árboles) se apoya en él sin flotar ni enterrarse.
import { test, expect } from '@playwright/test';
import { press, frames } from './helpers.js';

test.describe.serial('Relieve de la isla', () => {
  let page;
  const errors = [];
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
  });
  test.afterAll(async () => { await page?.context().close(); });

  test('la isla es el mapa por defecto y arranca', async ({}, testInfo) => {
    test.setTimeout(20 * 60_000);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 600_000 });
    await press(page, testInfo, '#m-new');
    await press(page, testInfo, '.cr-go');
    await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 600_000 });
    await press(page, testInfo, '.panel .btn');
    expect(await page.evaluate(() => !!__G.world.atms && __G.world.zones.length)).toBe(28);
  });

  test('hay una colina clara, calles en cuesta y la costa queda a ras del mar', async () => {
    const r = await page.evaluate(() => {
      const H = __G.world.groundAt;
      let min = 1e9, max = -1e9, steep = 0, road = 0;
      const onRoad = (x, z) => (__G.world.roadsX.some((r) => Math.abs(x - r) < 6.5) && Math.abs(z) < 127) || (__G.world.roadsZ.some((r) => Math.abs(z - r) < 6.5) && Math.abs(x) < 217);
      for (let x = -200; x <= 200; x += 2) for (let z = -110; z <= 110; z += 2) {
        const h = H(x, z); min = Math.min(min, h); max = Math.max(max, h);
        const s = Math.max(Math.abs(H(x + 1, z) - h), Math.abs(H(x, z + 1) - h));
        steep = Math.max(steep, s); if (onRoad(x, z)) road = Math.max(road, s);
      }
      // en la misma orilla (el borde de la isla) el terreno queda a nivel del mar
      return { range: max - min, steep, road, coast: [H(-249.6, 0), H(249.6, 0), H(0, 167.6), H(0, -164.6)] };
    });
    expect(r.range).toBeGreaterThan(12); // colina de unos 15 m
    expect(r.road).toBeLessThan(0.25); // calles: cuestas claras, como mucho ~22 %
    expect(r.steep).toBeLessThan(1.0); // taludes de césped junto a algún solar
    for (const h of r.coast) expect(h).toBeLessThan(0.02);
  });

  test('los edificios están en solares llanos', async () => {
    const bad = await page.evaluate(() => {
      const H = __G.world.groundAt, out = [];
      // (el rectángulo del mapa incluye toldos y rótulos que vuelan sobre la acera: se recorta)
      const W = __G.world, cut = 6.9, inBlock = (x, z) => !W.roadsX.some((v) => Math.abs(x - v) < cut) && !W.roadsZ.some((v) => Math.abs(z - v) < cut);
      for (const q of W.mapRects.filter((q) => !q.road && !q.zone && (q.x1 - q.x0) * (q.z1 - q.z0) < 4000)) {
        const r = { ...q };
        for (const v of W.roadsX) if (r.x0 < v + cut && r.x1 > v - cut) { if ((r.x0 + r.x1) / 2 > v) r.x0 = v + cut; else r.x1 = v - cut; }
        for (const v of W.roadsZ) if (r.z0 < v + cut && r.z1 > v - cut) { if ((r.z0 + r.z1) / 2 > v) r.z0 = v + cut; else r.z1 = v - cut; }
        if (r.x1 - r.x0 < 1 || r.z1 - r.z0 < 1 || !inBlock((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2)) continue;
        const hs = [[r.x0 + 0.2, r.z0 + 0.2], [r.x1 - 0.2, r.z0 + 0.2], [r.x0 + 0.2, r.z1 - 0.2], [r.x1 - 0.2, r.z1 - 0.2], [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]].map(([x, z]) => H(x, z));
        if (Math.max(...hs) - Math.min(...hs) > 0.02) out.push(r);
      }
      return out.length;
    });
    expect(bad).toBe(0);
  });

  test('el jugador anda cuesta arriba y abajo pegado al suelo', async ({}, testInfo) => {
    const H = (x, z) => page.evaluate(([x, z]) => __G.world.groundAt(x, z), [x, z]);
    // la calle norte-sur de la avenida central, de una punta a otra
    await page.evaluate(() => { __G.police.forEach((c) => c.pos.set(900, 0, 900)); __G.player.teleport(-30.5, -100, Math.PI); });
    await frames(page, 5);
    const gaps = [];
    for (let k = 0; k < 6; k++) {
      await page.evaluate(() => { __G.player.vel.set(0, 0, 0); });
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(1500);
      await page.keyboard.up('KeyW');
      await frames(page, 4);
      const p = await page.evaluate(() => ({ x: __G.player.pos.x, y: __G.player.pos.y, z: __G.player.pos.z }));
      gaps.push(Math.abs(p.y - (await H(p.x, p.z))));
    }
    const p = await page.evaluate(() => __G.player.pos.z);
    expect(p).toBeGreaterThan(-90); // ha avanzado
    for (const g of gaps) expect(g).toBeLessThan(0.05);
    await page.screenshot({ path: testInfo.outputPath('cuesta.png') });
  });

  test('gente y coches de pie sobre el suelo', async () => {
    await frames(page, 30);
    const r = await page.evaluate(() => {
      const H = __G.world.groundAt;
      const cars = __G.cars.map((c) => Math.abs(c.g.position.y - H(c.g.position.x, c.g.position.z)));
      const npcs = __G.npcs.filter((n) => n.g.visible).map((n) => Math.abs(n.pos.y - H(n.pos.x, n.pos.z)));
      return { cars: Math.max(0, ...cars), nc: cars.length, npcs: Math.max(0, ...npcs) };
    });
    expect(r.nc).toBeGreaterThan(0);
    expect(r.cars).toBeLessThan(0.12);
    expect(r.npcs).toBeLessThan(0.02);
  });

  test('árboles y palmeras: en el césped, ninguno en las aceras', async () => {
    const r = await page.evaluate(() => ({ g: __G.world.greenCount, onWalk: __G.world.treeSpots.filter(([x, z]) => __G.world.roadsX.some((rx) => Math.abs(x - rx) < 7) && z > -127 && z < 127 || __G.world.roadsZ.some((rz) => Math.abs(z - rz) < 7) && x > -217 && x < 217).length }));
    expect(r.g.trees).toBeGreaterThan(80);
    expect(r.g.bushes).toBeGreaterThan(100);
    expect(r.onWalk).toBe(0);
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
