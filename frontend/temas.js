/* VOLTA · Temas de color: Amarillo, Azul y Rojo (Perfil → Temas).
   La app nació verde y ese verde está repartido por estilos, colores en línea, SVG y miniaturas.
   En vez de reescribir cada pantalla, se sustituyen los verdes de la INTERFAZ por los tonos del tema:
   - en todas las hojas de estilo (se guarda el original para poder cambiar de tema sin recargar);
   - en los atributos style / fill / stroke / stop-color de lo que se dibuja (con un MutationObserver);
   - en las imágenes SVG en línea (miniaturas de ejercicios).
   Los verdes de la comida (verduras, hierbas) no están en la lista, así que no cambian. */
(function () {
  if (typeof S !== 'object' || typeof R !== 'function') return;
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const tr = (a) => a[LI[S.lang] || 0];

  // Verdes de la interfaz, agrupados por intensidad: b = neón, m = principal, d = profundo, k = fondo oscuro, o = texto sobre el color
  const GREENS = {
    b: ['9dff2e', '00ff66', '7cff6b', '7cff4a', 'c6ff3d', 'b6ff5c', '4ade80', '8dff2f', '7dff2a', 'b8ff6a', '76ff2e'],
    m: ['22c55e', '4bd01a', '58b800', '4bb800', '5ccc0a', '3fbf00'],
    d: ['3f9100', '2f9e00', '2a6a00', '2f8a14'],
    k: ['143d1d', '24461a'],
    o: ['04130a', '071006'],
  };
  const RGB = { b: ['157,255,46', '0,255,102'], m: ['34,197,94', '88,184,0', '75,208,26'], d: ['63,145,0'] };
  const THEMES = {
    amarillo: { n: ['Amarillo', 'Yellow', 'Jaune', 'Amarelo'], b: 'ffd84d', m: 'f5b800', d: 'b38600', k: '3d3208', o: '1d1600', light: ['8a6500', '6e5000'], hue: -42 },
    azul: { n: ['Azul', 'Blue', 'Bleu', 'Azul'], b: '5cb2ff', m: '2f86f0', d: '1c5fb8', k: '0f2a4d', o: '021226', light: ['1660c4', '104e9e'], hue: 122 },
    rojo: { n: ['Rojo', 'Red', 'Rouge', 'Vermelho'], b: 'ff6262', m: 'e53935', d: 'b3261e', k: '4d1414', o: '230404', light: ['c41e1e', '9e1818'], hue: -92 },
  };
  const hexToRgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
  const MAP = {}, RMAP = {};
  Object.keys(GREENS).forEach((k) => GREENS[k].forEach((h) => { MAP[h] = k; }));
  Object.keys(RGB).forEach((k) => RGB[k].forEach((c) => { RMAP[c] = k; }));
  const HEX_RE = new RegExp('(#|%23)(' + Object.keys(MAP).join('|') + ')([0-9a-f]{2})?(?![0-9a-f])', 'gi');
  const RGB_RE = new RegExp('rgba?\\(\\s*(' + Object.keys(RMAP).map((c) => c.replace(/,/g, '\\s*,\\s*')).join('|') + ')', 'gi');

  let cur = null;
  function recolor(str) {
    if (!cur || !str) return str;
    const T = THEMES[cur];
    return str
      .replace(HEX_RE, (m, pre, h, a) => pre + T[MAP[h.toLowerCase()]] + (a || ''))
      .replace(RGB_RE, (m, c) => m.replace(c, hexToRgb(T[RMAP[c.replace(/\s/g, '')]])));
  }

  // 1) Hojas de estilo
  const orig = new WeakMap();
  function themeStyles() {
    document.querySelectorAll('style').forEach((el) => {
      if (el.id === 'vx-theme-extra') return;
      if (!orig.has(el)) orig.set(el, el.textContent);
      const o = orig.get(el), next = cur ? recolor(o) : o;
      if (el.textContent !== next) el.textContent = next;
    });
    let ex = document.getElementById('vx-theme-extra');
    if (!ex) { ex = document.createElement('style'); ex.id = 'vx-theme-extra'; document.head.appendChild(ex); }
    const T = cur && THEMES[cur];
    // En tema claro, un tono más oscuro para que el texto de acento se lea bien
    // El logo es una imagen (V verde): se gira su tono hacia el del tema
    const hue = T ? T.hue : 0;
    ex.textContent = T ? `:root[data-t="light"]{--ac:#${T.light[0]};--ac2:#${T.light[1]}}@media(prefers-color-scheme:light){:root[data-t="auto"]{--ac:#${T.light[0]};--ac2:#${T.light[1]}}}` +
      `:root[data-accent] .vlogo img,:root[data-accent] img.vlogo-i{filter:hue-rotate(${hue}deg) saturate(1.25) drop-shadow(0 0 7px #${T.m}88)!important}` +
      `:root[data-t="light"][data-accent] .vlogo img,:root[data-t="light"][data-accent] img.vlogo-i{filter:invert(1) hue-rotate(${180 + hue}deg) saturate(1.6) brightness(.85)!important}` +
      `@media(prefers-color-scheme:light){:root[data-t="auto"][data-accent] .vlogo img,:root[data-t="auto"][data-accent] img.vlogo-i{filter:invert(1) hue-rotate(${180 + hue}deg) saturate(1.6) brightness(.85)!important}}` : '';
  }

  // 2) Atributos de lo que se dibuja (se recuerda el valor original de cada uno)
  const ATTRS = ['style', 'fill', 'stroke', 'stop-color', 'flood-color', 'color'];
  const KEY = '__vxo';
  function themeEl(el) {
    if (!el.getAttribute) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v == null) continue;
      const memo = el[KEY] || (el[KEY] = {});
      // si la app cambió el valor desde la última vez, ese es el nuevo original
      if (!(a in memo) || memo[a].out !== v) memo[a] = { src: v, out: v };
      const out = cur ? recolor(memo[a].src) : memo[a].src;
      if (out !== v) { el.setAttribute(a, out); memo[a].out = out; }
    }
    if (el.tagName === 'IMG') {
      const v = el.getAttribute('src') || '';
      if (v.startsWith('data:image/svg+xml')) {
        const memo = el[KEY] || (el[KEY] = {});
        if (!memo.src || memo.src.out !== v) memo.src = { src: v, out: v };
        const out = cur ? recolor(memo.src.src) : memo.src.src;
        if (out !== v) { el.setAttribute('src', out); memo.src.out = out; }
      }
    }
  }
  function themeTree(root) {
    if (!root || !root.querySelectorAll) return;
    themeEl(root);
    root.querySelectorAll('[style],[fill],[stroke],[stop-color],[flood-color],img[src^="data:image/svg+xml"]').forEach(themeEl);
  }
  let pending = new Set(), raf = 0;
  const flush = () => { raf = 0; const L = [...pending]; pending = new Set(); L.forEach((n) => (n.isConnected ? themeTree(n) : 0)); };
  const mo = new MutationObserver((muts) => {
    if (!cur && !document.documentElement.dataset.accentWas) return;
    for (const m of muts) {
      if (m.type === 'childList') m.addedNodes.forEach((n) => { if (n.nodeType === 1) pending.add(n); else if (n.parentElement && n.parentElement.tagName === 'STYLE') pending.add(document.body); });
      else if (m.target.nodeType === 1) pending.add(m.target);
    }
    if (!raf) raf = requestAnimationFrame(flush);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'fill', 'stroke', 'src'] });

  function apply(name) {
    cur = THEMES[name] ? name : null;
    if (cur) document.documentElement.dataset.accent = cur; else delete document.documentElement.dataset.accent;
    document.documentElement.dataset.accentWas = '1';
    themeStyles();
    themeTree(document.body);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { if (!meta.dataset.orig) meta.dataset.orig = meta.content; meta.content = cur ? '#' + THEMES[cur].m : meta.dataset.orig; }
  }
  // 'verde' es el color de serie: quita el tema elegido y vuelve al verde original
  window.vxSetAccent = function (name) {
    const n = THEMES[name] ? name : null;
    try { if (n) localStorage.setItem('vx:accent', n); else localStorage.removeItem('vx:accent'); } catch (e) { /* sin almacenamiento */ }
    apply(n);
    if (typeof toast === 'function') toast('🎨 ' + tr(T2.applied) + ': ' + tr(n ? THEMES[n].n : T2.green));
    R();
  };
  window.vxAccent = () => cur;

  // ── Perfil → Temas: una opción más de la lista; al tocarla se abre la pantalla con los cuatro colores ──
  const T2 = {
    title: ['Temas', 'Themes', 'Thèmes', 'Temas'],
    sub: ['Elige el color de toda la app. Cambia al instante.', 'Pick the colour for the whole app. It changes instantly.', 'Choisis la couleur de toute l’app. Changement instantané.', 'Escolhe a cor de toda a app. Muda na hora.'],
    applied: ['Tema aplicado', 'Theme applied', 'Thème appliqué', 'Tema aplicado'],
    green: ['Verde', 'Green', 'Vert', 'Verde'],
    def: ['Predeterminado', 'Default', 'Par défaut', 'Predefinido'],
  };
  // tonos fuera de la lista GREENS para que la muestra del verde no se recoloree con el tema activo
  const GREEN = { n: T2.green, m: '57b801', b: '9cff2f' };
  const OPTS = [['verde', GREEN], ['azul', THEMES.azul], ['amarillo', THEMES.amarillo], ['rojo', THEMES.rojo]];
  V['vx:themes'] = function () {
    const sel = cur || 'verde';
    return `<div class="row" style="margin-bottom:14px"><button class="back" onclick="back()" aria-label="‹">‹</button><h1 style="font-size:22px">${tr(T2.title)}</h1></div>` +
      `<div class="mu" style="margin:-4px 0 12px">${tr(T2.sub)}</div><div class="card vx-thlist" role="radiogroup" aria-label="${tr(T2.title)}">` +
      OPTS.map(([k, T]) => `<button class="li vx-thr${sel === k ? ' on' : ''}" role="radio" aria-checked="${sel === k}" onclick="vxSetAccent('${k}')"><span class="vx-th-sw" style="--a:#${T.m};--b:#${T.b}"></span><div class="g"><b>${tr(T.n)}</b>${k === 'verde' ? `<div class="mu">${tr(T2.def)}</div>` : ''}</div><span class="vx-thk" aria-hidden="true">${sel === k ? '✓' : ''}</span></button>`).join('') +
      '</div>';
  };
  if (typeof V.prof === 'function') {
    const _prof = V.prof;
    V.prof = function () {
      let h = _prof.apply(this, arguments);
      try {
        const row = `<div class="li" onclick="go('vx:themes')"><div class="g">${tr(T2.title)}</div><span class="arr">›</span></div>`;
        const mk = `<div class="li" onclick="go('p:settings')">`;
        h = h.indexOf(mk) !== -1 ? h.replace(mk, row + mk) : h;
      } catch (e) { /* Perfil original */ }
      return h;
    };
  }

  let saved = null;
  try { saved = localStorage.getItem('vx:accent'); } catch (e) { /* sin almacenamiento */ }
  if (saved && THEMES[saved]) apply(saved);
  window.vxThemes = THEMES; window.vxRecolor = (s) => recolor(s); // para pruebas
})();
