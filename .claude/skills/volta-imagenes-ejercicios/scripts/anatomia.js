/* VOLTA · Ilustrador anatómico v3 (estilo de la imagen de «Press de banca»).
   Figura con silueta humana real: cada segmento (tronco, brazo, antebrazo, muslo, pierna) tiene un perfil delantero y
   otro trasero que se ensanchan donde hay músculo y se estrechan en las articulaciones. Dentro, los músculos son
   regiones con su borde, su relieve (luz desde arriba a la izquierda) y fibras que siguen su dirección.
   El músculo trabajado va en verde suave semitransparente. Usa las posturas de la app (window.vxPoseData).
   window.vxAnatomia(i) → SVG 960×720. */
(function () {
  'use strict';
  const f = (v) => Math.round(v * 100) / 100;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]) || 1, unit = (a) => mul(a, 1 / len(a)), nrm = (a) => [-a[1], a[0]];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const deg = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  // interpolación de un perfil [[t, ancho], …]
  const prof = (P, t) => { if (t <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const k = (t - P[i - 1][0]) / (P[i][0] - P[i - 1][0]); const s = k * k * (3 - 2 * k); return lerp(P[i - 1][1], P[i][1], s); } return P[P.length - 1][1]; };
  // curva suave por puntos (Catmull-Rom → Bézier)
  function smooth(pts, closed) {
    const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = add(p1, mul(sub(p2, p0), 1 / 6)), c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  }

  const COL = { bg: '#c4cfc9', line: '#3e4943', skin: '#a3aea7', skinFar: '#8c9790', groove: '#56625b', tgt: '#86c39b', tgtLine: '#3f6a50', gear: ['#6d7c75', '#4d5c55', '#323d37'], hi: '#c6d2cb' };

  // Perfiles (en unidades de la postura): [t, ancho] por el lado delantero (F) y trasero (B) de cada segmento
  const PROF = {
    torso: { F: [[0, 9], [.18, 10.4], [.45, 11.2], [.62, 13.4], [.78, 14.6], [.9, 13], [1, 10]], B: [[0, 11.5], [.15, 10.6], [.35, 9.6], [.55, 11.6], [.75, 13.6], [.92, 12.8], [1, 9.5]] },
    thigh: { F: [[0, 9.5], [.2, 9.6], [.45, 9.2], [.75, 7.6], [.92, 6], [1, 5.6]], B: [[0, 10.4], [.12, 10.6], [.4, 8.6], [.75, 7], [.92, 6], [1, 5.8]] },
    shin: { F: [[0, 5.4], [.1, 5], [.4, 4.4], [.8, 3.2], [1, 3]], B: [[0, 5.6], [.18, 7.2], [.36, 7], [.6, 4.6], [.85, 3.2], [1, 3]] },
    ua: { F: [[0, 7.4], [.2, 6.6], [.5, 6.2], [.8, 5], [1, 4.4]], B: [[0, 7.8], [.25, 7.2], [.55, 6.6], [.85, 5], [1, 4.4]] },
    fa: { F: [[0, 4.4], [.15, 5.2], [.45, 4.4], [.85, 3], [1, 2.8]], B: [[0, 4.4], [.2, 4.8], [.5, 3.8], [.85, 2.8], [1, 2.6]] },
  };

  function build(i) {
    const e = EX[i], D = window.vxPoseData(e), q = D.B;
    const defs = new Map(), L = { props: [], far: [], body: [], near: [], gear: [], top: [] };
    const target = new Set(TARGET[e[1]] || []);
    const relief = (id, blur, scale, spec) => `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">` +
      `<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="b"/>` +
      `<feDiffuseLighting in="b" surfaceScale="${scale}" diffuseConstant="1.2" lighting-color="#fff" result="d"><feDistantLight azimuth="235" elevation="40"/></feDiffuseLighting>` +
      `<feSpecularLighting in="b" surfaceScale="${scale}" specularConstant="${spec}" specularExponent="24" lighting-color="#fff" result="s"><feDistantLight azimuth="235" elevation="52"/></feSpecularLighting>` +
      `<feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1=".46" k2=".68" result="m"/>` +
      `<feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>` +
      `<feComposite in="m" in2="s2" operator="arithmetic" k2="1" k3=".16" result="o"/><feComposite in="o" in2="SourceAlpha" operator="in"/></filter>`;
    defs.set('rb', relief('rb', 3.2, 3.2, .28)); defs.set('rm', relief('rm', 1.2, 1.6, .38));
    const fib = (ang) => { const a = ((Math.round(ang / 6) * 6) % 180 + 180) % 180, id = 'fb' + a; if (!defs.has(id)) defs.set(id, `<pattern id="${id}" width=".72" height=".72" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><path d="M0 .36H.72" stroke="#38433d" stroke-width=".1" opacity=".55"/></pattern>`); return `url(#${id})`; };

    // ── segmento con perfil: devuelve su contorno y una función para colocar regiones musculares ──
    function segment(a, b, P, s, ext0, ext1) {
      const d = sub(b, a), u = unit(d), n = nrm(u), Ld = len(d);
      const at = (t, side, frac) => add(add(a, mul(d, t)), mul(n, s * side * frac * prof(side > 0 ? P.F : P.B, t)));
      const N = 16, T0 = -(ext0 || 0), T1 = 1 + (ext1 || 0), ts = [...Array(N + 1)].map((_, k) => T0 + (T1 - T0) * k / N);
      const front = ts.map((t) => at(Math.max(0, Math.min(1, t)), 1, 1)).map((p, k) => add(p, mul(u, (ts[k] < 0 ? ts[k] : ts[k] > 1 ? ts[k] - 1 : 0) * Ld)));
      const back = ts.map((t) => at(Math.max(0, Math.min(1, t)), -1, 1)).map((p, k) => add(p, mul(u, (ts[k] < 0 ? ts[k] : ts[k] > 1 ? ts[k] - 1 : 0) * Ld)));
      // extremos redondeados
      const capA = [...Array(5)].map((_, k) => { const ang = Math.PI * (k + 1) / 6, r = (prof(P.F, 0) + prof(P.B, 0)) / 2, c = add(a, mul(u, T0 * Ld)); return add(add(c, mul(n, s * Math.cos(ang) * r * -1)), mul(u, -Math.sin(ang) * r * .75)); }).reverse();
      const capB = [...Array(5)].map((_, k) => { const ang = Math.PI * (k + 1) / 6, r = (prof(P.F, 1) + prof(P.B, 1)) / 2, c = add(a, mul(u, T1 * Ld)); return add(add(c, mul(n, s * Math.cos(ang) * r)), mul(u, Math.sin(ang) * r * .75)); });
      const outline = smooth(front.concat(capB, back.reverse(), capA), true);
      // región muscular: entre t0 y t1, desde frac0 hasta frac1 del ancho del lado (side), con forma de huso
      const region = (t0, t1, side, fIn, fOut, bulge) => {
        const M = 10, tt = [...Array(M + 1)].map((_, k) => lerp(t0, t1, k / M));
        const sw = (k) => Math.sin(Math.PI * k / M);
        const outer = tt.map((t, k) => at(t, side, lerp(fIn + (fOut - fIn) * .25, fOut, Math.pow(sw(k), .6)) * (1 + (bulge || 0) * sw(k))));
        const inner = tt.map((t, k) => at(t, side, lerp(fOut - (fOut - fIn) * .3, fIn, Math.pow(sw(k), .8)))).reverse();
        return { d: smooth(outer.concat(inner), true), ang: deg(u) + (side > 0 ? -4 : 4) };
      };
      return { outline, region, u, n, at };
    }
    const paintBase = (layer, seg, far) => L[layer].push(`<path d="${seg.outline}" fill="${far ? COL.skinFar : COL.skin}" filter="url(#rb)"/><path d="${seg.outline}" fill="${fib(deg(seg.u))}" opacity=".35"/><path d="${seg.outline}" fill="none" stroke="${COL.line}" stroke-width=".55" stroke-linejoin="round"/>`);
    const muscle = (layer, r, id, far) => {
      const isT = target.has(id);
      const body = isT ? COL.tgt : far ? '#939e97' : '#adb8b1';
      const s = `<path d="${r.d}" fill="${body}" ${isT ? 'fill-opacity=".9"' : ''} filter="url(#rm)"/><path d="${r.d}" fill="${fib(r.ang)}" opacity="${isT ? .5 : .75}"/>` +
        `<path d="${r.d}" fill="none" stroke="${isT ? COL.tgtLine : COL.groove}" stroke-width="${isT ? .32 : .22}" stroke-opacity="${isT ? .95 : .7}" stroke-linejoin="round"/>`;
      (isT ? L.top : L[layer]).push(s);
    };
    const line = (layer, pts, w, op) => L[layer].push(`<path d="${smooth(pts, false)}" fill="none" stroke="${COL.line}" stroke-width="${w}" opacity="${op}" stroke-linecap="round"/>`);

    const tU = unit(sub(q.sho, q.hip)), front = nrm(tU);
    const fs = (a, b) => (Math.sign(dot(nrm(unit(sub(b, a))), front)) || 1); // signo del "delante" de un segmento
    const flex = (a, b, c, flexFront) => { const cr = cross(unit(sub(b, a)), unit(sub(c, b))); if (Math.abs(cr) > .12) return flexFront ? Math.sign(cr) : -Math.sign(cr); return fs(a, b); };

    function leg(hip, k, an, toe, far) {
      const layer = far ? 'far' : 'near', s = flex(hip, k, an, false);
      const th = segment(hip, k, PROF.thigh, s, .08, .04), sh = segment(k, an, PROF.shin, s, .06, .02);
      paintBase(layer, th, far);
      muscle(layer, th.region(.1, .96, -1, .05, .95, .02), 'ham', far);
      muscle(layer, th.region(.06, .62, -1, -.3, .3), far ? 'fadd' : 'nadd', far);
      muscle(layer, th.region(.06, .96, 1, .08, .96, .03), 'vl', far);
      muscle(layer, th.region(.1, .84, 1, .45, .9), 'rf', far);
      // rodilla
      const kp = th.at(.98, 1, .55);
      L[layer].push(`<ellipse cx="${f(kp[0])}" cy="${f(kp[1])}" rx="2.1" ry="2.6" transform="rotate(${f(deg(th.u))} ${f(kp[0])} ${f(kp[1])})" fill="#b5bfb9" stroke="${COL.groove}" stroke-width=".22" filter="url(#rm)"/>`);
      paintBase(layer, sh, far);
      muscle(layer, sh.region(.04, .62, -1, .05, .97, .04), 'gas', far);
      muscle(layer, sh.region(.3, .88, -1, .02, .6), 'sol', far);
      muscle(layer, sh.region(.06, .78, 1, .25, .85), 'tib', far);
      // pie con talón, empeine y dedos
      const fu = unit(sub(toe, an)), fn = mul(nrm(fu), Math.sign(dot(nrm(fu), [0, 1])) || 1); // fn apunta al suelo
      const heel = add(an, mul(fu, -3.4)), ball = add(an, mul(fu, 9.4));
      const pts = [add(heel, mul(fn, 2.8)), add(heel, mul(fn, -.6)), add(an, mul(fn, -3.6)), add(add(an, mul(fu, 4)), mul(fn, -2.6)), add(ball, mul(fn, -1.2)), add(add(ball, mul(fu, 3.2)), mul(fn, .6)), add(ball, mul(fn, 2.6)), add(add(an, mul(fu, 3)), mul(fn, 2.4))];
      L[layer].push(`<path d="${smooth(pts, true)}" fill="${far ? COL.skinFar : COL.skin}" filter="url(#rm)"/><path d="${smooth(pts, true)}" fill="none" stroke="${COL.line}" stroke-width=".5"/>`);
    }
    function arm(sho, el, wr, far) {
      const layer = far ? 'far' : 'near', s = flex(sho, el, wr, true);
      const ua = segment(sho, el, PROF.ua, s, .12, .05), fa = segment(el, wr, PROF.fa, s, .05, .04);
      paintBase(layer, ua, far);
      muscle(layer, ua.region(.16, .94, -1, .05, .95, .03), 'tri', far);
      muscle(layer, ua.region(.24, .9, 1, .05, .95, .04), 'bic', far);
      muscle(layer, ua.region(-.1, .48, 1, -.9, .98, .02), 'del', far);
      paintBase(layer, fa, far);
      muscle(layer, fa.region(.02, .72, 1, .05, .96, .03), 'fa1', far);
      muscle(layer, fa.region(.05, .66, -1, .05, .9), 'fa2', far);
      // mano: palma y dedos
      const hu = unit(sub(wr, el)), hn = nrm(hu), h0 = add(wr, mul(hu, .8));
      const pts = [add(h0, mul(hn, 2.6)), add(add(h0, mul(hu, 3.4)), mul(hn, 3)), add(add(h0, mul(hu, 6.4)), mul(hn, 1.6)), add(add(h0, mul(hu, 6.8)), mul(hn, -.8)), add(add(h0, mul(hu, 4.4)), mul(hn, -2.8)), add(h0, mul(hn, -2.4))];
      L[layer].push(`<path d="${smooth(pts, true)}" fill="${far ? COL.skinFar : COL.skin}" filter="url(#rm)"/><path d="${smooth(pts, true)}" fill="none" stroke="${COL.line}" stroke-width=".45"/>`);
    }

    PROPS(D, L, COL, f);
    leg(q.hip, q.k2, q.an2, q.toe2, true);
    arm(q.sho, q.e2, q.w2, true);
    // ── tronco: tórax, cintura y pelvis con su perfil ──
    const to = segment(q.hip, q.sho, PROF.torso, 1, .16, .1);
    paintBase('body', to, false);
    muscle('body', to.region(-.12, .3, -1, .1, 1.02, .05), 'glu');
    muscle('body', to.region(.38, .96, -1, .15, .98, .03), 'lat');
    muscle('body', to.region(.04, .58, -1, .05, .45), 'ere');
    muscle('body', to.region(.1, .58, 1, .2, .62), 'obl');
    muscle('body', to.region(.56, .97, 1, .12, .99, .04), 'pec');
    muscle('body', to.region(.1, .6, 1, .62, .98), 'abs');
    for (let k = 0; k < 4; k++) line('body', [to.at(.18 + k * .11, 1, .63), to.at(.18 + k * .11 + .005, 1, .97)], .22, .7); // intersecciones del recto
    line('body', [to.at(.14, 1, .8), to.at(.6, 1, .8)], .2, .55); // línea alba
    for (let k = 0; k < 3; k++) muscle('body', to.region(.5 + k * .06, .58 + k * .06, 1, .02, .3), 'ser');
    // cuello, trapecio y cabeza
    const nu = unit(sub(q.neck, q.sho)), nn = mul(nrm(nu), Math.sign(dot(nrm(nu), front)) || 1);
    const neck = smooth([add(q.sho, mul(nn, 5.4)), add(q.neck, mul(nn, 3.4)), add(add(q.neck, mul(nu, 2)), mul(nn, 2.4)), add(add(q.neck, mul(nu, 2)), mul(nn, -3.2)), add(q.neck, mul(nn, -4)), add(q.sho, mul(nn, -9.5))], true);
    L.body.push(`<path d="${neck}" fill="${COL.skin}" filter="url(#rb)"/><path d="${neck}" fill="none" stroke="${COL.line}" stroke-width=".5"/>`);
    const trap = smooth([add(add(q.sho, mul(tU, -4)), mul(front, -11)), add(add(q.neck, mul(nu, 1)), mul(nn, -3.6)), add(q.sho, mul(front, 1)), add(add(q.sho, mul(tU, -2)), mul(front, -4))], true);
    muscle('body', { d: trap, ang: deg(tU) + 30 }, 'trap');
    line('body', [add(q.sho, mul(nn, 4.2)), add(q.neck, mul(nn, -1.8)), add(add(q.neck, mul(nu, 2.4)), mul(nn, -2.6))], .24, .6); // esternocleidomastoideo
    // cabeza de perfil: cráneo, frente, nariz, labios, mentón y oreja
    const hu = unit(sub(q.head, q.neck)), hf = mul(nrm(hu), Math.sign(dot(nrm(hu), front)) || 1), H = (x, y) => add(add(q.head, mul(hf, x)), mul(hu, y));
    const head = smooth([H(-8.4, 1.6), H(-6.6, 7.2), H(0, 9.6), H(5.6, 7.4), H(8, 2.2), H(8.4, -1), H(9.8, -2.6), H(8.4, -4), H(8.6, -5.2), H(7.6, -6.6), H(6.4, -9.4), H(2.6, -10.6), H(-1, -9.2), H(-3, -6.6), H(-6.8, -5), H(-8.8, -2.6)], true);
    L.body.push(`<path d="${head}" fill="${COL.skin}" filter="url(#rb)"/><path d="${head}" fill="${fib(deg(hu) + 90)}" opacity=".25"/><path d="${head}" fill="none" stroke="${COL.line}" stroke-width=".55"/>`);
    const ear = smooth([H(-1.2, .6), H(.4, -.4), H(.6, -3), H(-.6, -4.4), H(-1.8, -2.8)], true);
    L.body.push(`<path d="${ear}" fill="#9aa59e" stroke="${COL.groove}" stroke-width=".24"/>`);
    line('body', [H(5.6, -.4), H(4.2, -3.2), H(2.4, -7.6)], .2, .5); // pómulo y mandíbula
    // ── lado cercano ──
    leg(q.hip, q.k, q.an, q.toe, false);
    arm(q.sho, q.e, q.w, false);
    GEAR(D, L, COL, f);

    // ── encuadre 4:3 ──
    const pts = Object.keys(q).map((k) => q[k]).filter(Array.isArray).concat(L.bounds || []);
    let x0 = Math.min(...pts.map((p) => p[0])) - 18, x1 = Math.max(...pts.map((p) => p[0])) + 18, y0 = Math.min(...pts.map((p) => p[1])) - 16, y1 = Math.max(...pts.map((p) => p[1])) + 10;
    let w = x1 - x0, h = y1 - y0;
    if (w / h < 4 / 3) { const nw = h * 4 / 3; x0 -= (nw - w) / 2; w = nw; } else { const nh = w * 3 / 4; y0 -= (nh - h) * .6; h = nh; }
    const floor = Math.max(q.toe[1], q.toe2[1], q.an[1], q.an2[1]) + 3.4, cx = (Math.min(q.toe[0], q.toe2[0], q.hip[0]) + Math.max(q.toe[0], q.toe2[0], q.hip[0])) / 2;
    defs.set('sh', '<radialGradient id="sh"><stop offset="0" stop-color="#6f7c75" stop-opacity=".5"/><stop offset="1" stop-color="#6f7c75" stop-opacity="0"/></radialGradient>');
    defs.set('vig', '<radialGradient id="vig" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#cdd7d1"/><stop offset="1" stop-color="#bcc8c1"/></radialGradient>');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(h)}" width="960" height="720"><defs>${[...defs.values()].join('')}</defs>` +
      `<rect x="${f(x0 - 5)}" y="${f(y0 - 5)}" width="${f(w + 10)}" height="${f(h + 10)}" fill="url(#vig)"/>` +
      `<ellipse cx="${f(cx)}" cy="${f(Math.min(floor, y0 + h - 2))}" rx="${f(w * .3)}" ry="${f(h * .03)}" fill="url(#sh)"/>` +
      L.props.join('') + L.far.join('') + L.body.join('') + L.near.join('') + L.top.join('') + L.gear.join('') + '</svg>';
  }

  const TARGET = {
    Pecho: ['pec'], Espalda: ['lat'], Hombros: ['del'], Bíceps: ['bic'], Tríceps: ['tri'], Antebrazo: ['fa1', 'fa2'],
    Core: ['abs', 'obl'], Trapecio: ['trap'], Cuádriceps: ['vl', 'rf'], Isquiosurales: ['ham'], Glúteos: ['glu'], Gemelos: ['gas', 'sol'],
    Aductores: ['nadd', 'fadd'], Abductores: ['glu'], Lumbar: ['ere'],
  };

  function metal(defs) { return 'url(#mt)'; }
  function PROPS(D, L, C, f) {
    const list = D.props.concat(D.eq === 'cable' || D.eq === 'cablebar' ? ['cable'] : []), P = L.props, B = (L.bounds = L.bounds || []);
    const mt = `<linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.gear[0]}"/><stop offset=".55" stop-color="${C.gear[1]}"/><stop offset="1" stop-color="${C.gear[2]}"/></linearGradient>`;
    P.push(`<defs>${mt}</defs>`);
    const legR = (x, y, h) => `<rect x="${x}" y="${y}" width="4.6" height="${h}" rx="1" fill="url(#mt)" stroke="${C.line}" stroke-width=".4"/><rect x="${x + .6}" y="${y}" width="1" height="${h}" fill="${C.hi}" opacity=".25"/>`;
    const pad = (x, y, w, h, rot) => `<g ${rot ? `transform="rotate(${rot[0]} ${rot[1]} ${rot[2]})"` : ''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.4" fill="#56645d" stroke="${C.line}" stroke-width=".45"/><rect x="${x + 2.4}" y="${y + 1.1}" width="${w - 4.8}" height="2" rx="1" fill="${C.hi}" opacity=".3"/><path d="M${x + 3} ${y + h - 1.7}H${x + w - 3}" stroke="#2f3933" stroke-width=".24" stroke-dasharray="1.3 1" opacity=".6"/></g>`;
    if (list.includes('bench')) { P.push(legR(68, 112, 34) + legR(140, 112, 34) + `<path d="M60 146h92l3 2H57z" fill="url(#mt)" stroke="${C.line}" stroke-width=".4"/>` + pad(54, 103, 104, 10)); B.push([54, 103], [158, 148]); }
    if (list.includes('benchlow')) { P.push(legR(48, 118, 28) + legR(82, 118, 28) + pad(38, 107, 58, 11)); B.push([38, 107], [96, 146]); }
    if (list.includes('incline')) { P.push(legR(104, 112, 34) + legR(74, 132, 14) + pad(66, 110, 76, 10, [-30, 104, 116])); B.push([62, 92], [140, 146]); }
    if (list.includes('seat')) { P.push(legR(114, 104, 42) + pad(98, 95, 38, 9) + pad(90, 52, 10, 50)); B.push([90, 52], [136, 146]); }
    if (list.includes('legpress')) { P.push(pad(88, 108, 46, 9, [-6, 110, 112]) + `<rect x="148" y="38" width="9" height="60" rx="2" transform="rotate(-38 153 68)" fill="url(#mt)" stroke="${C.line}" stroke-width=".45"/>`); B.push([86, 30], [176, 124]); }
    if (list.includes('highbar')) { P.push(`<rect x="66" y="12" width="108" height="4.6" rx="2.3" fill="url(#mt)" stroke="${C.line}" stroke-width=".4"/>` + legR(66, 14, 132) + legR(170, 14, 132)); B.push([64, 10], [176, 146]); }
    if (list.includes('dipbar')) { P.push(`<rect x="94" y="80" width="60" height="4.4" rx="2.2" fill="url(#mt)" stroke="${C.line}" stroke-width=".4"/>` + legR(146, 82, 64)); B.push([94, 80], [154, 146]); }
    if (list.includes('step')) { P.push(pad(94, 139, 54, 7)); B.push([94, 139], [148, 146]); }
    if (list.includes('mat')) P.push(`<rect x="26" y="142.4" width="188" height="3.4" rx="1.7" fill="#a4b5ab" stroke="${C.line}" stroke-width=".3"/>`);
    if (list.includes('cable')) { const y = D.pat === 'pulldown' || D.pat === 'pushdown' ? 18 : 60; P.push(`<rect x="195" y="6" width="10" height="140" rx="2" fill="url(#mt)" stroke="${C.line}" stroke-width=".45"/><circle cx="200" cy="${y}" r="4.6" fill="${C.gear[0]}" stroke="${C.line}" stroke-width=".45"/><circle cx="200" cy="${y}" r="1.5" fill="${C.hi}"/><path d="M200 ${y}L${f(D.B.w[0])} ${f(D.B.w[1])}" stroke="#2f3933" stroke-width=".55"/>`); B.push([194, 6], [206, 146]); }
  }
  function GEAR(D, L, C, f) {
    const q = D.B, G = L.gear, B = (L.bounds = L.bounds || []), depth = [16, -9], uD = unit(depth);
    const plate = (c, r) => `<g><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="url(#mt)" stroke="${C.line}" stroke-width=".5"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .76)}" fill="none" stroke="${C.hi}" stroke-width=".42" opacity=".5"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .38)}" fill="none" stroke="${C.gear[2]}" stroke-width=".5"/><path d="M${f(c[0] - r * .64)} ${f(c[1] - r * .48)}A${f(r * .8)} ${f(r * .8)} 0 0 1 ${f(c[0] + r * .4)} ${f(c[1] - r * .8)}" fill="none" stroke="${C.hi}" stroke-width="1.1" stroke-linecap="round" opacity=".45"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r * .15)}" fill="${C.hi}" stroke="${C.line}" stroke-width=".35"/></g>`;
    const bar = (a, b) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.line}" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.gear[0]}" stroke-width="1.6" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1] - .5)}L${f(b[0])} ${f(b[1] - .5)}" stroke="${C.hi}" stroke-width=".45" opacity=".7" stroke-linecap="round"/>`;
    if (D.eq === 'machine') {
      const a = add(q.w, mul(uD, -6)), b2 = add(q.w, mul(uD, 6));
      const fx = Math.min(q.hip[0], q.sho[0]) - 36, top = Math.min(q.head[1], q.w[1], q.w2[1]) - 6, bot = Math.max(q.an[1], q.an2[1]) + 3;
      L.props.push(`<rect x="${f(fx)}" y="${f(top)}" width="7" height="${f(bot - top)}" rx="1.6" fill="url(#mt)" stroke="${C.line}" stroke-width=".45"/>` + [0, 1, 2, 3, 4, 5].map((k) => `<rect x="${f(fx + 9)}" y="${f(bot - 6 - k * 4.2)}" width="13" height="3.6" rx=".8" fill="url(#mt)" stroke="${C.line}" stroke-width=".35"/>`).join(''));
      G.push(`<path d="M${f(fx + 7)} ${f(q.w[1])}L${f(q.w[0])} ${f(q.w[1])}" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/><path d="M${f(fx + 7)} ${f(q.w[1])}L${f(q.w[0])} ${f(q.w[1])}" stroke="${C.gear[0]}" stroke-width="1.4" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1])}L${f(b2[0])} ${f(b2[1])}" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`);
      B.push([fx - 2, top], [fx + 24, bot]);
    } else if (D.eq === 'bar' || D.eq === 'backbar' || D.eq === 'hipbar') {
      const c = D.eq === 'backbar' ? add(q.sho, mul(unit(sub(q.neck, q.sho)), 2)) : D.eq === 'hipbar' ? add(q.hip, mul(nrm(unit(sub(q.sho, q.hip))), 10)) : q.w;
      const lying = Math.abs(unit(sub(q.sho, q.hip))[1]) < .55, back = D.eq === 'backbar';
      const kN = back ? -1.7 : lying ? -2.1 : -1.15, kF = back ? 1.5 : lying ? 1.6 : 1.25, rN = back || lying ? 12.5 : 14;
      const near = add(c, mul(depth, kN)), farP = add(c, mul(depth, kF));
      G.push(plate(farP, rN * .78) + bar(add(near, mul(depth, -.25)), add(farP, mul(depth, .3))) + plate(near, rN));
      B.push(add(near, [-16, -16]), add(farP, [12, 12]));
    } else if (D.eq === 'db') {
      for (const w of [q.w2, q.w]) {
        const a = add(w, mul(uD, -5.4)), b = add(w, mul(uD, 5.4));
        G.push(`<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.line}" stroke-width="1.9" stroke-linecap="round"/>` + [a, b].map((p) => `<g transform="rotate(${f(deg(uD))} ${f(p[0])} ${f(p[1])})"><rect x="${f(p[0] - 1.8)}" y="${f(p[1] - 3.8)}" width="3.6" height="7.6" rx="1.2" fill="url(#mt)" stroke="${C.line}" stroke-width=".4"/><rect x="${f(p[0] - 1.2)}" y="${f(p[1] - 3.2)}" width=".8" height="6.4" fill="${C.hi}" opacity=".35"/></g>`).join(''));
      }
      B.push(add(q.w, [-9, -9]), add(q.w, [9, 9]));
    } else if (D.eq === 'kb') {
      const c = add(q.w, [0, 6]); G.push(`<circle cx="${f(c[0])}" cy="${f(c[1] + 2)}" r="6.4" fill="url(#mt)" stroke="${C.line}" stroke-width=".5"/><path d="M${f(c[0] - 3.6)} ${f(c[1] - 2)}q3.6 -6 7.2 0" fill="none" stroke="${C.line}" stroke-width="1.8"/>`);
      B.push(add(c, [-8, -8]), add(c, [8, 10]));
    } else if (D.eq === 'cablebar' || D.eq === 'cable') {
      const a = add(q.w, mul(uD, -7)), b = add(q.w, mul(uD, 7));
      G.push(`<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${C.gear[0]}" stroke-width="1.1" stroke-linecap="round"/>`);
    }
  }
  window.vxAnatomia = build;
})();
