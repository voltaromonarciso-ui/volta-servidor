// Ciudad: farolas con el ciclo de día y noche y tráfico con colas y cruces por turnos.
import { test, expect } from '@playwright/test';
import { watchErrors, ev, frames, newGame } from './helpers.js';

test.describe.serial('Ciudad: farolas y tráfico', () => {
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

  test('farolas: apagadas de día, encendidas de noche, sin parpadeos al cambiar', async ({}, testInfo) => {
    const lampAt = async (min) => {
      await ev(page, (m) => { __G.state.minute = m; }, min);
      await frames(page, 30); // fundido corto
      return ev(page, () => ({ vis: __G.world.lampPoolMesh.visible, op: __G.world.lampPoolMesh.material.opacity, n: __G.world.lampPoolMesh.count }));
    };
    const day = await lampAt(12 * 60);
    expect(day.n).toBeGreaterThan(20);
    expect(day.vis).toBe(false);
    const night = await lampAt(22 * 60);
    expect(night.vis).toBe(true);
    expect(night.op).toBeGreaterThan(0.3);
    await page.screenshot({ path: testInfo.outputPath('farolas-noche.png') });
    // amanecer: a las 6:40 siguen encendidas; a las 6:50 se apagan
    expect((await lampAt(6 * 60 + 40)).vis).toBe(true);
    expect((await lampAt(6 * 60 + 50)).vis).toBe(false);
    // el encendido depende solo de la hora: recorrer la franja de 19:30 a 20:00 minuto a minuto
    // da un único cambio de estado (nada de encender y apagar)
    const flips = await ev(page, async () => {
      const { lampsShouldBeOn } = await import('/src/world/sky.js');
      let last = null, n = 0;
      for (let m = 19 * 60 + 30; m <= 20 * 60; m += 0.25) { const on = lampsShouldBeOn(m / 60); if (last !== null && on !== last) n++; last = on; }
      return n;
    });
    expect(flips).toBe(1);
    await ev(page, () => { __G.state.minute = 12 * 60; });
  });

  test('tráfico: sin atravesarse, frena ante obstáculos, hace colas y no se queda bloqueado', async () => {
    const r = await ev(page, () => {
      __G.paused = true;
      const cars = __G.cars;
      // jugador lejos para que no estorbe
      __G.player.pos.set(-100, 0, 100);
      const start = cars.map((c) => c.g.position.clone());
      let minD = Infinity, stoppedSteps = 0, travelled = cars.map(() => 0);
      const prev = cars.map((c) => c.g.position.clone());
      for (let k = 0; k < 6000; k++) { // 5 minutos de juego a 20 fps
        for (const c of cars) c.update(0.05);
        for (let i = 0; i < cars.length; i++) {
          const p = cars[i].g.position;
          travelled[i] += p.distanceTo(prev[i]); prev[i].copy(p);
          if (cars[i].speed < 0.3) stoppedSteps++;
          for (let j = i + 1; j < cars.length; j++) minD = Math.min(minD, p.distanceTo(cars[j].g.position));
        }
      }
      return { n: cars.length, minD, stoppedSteps, minTravel: Math.min(...travelled) };
    });
    expect(r.n).toBeGreaterThanOrEqual(12);
    expect(r.minD).toBeGreaterThan(2.6);         // nunca se meten uno dentro de otro
    expect(r.stoppedSteps).toBeGreaterThan(0);   // hay esperas en cruces / colas
    expect(r.minTravel).toBeGreaterThan(500);    // ninguno se queda atascado para siempre
    // un obstáculo en el carril: el coche frena y se para antes de tocarlo
    const stop = await ev(page, () => {
      const c = __G.cars[0], p = c.g.position;
      const fx = Math.sin(c.g.rotation.y), fz = Math.cos(c.g.rotation.y);
      // el jugador se planta 12 m por delante en su carril
      __G.player.pos.set(p.x + fx * 12, 0, p.z + fz * 12);
      c.speed = c.max;
      for (let k = 0; k < 200; k++) c.update(0.05);
      const d = c.g.position.distanceTo(__G.player.pos);
      __G.player.pos.set(-100, 0, 100);
      const p0 = c.g.position.clone();
      let moved = 0;
      for (let k = 0; k < 300; k++) { for (const o of __G.cars) o.update(0.05); moved = Math.max(moved, c.g.position.distanceTo(p0)); } // y vuelve a arrancar
      return { d, moved };
    });
    expect(stop.d).toBeGreaterThan(3.5);
    expect(stop.d).toBeLessThan(9);
    expect(stop.moved).toBeGreaterThan(15);
    await ev(page, () => { __G.paused = false; });
  });

  test('sin errores en la página', async () => {
    expect(errors).toEqual([]);
  });
});
