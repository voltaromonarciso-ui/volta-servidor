/* VOLTA · Accesibilidad (WCAG 2.2 AA). Se carga el último, después de temas.js.
   1) Botones hechos con <div>/<span onclick>: se les da rol de botón, foco con Tab y se activan con Intro o Espacio.
      Los chips de un grupo (.chips) indican si están seleccionados (aria-pressed).
   2) Formularios: cada <label> suelto se asocia al campo que tiene detrás, para que el lector de pantalla lo anuncie.
   3) Contraste: si un texto no llega a 4,5:1 (3:1 si es grande) sobre su fondo real, se oscurece o aclara su color
      sin cambiar el tono, hasta que se lea bien. Vale para los tres temas, el verde original, el modo claro y el oscuro,
      y para lo que se añada en el futuro. Los textos sobre degradados o imágenes no se tocan.
   Todo se revisa después de cada pintado y al cambiar de tema. */
(function () {
  if (typeof S !== 'object' || typeof R !== 'function') return;
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const tr = (a) => a[LI[S.lang] || 0];
  const T = {
    search: ['Buscar', 'Search', 'Rechercher', 'Pesquisar'],
    ranks: ['Guía de rangos', 'Rank guide', 'Guide des rangs', 'Guia de rangos'],
  };

  // ── 1) Botones y chips ──
  const NATIVE = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|OPTION)$/;
  function nameFor(el) {
    const oc = el.getAttribute('onclick') || '';
    if (/getElementById\('q'\)\.focus/.test(oc)) return tr(T.search);
    // puntos de la gráfica de peso: se nombran con su fecha y valor
    const pt = oc.match(/^selPt\((\d+)\)/);
    if (pt && typeof wDet === 'function') { try { const d = document.createElement('div'); d.innerHTML = wDet(+pt[1]); return d.textContent.replace(/\s+/g, ' ').trim().slice(0, 80); } catch (e) { /* sin nombre */ } }
    const t = el.getAttribute('title');
    if (t) return t;
    const img = el.querySelector('img[alt]');
    return img ? img.alt : '';
  }
  function fixControls(root) {
    root.querySelectorAll('[onclick]').forEach((el) => {
      if (NATIVE.test(el.tagName) || el.closest('button,a')) return;
      const oc = el.getAttribute('onclick') || '';
      // fondos de ventanas que se cierran al tocar fuera: no son botones
      if (/event\.target|===\s*this|this\s*===/.test(oc)) return;
      // el panel interior de una ventana (solo frena el clic) y el fondo que la cierra no son botones
      if (/^\s*event\.stopPropagation\(\);?\s*$/.test(oc)) return;
      const fc = el.firstElementChild;
      if (fc && /^\s*event\.stopPropagation\(\);?\s*$/.test(fc.getAttribute('onclick') || '')) return;
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.dataset.vxk = '1';
      // una tarjeta que lleva otros botones dentro (★ favorito…) no puede ser "botón": solo recibe el foco
      if (el.querySelector('button,a,input,select,textarea,[onclick]')) { if (el.getAttribute('role') === 'button') el.removeAttribute('role'); return; }
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      if (el.classList.contains('chip') && el.parentElement && el.parentElement.classList.contains('chips')) {
        el.setAttribute('aria-pressed', el.classList.contains('on') ? 'true' : 'false');
      }
      if (el.classList.contains('vinfo') && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', tr(T.ranks));
      if (!el.hasAttribute('aria-label') && !el.textContent.trim()) {
        const n = nameFor(el);
        if (n) el.setAttribute('aria-label', n);
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target;
    if (!el || !el.dataset || el.dataset.vxk !== '1' || NATIVE.test(el.tagName)) return;
    e.preventDefault();
    el.click();
  });

  // ── 2) Etiquetas de formulario ──
  let uid = 0;
  const isField = (el) => el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.type !== 'hidden';
  function fixLabels(root) {
    const pd = document.getElementById('pd'); // detalle del punto elegido en la gráfica de peso
    if (pd && !pd.hasAttribute('aria-live')) pd.setAttribute('aria-live', 'polite');
    root.querySelectorAll('label:not([for])').forEach((lb) => {
      if (lb.querySelector('input,select,textarea')) return;
      const f = lb.nextElementSibling;
      if (!isField(f)) return;
      if (!f.id) f.id = 'vxf' + (++uid);
      lb.htmlFor = f.id;
    });
  }

  // ── 3) Contraste ──
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  function toHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function fromHsl([h, s, l]) {
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [r, g, b].map((v) => Math.round((v + m) * 255)).concat(1);
  }

  let bgCache = new Map(), opCache = new Map();
  // opacidad acumulada (la del elemento por la de todos sus antepasados)
  function opOf(el) {
    if (!el || el === document.documentElement) return 1;
    if (opCache.has(el)) return opCache.get(el);
    const v = +getComputedStyle(el).opacity * opOf(el.parentElement);
    opCache.set(el, v);
    return v;
  }
  // Color de fondo real (capas semitransparentes incluidas). null si hay un degradado o una imagen detrás.
  function bgOf(el) {
    if (bgCache.has(el)) return bgCache.get(el);
    let out;
    const cs = getComputedStyle(el);
    if (cs.backgroundImage !== 'none') out = null;
    else {
      const c = parse(cs.backgroundColor) || [0, 0, 0, 0];
      if (c[3] >= 1) out = c;
      else {
        const below = el.parentElement ? bgOf(el.parentElement) : [255, 255, 255, 1];
        out = below && (c[3] > 0 ? over(c, below) : below);
      }
    }
    bgCache.set(el, out);
    return out;
  }
  const FIXED = new Set();
  function fixContrast(full) {
    // Al cambiar de tema o de modo claro/oscuro se deshacen los ajustes para medir con los colores nuevos.
    // En un pintado normal, lo ya corregido se deja como está (rehacerlo obligaría a recalcular estilos).
    FIXED.forEach((el) => {
      const o = el.__vxc;
      if (!el.isConnected) { FIXED.delete(el); return; }
      // sigue valiendo si no ha cambiado de clase (p. ej. la pestaña activa de la barra inferior)
      if (!full && o && el.style.getPropertyValue('color') === o.set && el.className === o.cls) return;
      if (o) {
        if (el.style.getPropertyValue('color') === o.set) el.style.setProperty('color', o.color, o.prio);
        if (o.op != null && el.style.getPropertyValue('opacity') === '1') el.style.setProperty('opacity', o.op, o.opPrio);
      }
      delete el.__vxc;
      FIXED.delete(el);
    });
    bgCache = new Map(); opCache = new Map();
    const todo = []; // se mide todo primero y se aplica al final: así el navegador no recalcula estilos en cada ajuste
    const root = document.getElementById('app') || document.body;
    const all = root.querySelectorAll('*');
    for (const el of all) {
      if (el.__vxc || /^(SCRIPT|STYLE|svg|SVG|PATH|IMG|CANVAS|VIDEO|OPTION)$/.test(el.tagName) || el.closest('svg')) continue;
      let txt = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && /[\p{L}\p{N}]/u.test(n.nodeValue)) { txt = true; break; }
      if (!txt) continue;
      if (!el.getClientRects().length || el.disabled || el.closest('[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') continue;
      const fg0 = parse(cs.color);
      if (!fg0 || fg0[3] === 0) continue;
      const bg = bgOf(el);
      if (!bg) continue;
      const op = opOf(el);
      const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
      const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;
      const fg = [fg0[0], fg0[1], fg0[2], fg0[3] * op];
      if (ratio(over(fg, bg), bg) >= need) continue;
      const memo = { color: el.style.getPropertyValue('color'), prio: el.style.getPropertyPriority('color'), cls: el.className };
      // un texto atenuado con opacidad: primero se le quita la opacidad propia
      if (+cs.opacity < 1) {
        memo.op = el.style.getPropertyValue('opacity'); memo.opPrio = el.style.getPropertyPriority('opacity');
        fg[3] = fg0[3] * (op / +cs.opacity);
      }
      // se mueve la luminosidad hacia el lado que da contraste (oscurecer sobre claro, aclarar sobre oscuro)
      const darker = lum(bg) > 0.18;
      const hsl = toHsl(fg0);
      let best = null;
      for (let i = 1; i <= 40; i++) {
        const l = darker ? hsl[2] * (1 - i / 40) : hsl[2] + (1 - hsl[2]) * (i / 40);
        const c = fromHsl([hsl[0], hsl[1], l]);
        if (ratio(over([c[0], c[1], c[2], fg[3]], bg), bg) >= need + 0.3) { best = c; break; }
      }
      if (!best) best = darker ? [0, 0, 0, 1] : [255, 255, 255, 1];
      memo.set = `rgb(${best[0]}, ${best[1]}, ${best[2]})`;
      todo.push([el, memo]);
    }
    for (const [el, memo] of todo) {
      if (memo.op != null) el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('color', memo.set, 'important');
      memo.set = el.style.getPropertyValue('color');
      el.__vxc = memo;
      FIXED.add(el);
    }
  }

  // ── Revisión después de cada cambio ──
  let raf = 0, full = true, waits = 0;
  // Mientras haya una transición o una animación de entrada en marcha (fundido al abrir una pantalla, cambio de tema…)
  // se espera: medir a mitad daría colores u opacidades intermedios y "corregiría" textos que al final se leen bien.
  // Las animaciones infinitas (miniaturas de ejercicios) no cuentan.
  const fading = () => {
    if (!document.getAnimations) return false;
    return document.getAnimations().some((a) => {
      if (a.playState !== 'running') return false;
      if (a.transitionProperty) return /color|background|opacity|^all$/.test(a.transitionProperty);
      try { return a.effect.getComputedTiming().iterations !== Infinity; } catch (e) { return false; }
    });
  };
  function pass() {
    raf = 0;
    // botones y etiquetas, al momento
    try { fixControls(document.body); fixLabels(document.body); } catch (e) { console.warn('[volta] a11y', e); }
    // el contraste, cuando termine el fundido de entrada o el cambio de tema
    if (fading() && waits++ < 120) { raf = requestAnimationFrame(pass); return; }
    waits = 0;
    const f = full; full = false;
    try { fixContrast(f); } catch (e) { console.warn('[volta] a11y', e); }
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(pass); };
  const scheduleFull = () => { full = true; schedule(); };
  new MutationObserver((muts) => {
    for (const m of muts) if (m.type === 'attributes' || [...m.addedNodes].some((n) => n.nodeType === 1)) { schedule(); return; }
  }).observe(document.documentElement, { childList: true, subtree: true });
  new MutationObserver(scheduleFull).observe(document.documentElement, { attributes: true, attributeFilter: ['data-t', 'data-accent'] });
  if (window.matchMedia) { const mq = matchMedia('(prefers-color-scheme: light)'); if (mq.addEventListener) mq.addEventListener('change', scheduleFull); }
  schedule();
  window.vxA11y = (all) => { full = full || !!all; pass(); }; // para pruebas
})();
