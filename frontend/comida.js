/* VOLTA · Registrar comida en segundos.
   - Buscador de alimentos: base de Volta (y alimentos propios) al instante, sin conexión; con conexión, Open Food Facts
     (base libre y gratuita) por nombre o por código de barras (cámara si el móvil lo permite).
   - Frecuentes y recientes: un toque y queda registrado.
   - «Repetir ayer» copia las comidas del día anterior.
   - Entrada rápida: solo calorías (y proteína si la sabes).
   - En Nutrición › Día: lista de lo registrado, con borrar y deshacer.
   Usa la capa de datos de NUTR (add, recents, frequent, copyDay, remove, undo). */
(function () {
  'use strict';
  if (typeof R !== 'function' || typeof S === 'undefined' || typeof V === 'undefined' || !window.NUTR) return;
  const N = window.NUTR;
  const LI = { es: 0, en: 1, fr: 2, pt: 3, de: 1, it: 1, ru: 1, ar: 1, tr: 1, ja: 1, ko: 1, zh: 1, hi: 1 };
  const T = {
    title: ['Añadir alimento', 'Add food', 'Ajouter un aliment', 'Adicionar alimento'],
    ph: ['Busca: pollo, arroz, yogur…', 'Search: chicken, rice, yogurt…', 'Cherche : poulet, riz, yaourt…', 'Pesquisa: frango, arroz, iogurte…'],
    freq: ['Lo que más comes', 'What you eat most', 'Ce que tu manges le plus', 'O que mais comes'],
    rec: ['Recientes', 'Recent', 'Récents', 'Recentes'],
    tapHint: ['Un toque y queda registrado', 'One tap and it’s logged', 'Un geste et c’est noté', 'Um toque e fica registado'],
    none: ['No está en la base de Volta.', 'Not in the Volta database.', 'Pas dans la base Volta.', 'Não está na base do Volta.'],
    off: ['Buscar en Open Food Facts', 'Search Open Food Facts', 'Chercher sur Open Food Facts', 'Pesquisar no Open Food Facts'],
    offNote: ['Base libre y gratuita con millones de productos. Necesita conexión.', 'Free open database with millions of products. Needs a connection.', 'Base libre et gratuite avec des millions de produits. Connexion requise.', 'Base livre e gratuita com milhões de produtos. Precisa de ligação.'],
    offErr: ['Sin conexión o sin resultados. Prueba otra palabra.', 'No connection or no results. Try another word.', 'Pas de connexion ou aucun résultat. Essaie un autre mot.', 'Sem ligação ou sem resultados. Tenta outra palavra.'],
    loading: ['Buscando…', 'Searching…', 'Recherche…', 'A pesquisar…'],
    scan: ['Escanear código', 'Scan barcode', 'Scanner le code', 'Ler código'],
    code: ['Código de barras', 'Barcode', 'Code-barres', 'Código de barras'],
    codeGo: ['Buscar código', 'Look up', 'Chercher', 'Procurar'],
    noCam: ['Tu navegador no puede leer códigos con la cámara: escribe los números.', 'Your browser can’t read barcodes with the camera: type the numbers.', 'Ton navigateur ne lit pas les codes avec la caméra : tape les chiffres.', 'O teu navegador não lê códigos com a câmara: escreve os números.'],
    camStop: ['Cerrar cámara', 'Close camera', 'Fermer la caméra', 'Fechar câmara'],
    amount: ['Cantidad', 'Amount', 'Quantité', 'Quantidade'],
    unit: ['unidad', 'unit', 'unité', 'unidade'],
    add: ['Añadir', 'Add', 'Ajouter', 'Adicionar'],
    cancel: ['Cancelar', 'Cancel', 'Annuler', 'Cancelar'],
    added: ['Añadido', 'Added', 'Ajouté', 'Adicionado'],
    done: ['Listo', 'Done', 'Terminé', 'Pronto'],
    per100: ['por 100 g', 'per 100 g', 'pour 100 g', 'por 100 g'],
    again: ['Repetir ayer', 'Repeat yesterday', 'Répéter hier', 'Repetir ontem'],
    againOk: ['Copiadas las comidas de ayer', 'Yesterday’s meals copied', 'Repas d’hier copiés', 'Refeições de ontem copiadas'],
    againNo: ['Ayer no registraste comidas.', 'You logged no meals yesterday.', 'Tu n’as rien noté hier.', 'Ontem não registaste refeições.'],
    quick: ['Entrada rápida (solo calorías)', 'Quick entry (calories only)', 'Saisie rapide (calories)', 'Entrada rápida (só calorias)'],
    qName: ['Nombre (opcional)', 'Name (optional)', 'Nom (facultatif)', 'Nome (opcional)'],
    qProt: ['Proteína g (opcional)', 'Protein g (optional)', 'Protéines g (facultatif)', 'Proteína g (opcional)'],
    logBtn: ['Registrar comida', 'Log food', 'Noter un repas', 'Registar refeição'],
    del: ['Borrar', 'Delete', 'Supprimer', 'Apagar'],
    undo: ['Deshacer', 'Undo', 'Annuler', 'Desfazer'],
    removed: ['Eliminado', 'Removed', 'Supprimé', 'Apagado'],
    empty: ['Aún no has registrado nada este día. Empieza por lo que más comes.', 'Nothing logged this day yet. Start with what you eat most.', 'Rien de noté ce jour-là. Commence par ce que tu manges le plus.', 'Ainda não registaste nada neste dia. Começa pelo que mais comes.'],
    meals: [['Desayuno', 'Comida', 'Merienda', 'Cena', 'Otros'], ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Other'], ['Petit-déj.', 'Déjeuner', 'Goûter', 'Dîner', 'Autres'], ['Pequeno-almoço', 'Almoço', 'Lanche', 'Jantar', 'Outros']],
    kcal: ['kcal', 'kcal', 'kcal', 'kcal'],
    macros: [['P', 'C', 'G'], ['P', 'C', 'F'], ['P', 'G', 'L'], ['P', 'H', 'G']]
  };
  const li = () => (LI[S.lang] != null ? LI[S.lang] : 1);
  const t = (k) => T[k][li()];
  const MTK = ['des', 'com', 'mer', 'cen', 'otr'];
  const UNITS = { huevos: 60, huevo: 60, claras: 33, 'plátano': 120, manzana: 180, pera: 170, kiwi: 75, aguacate: 150, naranja: 160, 'yogur natural': 125, 'yogur griego': 125, 'pan integral': 35, 'tortitas de arroz': 9 };
  const esc = (x) => String(x == null ? '' : x).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
  const nrm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const r0 = (x) => Math.round(+x || 0);
  const cap = (x) => String(x || '').charAt(0).toUpperCase() + String(x || '').slice(1);
  const name = (n) => cap(window.vxTr && S.lang !== 'es' ? window.vxTr(n) : n);
  // un aviso cada vez: el nuevo sustituye al anterior
  const say = (m) => { try { document.querySelectorAll('.toast').forEach((x) => x.remove()); toast(m); } catch (e) { /* sin aviso */ } };

  // día con el que se trabaja: el seleccionado en Nutrición (por defecto, hoy)
  const dayKey = () => (S.day != null && N.dateOfDow ? N.dateOfDow(S.day) : lk(Date.now()));
  const prevKey = (k) => { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() - 1); return lk(d); };
  const hourMt = () => { const h = new Date().getHours(); return h < 11 ? 'des' : h < 16 ? 'com' : h < 19 ? 'mer' : 'cen'; };

  // estado de la pantalla (no se guarda)
  const st = { mt: null, q: '', sel: null, off: null, offQ: '', offBusy: false, added: 0, cam: null };
  let results = [];

  // ── Búsqueda local ──
  function search(q) {
    const s = nrm(q); if (!s) return [];
    const D = window.FDB || {}, out = [];
    Object.keys(D).forEach((k) => {
      const f = D[k], a = nrm(f.n), b = nrm(name(f.n));
      let sc = 9;
      [a, b].forEach((x) => { if (x === s) sc = Math.min(sc, 0); else if (x.indexOf(s) === 0) sc = Math.min(sc, 1); else if (x.split(/[\s,()-]+/).some((w) => w.indexOf(s) === 0)) sc = Math.min(sc, 2); else if (x.indexOf(s) >= 0) sc = Math.min(sc, 3); });
      if (sc < 9) out.push({ sc, f });
    });
    return out.sort((x, y) => x.sc - y.sc || x.f.n.length - y.f.n.length).slice(0, 30).map((x) => ({ src: 'v', fid: x.f.n, n: x.f.n, k: x.f.k, p: x.f.p, c: x.f.c, f: x.f.f, fi: x.f.fi, custom: !!x.f.custom }));
  }
  const mac = (o, g) => { const v = (g || 100) / 100, M = T.macros[li()]; return `${r0(o.k * v)} kcal · ${M[0]} ${r0(o.p * v)} · ${M[1]} ${r0(o.c * v)} · ${M[2]} ${r0(o.f * v)}`; };

  function rowHTML(o, i) {
    const nm = o.src === 'v' ? name(o.n) : o.n;
    return `<button class="vx-f-row" onclick="vxFoodPick(${i})"><span class="g"><b class="vx-f-n">${esc(nm)}</b>${o.brand ? ` <span class="mu">· ${esc(o.brand)}</span>` : ''}<span class="mu vx-f-m">${mac(o)} · ${t('per100')}</span></span><span class="vx-f-plus" aria-hidden="true">+</span></button>`;
  }
  function resultsHTML() {
    const q = st.q.trim();
    if (!q) return quickListsHTML();
    results = search(q);
    let h = results.length ? `<div class="card vx-f-list">${results.map(rowHTML).join('')}</div>` : `<div class="mu" style="margin:8px 2px">${t('none')}</div>`;
    if (st.off && st.offQ === q) {
      const base = results.length;
      results = results.concat(st.off);
      h += st.off.length ? `<h2>🌍 Open Food Facts</h2><div class="card vx-f-list">${st.off.map((o, k) => rowHTML(o, base + k)).join('')}</div>` : `<div class="mu" style="margin:8px 2px">${t('offErr')}</div>`;
    } else if (q.length >= 3) {
      h += `<button class="btn o vx-f-off" onclick="vxFoodOff()" ${st.offBusy ? 'disabled' : ''}>🌍 ${st.offBusy ? t('loading') : t('off') + ' «' + esc(q) + '»'}</button><div class="mu" style="font-size:12px;margin:6px 2px">${t('offNote')}</div>`;
    }
    return h;
  }

  // ── Frecuentes y recientes (un toque) ──
  let quick = [];
  function quickListsHTML() {
    const fr = N.frequent(6, 60), seen = new Set(fr.map((x) => x.key)), rc = N.recents(10).filter((x) => !seen.has(x.key)).slice(0, 6);
    quick = fr.map((x) => x.e).concat(rc.map((x) => x.e));
    const row = (e, i) => `<button class="vx-f-row" onclick="vxFoodAgain(${i})"><span class="g"><b class="vx-f-n">${esc(e.ty === 'food' ? name(e.n) : e.n)}</b><span class="mu vx-f-m">${e.g ? r0(e.g) + ' g · ' : ''}${r0(e.k)} kcal</span></span><span class="vx-f-plus" aria-hidden="true">+</span></button>`;
    let h = '';
    if (fr.length) h += `<h2>⭐ ${t('freq')}</h2><div class="mu" style="font-size:12px;margin:-4px 2px 8px">${t('tapHint')}</div><div class="card vx-f-list vx-f-freq">${fr.map((x, i) => row(x.e, i)).join('')}</div>`;
    if (rc.length) h += `<h2>🕘 ${t('rec')}</h2><div class="card vx-f-list">${rc.map((x, i) => row(x.e, fr.length + i)).join('')}</div>`;
    return h;
  }

  // ── Cantidad ──
  function unitOf(o) { if (o.src !== 'v') return o.serving ? [o.serving, '1 ' + t('unit')] : null; const u = UNITS[nrm(o.n)] || UNITS[o.n]; return u ? [u, '1 ' + name(o.n).replace(/s$/, '')] : null; }
  function pickHTML() {
    const o = st.sel; if (!o) return '';
    const u = unitOf(o), opts = (u ? [[u[0], u[1]], [u[0] * 2, '2 × ' + u[0] + ' g']] : []).concat([50, 100, 150, 200, 300].map((g) => [g, g + ' g']));
    return `<div class="card vx-f-pick" role="dialog" aria-label="${esc(t('amount'))}"><div class="row sp"><b class="vx-f-n">${esc(o.src === 'v' ? name(o.n) : o.n)}</b><button class="back" onclick="vxFoodPick(-1)" aria-label="${esc(t('cancel'))}">×</button></div>` +
      `<div class="mu" style="margin:2px 0 10px">${mac(o)} · ${t('per100')}</div>` +
      `<div class="chips" style="flex-wrap:wrap">${opts.map((a) => `<div class="chip${+st.g === a[0] ? ' on' : ''}" onclick="vxFoodG(${a[0]})" role="button" tabindex="0">${esc(a[1])}</div>`).join('')}</div>` +
      `<label class="mu" for="vx-fg" style="display:block;margin-top:8px">${t('amount')} (g)</label><input id="vx-fg" type="number" inputmode="decimal" min="1" max="5000" value="${st.g}" oninput="vxFoodG(this.value,1)">` +
      `<div class="vx-f-tot" id="vx-ftot">${mac(o, st.g)}</div><button class="btn" id="vx-fadd" onclick="vxFoodAdd()">${t('add')} · ${st.mtName()}</button></div>`;
  }
  st.mtName = () => T.meals[li()][MTK.indexOf(st.mt)] || '';

  function addEntry(e, label) {
    const r = N.add(dayKey(), Object.assign({ mt: st.mt || hourMt() }, e));
    if (!r.ok) { say('⚠️ ' + r.msg); return false; }
    st.added++;
    say(`✓ ${t('added')}: ${label}${r.e.g ? ' · ' + r0(r.e.g) + ' g' : ''} · ${r0(r.e.k)} kcal`);
    return true;
  }

  // ── Open Food Facts ──
  const offFields = 'code,product_name,product_name_' + 'es,brands,nutriments,serving_quantity';
  function offItem(p) {
    const n = p.nutriments || {}, k = +n['energy-kcal_100g'] || (+n['energy_100g'] ? +n['energy_100g'] / 4.184 : 0);
    const nm = String(p['product_name_' + S.lang] || p.product_name || p.product_name_es || '').trim();
    const o = { src: 'off', code: p.code, n: nm.slice(0, 50), brand: String(p.brands || '').split(',')[0].trim().slice(0, 24), k: +k || 0, p: +n.proteins_100g || 0, c: +n.carbohydrates_100g || 0, f: +n.fat_100g || 0, fi: n.fiber_100g != null ? +n.fiber_100g : null, serving: +p.serving_quantity > 0 && +p.serving_quantity < 2000 ? Math.round(+p.serving_quantity) : 0 };
    // juego limpio con los datos: solo productos con valores posibles
    if (!o.n || !(o.k > 0) || o.k > 950 || o.p < 0 || o.c < 0 || o.f < 0 || o.p + o.c + o.f > 101) return null;
    return o;
  }
  async function offSearch(q) {
    const u = 'https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&search_simple=1&page_size=20&search_terms=' + encodeURIComponent(q) + '&fields=' + offFields + '&lc=' + (S.lang || 'es');
    const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return (j.products || []).map(offItem).filter(Boolean).slice(0, 15);
  }
  async function offCode(code) {
    const r = await fetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) + '.json?fields=' + offFields);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return j && j.product ? offItem(Object.assign({ code }, j.product)) : null;
  }

  // ── Cámara (BarcodeDetector, si el navegador lo tiene) ──
  async function camStart() {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices) { say(t('noCam')); const i = document.getElementById('vx-fcode'); if (i) i.focus(); return; }
    try {
      const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const box = document.createElement('div'); box.className = 'vx-f-cam';
      box.innerHTML = `<video playsinline muted></video><div class="vx-f-cam-frame"></div><button class="btn o" type="button">${t('camStop')}</button>`;
      document.body.appendChild(box);
      const v = box.querySelector('video'); v.srcObject = stream; await v.play();
      st.cam = { stream, box, run: true };
      box.querySelector('button').onclick = camStop;
      const loop = async () => {
        if (!st.cam || !st.cam.run) return;
        try { const c = await det.detect(v); if (c && c[0] && c[0].rawValue) { camStop(); lookupCode(c[0].rawValue); return; } } catch (e) { /* sigue */ }
        setTimeout(loop, 250);
      };
      loop();
    } catch (e) { camStop(); say(t('noCam')); }
  }
  function camStop() { if (!st.cam) return; st.cam.run = false; try { st.cam.stream.getTracks().forEach((x) => x.stop()); } catch (e) { /* nada */ } st.cam.box.remove(); st.cam = null; }
  async function lookupCode(code) {
    code = String(code || '').replace(/\D/g, ''); if (code.length < 8 || code.length > 14) { say('⚠️ ' + t('code')); return; }
    say(t('loading'));
    try { const o = await offCode(code); if (!o) throw new Error('nada'); st.sel = o; st.g = o.serving || 100; paint(); } catch (e) { say(t('offErr')); }
  }

  // ── Pantalla ──
  V['vx:food'] = function () {
    if (!st.mt) st.mt = hourMt();
    const M = T.meals[li()];
    let h = `<div class="row" style="margin-bottom:10px"><button class="back" onclick="vxFoodDone()" aria-label="‹">‹</button><h1 style="font-size:22px" class="g">${t('title')}</h1>${st.added ? `<button class="btn sm" onclick="vxFoodDone()">${t('done')} (${st.added})</button>` : ''}</div>`;
    h += `<div class="chips vx-f-mt" role="tablist">${MTK.map((k, i) => `<div class="chip${st.mt === k ? ' on' : ''}" role="tab" aria-selected="${st.mt === k}" tabindex="0" onclick="vxFoodMt('${k}')">${M[i]}</div>`).join('')}</div>`;
    h += `<div class="row vx-f-search"><input id="vx-fq" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(t('ph'))}" value="${esc(st.q)}" oninput="vxFoodQ(this.value)" aria-label="${esc(t('ph'))}"><button class="btn o sm" onclick="vxFoodScan()" aria-label="${esc(t('scan'))}" title="${esc(t('scan'))}">▥</button></div>`;
    h += `<div id="vx-fpick">${pickHTML()}</div><div id="vx-fres">${resultsHTML()}</div>`;
    h += `<div class="row" style="gap:8px;margin-top:12px"><button class="btn o g" onclick="vxFoodYesterday()">↻ ${t('again')}</button></div>`;
    h += `<details class="card vx-f-more"><summary><b>${t('code')}</b></summary><div class="row" style="gap:8px;margin-top:8px"><input id="vx-fcode" class="g" inputmode="numeric" pattern="[0-9]*" maxlength="14" placeholder="8410000000000" aria-label="${esc(t('code'))}"><button class="btn sm" onclick="vxFoodCode()">${t('codeGo')}</button></div></details>`;
    h += `<details class="card vx-f-more"><summary><b>${t('quick')}</b></summary><input id="vx-qn" maxlength="60" placeholder="${esc(t('qName'))}" aria-label="${esc(t('qName'))}" style="margin-top:8px"><div class="row" style="gap:8px;margin-top:8px"><input id="vx-qk" class="g" type="number" inputmode="numeric" min="1" max="10000" placeholder="kcal" aria-label="kcal"><input id="vx-qp" class="g" type="number" inputmode="decimal" min="0" max="1000" placeholder="${esc(t('qProt'))}" aria-label="${esc(t('qProt'))}"></div><button class="btn" style="margin-top:8px" onclick="vxFoodQuick()">${t('add')}</button></details>`;
    return h;
  };
  // repinta solo las partes que cambian (así no se pierde el cursor del buscador)
  function paint() {
    const a = document.getElementById('vx-fres'), b = document.getElementById('vx-fpick');
    if (!a || !b) { R(); return; }
    a.innerHTML = resultsHTML(); b.innerHTML = pickHTML();
    if (st.sel) { const i = document.getElementById('vx-fadd'); if (i && i.scrollIntoView) i.scrollIntoView({ block: 'nearest' }); }
  }

  Object.assign(window, {
    vxFoodOpen(mt) { st.q = ''; st.sel = null; st.off = null; st.added = 0; st.mt = MTK.includes(mt) ? mt : hourMt(); go('vx:food'); },
    vxFoodQ(v) { st.q = String(v || '').slice(0, 60); paint(); },
    vxFoodMt(k) { st.mt = k; const q = document.getElementById('vx-fq'); st.q = q ? q.value : st.q; R(); },
    vxFoodPick(i) { if (i < 0 || !results[i]) { st.sel = null; paint(); return; } st.sel = results[i]; const u = unitOf(st.sel); st.g = u ? u[0] : 100; paint(); },
    vxFoodG(g, typed) {
      const n = Math.max(0, Math.min(5000, parseFloat(String(g).replace(',', '.')) || 0)); st.g = n;
      if (typed) { const x = document.getElementById('vx-ftot'); if (x && st.sel) x.textContent = mac(st.sel, n); return; }
      paint();
    },
    vxFoodAdd() {
      const o = st.sel; if (!o) return; const g = +st.g;
      if (!(g > 0)) { say('⚠️ ' + t('amount')); return; }
      let ok;
      if (o.src === 'v') ok = addEntry({ ty: 'food', fid: o.fid, g }, name(o.n));
      else { const v = g / 100; ok = addEntry({ ty: 'quick', n: (o.n + (o.brand ? ' · ' + o.brand : '')).slice(0, 60), g, k: o.k * v, p: o.p * v, c: o.c * v, f: o.f * v, fi: o.fi == null ? null : o.fi * v, mid: o.code ? 'off:' + o.code : undefined }, o.n); }
      if (ok) { st.sel = null; st.q = ''; st.off = null; R(); const q = document.getElementById('vx-fq'); if (q) q.focus(); }
    },
    vxFoodAgain(i) {
      const e = quick[i]; if (!e) return;
      const c = e.ty === 'food' ? { ty: 'food', fid: e.fid, g: e.g } : { ty: e.ty, n: e.n, g: e.g, k: e.k, p: e.p, c: e.c, f: e.f, fi: e.fi, mid: e.mid };
      if (addEntry(c, e.ty === 'food' ? name(e.n) : e.n)) R();
    },
    async vxFoodOff() {
      const q = st.q.trim(); if (q.length < 3 || st.offBusy) return;
      st.offBusy = true; paint();
      try { st.off = await offSearch(q); } catch (e) { st.off = []; }
      st.offQ = q; st.offBusy = false; paint();
    },
    vxFoodScan: camStart,
    vxFoodCode() { const i = document.getElementById('vx-fcode'); lookupCode(i && i.value); },
    vxFoodQuick() {
      const k = parseFloat((document.getElementById('vx-qk') || {}).value), p = parseFloat((document.getElementById('vx-qp') || {}).value), n = ((document.getElementById('vx-qn') || {}).value || '').trim();
      if (!(k > 0)) { say('⚠️ kcal'); return; }
      if (addEntry({ ty: 'quick', n: n || t('quick').split(' (')[0], k, p: p > 0 ? p : null }, n || 'kcal')) R();
    },
    vxFoodYesterday() {
      const to = dayKey(), r = N.copyDay(prevKey(to), to);
      say(r.ok ? `✓ ${t('againOk')} (${r.n})` : t('againNo'));
      if (r.ok) { st.added += r.n; R(); }
    },
    vxFoodDone() { camStop(); st.sel = null; st.q = ''; st.off = null; back(); },
    vxFoodDel(id) { const r = N.remove(dayKey(), id); if (r && r.ok !== false) { st.undo = 1; say(t('removed')); R(); } },
    vxFoodUndo() { N.undo(); st.undo = 0; R(); }
  });

  // ── Nutrición › Día: acciones y lo registrado ──
  function dayHTML() {
    const k = dayKey(), d = (S.nlog && S.nlog[k]) || { e: [] }, es = d.e || [], M = T.meals[li()];
    let h = `<div class="row vx-f-actions" style="gap:8px;margin-bottom:10px"><button class="btn g" onclick="vxFoodOpen()">＋ ${t('logBtn')}</button><button class="btn o" onclick="vxFoodYesterday()" aria-label="${esc(t('again'))}">↻ ${t('again')}</button></div>`;
    if (!es.length) {
      const fr = N.frequent(4, 60);
      quick = fr.map((x) => x.e);
      return h + `<div class="card vx-f-day"><div class="mu">${t('empty')}</div>${fr.length ? `<div class="chips" style="flex-wrap:wrap;margin-top:8px">${fr.map((x, i) => `<div class="chip" role="button" tabindex="0" onclick="vxFoodAgain(${i})">＋ ${esc(x.e.ty === 'food' ? name(x.e.n) : x.e.n)}</div>`).join('')}</div>` : ''}</div>`;
    }
    h += MTK.map((m, i) => {
      const xs = es.filter((e) => (e.mt || 'otr') === m); if (!xs.length) return '';
      const kc = xs.reduce((a, e) => a + (+e.k || 0), 0);
      return `<div class="card vx-f-day"><div class="row sp"><b>${M[i]}</b><span class="row" style="gap:8px"><span class="mu">${r0(kc)} kcal</span><button class="btn sm o" onclick="vxFoodOpen('${m}')" aria-label="${esc(t('add') + ' · ' + M[i])}">＋</button></span></div>` +
        xs.map((e) => `<div class="row sp vx-f-e"><span class="g">${esc(e.ty === 'food' ? name(e.n) : e.n)}${e.g ? ` <span class="mu">· ${r0(e.g)} g</span>` : ''}</span><span class="mu">${r0(e.k)} kcal</span><button class="vx-f-x" onclick="vxFoodDel('${esc(e.id)}')" aria-label="${esc(t('del'))}">×</button></div>`).join('') + '</div>';
    }).join('');
    if (st.undo) h += `<button class="btn o sm" onclick="vxFoodUndo()">↶ ${t('undo')}</button>`;
    return h;
  }
  const _nut = V.nut;
  V.nut = function () {
    let h = _nut.apply(this, arguments);
    if ((S.nsub || 'day') !== 'day' || S.demo) return h;
    const mk = h.indexOf('<h2>Comidas de hoy</h2>');
    if (mk < 0) return h;
    // la lista sencilla de NUTR se sustituye por la nuestra (con añadir y borrar)
    try { const old = N.dayListHTML(dayKey()); if (old) h = h.split(old).join(''); } catch (e) { /* sin lista previa */ }
    const at = h.indexOf('<h2>Comidas de hoy</h2>') + '<h2>Comidas de hoy</h2>'.length;
    return h.slice(0, at) + dayHTML() + h.slice(at);
  };

  // «Registrar comida» de Inicio abre directamente el buscador
  const _R = R;
  R = function () {
    _R.apply(this, arguments);
    try {
      const top = S.stack && S.stack.length ? S.stack[S.stack.length - 1] : '';
      if (!top && S.tab === 'home') document.querySelectorAll('#m button[onclick="tab(\'nut\')"]').forEach((b) => { if (/Registrar comida|Log meal|Log food|Enregistrer|Registar/.test(b.textContent)) b.setAttribute('onclick', 'vxFoodOpen()'); });
      if (top !== 'vx:food') camStop();
    } catch (e) { /* sin cambios */ }
  };

  window.vxFoodSearch = search; // para las pruebas
})();
