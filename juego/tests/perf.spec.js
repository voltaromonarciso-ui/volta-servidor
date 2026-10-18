// Medición de coste por escena (no es un test de aprobado/suspenso: guarda los números en
// tests/.results*/perf.json). OJO: aquí la GPU es por software (SwiftShader), así que los
// fps NO representan un móvil; las llamadas de dibujo y los triángulos sí son reales.
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { ev, frames, newGame } from './helpers.js';

test('coste por escena y ajustes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'android', 'una sola medición basta');
  test.setTimeout(40 * 60_000);
  await newGame(page, testInfo);
  const scenes = [
    ['nave (pocos personajes)', -62.5, -38.2, 0.32, 12 * 60],
    ['calle con tráfico', 36, -10, Math.PI, 12 * 60],
    ['zona comercial (peatones)', 50, -32, Math.PI, 12 * 60],
    ['interior de tienda (ferretería)', -96, -20, Math.PI / 2, 12 * 60],
    ['ciudad de noche con farolas', 36, 60, Math.PI, 22 * 60],
  ];
  const out = [];
  for (const [draw, quality] of [['larga', 'alta'], ['corta', 'baja']]) {
    await ev(page, ([d, q]) => { __G.act.drawDistance(d); __G.act.quality(q); }, [draw, quality]);
    for (const [name, x, z, yaw, min] of scenes) {
      await ev(page, ([x, z, yaw, min]) => { __G.state.minute = min; __G.player.teleport(x, z, yaw); __G.player.pitch = -0.05; }, [x, z, yaw, min]);
      await frames(page, 8);
      const r = await ev(page, () => new Promise((res) => {
        // se suman todas las pasadas del fotograma (escena, manos, posprocesado)
        const info = window.__R.renderer.info;
        info.autoReset = false; info.reset();
        let n = 0, t0 = performance.now(), calls = 0, tris = 0;
        const step = () => {
          if (n > 0) { calls = Math.max(calls, info.render.calls); tris = Math.max(tris, info.render.triangles); }
          info.reset();
          if (++n < 20) requestAnimationFrame(step); else { info.autoReset = true; res({ ms: Math.round((performance.now() - t0) / 20), calls, tris, geo: info.memory.geometries, tex: info.memory.textures }); }
        };
        requestAnimationFrame(step);
      }));
      out.push({ ajustes: `${quality}/${draw}`, escena: name, ...r });
    }
  }
  const heap = await ev(page, () => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  writeFileSync(testInfo.outputPath('perf.json'), JSON.stringify({ out, heapMB: heap }, null, 1));
  console.log(JSON.stringify({ out, heapMB: heap }));
  expect(out.length).toBe(10);
});
