/* VOLTA · Ilustrador anatómico (estilo de la imagen de «Press de banca»).
   Se inyecta en la página de la app y dibuja cada ejercicio en su posición final con:
   - un maniquí anatómico gris: cada músculo por separado, con volumen (degradado), fibras orientadas y contorno;
   - el músculo trabajado en verde suave (#82be97) con su sombra (#42604d);
   - el material y los apoyos en gris pizarra con brillos, sobre fondo liso #c4cfc9 y sombra de contacto difusa.
   Usa las articulaciones que ya calcula la app (window.vxPoseData), así la postura de cada ejercicio es la correcta.
   window.vxIlustrar(i) → SVG 960×720 (texto). */
(function () {
  'use strict';
  const C = {
    bg: '#c4cfc9', line: '#414c44', fiber: '#414c44', skin: ['#b6c0ba', '#97a39b', '#76827b'], far: ['#98a39d', '#7d8882', '#626d67'],
    tgt: ['#a9dcbb', '#82be97', '#5c9a73'], tgtLine: '#42604d', gear: ['#6d7c75', '#4d5c55', '#323d37'], hi: '#bfccc5', pad: ['#5b6a63', '#46534c'],
  };
  const f = (v) => Math.round(v * 100) / 100;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]) || 1, unit = (a) => mul(a, 1 / len(a)), nrm = (a) => [-a[1], a[0]];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const deg = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;

  function build(i) {
    const e = EX[i], D = window.vxPoseData(e), q = D.B, W = D.W;
    const defs = new Map(), out = { back: [], far: [], farT: [], body: [], bodyT: [], near: [], nearT: [], top: [], gear: [], props: [] };
    const K = 1.22; // extremidades algo más llenas que en la miniatura de la app
    const WW = { th: W.th.map((v) => v * K), sh: W.sh.map((v) => v * K), ua: W.ua.map((v) => v * K), fa: W.fa.map((v) => v * K), torso: W.torso, neck: W.neck.map((v) => v * 1.1) };
    const grad = (id, cols) => { if (!defs.has(id)) defs.set(id, `<radialGradient id="${id}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${cols[0]}"/><stop offset=".6" stop-color="${cols[1]}"/><stop offset="1" stop-color="${cols[2]}"/></radialGradient>`); return `url(#${id})`; };
    const fib = (ang) => { const a = ((Math.round(ang / 10) * 10) % 180 + 180) % 180, id = 'fb' + a; if (!defs.has(id)) defs.set(id, `<pattern id="${id}" width=".8" height=".8" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><path d="M0 .4H.8" stroke="${C.fiber}" stroke-width=".11" opacity=".55"/></pattern>`); return `url(#${id})`; };
    const target = new Set(TARGET[e[1]] || []);
    // Relieve: cada forma se ilumina como un volumen (difusa + brillo especular sobre su alfa desenfocado)
    const relief = (id, blur, scale, spec) => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">` +
      `<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="b"/>` +
      `<feDiffuseLighting in="b" surfaceScale="${scale}" diffuseConstant="1.25" lighting-color="#ffffff" result="d"><feDistantLight azimuth="235" elevation="38"/></feDiffuseLighting>` +
      `<feSpecularLighting in="b" surfaceScale="${scale}" specularConstant="${spec}" specularExponent="22" lighting-color="#ffffff" result="s"><feDistantLight azimuth="235" elevation="48"/></feSpecularLighting>` +
      `<feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1=".5" k2=".66" k3="0" k4="0" result="m"/>` +
      `<feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>` +
      `<feComposite in="m" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".18" k4="0" result="o"/>` +
      `<feComposite in="o" in2="SourceAlpha" operator="in"/></filter>`;
    defs.set('rl', relief('rl', 1.3, 2.2, .45));
    defs.set('rb', relief('rb', 3, 3, .3));
    defs.set('grain', '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .25  0 0 0 0 .3  0 0 0 0 .27  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>');

    // Cápsula (segmento con grosor variable y extremos redondeados)
    const capsule = (a, b, r1, r2) => {
      const u = unit(sub(b, a)), n = nrm(u), p = (c, k, r) => add(c, mul(n, k * r));
      const A1 = p(a, 1, r1), A2 = p(a, -1, r1), B1 = p(b, 1, r2), B2 = p(b, -1, r2);
      return `M${f(A1[0])} ${f(A1[1])}L${f(B1[0])} ${f(B1[1])}A${f(r2)} ${f(r2)} 0 0 0 ${f(B2[0])} ${f(B2[1])}L${f(A2[0])} ${f(A2[1])}A${f(r1)} ${f(r1)} 0 0 0 ${f(A1[0])} ${f(A1[1])}Z`;
    };
    // Vientre muscular en forma de huso entre t0 y t1 del segmento a→b, desplazado "side" (en múltiplos del radio local)
    const belly = (a, b, t0, t1, side, r, rIn) => {
      const d = sub(b, a), u = unit(d), n = nrm(u), Ld = len(d);
      const at = (t) => add(a, mul(d, t));
      const P0 = add(at(t0), mul(n, side)), P1 = add(at(t1), mul(n, side)), l = Ld * (t1 - t0);
      const o = mul(n, r), oi = mul(n, -(rIn === undefined ? r : rIn));
      const c1 = add(add(P0, mul(u, l * .28)), o), c2 = add(add(P1, mul(u, -l * .28)), o);
      const c3 = add(add(P1, mul(u, -l * .28)), oi), c4 = add(add(P0, mul(u, l * .28)), oi);
      return { d: `M${f(P0[0])} ${f(P0[1])}C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(P1[0])} ${f(P1[1])}C${f(c3[0])} ${f(c3[1])} ${f(c4[0])} ${f(c4[1])} ${f(P0[0])} ${f(P0[1])}Z`, ang: deg(u) };
    };
    const draw = (layer, shape, id, tone) => {
      const isT = target.has(id), cols = isT ? C.tgt : tone === 'far' ? C.far : C.skin;
      const g = grad((isT ? 't' : tone === 'far' ? 'f' : 's'), cols);
      // los relieves se funden con la silueta (contorno suave); el músculo trabajado va encima y con contorno marcado
      const base = isT ? '#86c39b' : tone === 'far' ? '#8e9993' : '#a9b4ad';
      (isT ? out[layer + 'T'] : out[layer]).push(`<path d="${shape.d}" fill="none" stroke="#3b463f" stroke-width=".5" stroke-opacity=".4" stroke-linejoin="round"/>` +
        `<path d="${shape.d}" fill="${base}" filter="url(#rl)"/>` +
        `<path d="${shape.d}" fill="${fib(shape.ang)}" opacity="${isT ? .5 : .7}"/>` +
        `<path d="${shape.d}" fill="none" stroke="${isT ? C.tgtLine : '#4a554e'}" stroke-width="${isT ? .3 : .18}" stroke-opacity="${isT ? .9 : .5}"/>`);
    };
    const base = (layer, a, b, r1, r2, tone) => {
      const d = capsule(a, b, r1, r2);
      out[layer].push(`<path d="${d}" fill="none" stroke="${C.line}" stroke-width=".7" stroke-linejoin="round"/><path d="${d}" fill="${tone === 'far' ? '#808b85' : '#98a39c'}" filter="url(#rb)"/><path d="${d}" fill="${fib(deg(sub(b, a)))}" opacity=".45"/>`);
    };
    const line = (layer, pts, w, op) => out[layer].push(`<path d="M${pts.map((p) => f(p[0]) + ' ' + f(p[1])).join(' Q')}" fill="none" stroke="${C.line}" stroke-width="${w || .25}" opacity="${op || .7}" stroke-linecap="round"/>`);

    // Hacia dónde mira el pecho (normal del tronco) y hacia qué lado se doblan codos y rodillas
    const tU = unit(sub(q.sho, q.hip)), front = nrm(tU); // + del tronco = delante (convenio de la app)
    const sideFor = (a, b, c, flexIsFront) => { // lado del segmento a→b donde está el "frente" anatómico (cuádriceps / bíceps)
      const u = unit(sub(b, a)), n = nrm(u), cr = cross(u, unit(sub(c, b)));
      if (Math.abs(cr) > .12) { const flex = Math.sign(cr); return flexIsFront ? flex : -flex; } // se dobla hacia el lado flexor
      return Math.sign(dot(n, front)) || 1;
    };

    function leg(tag, hip, k, an, toe, tone) {
      const L = tone === 'far' ? 'far' : 'near';
      const s = sideFor(hip, k, an, false); // lado del cuádriceps
      const rT = WW.th, rS = WW.sh;
      base(L, hip, k, rT[0], rT[1], tone);
      draw(L, belly(hip, k, .08, .55, -s * 1.4, 5), tag + 'add', tone);
      draw(L, belly(hip, k, .1, .92, -s * 4.4, 5.6, 4.6), 'ham', tone);
      draw(L, belly(hip, k, .08, .94, s * 2.2, 7.4, 5.8), 'vl', tone);
      draw(L, belly(hip, k, .12, .88, s * 6.6, 3.2, 3), 'rf', tone);
      // rodilla y rótula
      out[L].push(`<circle cx="${f(k[0])}" cy="${f(k[1])}" r="${f(rT[1] * .95)}" fill="${grad(tone === 'far' ? 'f' : 's', tone === 'far' ? C.far : C.skin)}" stroke="${C.line}" stroke-width=".35"/>`);
      const pat = add(k, mul(nrm(unit(sub(k, hip))), s * rT[1] * .55));
      out[L].push(`<ellipse cx="${f(pat[0])}" cy="${f(pat[1])}" rx="2.2" ry="2.6" fill="none" stroke="${C.line}" stroke-width=".25" opacity=".7"/>`);
      base(L, k, an, rS[0], rS[1], tone);
      const sb = -sideFor(hip, k, an, false); // gemelo: detrás de la tibia (opuesto al cuádriceps)
      draw(L, belly(k, an, .04, .58, sb * 3.4, 5.4, 3), 'gas', tone);
      draw(L, belly(k, an, .32, .84, sb * 2.2, 3.2, 2), 'sol', tone);
      draw(L, belly(k, an, .06, .74, -sb * 2.8, 2.1, 1.5), 'tib', tone);
      // pie
      const fu = unit(sub(toe, an)), heel = add(an, mul(fu, -3.2));
      out[L].push(`<path d="${capsule(heel, toe, 3.4, 2.4)}" fill="${grad(tone === 'far' ? 'f' : 's', tone === 'far' ? C.far : C.skin)}" stroke="${C.line}" stroke-width=".4"/>`);
      out[L].push(`<circle cx="${f(an[0])}" cy="${f(an[1])}" r="2.6" fill="${grad(tone === 'far' ? 'f' : 's', tone === 'far' ? C.far : C.skin)}" stroke="${C.line}" stroke-width=".3"/>`);
    }
    function arm(sho, e2, w2, tone) {
      const L = tone === 'far' ? 'far' : 'near';
      const s = sideFor(sho, e2, w2, true); // lado del bíceps
      base(L, sho, e2, WW.ua[0], WW.ua[1], tone);
      draw(L, belly(sho, e2, .16, .92, -s * 3.4, 4.2, 3.4), 'tri', tone);
      draw(L, belly(sho, e2, .22, .9, s * 3.2, 4, 3.2), 'bic', tone);
      draw(L, belly(sho, e2, -.16, .44, 0, 9, 8.4), 'del', tone);
      out[L].push(`<circle cx="${f(e2[0])}" cy="${f(e2[1])}" r="${f(WW.ua[1] * .92)}" fill="${grad(tone === 'far' ? 'f' : 's', tone === 'far' ? C.far : C.skin)}" stroke="${C.line}" stroke-width=".32"/>`);
      base(L, e2, w2, WW.fa[0], WW.fa[1], tone);
      draw(L, belly(e2, w2, .0, .7, s * 1.8, 3.9, 2.6), 'fa1', tone);
      draw(L, belly(e2, w2, .06, .64, -s * 2, 3, 2.2), 'fa2', tone);
      // mano
      const hu = unit(sub(w2, e2)), hand = add(w2, mul(hu, 2.2));
      out[L].push(`<ellipse cx="${f(hand[0])}" cy="${f(hand[1])}" rx="3.6" ry="2.9" transform="rotate(${f(deg(hu))} ${f(hand[0])} ${f(hand[1])})" fill="${grad(tone === 'far' ? 'f' : 's', tone === 'far' ? C.far : C.skin)}" stroke="${C.line}" stroke-width=".35"/>`);
    }

    // ── material de fondo ──
    PROPS(D, out, C, grad, f);
    // ── lado lejano ──
    leg('f', q.hip, q.k2, q.an2, q.toe2, 'far');
    arm(q.sho, q.e2, q.w2, 'far');
    // ── tronco ──
    const rT = W.torso;
    base('body', q.hip, q.sho, rT[1], rT[0]);
    const bk = -1; // espalda = lado − del tronco
    draw('body', belly(q.hip, q.k, -.18, .26, 0, 7.6), 'glu');
    draw('body', belly(q.sho, q.hip, .06, .62, bk * 8.5, 6.2, 4.2), 'lat');
    draw('body', belly(q.sho, q.hip, .5, 1.02, bk * 10.4, 3, 2.4), 'ere');
    draw('body', belly(q.sho, q.hip, .42, .92, 3.2, 5.2, 4.6), 'obl');
    draw('body', belly(q.sho, q.hip, .04, .4, 9.2, 6.4, 5.4), 'pec');
    draw('body', belly(q.sho, q.hip, .42, .96, 10.6, 3.6, 3.2), 'abs');
    // bloques del abdomen y serrato
    for (let k = 0; k < 3; k++) { const t = .55 + k * .13, p = add(add(q.sho, mul(sub(q.hip, q.sho), t)), mul(front, 10.6)); const a2 = add(p, mul(front, 3.2)), b2 = add(p, mul(front, -3.2)); line('top', [a2, b2], .22, .65); }
    for (let k = 0; k < 3; k++) { const t = .3 + k * .07; draw('body', belly(q.sho, q.hip, t, t + .1, 6.6, 1.3, 1), 'ser'); }
    // cuello, trapecio y cabeza
    draw('body', belly(q.sho, q.neck, -.6, .95, bk * 4.2, 4.4, 2.6), 'trap');
    base('body', q.sho, q.neck, WW.neck[0], WW.neck[1]);
    line('top', [add(q.sho, mul(front, 3)), add(q.neck, mul(front, 1.4))], .25, .6);
    const hu = unit(sub(q.head, q.neck)), hc = add(q.head, mul(hu, .6));
    out.top.push(`<ellipse cx="${f(hc[0])}" cy="${f(hc[1])}" rx="8.6" ry="10.2" transform="rotate(${f(deg(hu) + 90)} ${f(hc[0])} ${f(hc[1])})" fill="${grad('s', C.skin)}" stroke="${C.line}" stroke-width=".42"/>`);
    const jaw = add(hc, add(mul(front, 4.2), mul(hu, -4.6))), ear = add(hc, mul(front, -1.2));
    line('top', [add(hc, add(mul(front, 7.6), mul(hu, -1))), add(jaw, mul(front, 1.6)), add(hc, add(mul(front, -2.4), mul(hu, -7.6)))], .28, .55);
    out.top.push(`<ellipse cx="${f(ear[0])}" cy="${f(ear[1])}" rx="1.4" ry="2.2" transform="rotate(${f(deg(hu) + 90)} ${f(ear[0])} ${f(ear[1])})" fill="none" stroke="${C.line}" stroke-width=".26" opacity=".7"/>`);
    // ── lado cercano ──
    leg('n', q.hip, q.k, q.an, q.toe, 'near');
    arm(q.sho, q.e, q.w, 'near');
    // ── material en las manos ──
    GEAR(D, out, C, grad, f, capsule);

    // ── encuadre 4:3 ──
    const pts = Object.keys(q).map((k) => q[k]).filter(Array.isArray).concat(out.bounds || []);
    let x0 = Math.min(...pts.map((p) => p[0])) - 16, x1 = Math.max(...pts.map((p) => p[0])) + 16, y0 = Math.min(...pts.map((p) => p[1])) - 14, y1 = Math.max(...pts.map((p) => p[1])) + 10;
    let w = x1 - x0, h = y1 - y0;
    if (w / h < 4 / 3) { const nw = h * 4 / 3; x0 -= (nw - w) / 2; w = nw; } else { const nh = w * 3 / 4; y0 -= (nh - h) * .6; h = nh; }
    const floor = Math.max(...[q.toe, q.toe2, q.an, q.an2].map((p) => p[1])) + 2.8;
    const cx = (Math.min(q.toe[0], q.toe2[0], q.hip[0]) + Math.max(q.toe[0], q.toe2[0], q.hip[0])) / 2;
    const shadow = `<ellipse cx="${f(cx)}" cy="${f(Math.min(floor + (out.floorDy || 0), y0 + h - 2))}" rx="${f(w * .32)}" ry="${f(h * .035)}" fill="url(#sh)"/>`;
    defs.set('sh', '<radialGradient id="sh"><stop offset="0" stop-color="#6f7c75" stop-opacity=".55"/><stop offset="1" stop-color="#6f7c75" stop-opacity="0"/></radialGradient>');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(h)}" width="960" height="720"><defs>${[...defs.values()].join('')}</defs>` +
      `<rect x="${f(x0 - 5)}" y="${f(y0 - 5)}" width="${f(w + 10)}" height="${f(h + 10)}" fill="${C.bg}"/>${shadow}` +
      out.back.join('') + out.props.join('') + '<g id="fig">' + out.far.join('') + out.farT.join('') + out.body.join('') + out.top.join('') + out.near.join('') + out.bodyT.join('') + out.nearT.join('') + '</g>' + out.gear.join('') + '</svg>';
  }

  // Músculos que se resaltan para cada grupo
  const TARGET = {
    Pecho: ['pec'], Espalda: ['lat'], Hombros: ['del'], Bíceps: ['bic'], Tríceps: ['tri'], Antebrazo: ['fa1', 'fa2'],
    Core: ['abs', 'obl'], Trapecio: ['trap'], Cuádriceps: ['vl', 'rf'], Isquiosurales: ['ham'], Glúteos: ['glu'], Gemelos: ['gas', 'sol'],
    Aductores: ['nadd', 'fadd'], Abductores: ['glu'], Lumbar: ['ere'],
  };

  // ── Apoyos (mismas posiciones que la app, con más detalle) ──
  function PROPS(D, out, C, grad, f) {
    const list = D.props.concat(D.eq === 'cable' || D.eq === 'cablebar' ? ['cable'] : []), P = out.props, B = (out.bounds = out.bounds || []);
    const metal = grad('m', C.gear), pad = `fill="${C.pad[0]}" stroke="${C.line}" stroke-width=".45"`;
    const leg = (x, y, h) => `<rect x="${x}" y="${y}" width="4.4" height="${h}" rx="1" fill="${metal}" stroke="${C.line}" stroke-width=".4"/>`;
    const padRect = (x, y, w, h, rot) => `<g ${rot ? `transform="rotate(${rot[0]} ${rot[1]} ${rot[2]})"` : ''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.2" ${pad}/><rect x="${x + 2}" y="${y + 1.2}" width="${w - 4}" height="1.6" rx=".8" fill="${C.hi}" opacity=".35"/><path d="M${x + 3} ${y + h - 1.6}H${x + w - 3}" stroke="${C.line}" stroke-width=".22" stroke-dasharray="1.2 1" opacity=".6"/></g>`;
    if (list.includes('bench')) { P.push(leg(66, 112, 34) + leg(140, 112, 34) + `<rect x="60" y="143" width="90" height="4" rx="1.6" fill="${metal}" stroke="${C.line}" stroke-width=".4"/>` + padRect(56, 103, 100, 10)); B.push([56, 103], [156, 147]); out.floorDy = 0; }
    if (list.includes('benchlow')) { P.push(leg(48, 118, 28) + leg(82, 118, 28) + padRect(38, 107, 58, 11)); B.push([38, 107], [96, 146]); }
    if (list.includes('incline')) { P.push(leg(104, 112, 34) + leg(74, 132, 14) + padRect(66, 110, 76, 10, [-30, 104, 116])); B.push([62, 92], [140, 146]); }
    if (list.includes('seat')) { P.push(leg(114, 104, 42) + padRect(98, 95, 38, 9) + padRect(90, 52, 10, 50)); B.push([90, 52], [136, 146]); }
    if (list.includes('legpress')) { P.push(padRect(88, 108, 46, 9, [-6, 110, 112]) + `<rect x="148" y="38" width="9" height="60" rx="2" transform="rotate(-38 153 68)" fill="${metal}" stroke="${C.line}" stroke-width=".45"/>`); B.push([86, 30], [176, 124]); }
    if (list.includes('highbar')) { P.push(`<rect x="66" y="12" width="108" height="4.6" rx="2.3" fill="${metal}" stroke="${C.line}" stroke-width=".4"/>` + leg(66, 14, 132) + leg(170, 14, 132)); B.push([64, 10], [176, 146]); }
    if (list.includes('dipbar')) { P.push(`<rect x="94" y="80" width="60" height="4.4" rx="2.2" fill="${metal}" stroke="${C.line}" stroke-width=".4"/>` + leg(146, 82, 64)); B.push([94, 80], [154, 146]); }
    if (list.includes('step')) { P.push(padRect(94, 139, 54, 7)); B.push([94, 139], [148, 146]); }
    if (list.includes('mat')) { P.push(`<rect x="28" y="142" width="184" height="3.6" rx="1.8" fill="#9fb3a7" stroke="${C.line}" stroke-width=".3" opacity=".9"/>`); }
    if (list.includes('cable')) { const y = D.pat === 'pulldown' || D.pat === 'pushdown' ? 18 : 60; P.push(`<rect x="195" y="6" width="10" height="140" rx="2" fill="${metal}" stroke="${C.line}" stroke-width=".45"/><circle cx="200" cy="${y}" r="4.4" fill="${C.gear[0]}" stroke="${C.line}" stroke-width=".45"/><circle cx="200" cy="${y}" r="1.4" fill="${C.hi}"/><path d="M200 ${y}L${f(D.B.w[0])} ${f(D.B.w[1])}" stroke="${C.line}" stroke-width=".5"/>`); B.push([194, 6], [206, 146]); }
  }
  // ── Material en las manos ──
  function GEAR(D, out, C, grad, f, capsule) {
    const q = D.B, G = out.gear, metal = grad('m', C.gear);
    const plate = (c, r) => `<g><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="${metal}" stroke="${C.line}" stroke-width=".5"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .74)}" fill="none" stroke="${C.hi}" stroke-width=".4" opacity=".55"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .36)}" fill="none" stroke="${C.gear[2]}" stroke-width=".45"/><path d="M${f(c[0] - r * .62)} ${f(c[1] - r * .5)}A${f(r * .8)} ${f(r * .8)} 0 0 1 ${f(c[0] + r * .4)} ${f(c[1] - r * .78)}" fill="none" stroke="${C.hi}" stroke-width="1" stroke-linecap="round" opacity=".5"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .14)}" fill="${C.hi}" stroke="${C.line}" stroke-width=".35"/></g>`;
    const bar = (a, b) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.line}" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.gear[0]}" stroke-width="1.6" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1] - .5)}L${f(b[0])} ${f(b[1] - .5)}" stroke="${C.hi}" stroke-width=".45" opacity=".7" stroke-linecap="round"/>`;
    const B = (out.bounds = out.bounds || []);
    const depth = [16, -9]; // la barra entra en profundidad (vista tres cuartos)
    if (D.eq === 'machine') {
      // máquina: empuñadura en las manos, brazo de palanca y bastidor con pila de placas detrás
      const u = unit(depth), a = add(q.w, mul(u, -6)), b2 = add(q.w, mul(u, 6));
      const fx = Math.min(q.hip[0], q.sho[0]) - 34, top = Math.min(q.head[1], q.w[1], q.w2[1]) - 6, bot = Math.max(q.an[1], q.an2[1]) + 2;
      out.props.push(`<rect x="${f(fx)}" y="${f(top)}" width="7" height="${f(bot - top)}" rx="1.6" fill="${metal}" stroke="${C.line}" stroke-width=".45"/>` +
        [0, 1, 2, 3, 4, 5].map((k) => `<rect x="${f(fx + 9)}" y="${f(bot - 6 - k * 4.2)}" width="13" height="3.6" rx=".8" fill="${metal}" stroke="${C.line}" stroke-width=".35"/>`).join('') +
        `<rect x="${f(fx + 14.4)}" y="${f(top + 2)}" width="2" height="${f(bot - top - 30)}" fill="${C.gear[2]}"/>`);
      G.push(`<path d="M${f(fx + 7)} ${f(q.w[1])}L${f(q.w[0])} ${f(q.w[1])}" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><path d="M${f(fx + 7)} ${f(q.w[1])}L${f(q.w[0])} ${f(q.w[1])}" stroke="${C.gear[0]}" stroke-width="1.4" stroke-linecap="round"/>` +
        `<path d="M${f(a[0])} ${f(a[1])}L${f(b2[0])} ${f(b2[1])}" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1])}L${f(b2[0])} ${f(b2[1])}" stroke="#5b6a63" stroke-width="2" stroke-linecap="round"/>`);
      B.push([fx - 2, top], [fx + 24, bot]);
    } else if (D.eq === 'bar' || D.eq === 'backbar' || D.eq === 'hipbar') {
      const c = D.eq === 'backbar' ? add(q.sho, mul(unit(sub(q.neck, q.sho)), 2)) : D.eq === 'hipbar' ? add(q.hip, mul(nrm(unit(sub(q.sho, q.hip))), 9)) : q.w;
      // tumbado (press, rompecráneos, hip thrust): la barra cruza el pecho y el disco cercano queda fuera del cuerpo
      const lying = Math.abs(unit(sub(q.sho, q.hip))[1]) < .55, back = D.eq === 'backbar';
      const kN = back ? -1.7 : lying ? -2.1 : -1.15, kF = back ? 1.5 : lying ? 1.6 : 1.25, rN = back ? 12.5 : lying ? 12.5 : 14;
      const near = add(c, mul(depth, kN)), farP = add(c, mul(depth, kF));
      G.push(plate(farP, rN * .78) + bar(add(near, mul(depth, -.25)), add(farP, mul(depth, .3))) + plate(near, rN));
      B.push(add(near, [-16, -16]), add(farP, [12, 12]));
    } else if (D.eq === 'db') {
      for (const w of [q.w2, q.w]) {
        const u = unit(depth), a = add(w, mul(u, -5)), b = add(w, mul(u, 5));
        G.push(`<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.line}" stroke-width="1.8" stroke-linecap="round"/>` +
          [a, b].map((p) => `<path d="${capsule(add(p, mul(u, -1.4)), add(p, mul(u, 1.4)), 3.4, 3.4)}" fill="${metal}" stroke="${C.line}" stroke-width=".4"/>`).join(''));
      }
      B.push(add(q.w, [-9, -9]), add(q.w, [9, 9]));
    } else if (D.eq === 'kb') {
      const c = add(q.w, [0, 6]); G.push(`<circle cx="${f(c[0])}" cy="${f(c[1] + 2)}" r="6.4" fill="${metal}" stroke="${C.line}" stroke-width=".5"/><path d="M${f(c[0] - 3.6)} ${f(c[1] - 2)}q3.6 -6 7.2 0" fill="none" stroke="${C.line}" stroke-width="1.8"/><path d="M${f(c[0] - 3)} ${f(c[1] + 1)}a4 4 0 0 1 3 -2.6" stroke="${C.hi}" stroke-width=".6" fill="none" opacity=".6"/>`);
      B.push(add(c, [-8, -8]), add(c, [8, 10]));
    } else if (D.eq === 'cablebar' || D.eq === 'cable') {
      const u = unit(depth), a = add(q.w, mul(u, -7)), b = add(q.w, mul(u, 7));
      G.push(`<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.gear[0]}" stroke-width="1.1" stroke-linecap="round"/>`);
    }
  }

  window.vxIlustrar = (i) => build(i);
})();
