// Utilidades comunes de las pruebas de referencia.
import { expect } from '@playwright/test';

export const isTouch = (testInfo) => !!testInfo.project.use.hasTouch;

// Errores de la página que hacen fallar la prueba.
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // el servidor de desarrollo a veces corta la descarga de un recurso: no es del juego
    // (y con él, alguna textura de un modelo que GLTFLoader no llega a leer)
    if (/Failed to load resource|net::ERR_|Couldn't load texture blob/.test(t)) return;
    errors.push(t);
  });
  return errors;
}

export const ev = (page, fn, arg) => page.evaluate(fn, arg);

// Módulos del juego (en desarrollo, Vite sirve la misma instancia que usa el juego).
export const mod = (page, path, fn, arg) => page.evaluate(async ([p, f, a]) => {
  const m = await import(p);
  // eslint-disable-next-line no-new-func
  return new Function('m', 'a', `return (${f})(m, a)`)(m, a);
}, [path, fn.toString(), arg]);

// Inventario resumido: "id:producto×cantidad".
export const invSummary = (page) => ev(page, () => __G.state.inv.filter(Boolean).map((s) => s.id + (s.p ? ':' + s.p : '') + 'x' + s.q).join(' '));

// Pulsa en un elemento con el dedo (perfiles táctiles) o con el ratón.
export async function press(page, testInfo, selector) {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible();
  if (isTouch(testInfo)) await el.tap();
  else await el.click();
}

// Arrastre con el dedo (eventos táctiles reales vía CDP) o con el ratón.
export async function drag(page, testInfo, [x0, y0], [x1, y1], steps = 6) {
  if (!isTouch(testInfo)) {
    await page.mouse.move(x0, y0); await page.mouse.down();
    for (let i = 1; i <= steps; i++) { await page.mouse.move(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await page.waitForTimeout(250); }
    await page.mouse.up();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const pt = (x, y) => [{ x, y, id: 1, radiusX: 8, radiusY: 8, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps) });
    await page.waitForTimeout(250);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

// Espera a que el juego haya dibujado unos cuantos fotogramas (con WebGL por software
// el juego va lento y las animaciones avanzan por fotograma, no por tiempo real).
export async function frames(page, n = 10) {
  await page.evaluate((n) => new Promise((res) => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
}

// Arranca una partida nueva desde el menú, con el creador de personaje y la intro.
export async function newGame(page, testInfo) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('hide'), null, { timeout: 300_000 });
  await press(page, testInfo, '#m-new');
  await press(page, testInfo, '.cr-go');
  await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hide'), null, { timeout: 300_000 });
  await press(page, testInfo, '.panel .btn');
  await expect(page.locator('.panel')).toHaveCount(0);
  // fuera la policía para que no interrumpa las pruebas
  await ev(page, () => __G.police.forEach((c) => c.pos.set(300, 0, 300)));
}

// Coloca al jugador y espera a que la mira apunte de verdad a lo que hay delante.
export async function lookAt(page, x, z, yaw, pitch) {
  await ev(page, ([x, z, yaw, pitch]) => { __G.player.teleport(x, z, yaw); __G.player.pitch = pitch; }, [x, z, yaw, pitch]);
  await frames(page, 4);
}

// Acción principal o secundaria: con el botón táctil en móvil, con E/R en escritorio.
export async function act(page, testInfo, secondary = false) {
  if (isTouch(testInfo)) {
    // en móvil se interactúa tocando la etiqueta de acción del centro
    await page.locator(secondary ? '#prompt .pp.sec' : '#prompt .pp:not(.sec)').tap();
  } else {
    await page.keyboard.press(secondary ? 'KeyR' : 'KeyE');
  }
  await frames(page, 3);
}

// Texto de las acciones disponibles en la mira.
export const prompt = (page) => ev(page, () => document.getElementById('prompt').textContent);

// Selecciona una casilla del inventario tocando la barra (o con la tecla numérica).
export async function selectSlot(page, testInfo, i) {
  // tocar la casilla que ya está en la mano abre la mochila: no hace falta
  if (await page.evaluate((i) => __G.state.sel === i, i)) return;
  if (isTouch(testInfo)) {
    try { await page.locator('#hotbar > *').nth(i).tap({ timeout: 20_000 }); }
    catch (e) {
      const why = await page.evaluate((i) => { const d = document.querySelectorAll('#hotbar > *')[i]; const r = d?.getBoundingClientRect(); let p = d, chain = []; while (p && p !== document.body) { const cs = getComputedStyle(p); chain.push(`${p.id || p.className}:${cs.display}/${cs.visibility}/${cs.opacity}`); p = p.parentElement; } return { n: document.querySelectorAll('#hotbar > *').length, r: r && [r.x, r.y, r.width, r.height], chain, panels: document.querySelectorAll('.panel').length, ui: __G.uiOpen, body: document.body.className }; }, i);
      throw new Error('No se pudo tocar la casilla ' + i + ': ' + JSON.stringify(why) + '\n' + e.message.split('\n')[0]);
    }
  }
  else await page.keyboard.press('Digit' + ((i + 1) % 10));
  await frames(page, 3);
}

// Punto de la pantalla donde se ve un sitio de una mesa de trabajo.
export const spotOnScreen = (page, type, spot) => ev(page, ([type, spot]) => {
  const o = [...__G.objects.values()].find((x) => x.entry.type === type);
  const v = o.group.localToWorld(o.spots[spot].clone()).project(__G.camera);
  return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight];
}, [type, spot]);

// Tienda por pasos: vuelve al inicio, entra en la categoría del producto, lo abre, elige la
// cantidad y lo añade al carrito (luego se paga con «Pagar» del pie).
export async function shopAdd(page, testInfo, name, qty = 1) {
  for (let k = 0; k < 3; k++) {
    if (await page.locator(`.shop .card:has-text("${name}")`).count()) break;
    const back = page.locator('.panel .shop-crumb .btn');
    if (await back.count()) { await press(page, testInfo, '.panel .shop-crumb .btn'); continue; }
    const cat = page.locator(`.shop-cat[data-names*="${name}"]`);
    if (await cat.count()) { await press(page, testInfo, `.shop-cat[data-names*="${name}"]`); continue; }
    break;
  }
  await press(page, testInfo, `.shop .card:has-text("${name}")`);
  if (qty !== 1) await press(page, testInfo, `.qty-quick button[data-q="${qty}"]`);
  await press(page, testInfo, '.panel .btn.add');
}
