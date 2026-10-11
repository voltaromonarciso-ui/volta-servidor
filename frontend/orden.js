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
  const byText = (root, re, sel) => kids(root).find((e) => (!sel || e.matches(sel)) && re.test((e.textContent || '').slice(0, 160)));

  // Coloca los elementos en este orden donde estaba el primero de ellos
  function place(root, seq) {
    const ref = kids(root).find((e) => seq.includes(e)); if (!ref) return;
    const mk = document.createComment('vx'); root.insertBefore(mk, ref);
    seq.forEach((e) => root.insertBefore(e, mk)); mk.remove();
  }
  function orderHome(root) {
    const zeus = byClass(root, 'vx-zeus-card');
    const plan = byText(root, /Tu plan de hoy|Today’s plan|Ton plan du jour|O teu plano de hoje|Entrenamiento de hoy/, '.card');
    const quick = kids(root).find((e) => !e.classList.contains('card') && e.querySelector && e.querySelector('button') && /Registrar comida|Log meal|Log food|Enregistrer|Registar/.test(e.textContent || ''));
    const oly = byClass(root, 'vx-oly'), lg = byClass(root, 'vx-arena-card'), st = byClass(root, 'vx-streak');
    const seq = [zeus, plan, quick, oly, lg, st].filter(Boolean);
    if (seq.length < 3) return;
    place(root, seq);
  }

  function orderTrain(root) {
    // fuera la lista larga y los filtros: eso está en la Biblioteca
    const lst = root.querySelector('#lst'); if (lst) lst.remove();
    kids(root).forEach((e) => { if (e.tagName === 'H2' && /^(Ejercicios|Exercises|Exercices|Exercícios)$/.test((e.textContent || '').trim())) e.remove(); });
    const ch = root.querySelector('.chips.ch2'); if (ch) ch.remove();
    const q = root.querySelector('#q');
    if (q) {
      q.readOnly = true; q.setAttribute('aria-haspopup', 'dialog');
      const open = (ev) => { ev.preventDefault(); S.vxFocusLib = 1; go('lib'); };
      q.addEventListener('focus', open); q.addEventListener('click', open);
    }
    const hero = byClass(root, 'hero2');
    const quick = kids(root).find((e) => !e.classList.contains('card') && e.querySelector && e.querySelector('button,[onclick]') && /rutinas|routines|rotinas/i.test(e.textContent || '') && (e.textContent || '').length < 120);
    const mis = byClass(root, 'vx-missions'), rec = byClass(root, 'vx-recovery') || byText(root, /Recuperación muscular|Muscle recovery|Récupération|Recuperação/, '.card');
    const lab = byClass(root, 'vx-lab-card');
    const libc = byText(root, /Biblioteca de ejercicios|Exercise library|Bibliothèque|Biblioteca de exercícios/, '.card');
    const fav = byText(root, /Favoritos|Favorites|Favoris/, '.card');
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
