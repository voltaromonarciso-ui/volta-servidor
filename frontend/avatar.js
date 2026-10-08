/* VOLTA · avatar de ejercicios: deportista original en SVG, en vista lateral, que ejecuta el
   movimiento en bucle (posición inicial ↔ final) con el músculo trabajado resaltado y el material.
   Diseño propio: maniquí con volumen, no copia ninguna app. */
(function () {
  'use strict';
  if (typeof EX === 'undefined') return;

  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const f = (v) => Math.round(v * 10) / 10;
  const rad = (d) => (d * Math.PI) / 180;
  const L = { torso: 40, neck: 7, head: 9.5, ua: 27, fa: 25, th: 34, sh: 33, foot: 11 };
  const W = { torso: [16.5, 13], ua: [7.2, 5.2], fa: [5.6, 3.8], th: [10.2, 6.6], sh: [6.8, 4.2], foot: [3.6, 2.6], neck: [4.6, 4.2] };

  // ── Cinemática directa: ángulos en grados (0 = derecha, 90 = abajo) ──
  function pose(p) {
    const at = (o, a, l) => [o[0] + l * Math.cos(rad(a)), o[1] + l * Math.sin(rad(a))];
    const hip = [p.x, p.y];
    const sho = at(hip, p.t, L.torso);
    const neck = at(sho, p.t + (p.n || 0), L.neck);
    const head = at(neck, p.t + (p.n || 0), L.head + 1);
    const limb = (a1, a2, a3) => {
      const k = at(hip, a1, L.th), an = at(k, a2, L.sh), toe = at(an, a3 === undefined ? 0 : a3, L.foot);
      return { k, an, toe };
    };
    const arm = (a1, a2) => { const e = at(sho, a1, L.ua), w = at(e, a2, L.fa); return { e, w }; };
    const leg = limb(p.th, p.sh, p.ft), leg2 = limb(p.th2 === undefined ? p.th : p.th2, p.sh2 === undefined ? p.sh : p.sh2, p.ft2 === undefined ? p.ft : p.ft2);
    const ar = arm(p.ua, p.fa), ar2 = arm(p.ua2 === undefined ? p.ua : p.ua2, p.fa2 === undefined ? p.fa : p.fa2);
    return { hip, sho, neck, head, k: leg.k, an: leg.an, toe: leg.toe, k2: leg2.k, an2: leg2.an, toe2: leg2.toe, e: ar.e, w: ar.w, e2: ar2.e, w2: ar2.w };
  }

  // Cápsula (segmento con grosor variable y extremos redondeados): misma estructura de path en todos los fotogramas
  function capsule(a, b, r1, r2) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    return `M${f(a[0] + nx * r1)} ${f(a[1] + ny * r1)}L${f(b[0] + nx * r2)} ${f(b[1] + ny * r2)}A${r2} ${r2} 0 0 0 ${f(b[0] - nx * r2)} ${f(b[1] - ny * r2)}L${f(a[0] - nx * r1)} ${f(a[1] - ny * r1)}A${r1} ${r1} 0 0 0 ${f(a[0] + nx * r1)} ${f(a[1] + ny * r1)}Z`;
  }
  // Punto desplazado sobre un segmento: t a lo largo (0–1), o hacia un lado (en múltiplos de radio)
  function along(a, b, t, side) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    return [a[0] + dx * t + (side || 0) * (-dy / d), a[1] + dy * t + (side || 0) * (dx / d)];
  }

  // ── Músculo resaltado: [segmento, desde, hasta, desplazamiento lateral, radio] ──
  // El lado + es "delante" en el torso y el muslo, y "atrás" en la pierna (gemelo) con signo −.
  const MUSC = {
    Pecho: [['sho', 'hip', .08, .42, 7, 7.5]],
    Espalda: [['sho', 'hip', .05, .6, -7, 7.5]],
    Hombros: [['sho', 'e', -.05, .3, 0, 6.2]],
    Bíceps: [['sho', 'e', .2, .9, 2.4, 3.8]],
    Tríceps: [['sho', 'e', .15, .9, -2.4, 3.8]],
    Antebrazo: [['e', 'w', .05, .75, 0, 3.6]],
    Core: [['sho', 'hip', .45, .95, 6, 6]],
    Trapecio: [['sho', 'neck', -.3, .9, -3, 4.6]],
    Cuádriceps: [['hip', 'k', .12, .9, -3.2, 6]],
    Isquiosurales: [['hip', 'k', .15, .9, 3.2, 5.6]],
    Glúteos: [['hip', 'k', -.12, .25, 5, 7.4]],
    Gemelos: [['k', 'an', .08, .55, 2.6, 4.4]],
  };

  // ── Poses por patrón de movimiento: [inicio, final] + material y apoyos ──
  const STAND = { x: 120, y: 80, t: -90, th: 90, sh: 90, ft: 0, ua: 90, fa: 90 };
  const P = (o) => Object.assign({}, STAND, o);
  const PAT = {
    bench: { a: P({ x: 104, y: 98, t: 180, th: 10, sh: 95, ua: -88, fa: -90, n: 0 }), b: P({ x: 104, y: 98, t: 180, th: 10, sh: 95, ua: 55, fa: -88 }), props: ['bench'], eq: 'bar' },
    incline: { a: P({ x: 112, y: 96, t: 210, th: 10, sh: 95, ua: -75, fa: -78 }), b: P({ x: 112, y: 96, t: 210, th: 10, sh: 95, ua: 60, fa: -70 }), props: ['incline'], eq: 'bar' },
    fly: { a: P({ x: 104, y: 98, t: 180, th: 10, sh: 95, ua: -88, fa: -90 }), b: P({ x: 104, y: 98, t: 180, th: 10, sh: 95, ua: -10, fa: -40 }), props: ['bench'], eq: 'db' },
    pushup: { a: P({ x: 98, y: 102, t: 192, th: 8, sh: 8, ft: 80, ua: 90, fa: 90 }), b: P({ x: 98, y: 112, t: 184, th: 4, sh: 4, ft: 80, ua: 30, fa: 120 }), props: [], eq: '' },
    dip: { a: P({ x: 120, y: 92, t: -88, th: 100, sh: 150, ua: 90, fa: 90 }), b: P({ x: 120, y: 108, t: -80, th: 100, sh: 150, ua: 20, fa: 110 }), props: ['dipbar'], eq: '' },
    ohp: { a: P({ ua: 110, fa: -80 }), b: P({ ua: -92, fa: -90 }), props: [], eq: 'bar' },
    lateral: { a: P({ ua: 92, fa: 88 }), b: P({ ua: 5, fa: 8 }), props: [], eq: 'db' },
    front: { a: P({ ua: 88, fa: 88 }), b: P({ ua: -5, fa: -5 }), props: [], eq: 'db' },
    reardelt: { a: P({ x: 118, y: 84, t: -30, th: 98, sh: 88, ua: 92, fa: 92 }), b: P({ x: 118, y: 84, t: -30, th: 98, sh: 88, ua: 196, fa: 196 }), props: [], eq: 'db' },
    shrug: { a: P({ ua: 90, fa: 90 }), b: P({ y: 77, ua: 90, fa: 90 }), props: [], eq: 'db' },
    squat: { a: P({ ua: 110, fa: -80 }), b: P({ x: 110, y: 112, t: -62, th: 8, sh: 118, ua: 138, fa: -52 }), props: [], eq: 'backbar' },
    lunge: { a: P({ th: 80, th2: 100, sh: 90, sh2: 100 }), b: P({ y: 100, th: 40, sh: 95, th2: 120, sh2: 175, ft2: 80 }), props: [], eq: 'db' },
    hinge: { a: P({ ua: 92, fa: 90 }), b: P({ x: 108, y: 84, t: -18, th: 95, sh: 90, ua: 92, fa: 90 }), props: [], eq: 'bar' },
    row: { a: P({ x: 108, y: 86, t: -30, th: 100, sh: 82, ua: 92, fa: 92 }), b: P({ x: 108, y: 86, t: -30, th: 100, sh: 82, ua: 155, fa: 60 }), props: [], eq: 'bar' },
    pulldown: { a: P({ y: 100, t: -95, th: 0, sh: 90, ua: -85, fa: -88 }), b: P({ y: 100, t: -100, th: 0, sh: 90, ua: 120, fa: -60 }), props: ['seat', 'cable'], eq: 'cablebar' },
    pullup: { a: P({ y: 82, t: -90, th: 92, sh: 100, ua: -88, fa: -90 }), b: P({ y: 62, t: -94, th: 95, sh: 105, ua: 125, fa: -55 }), props: ['highbar'], eq: '' },
    curl: { a: P({ ua: 92, fa: 90 }), b: P({ ua: 96, fa: -70 }), props: [], eq: 'db' },
    pushdown: { a: P({ ua: 96, fa: -20 }), b: P({ ua: 96, fa: 92 }), props: ['cable'], eq: 'cablebar' },
    overhead: { a: P({ ua: -100, fa: 70 }), b: P({ ua: -100, fa: -95 }), props: [], eq: 'db' },
    skull: { a: P({ x: 104, y: 98, t: 180, th: 10, sh: 95, ua: -100, fa: -88 }), b: P({ x: 104, y: 98, t: 180, th: 10, sh: 95, ua: -100, fa: 150 }), props: ['bench'], eq: 'bar' },
    legext: { a: P({ y: 92, t: -100, th: 0, sh: 90, ua: 95, fa: 60 }), b: P({ y: 92, t: -100, th: 0, sh: 2, ua: 95, fa: 60 }), props: ['seat'], eq: '' },
    legcurl: { a: P({ x: 90, y: 106, t: 182, th: -2, sh: -2, ft: 80, ua: 150, fa: 90 }), b: P({ x: 90, y: 106, t: 182, th: -2, sh: -95, ft: -10, ua: 150, fa: 90 }), props: ['bench'], eq: '' },
    legpress: { a: P({ x: 112, y: 104, t: -140, th: -60, sh: 60, ua: 70, fa: 30 }), b: P({ x: 112, y: 104, t: -140, th: -20, sh: -18, ua: 70, fa: 30 }), props: ['legpress'], eq: '' },
    thrust: { a: P({ x: 112, y: 116, t: 200, th: -20, sh: 90, ua: 120, fa: 60 }), b: P({ x: 112, y: 98, t: 180, th: -8, sh: 90, ua: 120, fa: 60 }), props: ['benchlow'], eq: 'bar' },
    bridge: { a: P({ x: 112, y: 134, t: 186, th: -40, sh: 70, ua: 175, fa: 175 }), b: P({ x: 112, y: 118, t: 170, th: -18, sh: 88, ua: 165, fa: 165 }), props: [], eq: '' },
    calf: { a: P({ ua: 92, fa: 90 }), b: P({ y: 74, ft: -35, ua: 92, fa: 90 }), props: ['step'], eq: '' },
    plank: { a: P({ x: 104, y: 112, t: 184, th: 4, sh: 4, ft: 80, ua: 92, fa: 0 }), b: P({ x: 104, y: 110, t: 184, th: 4, sh: 4, ft: 80, ua: 92, fa: 0 }), props: ['mat'], eq: '' },
    crunch: { a: P({ x: 118, y: 134, t: 180, th: -45, sh: 60, ua: 225, fa: -110 }), b: P({ x: 118, y: 134, t: 215, th: -45, sh: 60, ua: 225, fa: -110 }), props: ['mat'], eq: '' },
    legraise: { a: P({ y: 82, t: -90, th: 92, sh: 95, ua: -88, fa: -90 }), b: P({ y: 82, t: -90, th: 2, sh: 0, ua: -88, fa: -90 }), props: ['highbar'], eq: '' },
    twist: { a: P({ x: 118, y: 128, t: -125, th: -25, sh: 40, ua: 15, fa: 30 }), b: P({ x: 118, y: 128, t: -125, th: -25, sh: 40, ua: -30, fa: -5 }), props: ['mat'], eq: '' },
    carry: { a: P({ th: 82, th2: 98, sh: 92, sh2: 90 }), b: P({ th: 98, th2: 82, sh: 90, sh2: 92 }), props: [], eq: 'db' },
    jump: { a: P({ x: 118, y: 96, t: -70, th: 20, sh: 118, ua: 130, fa: 110 }), b: P({ y: 68, ft: 50, ua: -100, fa: -95 }), props: [], eq: '' },
    swing: { a: P({ x: 108, y: 86, t: -25, th: 98, sh: 85, ua: 120, fa: 120 }), b: P({ ua: -10, fa: -10 }), props: [], eq: 'kb' },
    wrist: { a: P({ y: 92, t: -100, th: 0, sh: 90, ua: 60, fa: 10 }), b: P({ y: 92, t: -100, th: 0, sh: 90, ua: 60, fa: -25 }), props: ['seat'], eq: 'db' },
  };

  // ── Qué patrón usa cada ejercicio ──
  const RULES = [
    [/jalón con brazos rectos/i, 'pushdown'], [/tibial/i, 'calf'], [/v-ups|crunch inverso|elevación de piernas tumbado|rodilla al codo/i, 'crunch'], [/prensa/i, 'legpress'], [/press cubano/i, 'ohp'],
    [/fondos en banco/i, 'dip'], [/fondos|dips/i, 'dip'],
    [/flexion|push-up|pushup/i, 'pushup'],
    [/apertura|cruce|peck|pec deck|fly|pullover/i, 'fly'],
    [/press franc|extensión tate|skull|jm/i, 'skull'],
    [/inclinad.*(press|mancuernas|barra|smith|máquina)|press inclinado/i, 'incline'],
    [/press de banca|press de suelo|press cerrado|press declinado|press en máquina convergente|press con agarre neutro|press en smith$|svend|landmine/i, 'bench'],
    [/press militar|press arnold|press de hombros|press z|bradford|press .*hombro/i, 'ohp'],
    [/elevaciones laterales|elevaciones en y|pájaros en máquina|rotación externa/i, 'lateral'],
    [/elevaciones frontales/i, 'front'],
    [/pájaros|face pull|pull-apart|remo al mentón/i, 'reardelt'],
    [/encogimientos/i, 'shrug'],
    [/sentadilla búlgara|zancada|step-up|subida al cajón|split/i, 'lunge'],
    [/sentadilla con salto|saltos|comba/i, 'jump'],
    [/sentadilla|squat|hack/i, 'squat'],
    [/prensa/i, 'legpress'],
    [/hip thrust/i, 'thrust'],
    [/puente de glúteo|frog pump/i, 'bridge'],
    [/patada de glúteo|abducción|kickback/i, 'bridge'],
    [/peso muerto|buenos días|rack pull|hiperextensión|superman/i, 'hinge'],
    [/balanceo|swing/i, 'swing'],
    [/dominadas/i, 'pullup'],
    [/jalón|pulldown/i, 'pulldown'],
    [/remo/i, 'row'],
    [/curl femoral|curl nórdico/i, 'legcurl'],
    [/extensión de cuádriceps/i, 'legext'],
    [/curl de muñeca|extensión de muñeca|rodillo/i, 'wrist'],
    [/curl/i, 'curl'],
    [/extensión con cuerda|extensión con barra en polea|extensión unilateral|patada de tríceps|extensión de tríceps en máquina|extensión de tríceps con banda/i, 'pushdown'],
    [/extensión de tríceps sobre la cabeza|extensión de tríceps/i, 'overhead'],
    [/gemelos|talones|calf/i, 'calf'],
    [/plancha|dead bug|bird dog|hollow|mountain/i, 'plank'],
    [/crunch|rueda|bicicleta/i, 'crunch'],
    [/elevación de piernas|elevación de rodillas|colgarse/i, 'legraise'],
    [/russian twist|leñador|pallof/i, 'twist'],
    [/paseo de granjero/i, 'carry'],
  ];
  const GROUP_DEFAULT = { Pecho: 'bench', Espalda: 'row', Hombros: 'ohp', Bíceps: 'curl', Tríceps: 'pushdown', Cuádriceps: 'squat', Isquiosurales: 'hinge', Glúteos: 'thrust', Gemelos: 'calf', Core: 'crunch', Trapecio: 'shrug', Antebrazo: 'wrist' };
  function patternOf(e) {
    const n = e[0] || '';
    for (const [re, k] of RULES) if (re.test(n)) return k;
    return GROUP_DEFAULT[e[1]] || 'curl';
  }
  function equipOf(e, pat) {
    const eq = (e[4] || e[3] || '').toLowerCase(), n = (e[0] || '').toLowerCase();
    if (/peso corporal|barra de dominadas/.test(eq) || ['pushup', 'dip', 'pullup', 'plank', 'crunch', 'legraise', 'bridge', 'jump', 'legext', 'legcurl', 'legpress'].includes(pat)) return '';
    if (pat === 'thrust') return /barra|máquina/.test(eq) ? 'hipbar' : '';
    if (/mancuerna/.test(eq) || /mancuerna/.test(n)) return 'db';
    if (/kettlebell/.test(eq)) return 'kb';
    if (/polea|cable|banda/.test(eq) || /polea|cuerda|banda/.test(n)) return 'cable';
    if (/máquina|smith/.test(eq)) return pat === 'squat' ? 'backbar' : 'machine';
    if (/barra/.test(eq)) return pat === 'squat' || pat === 'lunge' ? 'backbar' : 'bar';
    return PAT[pat].eq || '';
  }

  // ── Material y apoyos ──
  const PLATE = (c, r) => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="#1c2227" stroke="#5c6b75" stroke-width="1.4"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r * .35}" fill="#8796a0"/>`;
  function gear(eq, q) {
    const w = q.w;
    if (eq === 'bar' || eq === 'machine') return PLATE(w, 13);
    if (eq === 'backbar') return ''; // se pinta aparte, pegada al hombro
    if (eq === 'hipbar') return PLATE(along(q.hip, q.k, .15, -10), 13);
    if (eq === 'db') return `<rect x="${f(w[0] - 7)}" y="${f(w[1] - 2)}" width="14" height="4" rx="2" fill="#6e7d88"/><rect x="${f(w[0] - 9)}" y="${f(w[1] - 5)}" width="4.5" height="10" rx="1.6" fill="#232a30" stroke="#5c6b75" stroke-width=".8"/><rect x="${f(w[0] + 4.5)}" y="${f(w[1] - 5)}" width="4.5" height="10" rx="1.6" fill="#232a30" stroke="#5c6b75" stroke-width=".8"/>`;
    if (eq === 'kb') return `<circle cx="${f(w[0])}" cy="${f(w[1] + 8)}" r="7" fill="#232a30" stroke="#5c6b75" stroke-width="1"/><path d="M${f(w[0] - 4)} ${f(w[1] + 3)}q4 -7 8 0" stroke="#5c6b75" stroke-width="2" fill="none"/>`;
    if (eq === 'cablebar') return `<rect x="${f(w[0] - 9)}" y="${f(w[1] - 1.6)}" width="18" height="3.2" rx="1.6" fill="#6e7d88"/>`;
    return '';
  }
  function props(list, eq, pat) {
    let s = '';
    const all = list.concat(eq === 'cable' || eq === 'cablebar' ? ['cable'] : []);
    if (all.includes('bench')) s += `<rect x="58" y="104" width="96" height="8" rx="3" fill="#2a3238" stroke="#46535c"/><rect x="66" y="112" width="5" height="34" fill="#2a3238"/><rect x="140" y="112" width="5" height="34" fill="#2a3238"/>`;
    if (all.includes('benchlow')) s += `<rect x="40" y="108" width="54" height="10" rx="3" fill="#2a3238" stroke="#46535c"/><rect x="48" y="118" width="5" height="28" fill="#2a3238"/><rect x="82" y="118" width="5" height="28" fill="#2a3238"/>`;
    if (all.includes('incline')) s += `<path d="M70 132L132 96l6 6l-62 36z" fill="#2a3238" stroke="#46535c"/><rect x="104" y="112" width="5" height="34" fill="#2a3238"/><rect x="74" y="132" width="5" height="14" fill="#2a3238"/>`;
    if (all.includes('seat')) s += `<rect x="100" y="96" width="34" height="8" rx="3" fill="#2a3238" stroke="#46535c"/><rect x="92" y="54" width="8" height="48" rx="3" fill="#2a3238" stroke="#46535c"/><rect x="114" y="104" width="5" height="42" fill="#2a3238"/>`;
    if (all.includes('legpress')) s += `<path d="M90 112l40 -4l2 8l-40 6z" fill="#2a3238" stroke="#46535c"/><rect x="150" y="40" width="7" height="56" rx="2" transform="rotate(-38 153 68)" fill="#3a444c" stroke="#5c6b75"/>`;
    if (all.includes('highbar')) s += `<rect x="70" y="14" width="100" height="4" rx="2" fill="#6e7d88"/><rect x="68" y="14" width="4" height="132" fill="#2a3238"/><rect x="168" y="14" width="4" height="132" fill="#2a3238"/>`;
    if (all.includes('dipbar')) s += `<rect x="96" y="82" width="56" height="4" rx="2" fill="#6e7d88"/><rect x="146" y="82" width="4" height="64" fill="#2a3238"/>`;
    if (all.includes('step')) s += `<rect x="96" y="140" width="50" height="6" rx="2" fill="#2a3238" stroke="#46535c"/>`;
    if (all.includes('mat')) s += `<rect x="30" y="142" width="180" height="4" rx="2" fill="#26402a" opacity=".9"/>`;
    if (all.includes('cable')) s += `<rect x="196" y="8" width="8" height="138" rx="2" fill="#2a3238" stroke="#46535c"/><circle cx="200" cy="${pat === 'pulldown' || pat === 'pushdown' ? 18 : 60}" r="4" fill="#6e7d88"/>`;
    return s;
  }
  const cableLine = (eq, pat, q) => (eq === 'cable' || eq === 'cablebar') ? `M200 ${pat === 'pulldown' || pat === 'pushdown' ? 18 : 60}L${f(q.w[0])} ${f(q.w[1])}` : '';

  // ── Dibujo de un fotograma (capas: lado lejano, torso, lado cercano) ──
  function frame(q) {
    const blob = (a, b, t0, t1, side, r1, r2) => capsule(along(a, b, t0, side), along(a, b, t1, side), r1, r2);
    return {
      far: [capsule(q.hip, q.k2, ...W.th), capsule(q.k2, q.an2, ...W.sh), blob(q.k2, q.an2, .1, .45, 2.2, 5.6, 4.4), capsule(q.sho, q.e2, ...W.ua), capsule(q.e2, q.w2, ...W.fa)],
      shoes: [capsule(q.an2, q.toe2, ...W.foot), capsule(q.an, q.toe, ...W.foot)],
      body: [blob(q.hip, q.k, -.05, .3, 4.2, 9.5, 8), capsule(q.sho, q.neck, ...W.neck)],
      shirt: [capsule(q.hip, q.sho, W.torso[1], W.torso[0]), blob(q.sho, q.hip, .1, .38, 5.5, 9, 8)],
      near: [capsule(q.hip, q.k, ...W.th), capsule(q.k, q.an, ...W.sh), blob(q.k, q.an, .1, .45, 2.2, 5.6, 4.4), capsule(q.sho, q.e, ...W.ua), capsule(q.e, q.w, ...W.fa), blob(q.sho, q.e, -.12, .22, 0, 8.2, 6.4)],
      head: q.head,
    };
  }
  function musclePaths(group, q) {
    const spec = MUSC[group]; if (!spec) return [];
    return spec.map(([a, b, t0, t1, side, r]) => {
      const A = along(q[a], q[b], t0, side), B = along(q[a], q[b], t1, side);
      return capsule(A, B, r * .85, r * .7);
    });
  }

  const anim = (attr, vals, dur) => `<animate attributeName="${attr}" values="${vals.join(';')}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>`;
  function animPath(d1, d2, attrs, dur, still) {
    return `<path d="${d1}" ${attrs}>${still || d1 === d2 ? '' : anim('d', [d1, d2, d1], dur)}</path>`;
  }

  const cache = {};
  function render(e, opts) {
    opts = opts || {};
    const pat = patternOf(e), P0 = PAT[pat], eq = equipOf(e, pat);
    const key = e[0] + '|' + (opts.still ? 's' : 'a') + (opts.crop ? 'c' : '') + (opts.zoom ? 'z' : '') + (opts.dur || '');
    if (cache[key]) return cache[key];
    const qa = pose(P0.a), qb = pose(P0.b), A = frame(qa), B = frame(qb);
    const REF = !!(opts.crop || opts.zoom); // estilo de referencia: el de la imagen del press banca
    const still = opts.still || reduceMotion(), dur = opts.dur || 2.6, id = 'av' + Math.abs([...e[0]].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
    // En miniaturas estáticas se dibuja la posición final (la más reconocible)
    const pick = (a, b) => (still ? b : a);
    // Miniatura: encuadre ajustado al deportista (y su material), con proporción 4:3
    let vb = '0 0 240 160';
    if (opts.crop || opts.zoom) {
      const AR = opts.zoom ? 16 / 10 : 4 / 3;
      // Encuadre que contiene las dos posiciones del movimiento: animada, la figura no se sale del cuadro
      const pose2 = opts.still ? [qb] : [qa, qb];
      const pts = pose2.flatMap((q) => Object.keys(q).map((k) => q[k]).concat([q.w, q.w2])).filter((pt) => Array.isArray(pt));
      let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
      // Encuadre ceñido: poco margen y el suelo justo bajo los pies, para que la figura llene la miniatura
      x0 = x0 * .73 + 34 - 9; x1 = x1 * .73 + 34 + 9; y0 = y0 * .73 + 40 - 9; y1 = Math.min(Math.max(y1 * .73 + 40 + 7, 120), 152);
      let w = x1 - x0, h = y1 - y0;
      if (opts.zoom) { y0 -= 6; h += 6; x0 -= 6; w += 12; } // la ficha deja algo más de aire alrededor
      if (w / h < AR) { const nw = h * AR; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / AR; y0 -= (nh - h); h = nh; }
      vb = `${f(x0)} ${f(y0)} ${f(w)} ${f(h)}`;
    }
    let s = `<svg viewBox="${vb}" role="img" aria-label="${String(e[0]).replace(/"/g, '&quot;')}" style="width:100%;height:auto;display:block">` +
      `<defs><radialGradient id="${id}bg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="${REF ? '#cbd5cf' : '#26323a'}"/><stop offset="1" stop-color="${REF ? '#bfcbc4' : '#11161a'}"/></radialGradient>` +
      // Textura de fibras musculares (como la ilustración anatómica del press banca)
      (REF ? `<pattern id="${id}fb" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><path d="M0 1H2" stroke="#414c44" stroke-width=".3" opacity=".22"/></pattern>` : '') +
      `<linearGradient id="${id}sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8c6d1"/><stop offset=".55" stop-color="#7d8f9d"/><stop offset="1" stop-color="#4c5d6b"/></linearGradient>` +
      `<linearGradient id="${id}fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6c7d8a"/><stop offset="1" stop-color="#3a4752"/></linearGradient>` +
      `<linearGradient id="${id}sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46525b"/><stop offset="1" stop-color="#1f262c"/></linearGradient>` +
      `<filter id="${id}gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
      `<rect x="-60" y="-60" width="360" height="280" fill="url(#${id}bg)"/>`;
    // Miniaturas en estudio claro (como las fotos reales); la ficha grande mantiene el escenario oscuro
    // Referencia (press banca): fondo liso, sin suelo dibujado; solo una sombra suave bajo el deportista
    if (!REF) {
      for (let i = 0; i < 9; i++) s += `<path d="M${i * 30} 146L${120 + (i * 30 - 120) * 1.8} 160" stroke="#2a3a44" stroke-width=".6"/>`;
      s += `<rect x="-60" y="146" width="360" height="60" fill="#151c21"/><path d="M-60 146H300" stroke="#3a4a54" stroke-width="1"/>`;
    }
    // Sombra en el suelo
    s += `<ellipse cx="${f(qa.hip[0] * .73 + 34)}" cy="147" rx="36" ry="3.6" fill="#2c3a33" opacity="${REF ? .16 : .4}"/>`;
    s += '<g transform="translate(34 40) scale(.73)">';
    s += props(P0.props, eq, pat);
    // Cable
    const cl1 = cableLine(eq, pat, qa), cl2 = cableLine(eq, pat, qb);
    if (cl1) s += animPath(pick(cl1, cl2), cl2, 'stroke="#9aa8b2" stroke-width="1" fill="none"', dur, still);
    const layer = (k, fill, extra) => A[k].map((d, i) => animPath(pick(d, B[k][i]), B[k][i], `fill="${fill}" ${extra || 'stroke="#202a31" stroke-width=".8"'}`, dur, still)).join('');
    s += layer('far', `url(#${id}fr)`);
    s += layer('body', `url(#${id}sk)`);
    s += layer('shirt', `url(#${id}sh)`);
    if (REF) { s += layer('body', `url(#${id}fb)`, 'stroke="none"'); s += layer('shirt', `url(#${id}fb)`, 'stroke="none"'); }
    // Cabeza
    const h1 = A.head, h2 = B.head;
    s += `<circle cx="${f(pick(h1, h2)[0])}" cy="${f(pick(h1, h2)[1])}" r="${L.head}" fill="url(#${id}sk)" stroke="#202a31" stroke-width=".8">${still ? '' : anim('cx', [f(h1[0]), f(h2[0]), f(h1[0])], dur) + anim('cy', [f(h1[1]), f(h2[1]), f(h1[1])], dur)}</circle>`;
    s += layer('near', `url(#${id}sk)`);
    if (REF) s += layer('near', `url(#${id}fb)`, 'stroke="none"');
    s += REF ? layer('shoes', `url(#${id}sk)`) : layer('shoes', '#1b1f22', 'stroke="#9dff2e" stroke-width=".7"');
    // Músculo trabajado (brillo verde que late)
    const m1 = musclePaths(e[1], qa), m2 = musclePaths(e[1], qb);
    s += REF
      ? `<g opacity=".88">${m1.map((d, i) => animPath(pick(d, m2[i]), m2[i], 'fill="#82be97" stroke="#42604d" stroke-width=".5"', dur, still)).join('')}${still ? '' : anim('opacity', ['.7', '.95', '.7'], dur)}</g>`
      : `<g filter="url(#${id}gl)" opacity=".92">${m1.map((d, i) => animPath(pick(d, m2[i]), m2[i], 'fill="#9dff2e"', dur, still)).join('')}${still ? '' : anim('opacity', ['.65', '1', '.65'], dur)}</g>`;
    // Material en las manos
    const g1 = gear(eq, qa), g2 = gear(eq, qb);
    const mv = eq === 'hipbar' ? [qb.hip[0] - qa.hip[0], qb.hip[1] - qa.hip[1]] : [qb.w[0] - qa.w[0], qb.w[1] - qa.w[1]];
    if (g1) s += still ? g2 : `<g>${g1}<animateTransform attributeName="transform" type="translate" values="0 0;${f(mv[0])} ${f(mv[1])};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/></g>`;
    if (eq === 'backbar') { const b1 = along(qa.sho, qa.neck, .4, -5), b2 = along(qb.sho, qb.neck, .4, -5); s += `<g>${PLATE(pick(b1, b2), 13)}${still ? '' : `<animateTransform attributeName="transform" type="translate" values="0 0;${f(b2[0] - b1[0])} ${f(b2[1] - b1[1])};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>`}</g>`; }
    // Flecha del recorrido (de la articulación que más se mueve)
    if (!opts.noArrow) {
      const cand = ['w', 'hip', 'an', 'head'].map((k) => [k, Math.hypot(qb[k][0] - qa[k][0], qb[k][1] - qa[k][1])]).sort((x, y) => y[1] - x[1])[0][0];
      const a1 = qa[cand], a2 = qb[cand], mx = (a1[0] + a2[0]) / 2 + (a2[1] - a1[1]) * .35 + 18, my = (a1[1] + a2[1]) / 2 - (a2[0] - a1[0]) * .35;
      if (Math.hypot(a2[0] - a1[0], a2[1] - a1[1]) > 8) s += `<path d="M${f(a1[0] + 16)} ${f(a1[1])}Q${f(mx)} ${f(my)} ${f(a2[0] + 16)} ${f(a2[1])}" stroke="#9dff2e" stroke-width="1.6" fill="none" stroke-dasharray="3 3" opacity=".75" marker-end="url(#${id}ar)"/><defs><marker id="${id}ar" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8z" fill="#9dff2e"/></marker></defs>`;
    }
    s += '</g></svg>';
    if (REF) {
      const MAPC = {
        '#b8c6d1': '#a6b1aa', '#7d8f9d': '#8e9a92', '#4c5d6b': '#6c7871', // piel
        '#6c7d8a': '#7f8a84', '#3a4752': '#5f6a64', // brazo/pierna lejanos
        '#46525b': '#9aa59e', '#1f262c': '#78837d', // sin camiseta: mismo gris que la piel
        '#202a31': '#414c44', // contorno
        '#2a3238': '#4d5c55', '#46535c': '#5d6b64', '#5c6b75': '#6f7d76', '#6e7d88': '#85938b', '#232a30': '#45524b',
        '#1c2227': '#4d5c55', '#8796a0': '#bfccc5', '#3a444c': '#56635c', '#9aa8b2': '#5d6b64', '#26402a': '#42604d',
        '#9dff2e': '#42604d', // flecha de dirección
      };
      s = s.replace(/#[0-9a-f]{6}\b/gi, (c) => MAPC[c.toLowerCase()] || c);
    }
    return (cache[key] = s);
  }
  window.vxAvatar = render;
  window.vxPattern = patternOf;

  // ── Uso en la app ──
  // 1) Miniaturas: los ejercicios sin ilustración propia usan el avatar (fotograma final, estático)
  const hasReal = (e) => typeof EMB === 'object' && e.cid && EMB[e.cid];
  EX.forEach((e) => {
    if (hasReal(e)) return;
    try { e.image = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(render(e, { still: true, noArrow: true, crop: true }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); } catch (err) { /* se queda la imagen anterior */ }
  });
  // Las miniaturas de la app pintan una silueta fija (SIL): se sustituye por la imagen del avatar
  const byName = {}; EX.forEach((e) => { byName[e[0]] = e; });
  function swapThumbs(root) {
    if (!root) return;
    root.querySelectorAll('.ex-img:not(.real)').forEach((el) => {
      const e = byName[el.getAttribute('aria-label')];
      if (!e || !e.image || hasReal(e)) return;
      el.classList.add('real', 'vx-av-thumb');
      // Miniatura en movimiento (se genera la primera vez que hace falta); fija si el sistema pide reducir movimiento
      if (!reduceMotion() && !e.imageAnim) { try { e.imageAnim = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(render(e, { noArrow: true, crop: true }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); } catch (err) { e.imageAnim = ''; } }
      el.innerHTML = `<img src="${(!reduceMotion() && e.imageAnim) || e.image}" alt="" loading="lazy" decoding="async" draggable="false">`;
    });
  }
  const _R = R;
  R = function () { const out = _R.apply(this, arguments); try { swapThumbs(document.getElementById('m')); } catch (err) { /* miniaturas originales */ } return out; };
  window.vxSwapThumbs = swapThumbs;

  // 2) Ficha: el reproductor de vídeo vacío se cambia por la animación (y la foto real si existe)
  const MOV = ['Así se hace', 'How it’s done', 'Comment le faire', 'Como se faz'];
  const CTL = {
    label: ['Control de la animación', 'Animation controls', 'Contrôle de l’animation', 'Controlo da animação'],
    pause: ['Pausa', 'Pause', 'Pause', 'Pausa'], play: ['Seguir', 'Play', 'Lecture', 'Continuar'],
    slow: ['Lento 0,5×', 'Slow 0.5×', 'Lent 0,5×', 'Lento 0,5×'],
    tempo: ['Ritmo recomendado: 2–3 s en la fase de bajada y 1 s subiendo, sin rebotes.', 'Recommended tempo: 2–3 s lowering and 1 s lifting, no bouncing.', 'Tempo conseillé : 2–3 s en descente et 1 s en montée, sans rebond.', 'Ritmo recomendado: 2–3 s a descer e 1 s a subir, sem ressaltos.'],
  };
  // Pausa / cámara lenta / velocidad normal de la animación de la ficha
  window.vxAv = function (i, mode, btn) {
    const box = document.querySelector('.vx-avatar[data-ex="' + i + '"]'), e = EX[i];
    if (!box || !e) return;
    const x = { es: 0, en: 1, fr: 2, pt: 3 }[S.lang] || 0, bar = btn && btn.parentElement;
    const svg = () => box.querySelector('svg');
    if (mode === 'pause') {
      const s2 = svg(); if (!s2 || !s2.pauseAnimations) return;
      const paused = s2.animationsPaused();
      if (paused) s2.unpauseAnimations(); else s2.pauseAnimations();
      btn.setAttribute('aria-pressed', String(!paused)); btn.classList.toggle('on', !paused);
      btn.textContent = (paused ? '⏸ ' + CTL.pause[x] : '▶ ' + CTL.play[x]);
      return;
    }
    const tag = box.querySelector('.vx-av-tag');
    box.innerHTML = render(e, { zoom: true, dur: mode === 'slow' ? 5.6 : 2.6 }); if (tag) box.appendChild(tag);
    if (bar) bar.querySelectorAll('button').forEach((b, k) => { b.classList.toggle('on', (mode === 'slow' && k === 1) || (mode === 'normal' && k === 2)); if (k === 0) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); b.textContent = '⏸ ' + CTL.pause[x]; } });
  };
  if (typeof V.ex === 'function') {
    const _ex = V.ex;
    V.ex = function (i) {
      let h = _ex.apply(this, arguments);
      try {
        const e = EX[i], x = { es: 0, en: 1, fr: 2, pt: 3 }[S.lang] || 0;
        const anim2 = `<div class="vx-avatar" data-ex="${i}">${render(e, { zoom: true })}<span class="vx-av-tag">▶ ${MOV[x]}</span></div>` +
          (reduceMotion() ? '' : `<div class="vx-av-ctl" role="group" aria-label="${CTL.label[x]}"><button class="chip" onclick="vxAv(${i},'pause',this)" aria-pressed="false">⏸ ${CTL.pause[x]}</button><button class="chip" onclick="vxAv(${i},'slow',this)">🐢 ${CTL.slow[x]}</button><button class="chip on" onclick="vxAv(${i},'normal',this)">1×</button></div>`) +
          `<div class="mu vx-av-tempo">⏱ ${CTL.tempo[x]}</div>`;
        h = h.replace(/<video[^>]*poster="([^"]*)"[^>]*>[\s\S]*?<\/video>/, (m, poster) => (hasReal(e) ? `<img src="${poster}" alt="" style="width:100%;border-radius:14px;display:block">` + anim2 : anim2));
        if (h.indexOf('vx-avatar') === -1) h = h.replace(/<div class="ex-img"[^>]*>[\s\S]*?<\/svg><\/div>/, anim2);
      } catch (err) { /* ficha original */ }
      return h;
    };
  }
})();
