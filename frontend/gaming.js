/* VOLTA · Progreso, Nutrición y Perfil con estilo «gaming» (decisión de los fundadores, 12-10-2026).
   Progreso: arriba tu rango de Voltios en grande (brillo, rayos) y tu evolución reciente (fuerza, volumen, entrenos);
             debajo, la gráfica de evolución y el resumen de la semana. Fuera la gráfica repetida de volumen.
   Nutrición (Día): arriba el anillo de calorías y macros con «Registrar comida»; Explorar baja al final.
   Perfil: tarjeta de atleta (avatar, rango, liga, racha, medallas y estadísticas) que se puede compartir como imagen.
   Como inicio.js: reorganiza lo que ya pintan los demás módulos (mismos onclick y textos traducidos); no cambia datos. */
(function () {
  'use strict';
  if (typeof R !== 'function' || typeof S === 'undefined') return;
  const tr = (s) => (window.vxTr ? window.vxTr(s) : s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const nf = (n) => Math.round(+n || 0).toLocaleString(S.lang || 'es');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nice = (s) => String(s || '').split(' ').map((w, i) => (i ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ');
  const pct = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);
  const BOLT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2 4 13.5h6.5L9 22l11-12.5h-6.8z"/></svg>';

  // ── Evolución: últimas 2 semanas frente a las 2 anteriores ──
  function evolution() {
    let L = [];
    try { L = (typeof getLog === 'function' ? getLog() : S.log || []).filter((l) => l && l.t && l.ty !== 'warmup' && (+l.w || 0) >= 0 && (+l.r || 0) > 0); } catch (e) { L = []; }
    const now = Date.now(), H = 14 * 864e5;
    const half = (a, b) => L.filter((l) => l.t > now - a && l.t <= now - b);
    const A = half(H, 0), B = half(2 * H, H);
    const vol = (x) => x.reduce((s, l) => s + (+l.w || 0) * (+l.r || 0), 0);
    const days = (x) => new Set(x.map((l) => new Date(l.t).toDateString())).size;
    const best = (x) => { const o = {}; x.forEach((l) => { const v = +l.e1 || (+l.w || 0) * (1 + (+l.r || 0) / 30); if (v > (o[l.ex] || 0)) o[l.ex] = v; }); return o; };
    const ba = best(A), bb = best(B), common = Object.keys(ba).filter((k) => bb[k] > 0);
    const str = common.length ? Math.round((common.reduce((s, k) => s + ba[k] / bb[k], 0) / common.length - 1) * 100) : null;
    return { str, vol: pct(vol(A), vol(B)), volN: vol(A), ses: days(A), sesD: days(A) - days(B), any: A.length > 0 };
  }
  const delta = (v, unit) => (v == null ? '<em class="vx-g-new">' + tr('nuevo') + '</em>' : `<em class="${v > 0 ? 'up' : v < 0 ? 'down' : ''}">${v > 0 ? '▲ +' : v < 0 ? '▼ ' : '= '}${v > 0 || v < 0 ? nf(v) : '0'}${unit}</em>`);

  function prog(r) {
    const vp = r.querySelector('.vp'); if (!vp || vp.dataset.vxG === '1') return;
    const hero = vp.querySelector('.vhero'); if (!hero) return;
    vp.dataset.vxG = '1';
    hero.classList.add('vx-g-rank');
    const nm = hero.querySelector('.nm');
    if (nm) { const emb = el('div', 'vx-g-emb', BOLT); emb.setAttribute('aria-hidden', 'true'); hero.insertBefore(emb, nm); }
    hero.insertAdjacentHTML('beforeend', '<i class="vx-g-spark s1" aria-hidden="true"></i><i class="vx-g-spark s2" aria-hidden="true"></i><i class="vx-g-spark s3" aria-hidden="true"></i>');
    // tarjeta de evolución
    const e = evolution();
    const evo = el('div', 'card vx-g-evo', `<div class="vx-g-h"><b>${tr('Tu evolución')}</b><span class="mu">${tr('Últimas 2 semanas')}</span></div>` +
      '<div class="vx-g-stats3">' +
      `<div><span class="vx-g-ic" aria-hidden="true">🏋️</span><span class="mu">${tr('Fuerza')}</span>${delta(e.any ? e.str : null, '%')}</div>` +
      `<div><span class="vx-g-ic" aria-hidden="true">📈</span><span class="mu">${tr('Volumen')}</span>${delta(e.any ? e.vol : null, '%')}</div>` +
      `<div><span class="vx-g-ic" aria-hidden="true">📅</span><span class="mu">${tr('Entrenos')}</span><b>${nf(e.ses)}</b>${e.sesD ? `<em class="${e.sesD > 0 ? 'up' : 'down'}">${e.sesD > 0 ? '+' : ''}${e.sesD}</em>` : ''}</div>` +
      '</div>');
    hero.after(evo);
    // la gráfica de evolución sube; la de volumen repetida se quita
    const chips = [...vp.children].filter((c) => c.classList.contains('chips'));
    const charts = [...vp.children].filter((c) => c.classList.contains('vch'));
    const metric = chips.find((c) => /S\.pmt=/.test(c.innerHTML)), period = chips.find((c) => /S\.prr=/.test(c.innerHTML));
    const h2 = metric && metric.previousElementSibling && metric.previousElementSibling.tagName === 'H2' ? metric.previousElementSibling : null;
    const evoChart = metric && metric.nextElementSibling && metric.nextElementSibling.classList.contains('vch') ? metric.nextElementSibling : null;
    if (metric && h2 && evoChart) {
      charts.filter((c) => c !== evoChart).forEach((c) => c.remove());
      let at = evo;
      [h2, period, metric, evoChart].filter(Boolean).forEach((n) => { at.after(n); at = n; });
      evoChart.classList.add('vx-g-chart');
    }
  }

  function nut(r) {
    const vx = r.querySelector('.vx') || r; if (vx.dataset.vxG === '1') return;
    const ringC = vx.querySelector('circle[r="52"]'); const ring = ringC && ringC.closest('.card'); if (!ring) return;
    vx.dataset.vxG = '1';
    const chips = [...vx.children].find((c) => c.classList.contains('chips'));
    ring.classList.add('vx-g-fuel');
    const head = el('div', 'vx-g-fuelh', `<span class="vx-g-boltic">${BOLT}</span><b>${tr('Combustible de hoy')}</b>`);
    const box = el('div', 'card vx-g-fuelbox');
    const log = el('button', 'btn vx-g-log', `＋ ${tr('Registrar comida')}`); log.type = 'button';
    log.setAttribute('onclick', typeof window.vxFoodOpen === 'function' ? 'vxFoodOpen()' : "go('explore')");
    if (chips) chips.after(box); else vx.insertBefore(box, ring);
    ring.classList.remove('card');
    box.append(head, ring, log);
    // Explorar y los botones de modo bajan, antes de Personalización
    const explore = [...vx.children].find((c) => /^go\('explore'\)/.test(c.getAttribute('onclick') || ''));
    const mode = [...vx.children].find((c) => c.classList.contains('row') && /S\.mode=/.test(c.innerHTML));
    const vcard = vx.querySelector('.vcard'), pers = vcard && vcard.parentElement && vcard.parentElement.previousElementSibling;
    if (pers && pers.tagName === 'H2') [explore, mode].filter(Boolean).forEach((n) => vx.insertBefore(n, pers));
  }

  // ── Tarjeta de atleta ──
  function athlete() {
    const o = { name: (S.name || '').trim() || tr('Atleta'), rank: '', p: 0, volt: 0, league: '', streak: +S.streakCount || 0, medals: 0, total: 0 };
    try { const v = window.vxVolt && window.vxVolt(); if (v) { o.volt = v.total; o.rank = nice(v.rank.nm); o.p = v.rank.p; o.ri = v.rank.i; } } catch (e) { /* sin Voltios */ }
    try { if (window.vxPractice) { const g = window.vxPractice.group(); o.league = tr(window.vxPractice.names[g.i] || ''); o.pos = g.pos; } } catch (e) { /* sin liga */ }
    try { const a = window.vxAch ? window.vxAch() : []; o.medals = a.filter((x) => x.ok).length; o.total = a.length; } catch (e) { /* sin logros */ }
    return o;
  }
  function prof(r) {
    if (r.dataset.vxG === '1') return;
    const kids = [...r.children];
    const who = kids.find((c) => c.classList.contains('row') && c.querySelector(':scope > .th'));
    const grid = kids.find((c) => c.classList.contains('grid2'));
    if (!who) return;
    r.dataset.vxG = '1';
    const a = athlete();
    const card = el('div', 'card vx-g-card');
    const top = el('div', 'vx-g-ctop');
    const av = who.querySelector('.th'); av.classList.add('vx-g-av');
    const ring = el('div', 'vx-g-avring'); ring.appendChild(av);
    const info = who.querySelector('.g'); info.classList.add('vx-g-who');
    const bar = info.querySelector('.bar'); if (bar) bar.remove();
    top.append(ring, info);
    const lg = el('div', 'vx-g-lg', `<span aria-hidden="true">🏆</span>${esc(a.league)}`); if (a.league) info.appendChild(lg);
    const rk = el('div', 'vx-g-rk', `<div class="row sp"><b class="vx-g-rkn">${BOLT}${esc(a.rank)}</b><span class="mu">${nf(a.volt)} ⚡</span></div><div class="bar"><i style="width:${Math.max(3, a.p)}%"></i></div>`);
    rk.setAttribute('onclick', "tab('prog')"); rk.setAttribute('role', 'button'); rk.tabIndex = 0;
    const chips = el('div', 'vx-g-chips',
      `<div><span aria-hidden="true">🔥</span><b>${nf(a.streak)}</b><span class="mu">${tr('Racha')}</span></div>` +
      `<div><span aria-hidden="true">🏅</span><b>${nf(a.medals)}</b><span class="mu">${tr('Medallas')}</span></div>` +
      `<div><span aria-hidden="true">🏆</span><b>${a.pos ? '#' + nf(a.pos) : '—'}</b><span class="mu">${tr('Liga')}</span></div>`);
    card.append(top, rk, chips);
    if (grid) { grid.classList.add('vx-g-grid'); card.appendChild(grid); }
    const sh = el('button', 'btn o vx-g-share', `↗ ${tr('Compartir mi tarjeta')}`); sh.type = 'button'; sh.setAttribute('onclick', 'vxAthleteShare()');
    card.appendChild(sh);
    r.insertBefore(card, who); who.remove();
  }

  // Imagen 1080×1350 para compartir
  function drawAthlete() {
    const a = athlete(), W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), cs = getComputedStyle(document.documentElement);
    const ac = (cs.getPropertyValue('--ac') || '#9dff2e').trim() || '#9dff2e';
    const font = (w, s) => `${w} ${s}px Inter, system-ui, sans-serif`;
    g.fillStyle = '#060906'; g.fillRect(0, 0, W, H);
    let gr = g.createRadialGradient(W / 2, 380, 40, W / 2, 380, 760); gr.addColorStop(0, ac + '55'); gr.addColorStop(1, 'transparent'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // rayos de fondo
    g.save(); g.globalAlpha = 0.10; g.strokeStyle = ac; g.lineWidth = 6;
    for (let i = 0; i < 9; i++) { const x = 60 + i * 120; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 120); g.lineTo(x - 10, 130); g.lineTo(x + 30, 260); g.stroke(); }
    g.restore();
    g.strokeStyle = ac; g.lineWidth = 6; g.globalAlpha = 0.7; g.strokeRect(36, 36, W - 72, H - 72); g.globalAlpha = 1;
    g.fillStyle = ac; g.font = font(900, 46); g.textAlign = 'center'; g.fillText('VOLTA', W / 2, 130);
    // avatar
    g.save(); g.shadowColor = ac; g.shadowBlur = 60; g.beginPath(); g.arc(W / 2, 360, 150, 0, Math.PI * 2); g.fillStyle = '#111811'; g.fill(); g.restore();
    g.lineWidth = 12; g.strokeStyle = ac; g.beginPath(); g.arc(W / 2, 360, 150, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#f2f6f0'; g.font = font(900, 150); g.textBaseline = 'middle'; g.fillText((a.name[0] || 'V').toUpperCase(), W / 2, 370); g.textBaseline = 'alphabetic';
    g.font = font(900, 76); g.fillText(a.name.slice(0, 22), W / 2, 620);
    g.fillStyle = ac; g.font = font(900, 64); g.fillText('⚡ ' + a.rank, W / 2, 720);
    g.fillStyle = '#8a968a'; g.font = font(600, 38); g.fillText(nf(a.volt) + ' ' + tr('Voltios') + (a.league ? '  ·  🏆 ' + a.league : ''), W / 2, 790);
    // barra de rango
    g.fillStyle = '#1b231b'; g.fillRect(190, 830, 700, 18); g.fillStyle = ac; g.fillRect(190, 830, 700 * Math.max(0.03, a.p / 100), 18);
    // estadísticas
    const st = [['🔥', nf(a.streak), tr('Racha')], ['🏅', nf(a.medals), tr('Medallas')], ['⚡', nf(a.volt), tr('Voltios')]];
    st.forEach((s, i) => {
      const x = 120 + i * 300, y = 920;
      g.fillStyle = '#0f150f'; g.strokeStyle = ac + '88'; g.lineWidth = 3;
      if (g.roundRect) { g.beginPath(); g.roundRect(x, y, 240, 240, 36); g.fill(); g.stroke(); } else { g.fillRect(x, y, 240, 240); g.strokeRect(x, y, 240, 240); }
      g.fillStyle = '#f2f6f0'; g.font = font(600, 58); g.fillText(s[0], x + 120, y + 80);
      g.font = font(900, 64); g.fillText(s[1], x + 120, y + 160);
      g.fillStyle = '#8a968a'; g.font = font(600, 32); g.fillText(s[2], x + 120, y + 210);
    });
    g.fillStyle = '#8a968a'; g.font = font(600, 32); g.fillText(tr('Entrena conmigo en Volta'), W / 2, H - 80);
    return cv;
  }
  window.vxAthleteCard = drawAthlete;
  window.vxAthleteShare = async function () {
    try {
      const blob = await new Promise((ok) => drawAthlete().toBlob(ok, 'image/png'));
      const file = new File([blob], 'volta-atleta.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Volta' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      if (typeof toast === 'function') toast(tr('Imagen guardada'));
    } catch (e) { if (typeof toast === 'function') toast(tr('No se pudo crear la imagen')); }
  };

  const root = () => { const r = document.getElementById('m'); if (!r) return null; return r.children.length === 1 && r.firstElementChild.children.length > 3 ? r.firstElementChild : r; };
  const _R = R;
  R = function () {
    _R.apply(this, arguments);
    try {
      const top = S.stack && S.stack.length ? S.stack[S.stack.length - 1] : '';
      if (top) return;
      const m = document.getElementById('m'); if (!m) return;
      if (S.tab === 'prog' && S.pgt != 1) prog(m);
      else if (S.tab === 'nut' && (S.nsub || 'day') === 'day') nut(m);
      else if (S.tab === 'prof') { const r = root(); if (r) prof(r); }
    } catch (e) { /* se queda la pantalla tal cual */ }
  };

  if (window.vxAddTr) window.vxAddTr(`
nuevo|new|nouveau|novo
Registrar comida|Log meal|Enregistrer un repas|Registar refeição
Racha|Streak|Série|Sequência
Medallas|Medals|Médailles|Medalhas
Atleta|Athlete|Athlète|Atleta
Cambiar ejercicio|Swap exercise|Changer d'exercice|Trocar exercício
Volver|Back|Retour|Voltar
Liga|League|Ligue|Liga
Calorías de hoy|Today's calories|Calories du jour|Calorias de hoje
Información|Info|Infos|Informação
Tu evolución|Your progress|Ton évolution|A tua evolução
Últimas 2 semanas|Last 2 weeks|2 dernières semaines|Últimas 2 semanas
Combustible de hoy|Today's fuel|Carburant du jour|Combustível de hoje
Compartir mi tarjeta|Share my card|Partager ma carte|Partilhar o meu cartão
Entrena conmigo en Volta|Train with me on Volta|Entraîne-toi avec moi sur Volta|Treina comigo no Volta
Imagen guardada|Image saved|Image enregistrée|Imagem guardada
No se pudo crear la imagen|Couldn't create the image|Impossible de créer l’image|Não foi possível criar a imagem
`);
})();
