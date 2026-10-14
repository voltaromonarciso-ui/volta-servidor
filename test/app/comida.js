const { chromium } = require('playwright');
const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage({ viewport: { width: 390, height: 1600 }, locale: 'es-ES' });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  // Open Food Facts simulado (las pruebas no dependen de la red)
  let offHits = 0;
  await p.route('https://world.openfoodfacts.org/**', (route) => {
    offHits++;
    const u = route.request().url();
    if (/api\/v2\/product\/8410000000001/.test(u)) return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 1, product: { product_name: 'Barrita de avena', brands: 'Marca A', serving_quantity: 40, nutriments: { 'energy-kcal_100g': 400, proteins_100g: 10, carbohydrates_100g: 60, fat_100g: 12, fiber_100g: 6 } } }) });
    if (/api\/v2\/product\//.test(u)) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"status":0}' });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ products: [
      { code: '1', product_name: 'Yogur proteico fresa', brands: 'Marca B', nutriments: { 'energy-kcal_100g': 70, proteins_100g: 10, carbohydrates_100g: 5, fat_100g: 0.5 } },
      { code: '2', product_name: 'Producto imposible', nutriments: { 'energy-kcal_100g': 2000, proteins_100g: 90, carbohydrates_100g: 90, fat_100g: 90 } },
      { code: '3', product_name: 'Sin datos' }] }) });
  });
  await p.goto(process.env.APP_URL); await p.waitForTimeout(900);
  const today = await p.evaluate(() => { S.onboarded = true; S.demo = false; S.lang = 'es'; S.nlog = {}; S.nsub = 'day'; S.day = (new Date().getDay() + 6) % 7; S.stack = []; tab('nut'); return lk(Date.now()); });
  await p.waitForTimeout(300);
  let t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Registrar comida/.test(t) && /Repetir ayer/.test(t), 'Nutrición › Día: botones «Registrar comida» y «Repetir ayer»');

  // buscar y añadir
  await p.click('.vx-f-actions .btn.g'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.stack[S.stack.length - 1] === 'vx:food'), 'abre la pantalla «Añadir alimento»');
  await p.fill('#vx-fq', 'poll'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'vx-fq'), 'el cursor sigue en el buscador mientras escribes');
  const first = await p.evaluate(() => (document.querySelector('#vx-fres .vx-f-n') || {}).textContent);
  ok(/^pollo/i.test(first || ''), 'buscar «poll» encuentra pollo primero (' + first + ')');
  ok(await p.evaluate(() => vxFoodSearch('platano').some((x) => x.n === 'plátano')), 'busca sin tildes («platano» → plátano)');
  await p.click('#vx-fres .vx-f-row'); await p.waitForTimeout(150);
  await p.fill('#vx-fg', '150'); await p.waitForTimeout(100);
  ok(/248 kcal/.test(await p.textContent('#vx-ftot')), 'calcula en vivo las calorías de 150 g de pollo');
  await p.click('#vx-fadd'); await p.waitForTimeout(250);
  let d = await p.evaluate((k) => S.nlog[k] && S.nlog[k].e, today);
  ok(d && d.length === 1 && d[0].fid === 'pollo' && d[0].g === 150 && Math.round(d[0].k) === 248, 'queda registrado: pollo 150 g, 248 kcal');
  ok(/Listo \(1\)/.test(await p.evaluate(() => document.getElementById('m').innerText)), 'botón «Listo (1)»');

  // un toque: frecuentes
  t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/Lo que más comes/.test(t) && /pollo/i.test(t), 'con el buscador vacío salen tus frecuentes');
  await p.click('.vx-f-freq .vx-f-row'); await p.waitForTimeout(200);
  d = await p.evaluate((k) => S.nlog[k].e, today);
  ok(d.length === 2 && d[1].fid === 'pollo' && d[1].g === 150, 'un toque en un frecuente lo vuelve a registrar');

  // Open Food Facts por nombre (descarta datos imposibles)
  await p.fill('#vx-fq', 'yogur proteico'); await p.waitForTimeout(150);
  await p.click('.vx-f-off'); await p.waitForTimeout(400);
  t = await p.evaluate(() => document.getElementById('vx-fres').innerText);
  ok(/Yogur proteico fresa/.test(t) && !/Producto imposible/.test(t) && !/Sin datos/.test(t), 'Open Food Facts: muestra productos válidos y descarta los imposibles');
  await p.evaluate(() => { const r = [...document.querySelectorAll('#vx-fres .vx-f-row')].find((x) => /Yogur proteico fresa/.test(x.textContent)); r.click(); });
  await p.waitForTimeout(150); await p.fill('#vx-fg', '200'); await p.click('#vx-fadd'); await p.waitForTimeout(250);
  d = await p.evaluate((k) => S.nlog[k].e, today);
  ok(d.length === 3 && /Yogur proteico fresa · Marca B/.test(d[2].n) && d[2].k === 140 && d[2].p === 20, 'producto de Open Food Facts registrado con sus macros (200 g → 140 kcal)');

  // código de barras
  await p.evaluate(() => { document.querySelectorAll('.vx-f-more').forEach((x) => { x.open = true; }); });
  await p.fill('#vx-fcode', '8410000000001'); await p.click('.vx-f-more .btn.sm'); await p.waitForTimeout(400);
  ok(/Barrita de avena/.test(await p.evaluate(() => (document.querySelector('.vx-f-pick') || {}).textContent || '')) && (await p.inputValue('#vx-fg')) === '40', 'código de barras: encuentra el producto y propone su ración (40 g)');
  await p.click('#vx-fadd'); await p.waitForTimeout(250);

  // entrada rápida
  await p.evaluate(() => { document.querySelectorAll('.vx-f-more').forEach((x) => { x.open = true; }); });
  await p.fill('#vx-qn', 'Menú del día'); await p.fill('#vx-qk', '750'); await p.fill('#vx-qp', '35');
  await p.click('text=Añadir >> nth=-1'); await p.waitForTimeout(250);
  d = await p.evaluate((k) => S.nlog[k].e, today);
  ok(d.length === 5 && d[4].n === 'Menú del día' && d[4].k === 750 && d[4].p === 35, 'entrada rápida: solo calorías y proteína');
  ok(offHits === 2, 'solo se llama a Open Food Facts cuando el usuario lo pide (' + offHits + ')');

  // vuelta a Nutrición: lista, borrar y deshacer
  await p.click('.btn.sm >> text=Listo'); await p.waitForTimeout(300);
  t = await p.evaluate(() => document.getElementById('m').innerText);
  ok(/pollo/i.test(t) && /Menú del día/.test(t) && await p.evaluate(() => document.querySelectorAll('.vx-f-e').length === 5), 'Nutrición › Día muestra las 5 entradas por comida');
  await p.click('.vx-f-x'); await p.waitForTimeout(200);
  ok(await p.evaluate((k) => S.nlog[k].e.length === 4, today), 'borrar una entrada');
  await p.click('text=Deshacer'); await p.waitForTimeout(200);
  ok(await p.evaluate((k) => S.nlog[k].e.length === 5, today), 'deshacer el borrado');
  await p.screenshot({ path: 'shots/comida-dia.png' });

  // repetir ayer
  const res = await p.evaluate(() => {
    const y = new Date(); y.setDate(y.getDate() - 1); const yk = lk(y);
    S.nlog[yk] = { e: [{ ty: 'quick', mt: 'des', h: '08:00', n: 'Tostadas', k: 300, p: 10, c: 50, f: 6, id: 'y1' }, { ty: 'quick', mt: 'cen', h: '21:00', n: 'Tortilla', k: 400, p: 25, c: 5, f: 30, id: 'y2' }], w: 0 };
    vxFoodYesterday(); return S.nlog[lk(Date.now())].e.map((e) => e.n);
  });
  ok(res.length === 7 && res.includes('Tostadas') && res.includes('Tortilla'), 'repetir ayer copia las comidas del día anterior');

  // Inicio: «Registrar comida» abre el buscador
  await p.evaluate(() => { S.stack = []; tab('home'); }); await p.waitForTimeout(300);
  await p.click('#m button:has-text("Registrar comida")'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.stack[S.stack.length - 1] === 'vx:food'), 'Inicio › «Registrar comida» abre el buscador');
  await p.screenshot({ path: 'shots/comida-buscar.png' });

  // en inglés se busca por el nombre traducido
  await p.evaluate(() => { S.lang = 'en'; R(); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => vxFoodSearch('chicken').some((x) => x.n === 'pollo')), 'en inglés, «chicken» encuentra pollo');
  ok(/Add food/.test(await p.evaluate(() => document.getElementById('m').innerText)), 'pantalla traducida al inglés');
  ok(errs.length === 0, 'sin errores de JavaScript: ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
