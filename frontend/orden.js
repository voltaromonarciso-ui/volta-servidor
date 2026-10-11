/* VOLTA · Orden de Inicio y Entrenos («lo de hoy» primero).
   Inicio, pensado para abrirlo al despertar:
     1. Zeus (mensaje del día)   2. Tu plan de hoy y accesos rápidos   3. Tu Olimpo y tu liga
     4. Racha                    5. Calorías y el resto
   Entrenos: Hoy, rutinas, misiones, recuperación y Trabajos. La lista completa de ejercicios vive en la Biblioteca:
   el buscador de Entrenos te lleva a ella.
   Se reordena el DOM después de pintar, así cada módulo sigue insertando sus tarjetas como siempre. */
(function () {
  'use strict';
  if (typeof R !== 'function' || typeof S === 'undefined') return;
  const m = () => { const r = document.getElementById('m'); if (!r) return null; return r.children.length === 1 && r.firstElementChild.children.length > 3 ? r.firstElementChild : r; };
  const kids = (root) => [...root.children];
  const byClass = (root, c) => kids(root).find((e) => e.classList && e.classList.contains(c));
  // por lo que hace al tocarlo (no por el texto: así funciona en todos los idiomas)
  const byClick = (root, re, sel) => kids(root).find((e) => (!sel || e.matches(sel)) && re.test(e.getAttribute('onclick') || ''));
  const hasClick = (root, re) => kids(root).find((e) => !e.classList.contains('card') && [...e.querySelectorAll('[onclick]')].some((x) => re.test(x.getAttribute('onclick') || '')));

  // Coloca los elementos en este orden donde estaba el primero de ellos
  function place(root, seq) {
    const ref = kids(root).find((e) => seq.includes(e)); if (!ref) return;
    const mk = document.createComment('vx'); root.insertBefore(mk, ref);
    seq.forEach((e) => root.insertBefore(e, mk)); mk.remove();
  }
  function orderHome(root) {
    const zeus = byClass(root, 'vx-zeus-card');
    const plan = byClick(root, /^playToday\(\)/, '.card');
    const quick = hasClick(root, /vxFoodOpen\(|tab\('nut'\)/);
    const oly = byClass(root, 'vx-oly'), lg = byClass(root, 'vx-arena-card'), st = byClass(root, 'vx-streak');
    const seq = [zeus, plan, quick, oly, lg, st].filter(Boolean);
    if (seq.length < 3) return;
    place(root, seq);
  }

  function orderTrain(root) {
    // fuera la lista larga y los filtros: eso está en la Biblioteca
    const lst = root.querySelector('#lst');
    if (lst) {
      // el título «Ejercicios» y los filtros que van justo antes de la lista
      let e = lst.previousElementSibling;
      for (let k = 0; e && k < 3; k++) { const prev = e.previousElementSibling; if (e.tagName === 'H2' || e.matches('.chips.ch2')) { const h2 = e.tagName === 'H2'; e.remove(); if (h2) break; } e = prev; }
      lst.remove();
    }
    const ch = root.querySelector('.chips.ch2'); if (ch) ch.remove();
    const q = root.querySelector('#q');
    if (q) {
      q.readOnly = true; q.setAttribute('aria-haspopup', 'dialog');
      const open = (ev) => { ev.preventDefault(); S.vxFocusLib = 1; go('lib'); };
      q.addEventListener('focus', open); q.addEventListener('click', open);
    }
    const hero = byClass(root, 'hero2');
    const quick = hasClick(root, /go\('routines'\)/);
    const mis = byClass(root, 'vx-missions'), rec = byClass(root, 'vx-rec') || byClass(root, 'vx-recovery');
    const lab = byClass(root, 'vx-lab-card');
    const libc = byClick(root, /^go\('lib'\)/, '.card');
    const fav = byClick(root, /^go\('favs'\)/, '.card');
    const coach = kids(root).find((e) => e.getAttribute && /go\('coach'\)/.test(e.getAttribute('onclick') || ''));
    const seq = [hero, quick, mis, rec, lab, libc, fav, coach].filter(Boolean);
    if (!seq.length) return;
    place(root, seq);
  }

  const _R = R;
  R = function () {
    _R.apply(this, arguments);
    try {
      const root = m(); if (!root) return;
      const top = S.stack && S.stack.length ? S.stack[S.stack.length - 1] : '';
      if (!top && S.tab === 'home') orderHome(root);
      if (!top && S.tab === 'train') orderTrain(root);
      if (top === 'lib' && S.vxFocusLib) { S.vxFocusLib = 0; const i = root.querySelector('input'); if (i) setTimeout(() => i.focus(), 30); }
    } catch (e) { /* se queda el orden original */ }
  };
})();
