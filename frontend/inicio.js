/* VOLTA · Inicio y Entrenos más simples y con más vida (decisión de los fundadores, 12-10-2026).
   Inicio (vistazo de la mañana):
     1. Tarjeta «Hoy»: Zeus con su mensaje + tu plan + botón Empezar (antes eran 3 tarjetas y 2 botones).
     2. Tres fichas en fila: Racha 🔥 · Liga 🏆 · Voltios ⚡, y debajo el objetivo de la semana.
     3. Comidas en una línea con «Registrar comida».   (Fuera: «Ver progreso», el anillo grande de calorías y el
        resumen repetido; todo eso está en sus pestañas.)
   Entrenos: misiones (3 a la vista + «Ver todas»), recuperación plegada, Biblioteca y Favoritos en dos fichas,
   sin la tarjeta de Zeus (ya tiene su botón flotante).
   Reorganiza lo que ya pintan los demás módulos (textos ya traducidos, mismos onclick); no cambia datos. */
(function () {
  'use strict';
  if (typeof R !== 'function' || typeof S === 'undefined') return;
  const root = () => { const r = document.getElementById('m'); if (!r) return null; return r.children.length === 1 && r.firstElementChild.children.length > 3 ? r.firstElementChild : r; };
  const kids = (r) => [...r.children];
  const byClass = (r, c) => kids(r).find((e) => e.classList && e.classList.contains(c));
  const byClick = (r, re, sel) => kids(r).find((e) => (!sel || e.matches(sel)) && re.test(e.getAttribute('onclick') || ''));
  const hasClick = (r, re) => kids(r).find((e) => !e.classList.contains('card') && [...e.querySelectorAll('[onclick]')].some((x) => re.test(x.getAttribute('onclick') || '')));
  const tr = (s) => (window.vxTr ? window.vxTr(s) : s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const nf = (n) => Math.round(+n || 0).toLocaleString(S.lang || 'es');

  function home(r) {
    if (r.dataset.vxIni === '1') return;
    const zeus = byClass(r, 'vx-zeus-card'), plan = byClick(r, /^playToday\(\)/, '.card');
    // 1. Tarjeta «Hoy»
    if (zeus && plan) {
      const hero = el('div', 'card vx-hero');
      const img = zeus.querySelector('.vx-zeus-img'), say = zeus.querySelector('.g');
      const top = el('div', 'vx-hero-top'); top.setAttribute('onclick', "go('coach')"); top.setAttribute('role', 'button'); top.tabIndex = 0;
      if (img) { img.width = 112; img.height = 112; top.appendChild(img); }
      if (say) top.appendChild(say);
      const bottom = el('div', 'vx-hero-plan'); bottom.setAttribute('onclick', 'playToday()'); bottom.setAttribute('role', 'button'); bottom.tabIndex = 0;
      const pg = plan.querySelector('.g'), pb = plan.querySelector('.btn');
      if (pg) bottom.appendChild(pg);
      if (pb) { pb.classList.add('vx-hero-go'); bottom.appendChild(pb); }
      hero.append(top, bottom);
      r.insertBefore(hero, zeus); zeus.remove(); plan.remove();
    }
    // 2. Fichas: racha, liga y Olimpo
    const st = byClass(r, 'vx-streak'), lg = byClass(r, 'vx-arena-card'), oly = byClass(r, 'vx-oly');
    const tiles = [st, lg, oly].filter(Boolean);
    if (tiles.length >= 2) {
      const row = el('div', 'vx-tiles');
      r.insertBefore(row, tiles[0]);
      tiles.forEach((t) => { t.classList.add('vx-tile'); row.appendChild(t); });
      const goal = oly && oly.querySelector('.vx-oly-goal');
      if (goal) { const g = el('div', 'card vx-goalbar'); g.appendChild(goal); const v = window.vxVolt ? window.vxVolt() : null; if (v && v.goal) { const b = el('div', 'bar'); b.innerHTML = `<i style="width:${Math.min(100, v.weekDone / v.goal * 100)}%"></i>`; g.appendChild(b); } row.after(g); }
    }
    // 3. Comidas en una línea
    const quick = hasClick(r, /vxFoodOpen\(|tab\('nut'\)/), kcal = byClick(r, /^go\('ngoal'\)/, '.card');
    if (kcal) {
      let k = 0, goal = 0;
      try { const d = window.NUTR; if (d) { k = d.tot(d.dateOfDow((new Date().getDay() + 6) % 7)).k; goal = d.goals().kc; } } catch (e) { /* sin datos */ }
      const line = el('div', 'card row vx-meals', `<span class="vx-meals-ic" aria-hidden="true">🍽️</span><div class="g" role="button" tabindex="0" onclick="go('ngoal')"><div class="mu" style="font-size:12.5px">${tr('Calorías de hoy')}</div><b>${nf(k)}${goal ? ' / ' + nf(goal) : ''} kcal</b></div><button class="btn sm vx-meals-btn" onclick="vxFoodOpen()">${tr('Registrar comida')}</button>`);
      r.insertBefore(line, kcal); kcal.remove();
    }
    if (quick) quick.remove();
    const sum = byClick(r, /^tab\('prog'\)/, '.card'); if (sum) sum.remove();
    r.dataset.vxIni = '1';
  }

  function train(r) {
    if (r.dataset.vxIni === '1') return;
    // misiones: 3 a la vista
    const mis = byClass(r, 'vx-missions');
    if (mis) {
      const rows = [...mis.querySelectorAll('.vx-mrow')];
      if (rows.length > 3 && !S.vxMisAll) {
        rows.slice(3).forEach((x) => { x.style.display = 'none'; });
        const b = el('button', 'vx-more', `${tr('Ver todas')} (${rows.length}) ›`); b.type = 'button'; b.setAttribute('onclick', 'S.vxMisAll=1;R()'); mis.appendChild(b);
      }
    }
    // recuperación plegada
    const rec = byClass(r, 'vx-rec');
    if (rec && !S.vxRecOpen) {
      const grid = rec.querySelector('.vx-recgrid');
      if (grid) { grid.style.display = 'none'; const b = el('button', 'vx-more', `${tr('Ver mapa muscular')} ›`); b.type = 'button'; b.setAttribute('onclick', 'S.vxRecOpen=1;R()'); rec.appendChild(b); }
    }
    // Biblioteca y Favoritos en dos fichas
    const lib = byClick(r, /^go\('lib'\)/, '.card'), fav = byClick(r, /^go\('favs'\)/, '.card');
    if (lib && fav) { const duo = el('div', 'vx-duo'); r.insertBefore(duo, lib); duo.append(lib, fav); lib.classList.add('vx-duo-c'); fav.classList.add('vx-duo-c'); }
    const coach = kids(r).find((e) => /^go\('coach'\)/.test(e.getAttribute('onclick') || '') && !e.classList.contains('vx-hero')); if (coach) coach.remove();
    r.dataset.vxIni = '1';
  }

  // Entrada suave de las tarjetas al cambiar de pantalla (no en cada repintado)
  let lastView = '';
  function enter(r, view) {
    if (view === lastView) return; lastView = view;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    kids(r).forEach((c, i) => { if (i > 14) return; c.style.setProperty('--vxi', i); c.classList.add('vx-in'); setTimeout(() => c.classList.remove('vx-in'), 700 + i * 45); });
  }

  const _R = R;
  R = function () {
    _R.apply(this, arguments);
    try {
      const r = root(); if (!r) return;
      const top = S.stack && S.stack.length ? S.stack[S.stack.length - 1] : '';
      if (!top && S.tab === 'home') home(r);
      if (!top && S.tab === 'train') train(r);
      enter(r, (top || S.tab) + '');
    } catch (e) { /* se queda la pantalla tal cual */ }
  };

  if (window.vxAddTr) window.vxAddTr(`
Ver todas|See all|Tout voir|Ver todas
Ver mapa muscular|View muscle map|Voir la carte musculaire|Ver mapa muscular
`);
})();
