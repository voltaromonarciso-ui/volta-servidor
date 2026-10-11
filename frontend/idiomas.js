/* VOLTA · Idiomas nuevos: alemán, italiano, ruso, árabe, turco, japonés, coreano, chino e hindi.
   Cómo funciona:
   - Con uno de estos idiomas la app se pinta en inglés (idioma puente: todos los módulos lo tienen completo).
   - Este módulo traduce del inglés al idioma elegido con public/assets/i18n/<idioma>.json, que solo se descarga
     si el usuario elige ese idioma (la app no pesa más) y queda guardado para usarlo sin conexión.
   - Diccionario: textos exactos; {0}, {1}… para cifras («Exercise {0} of {1}»); {s1}, {s2}… para texto variable.
   - Árabe: la pantalla se pone de derecha a izquierda.
   Para añadir textos: npm run build:app && node scripts/i18n-extract.js, traducir lo nuevo y node scripts/i18n-check.js */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof R !== 'function' || !window.vxTr) return;
  const XL = window.VXL2 || ['de', 'it', 'ru', 'ar', 'tr', 'ja', 'ko', 'zh', 'hi'];
  const RTL = { ar: 1 };
  const VER = '__VX_I18N__';
  const NUM = /\d+(?:[.,]\d+)*/g;
  const dicts = {}; // idioma → { s, up, pats, memo } | 'loading' | 'error'

  function compile(lang, j) {
    const s = j.strings || {}, pats = [];
    const up = {};
    Object.keys(s).forEach((k) => { up[k.toUpperCase()] = s[k]; });
    // textos con huecos de texto ({s1}) y patrones: se convierten en expresiones regulares
    const toRe = (k) => {
      const parts = k.split(/(\{s?\d\})/);
      const groups = [];
      const src = parts.map((x) => { const m = /^\{(s?)(\d)\}$/.exec(x); if (!m) return x.replace(/[.*+?^$()|[\]\\]/g, '\\$&'); groups.push(x); return m[1] ? '(.+?)' : '(\\d+(?:[.,]\\d+)*)'; }).join('');
      return { re: new RegExp('^' + src + '$'), groups };
    };
    Object.keys(s).forEach((k) => { if (/\{s\d\}/.test(k)) pats.push(Object.assign(toRe(k), { out: s[k] })); });
    Object.keys(j.patterns || {}).forEach((k) => pats.push(Object.assign(toRe(k), { out: j.patterns[k] })));
    pats.sort((a, b) => b.re.source.length - a.re.source.length); // primero los más concretos
    return { s, up, pats, memo: new Map(), lang };
  }

  function tx(d, str, depth) {
    if (!str || depth > 4) return str;
    if (d.memo.has(str)) return d.memo.get(str);
    const out = tx1(d, str, depth);
    if (d.memo.size > 20000) d.memo.clear();
    d.memo.set(str, out);
    return out;
  }
  function tx1(d, str, depth) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(str); const a = m[1], core = m[2], z = m[3];
    if (!core || !/\p{L}/u.test(core)) return str;
    const r = look(d, core, depth);
    if (r != null) return a + r + z;
    // lo que va delante (emoji, signos) se deja igual
    const p = /^([^\p{L}¿¡]+)([\s\S]+)$/u.exec(core);
    if (p) { const r2 = look(d, p[2], depth); if (r2 != null) return a + p[1] + r2 + z; }
    // trozos separados por « · » o « — »
    for (const sep of [' · ', ' — ', ' | ']) {
      if (core.indexOf(sep) === -1) continue;
      let any = false;
      const o = core.split(sep).map((x) => { const y = tx(d, x, depth + 1); if (y !== x) any = true; return y; }).join(sep);
      if (any) return a + o + z;
    }
    return str;
  }
  function look(d, k, depth) {
    if (Object.prototype.hasOwnProperty.call(d.s, k) && !/\{s\d\}/.test(k)) return d.s[k];
    // cifras: «Exercise 3 of 8» → «Exercise {0} of {1}»
    const nums = []; const km = k.replace(NUM, (n) => '{' + (nums.push(n) - 1) + '}');
    if (nums.length && Object.prototype.hasOwnProperty.call(d.s, km)) return d.s[km].replace(/\{(\d)\}/g, (_, i) => (nums[+i] != null ? nums[+i] : ''));
    // MAYÚSCULAS
    if (k === k.toUpperCase() && k !== k.toLowerCase()) {
      const u = d.up[k] != null ? d.up[k] : (nums.length ? d.up[km.toUpperCase()] : null);
      if (u != null) return u.replace(/\{(\d)\}/g, (_, i) => nums[+i] || '').toLocaleUpperCase(d.lang);
    }
    // patrones con huecos de texto
    for (const p of d.pats) {
      const mm = p.re.exec(k); if (!mm) continue;
      let o = p.out;
      p.groups.forEach((g, i) => { const v = mm[i + 1]; o = o.split(g).join(/^\{s/.test(g) ? tx(d, v, depth + 1) : v); });
      return o;
    }
    return null;
  }

  function load(lang) {
    if (dicts[lang]) return;
    dicts[lang] = 'loading';
    fetch('assets/i18n/' + lang + '.json?v=' + VER)
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((j) => { dicts[lang] = compile(lang, j); if (S.lang === lang) { R(); walk(document.body); } })
      .catch(() => { dicts[lang] = 'error'; setTimeout(() => { if (dicts[lang] === 'error') delete dicts[lang]; }, 30000); });
  }

  const _tr = window.vxTr;
  window.vxTr = function (str) {
    const r = _tr(str);
    if (typeof r !== 'string' || XL.indexOf(S.lang) < 0) return r;
    const d = dicts[S.lang];
    if (!d || typeof d === 'string') { load(S.lang); return r; }
    return tx(d, r, 0);
  };
  window.vxI18nReady = (lang) => { const d = dicts[lang || S.lang]; return !!d && typeof d === 'object'; };

  // Traduce todo lo que aparece en pantalla (bienvenida, ventanas, avisos…), no solo la pantalla principal
  const ATTR = ['placeholder', 'aria-label', 'title', 'alt'];
  function walk(root) {
    if (!root || XL.indexOf(S.lang) < 0 || !window.vxI18nReady()) return;
    if (root.nodeType === 3) { const v = root.nodeValue, r = window.vxTr(v); if (r !== v) root.nodeValue = r; return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.tagName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; const ns = [];
    while ((n = w.nextNode())) { const pe = n.parentElement; if (pe && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(pe.tagName) && !pe.closest('[data-notr]')) ns.push(n); }
    ns.forEach((t) => { const v = t.nodeValue, r = window.vxTr(v); if (r !== v) t.nodeValue = r; });
    [root].concat([...root.querySelectorAll('[placeholder],[aria-label],[title],img[alt]')]).forEach((e) => ATTR.forEach((a) => { const v = e.getAttribute && e.getAttribute(a); if (!v) return; const r = window.vxTr(v); if (r !== v) e.setAttribute(a, r); }));
  }
  let pend = new Set(), raf = 0;
  const flush = () => { raf = 0; const xs = [...pend]; pend = new Set(); xs.forEach((x) => { if (x.isConnected) walk(x); }); };
  new MutationObserver((ms) => {
    if (XL.indexOf(S.lang) < 0) return;
    ms.forEach((m) => m.addedNodes.forEach((x) => pend.add(x)));
    if (pend.size && !raf) raf = (window.requestAnimationFrame || setTimeout)(flush);
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.vxI18nWalk = walk;

  // dirección del texto y precarga del diccionario
  const _R = R;
  R = function () {
    if (XL.indexOf(S.lang) >= 0) load(S.lang);
    _R.apply(this, arguments);
    const h = document.documentElement, dir = RTL[S.lang] ? 'rtl' : 'ltr';
    if (h.dir !== dir) h.dir = dir;
    if (h.lang !== S.lang) h.lang = S.lang;
    if (XL.indexOf(S.lang) >= 0) { const m = document.getElementById('m'); if (m) walk(m); }
  };
  if (XL.indexOf(S.lang) >= 0) load(S.lang);
})();
