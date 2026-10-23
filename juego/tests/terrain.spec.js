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
      const H = __G.world.terrainH; // el terreno (sin los suelos elevados de escaleras y pisos)
      let min = 1e9, max = -1e9, steep = 0, road = 0;
      const W = __G.world, dRoad = (x, z) => Math.min(...W.roadsX.map((r) => (Math.abs(z) < 127 ? Math.abs(x - r) : 1e9)), ...W.roadsZ.map((r) => (Math.abs(x) < 217 ? Math.abs(z - r) : 1e9)));
      for (let x = -200; x <= 200; x += 2) for (let z = -110; z <= 110; z += 2) {
        const h = H(x, z); min = Math.min(min, h); max = Math.max(max, h);
        const s = Math.max(Math.abs(H(x + 1, z) - h), Math.abs(H(x, z + 1) - h));
        const d = dRoad(x, z);
        // el borde de un solar llano con desnivel es un muro de contención, no un talud
        const padEdge = W.pads.some((p) => (x - 0.6 < p.x1 && x + 1.6 > p.x0 && z - 0.6 < p.z1 && z + 1.6 > p.z0) && !(x - 0.6 > p.x0 && x + 1.6 < p.x1 && z - 0.6 > p.z0 && z + 1.6 < p.z1));
        if (d < 5.5) road = Math.max(road, s); // calzada y acera
        else if (d > 7.8 && !padEdge) steep = Math.max(steep, s); // dentro de las manzanas (el borde con la acera es un muro)
      }
      // en la misma orilla (el borde de la isla) el terreno queda a nivel del mar
      return { range: max - min, steep, road, walls: W.wallCount, coast: W.coastPoly.land.filter((q, i) => i % 9 === 0).map(([x, z]) => H(x, z)) }; // por toda la orilla (con sus cabos)
    });
    expect(r.range).toBeGreaterThan(5); // colina en terrazas: dos niveles de 3 m sobre la costa
    expect(r.road).toBeLessThan(0.25); // calles: cuestas claras, como mucho ~22 %
    expect(r.steep).toBeLessThan(1.0); // taludes de césped junto a algún solar
    expect(r.walls).toBeGreaterThan(0); // los escalones entre acera y manzana llevan muro de contención
    for (const h of r.coast) expect(h).toBeLessThan(0.02);
  });

  test('los edificios están en solares llanos', async () => {
    const bad = await page.evaluate(() => {
      const H = __G.world.terrainH, out = [];
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

  test('la costa tiene forma (cabos y calas), ningún edificio en el agua y no se sale al mar', async () => {
    const r = await page.evaluate(() => {
      const W = __G.world, sd = W.shoreDist, P = __G.player;
      const wet = W.footprints.filter((f) => f.z0 < 130 && [[f.x0, f.z0], [f.x1, f.z0], [f.x0, f.z1], [f.x1, f.z1]].some(([x, z]) => sd(x, z) < 1)).length;
      const out = [[-300, 22], [300, -32], [0, -200]].map(([x, z]) => { P.teleport(x, z, 0); P.update(1 / 30); return sd(P.pos.x, P.pos.z); });
      const s = W.furnitureStats, sp = W.props.piso.spawn;
      P.teleport(sp.x, sp.z, sp.yaw); // de vuelta al piso (las pruebas siguientes empiezan ahí)
      return { wet, out, cape: sd(-268, 22), bay: sd(-32, -163), s };
    });
    expect(r.wet).toBe(0);
    for (const d of r.out) expect(d).toBeGreaterThan(-7.5); // como mucho unos metros dentro del agua
    expect(r.cape).toBeGreaterThan(0); // la península del oeste sale más allá del borde recto
    expect(r.bay).toBeLessThan(0); // y en la cala el mar entra
    expect(r.s.skipped).toBeGreaterThan(0); // en las cuestas se quitan los objetos que sobran
  });

  test('ningún edificio se mete dentro de otro', async () => {
    const r = await page.evaluate(() => ({ n: __G.world.footprints.length, ov: __G.world.footOverlaps }));
    expect(r.n).toBeGreaterThan(80);
    expect(r.ov).toEqual([]);
  });

  test('piso inicial: empiezas dentro, en la 1.ª planta, con Leo', async () => {
    const r = await page.evaluate(() => {
      const W = __G.world, p = __G.player.pos, s = __G.state;
      return { home: s.home, props: s.props, inside: W.inProperty(p.x, p.z), up: p.y - W.terrainH(p.x, p.z), caja: s.inv.some((x) => x && x.id === 'caja') };
    });
    expect(r.home).toBe('piso');
    expect(r.props.piso).toBe(true);
    expect(r.props.nave).toBe(false); // la nave de Leo es ahora el Almacén Bravo (no es tuya)
    expect(r.inside).toBe('piso');
    expect(r.up).toBeGreaterThan(3); // primera planta
    expect(r.caja).toBe(true);
  });

  test('piso inicial: se sube por la escalera del portal y se entra por la puerta', async () => {
    const r = await page.evaluate(async () => {
      const { input } = await import('/src/core/input.js');
      const W = __G.world, P = __G.player, pis = W.props.piso, log = [];
      // del portal (planta baja) escaleras arriba hasta el rellano de la 1.ª
      const px = W.pois.piso.x, pz = W.pois.piso.z;
      const door = W.doors.find((d) => Math.hypot(d.pivot.position.x - (px - 0.65), d.pivot.position.z - (pz - 1.75)) < 1.5);
      if (door) { door.open = true; door.col.on = false; }
      P.teleport(px, pz - 3, 0);
      const y0 = P.pos.y - W.terrainH(P.pos.x, P.pos.z);
      const walk = (n, yaw) => { P.yaw = yaw; for (let i = 0; i < n; i++) { input.my = 1; input.mx = 0; P.update(1 / 30); } input.my = 0; };
      walk(150, 0);
      const top = { up: P.pos.y - W.terrainH(P.pos.x, P.pos.z), z: P.pos.z };
      // la puerta del piso, en el rellano: abrirla y entrar
      const fd = W.doors.filter((d) => d.pivot.position.x > px && d.pivot.position.x < pis.x0 + 0.5 && Math.abs(d.pivot.position.y - P.pos.y) < 0.3)[0];
      if (fd) { fd.open = true; fd.col.on = false; P.pos.z = fd.pivot.position.z + 0.65; }
      walk(60, -Math.PI / 2);
      return { y0, top, inside: W.inProperty(P.pos.x, P.pos.z), door: !!fd };
    });
    expect(r.y0).toBeLessThan(0.1); // en el portal, a pie de calle
    expect(r.top.up).toBeGreaterThan(3); // arriba, en el rellano
    expect(r.door).toBe(true);
    expect(r.inside).toBe('piso');
  });

  test('piso inicial: el fregadero rellena la regadera', async () => {
    const r = await page.evaluate(() => {
      const W = __G.world, pis = W.props.piso, s = __G.state;
      const slot = s.inv.findIndex((x) => !x);
      s.inv[slot] = { id: 'regadera', q: 1 }; s.water = 0;
      const sinks = __G.interactables.filter((m) => m.position.x > pis.x0 - 1 && m.position.x < pis.x1 + 1 && m.position.z > pis.z0 - 1 && m.position.z < pis.z1 + 1 && m.userData.ia?.actions?.().some((a) => a.label === 'Rellenar regadera'));
      sinks[0].userData.ia.actions().find((a) => a.label === 'Rellenar regadera').fn();
      const w = s.water;
      s.inv[slot] = null;
      return { sinks: sinks.length, w };
    });
    expect(r.sinks).toBe(2); // cocina y baño
    expect(r.w).toBe(6);
  });

  test('el jugador anda cuesta arriba y abajo pegado al suelo', async ({}, testInfo) => {
    const H = (x, z) => page.evaluate(([x, z]) => __G.world.groundAt(x, z), [x, z]);
    // la calle norte-sur de la avenida central, de una punta a otra
    await page.evaluate(() => { __G.police.forEach((c) => c.pos.set(900, 0, 900)); __G.player.teleport(-30.5, -100, Math.PI); });
    await frames(page, 5);
    const gaps = [];
    for (let k = 0; k < 4; k++) {
      await page.evaluate(() => { __G.player.vel.set(0, 0, 0); });
      // se anda hasta avanzar unos metros, contando fotogramas y no segundos (el navegador de
      // pruebas dibuja por software: mirando calle arriba al centro da muy pocos por segundo)
      const z0 = await page.evaluate(() => __G.player.pos.z);
      await page.keyboard.down('KeyW');
      for (let t = 0; t < 40; t++) { await frames(page, 2); if ((await page.evaluate(() => __G.player.pos.z)) - z0 > 2.2) break; }
      await page.keyboard.up('KeyW');
      await frames(page, 4);
      const p = await page.evaluate(() => ({ x: __G.player.pos.x, y: __G.player.pos.y, z: __G.player.pos.z }));
      gaps.push(Math.abs(p.y - (await H(p.x, p.z))));
    }
    const p = await page.evaluate(() => __G.player.pos.z);
    expect(p).toBeGreaterThan(-92); // ha avanzado (4 tramos de más de 2 m)
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
