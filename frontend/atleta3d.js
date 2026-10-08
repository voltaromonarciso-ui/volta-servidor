/* VOLTA · atleta 3D animado (personaje propio de Volta).
   - Cuerpo: base de MakeHuman (CC0) creada con .claude/skills/volta-atleta-3d; esqueleto de 53 huesos y zonas musculares.
   - Cada ejercicio usa un patrón de movimiento (window.vxPattern) con dos posturas: inicio (A) y final (B).
     Las posturas se escriben como direcciones de cada segmento (brazo, antebrazo, muslo…) y se aplican a los huesos.
   - El músculo trabajado brilla en verde Volta; los secundarios, más suaves. Una línea marca el recorrido completo.
   - Se carga solo al abrir la ficha de un ejercicio. Si el móvil no tiene WebGL o falla la carga, se queda la animación 2D. */
(function () {
  'use strict';
  if (typeof EX === 'undefined') return;

  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
  const MODEL_URL = 'assets/models/atleta.bin'; // GLB comprimido con deflate
  const ZONES = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazo', 'Cuádriceps', 'Isquiosurales', 'Glúteos', 'Gemelos', 'Core', 'Trapecio', 'Aductores', 'Abductores', 'Lumbar'];

  // ── Posturas ──
  // Vectores [lado, arriba, delante] en el marco del deportista. En brazos y piernas «lado» es hacia fuera (se refleja
  // en el lado derecho); en tronco y pelvis «lado» es hacia su izquierda.
  const STAND = {
    pel: { u: [0, 1, 0], f: [0, 0, 1] }, ground: true, sp: [0, 1, .04], hd: [0, 1, .12],
    ua: [.12, -1, 0], fa: [.06, -1, .12], hn: null, th: [.05, -1, 0], sh: [.01, -1, -.03], ft: [0, -.25, 1], grip: 0,
  };
  const S = (o) => Object.assign({}, STAND, o, { pel: Object.assign({}, STAND.pel, o.pel) });
  const LIE = { pel: { u: [0, 0, -1], f: [0, 1, 0], p: [0, .62, 0] }, ground: false, sp: [0, .04, -1], hd: [0, .25, -1] }; // boca arriba, cabeza hacia atrás
  const lie = (o) => S(Object.assign({}, LIE, o));
  const BENCH_LEGS = { th: [.22, -.15, 1], sh: [.12, -1, .05], ft: [0, -.2, 1] };
  const PRONE = { pel: { u: [0, 0, -1], f: [0, -1, 0], p: [0, .14, 0] }, ground: false, sp: [0, -.02, -1], hd: [0, .25, -1] };

  const PATS = {
    bench: { A: lie(Object.assign({ ua: [.55, 1, 0], fa: [.05, 1, 0], grip: 1, pm: [0, 0, 1] }, BENCH_LEGS)), B: lie(Object.assign({ ua: [.85, -.5, .2], fa: [0, 1, .05], grip: 1, pm: [0, 0, 1] }, BENCH_LEGS)), props: ['bench'], eq: 'bar', fx: 'bar' },
    incline: { A: S({ pel: { u: [0, .55, -.83], f: [0, .83, .55], p: [0, .66, 0] }, ground: false, sp: [0, .7, -.7], hd: [0, .85, -.4], ua: [.5, 1, .25], fa: [.05, 1, .1], grip: 1, th: [.2, 0, 1], sh: [.1, -1, 0] }),
      B: S({ pel: { u: [0, .55, -.83], f: [0, .83, .55], p: [0, .66, 0] }, ground: false, sp: [0, .7, -.7], hd: [0, .85, -.4], ua: [.95, .05, -.15], fa: [0, 1, .2], grip: 1, th: [.2, 0, 1], sh: [.1, -1, 0] }), props: ['incline'], eq: 'bar', fx: 'bar' },
    fly: { A: lie(Object.assign({ ua: [.3, 1, 0], fa: [.15, 1, 0], grip: 1 }, BENCH_LEGS)), B: lie(Object.assign({ ua: [1, -.2, 0], fa: [1, .25, 0], grip: 1 }, BENCH_LEGS)), props: ['bench'], eq: 'db', fx: 'hand' },
    pushup: { A: S({ pel: { u: [0, .3, -1], f: [0, -1, .3], p: [0, .5, 0] }, ground: false, sp: [0, .3, -1], hd: [0, .2, -1], ua: [.22, -1, -.05], fa: [.05, -1, 0], pm: [0, -1, 0], th: [.05, -.3, 1], sh: [.02, -.3, 1], ft: [0, -1, .1] }),
      B: S({ pel: { u: [0, .12, -1], f: [0, -1, .12], p: [0, .26, 0] }, ground: false, sp: [0, .1, -1], hd: [0, .12, -1], ua: [.65, .55, .5], fa: [.05, -1, -.1], pm: [0, -1, 0], th: [.05, -.12, 1], sh: [.02, -.12, 1], ft: [0, -1, .1] }), props: [], eq: '', fx: 'chest' },
    dip: { A: S({ ground: false, pel: { u: [0, 1, .05], f: [0, -.05, 1], p: [0, 1.3, 0] }, sp: [0, 1, .15], ua: [.08, -1, .05], fa: [.05, -1, .02], th: [.05, -.7, .3], sh: [0, -.7, -.7] }),
      B: S({ ground: false, pel: { u: [0, 1, .2], f: [0, -.2, 1], p: [0, 1.05, 0] }, sp: [0, 1, .4], ua: [.1, -.25, -1], fa: [.04, -1, .08], th: [.05, -.7, .3], sh: [0, -.7, -.7] }), props: ['dipbar'], eq: '', fx: 'chest' },
    ohp: { A: S({ ua: [.55, -.3, .55], fa: [.05, 1, -.05], grip: 1, pm: [0, 0, 1] }), B: S({ ua: [.12, 1, .05], fa: [.05, 1, .05], grip: 1, pm: [0, 0, 1] }), props: [], eq: 'bar', fx: 'bar' },
    lateral: { A: S({ ua: [.2, -1, .08], fa: [.15, -1, .25], grip: 1, pm: [-1, 0, 0] }), B: S({ ua: [1, .02, .1], fa: [1, .12, .2], grip: 1, pm: [0, -1, 0] }), props: [], eq: 'db', fx: 'hand' },
    front: { A: S({ ua: [.08, -1, .1], fa: [.04, -1, .2], grip: 1, pm: [0, 0, -1] }), B: S({ ua: [.12, .05, 1], fa: [.1, .1, 1], grip: 1, pm: [0, -1, 0] }), props: [], eq: 'db', fx: 'hand' },
    reardelt: { A: S({ pel: { u: [0, .7, .7], f: [0, -.7, .7] }, sp: [0, .45, .9], hd: [0, .2, 1], ua: [.15, -1, .1], fa: [.1, -1, .15], th: [.05, -1, -.15], sh: [.01, -1, .1], grip: 1 }),
      B: S({ pel: { u: [0, .7, .7], f: [0, -.7, .7] }, sp: [0, .45, .9], hd: [0, .2, 1], ua: [1, .05, -.05], fa: [1, -.2, 0], th: [.05, -1, -.15], sh: [.01, -1, .1], grip: 1 }), props: [], eq: 'db', fx: 'hand' },
    shrug: { A: S({ ua: [.12, -1, 0], fa: [.06, -1, .05], grip: 1, pm: [-1, 0, 0] }), B: S({ ua: [.12, -1, 0], fa: [.06, -1, .05], grip: 1, pm: [-1, 0, 0], shr: 1 }), props: [], eq: 'db', fx: 'hand' },
    squat: { A: S({ ua: [.55, -.75, -.4], fa: [-.15, .85, .1], grip: 1, th: [.14, -1, 0], sh: [.02, -1, -.02] }),
      B: S({ pel: { u: [0, .9, .45], f: [0, -.45, .9] }, sp: [0, .8, .65], hd: [0, .6, .8], ua: [.55, -.5, -.7], fa: [-.15, .9, .3], grip: 1, th: [.32, -.12, 1], sh: [.12, -1, .38] }), props: [], eq: 'backbar', fx: 'hip' },
    lunge: { A: S({ grip: 1, ua: [.14, -1, 0], fa: [.06, -1, .05], th: [.08, -1, .25], sh: [.02, -1, 0], thR: [.08, -1, -.3], shR: [.02, -1, -.1] }),
      B: S({ grip: 1, ua: [.14, -1, 0], fa: [.06, -1, .05], th: [.08, -.15, 1], sh: [.02, -1, .05], thR: [.08, -1, -.25], shR: [.02, -.15, -1], ftR: [0, -1, .2] }), props: [], eq: 'db', fx: 'hip' },
    hinge: { A: S({ grip: 1, pm: [0, 0, -1], ua: [.08, -1, 0], fa: [.04, -1, .02] }),
      B: S({ pel: { u: [0, .45, .9], f: [0, -.9, .45] }, sp: [0, .35, 1], hd: [0, .1, 1], grip: 1, pm: [0, 0, -1], ua: [.08, -1, .02], fa: [.04, -1, 0], th: [.05, -1, -.25], sh: [.01, -1, .1] }), props: [], eq: 'bar', fx: 'bar' },
    row: { A: S({ pel: { u: [0, .55, .85], f: [0, -.85, .55] }, sp: [0, .4, 1], hd: [0, .25, 1], grip: 1, pm: [0, 0, -1], ua: [.1, -1, .08], fa: [.04, -1, 0], th: [.06, -1, -.3], sh: [.01, -1, .15] }),
      B: S({ pel: { u: [0, .55, .85], f: [0, -.85, .55] }, sp: [0, .4, 1], hd: [0, .25, 1], grip: 1, pm: [0, 0, -1], ua: [.25, -.1, -1], fa: [.05, -1, .25], th: [.06, -1, -.3], sh: [.01, -1, .15] }), props: [], eq: 'bar', fx: 'bar' },
    pulldown: { A: S({ ground: false, pel: { u: [0, 1, -.05], f: [0, .05, 1], p: [0, .62, 0] }, sp: [0, 1, -.15], ua: [.45, 1, .1], fa: [.15, 1, 0], grip: 1, th: [.12, 0, 1], sh: [.05, -1, 0] }),
      B: S({ ground: false, pel: { u: [0, 1, -.05], f: [0, .05, 1], p: [0, .62, 0] }, sp: [0, 1, -.25], ua: [.75, -.6, -.15], fa: [.05, 1, .1], grip: 1, th: [.12, 0, 1], sh: [.05, -1, 0] }), props: ['seat', 'cabletop'], eq: 'cablebar', fx: 'bar' },
    pullup: { A: S({ ground: false, pel: { p: [0, 1.05, 0] }, ua: [.4, 1, .05], fa: [.12, 1, 0], grip: 1, th: [.04, -1, .12], sh: [.01, -1, -.35] }),
      B: S({ ground: false, pel: { p: [0, 1.48, 0], u: [0, 1, .1], f: [0, -.1, 1] }, sp: [0, 1, -.08], ua: [.8, -.55, -.1], fa: [.1, 1, .05], grip: 1, th: [.04, -1, .2], sh: [.01, -1, -.45] }), props: ['highbar'], eq: '', fx: 'chest' },
    curl: { A: S({ ua: [.08, -1, .04], fa: [.05, -1, .1], grip: 1, pm: [0, 0, 1] }), B: S({ ua: [.08, -1, .1], fa: [.03, .55, 1], grip: 1, pm: [0, .6, -.8] }), props: [], eq: 'db', fx: 'hand' },
    pushdown: { A: S({ sp: [0, 1, .15], ua: [.08, -1, .12], fa: [.04, .05, 1], grip: 1 }), B: S({ sp: [0, 1, .15], ua: [.08, -1, .1], fa: [.03, -1, .1], grip: 1 }), props: ['cabletop'], eq: 'cablebar', fx: 'hand' },
    overhead: { A: S({ ua: [.1, 1, .05], fa: [-.25, -.8, -.4], grip: 1 }), B: S({ ua: [.1, 1, .05], fa: [.04, 1, .05], grip: 1 }), props: [], eq: 'db1', fx: 'hand' },
    skull: { A: lie(Object.assign({ ua: [.15, 1, -.2], fa: [.05, 1, 0], grip: 1 }, BENCH_LEGS)), B: lie(Object.assign({ ua: [.15, 1, -.25], fa: [.05, -.35, -1], grip: 1 }, BENCH_LEGS)), props: ['bench'], eq: 'bar', fx: 'bar' },
    legext: { A: S({ ground: false, pel: { u: [0, 1, -.08], f: [0, .08, 1], p: [0, .62, 0] }, sp: [0, 1, -.1], ua: [.35, -1, -.1], fa: [.05, -.3, 1], grip: 1, th: [.08, 0, 1], sh: [.03, -1, -.1] }),
      B: S({ ground: false, pel: { u: [0, 1, -.08], f: [0, .08, 1], p: [0, .62, 0] }, sp: [0, 1, -.1], ua: [.35, -1, -.1], fa: [.05, -.3, 1], grip: 1, th: [.08, .1, 1], sh: [.03, .12, 1], ft: [0, .6, .8] }), props: ['seat'], eq: '', fx: 'foot' },
    legcurl: { A: S(Object.assign({}, PRONE, { pel: { u: [0, 0, -1], f: [0, -1, 0], p: [0, .7, 0] }, ua: [.35, -.2, -1], fa: [.1, -1, -.2], th: [.06, 0, 1], sh: [.02, 0, 1], ft: [0, -1, .1] })),
      B: S(Object.assign({}, PRONE, { pel: { u: [0, 0, -1], f: [0, -1, 0], p: [0, .7, 0] }, ua: [.35, -.2, -1], fa: [.1, -1, -.2], th: [.06, .05, 1], sh: [.02, 1, -.1], ft: [0, .1, -1] })), props: ['benchhigh'], eq: '', fx: 'foot' },
    legpress: { A: S({ ground: false, pel: { u: [0, .7, -.7], f: [0, .7, .7], p: [0, .55, 0] }, sp: [0, .7, -.7], hd: [0, .8, -.3], ua: [.35, -.6, .2], fa: [.05, -.3, 1], th: [.18, 1, .6], sh: [.08, -.75, .65], ft: [0, .6, .3] }),
      B: S({ ground: false, pel: { u: [0, .7, -.7], f: [0, .7, .7], p: [0, .55, 0] }, sp: [0, .7, -.7], hd: [0, .8, -.3], ua: [.35, -.6, .2], fa: [.05, -.3, 1], th: [.14, .6, 1], sh: [.06, .55, 1], ft: [0, 1, .1] }), props: ['legpress'], eq: '', fx: 'foot' },
    thrust: { A: S({ ground: false, pel: { u: [0, .2, -1], f: [0, 1, .2], p: [0, .3, 0] }, sp: [0, .45, -.9], hd: [0, .7, -.6], ua: [.6, -.35, -.2], fa: [.05, -.2, 1], grip: 1, th: [.16, .55, .85], sh: [.06, -1, .05] }),
      B: S({ ground: false, pel: { u: [0, 0, -1], f: [0, 1, 0], p: [0, .5, 0] }, sp: [0, .1, -1], hd: [0, .7, -.6], ua: [.6, -.35, -.2], fa: [.05, -.2, 1], grip: 1, th: [.16, 0, 1], sh: [.06, -1, .05] }), props: ['benchlow'], eq: 'hipbar', fx: 'hip' },
    bridge: { A: S({ ground: false, pel: { u: [0, 0, -1], f: [0, 1, 0], p: [0, .12, 0] }, sp: [0, .02, -1], hd: [0, .15, -1], ua: [.25, 0, 1], fa: [.1, 0, 1], th: [.12, .5, .85], sh: [.05, -1, .1] }),
      B: S({ ground: false, pel: { u: [0, -.35, -1], f: [0, 1, -.35], p: [0, .38, 0] }, sp: [0, -.25, -1], hd: [0, .15, -1], ua: [.25, 0, 1], fa: [.1, 0, 1], th: [.12, .08, 1], sh: [.05, -1, .1] }), props: ['mat'], eq: '', fx: 'hip' },
    calf: { A: S({ grip: 1, ua: [.14, -1, 0], fa: [.06, -1, .05], ft: [0, -.45, 1] }), B: S({ grip: 1, ua: [.14, -1, 0], fa: [.06, -1, .05], ft: [0, -1.4, 1], tip: 1 }), props: ['step'], eq: 'db', fx: 'hip' },
    plank: { A: S(Object.assign({}, PRONE, { pel: { u: [0, .05, -1], f: [0, -1, .05], p: [0, .38, 0] }, sp: [0, .04, -1], ua: [.2, -1, 0], fa: [-.1, 0, -1], th: [.05, -.07, 1], sh: [.02, -.07, 1], ft: [0, -1, .15] })),
      B: S(Object.assign({}, PRONE, { pel: { u: [0, .05, -1], f: [0, -1, .05], p: [0, .39, 0] }, sp: [0, .04, -1], ua: [.2, -1, 0], fa: [-.1, 0, -1], th: [.05, -.07, 1], sh: [.02, -.07, 1], ft: [0, -1, .15] })), props: ['mat'], eq: '', fx: 'hip' },
    crunch: { A: S({ ground: false, pel: { u: [0, 0, -1], f: [0, 1, 0], p: [0, .12, 0] }, sp: [0, .05, -1], hd: [0, .2, -1], ua: [.5, .5, -.7], fa: [-.5, .4, .2], th: [.12, .65, .75], sh: [.05, -1, .15] }),
      B: S({ ground: false, pel: { u: [0, .1, -1], f: [0, 1, .1], p: [0, .12, 0] }, sp: [0, .8, -.6], hd: [0, .9, .1], ua: [.5, .9, .1], fa: [-.5, .3, .5], th: [.12, .65, .75], sh: [.05, -1, .15] }), props: ['mat'], eq: '', fx: 'chest' },
    legraise: { A: S({ ground: false, pel: { p: [0, 1.1, 0] }, ua: [.4, 1, .05], fa: [.12, 1, 0], grip: 1 }), B: S({ ground: false, pel: { p: [0, 1.1, 0], u: [0, 1, -.15], f: [0, .15, 1] }, sp: [0, 1, -.1], ua: [.4, 1, .05], fa: [.12, 1, 0], grip: 1, th: [.06, .05, 1], sh: [.02, .05, 1] }), props: ['highbar'], eq: '', fx: 'foot' },
    twist: { A: S({ ground: false, pel: { u: [0, .6, -.8], f: [0, .8, .6], p: [0, .13, 0] }, sp: [-.35, .7, -.25], hd: [-.3, .8, .2], ua: [-.3, -.4, 1], fa: [-.6, .1, .7], uaR: [.6, -.3, .8], faR: [.6, .2, .6], grip: 1, th: [.12, .6, .8], sh: [.05, -.3, 1] }),
      B: S({ ground: false, pel: { u: [0, .6, -.8], f: [0, .8, .6], p: [0, .13, 0] }, sp: [.35, .7, -.25], hd: [.3, .8, .2], ua: [.6, -.3, .8], fa: [.6, .2, .6], uaR: [-.3, -.4, 1], faR: [-.6, .1, .7], grip: 1, th: [.12, .6, .8], sh: [.05, -.3, 1] }), props: ['mat'], eq: '', fx: 'hand' },
    carry: { A: S({ grip: 1, ua: [.14, -1, -.1], fa: [.06, -1, 0], th: [.05, -1, .3], sh: [.01, -1, .05], thR: [.05, -1, -.25], shR: [.01, -1, -.15] }),
      B: S({ grip: 1, ua: [.14, -1, .1], fa: [.06, -1, .05], th: [.05, -1, -.25], sh: [.01, -1, -.15], thR: [.05, -1, .3], shR: [.01, -1, .05] }), props: [], eq: 'db', fx: 'hip' },
    jump: { A: S({ pel: { u: [0, .9, .4], f: [0, -.4, .9] }, sp: [0, .85, .5], ua: [.15, -.5, -1], fa: [.1, -1, 0], th: [.15, -.3, 1], sh: [.05, -1, .4] }),
      B: S({ ground: false, pel: { p: [0, 1.4, 0] }, ua: [.25, 1, .2], fa: [.1, 1, .1], th: [.05, -1, .05], sh: [.01, -1, -.1], ft: [0, -1.2, .5] }), props: [], eq: '', fx: 'hip' },
    swing: { A: S({ pel: { u: [0, .55, .85], f: [0, -.85, .55] }, sp: [0, .3, 1], hd: [0, .1, 1], grip: 1, ua: [.05, -.6, -.8], fa: [0, -.4, -1], th: [.15, -1, -.3], sh: [.05, -1, .15] }),
      B: S({ grip: 1, ua: [.05, .02, 1], fa: [.03, .05, 1] }), props: [], eq: 'kb', fx: 'hand' },
    wrist: { A: S({ ground: false, pel: { u: [0, 1, .15], f: [0, -.15, 1], p: [0, .62, 0] }, sp: [0, 1, .5], hd: [0, .7, .7], ua: [.15, -.7, .7], fa: [.05, -.05, 1], hn: [0, -.6, .8], grip: 1, th: [.12, 0, 1], sh: [.05, -1, 0] }),
      B: S({ ground: false, pel: { u: [0, 1, .15], f: [0, -.15, 1], p: [0, .62, 0] }, sp: [0, 1, .5], hd: [0, .7, .7], ua: [.15, -.7, .7], fa: [.05, -.05, 1], hn: [0, .6, .8], grip: 1, th: [.12, 0, 1], sh: [.05, -1, 0] }), props: ['seat'], eq: 'db', fx: 'hand' },
    sidelie: { A: S({ ground: false, pel: { u: [-1, 0, 0], f: [0, 0, 1], p: [0, .17, 0] }, sp: [-1, .02, 0], hd: [-1, .1, 0], uaR: [-.2, 1, .2], faR: [.6, .1, .6], ua: [-.1, -.3, 1], fa: [.4, -.3, .5], th: [-.95, -.1, .05], sh: [-.95, -.15, .05], thR: [.95, -.05, .05], shR: [.95, -.05, .05] }),
      B: S({ ground: false, pel: { u: [-1, 0, 0], f: [0, 0, 1], p: [0, .17, 0] }, sp: [-1, .02, 0], hd: [-1, .1, 0], uaR: [-.2, 1, .2], faR: [.6, .1, .6], ua: [-.1, -.3, 1], fa: [.4, -.3, .5], th: [-.75, .65, .05], sh: [-.75, .65, .05], thR: [.95, -.05, .05], shR: [.95, -.05, .05] }), props: ['mat'], eq: '', fx: 'foot' },
    prone: { A: S(Object.assign({}, PRONE, { ua: [.3, 0, -1], fa: [.15, 0, -1], th: [.06, 0, 1], sh: [.02, 0, 1], ft: [0, -1, .2] })),
      B: S(Object.assign({}, PRONE, { sp: [0, .25, -1], hd: [0, .4, -1], ua: [.3, .35, -1], fa: [.15, .35, -1], th: [.06, .3, 1], sh: [.02, .3, 1], ft: [0, -1, .2] })), props: ['mat'], eq: '', fx: 'chest' },
    backext: { A: S({ ground: false, pel: { u: [0, -.75, -.65], f: [0, -.65, .75], p: [0, .92, 0] }, sp: [0, -.95, -.25], hd: [0, -1, 0], ua: [.25, .2, -1], fa: [-.2, .4, -1], th: [.06, -.65, .75], sh: [.02, -.65, .75], ft: [0, -.7, -.7] }),
      B: S({ ground: false, pel: { u: [0, -.1, -1], f: [0, -1, .1], p: [0, .92, 0] }, sp: [0, -.05, -1], hd: [0, .1, -1], ua: [.25, .9, -.3], fa: [-.2, .4, -1], th: [.06, -.65, .75], sh: [.02, -.65, .75], ft: [0, -.7, -.7] }), props: ['roman'], eq: '', fx: 'chest' },
    hang: { A: S({ ground: false, pel: { p: [0, 1.1, 0] }, ua: [.4, 1, .05], fa: [.12, 1, 0], grip: 1, th: [.04, -1, .06], sh: [.01, -1, -.15] }),
      B: S({ ground: false, pel: { p: [0, 1.14, 0] }, ua: [.4, 1, .05], fa: [.12, 1, 0], grip: 1, th: [.04, -1, .06], sh: [.01, -1, -.15] }), props: ['highbar'], eq: '', fx: 'chest' },
  };
  PATS.cfly = {
    A: S({ sp: [0, 1, .18], ua: [1, .35, -.05], fa: [1, .3, .15], grip: 1, pm: [0, 0, 1], th: [.06, -1, .1], sh: [.02, -1, -.05], thR: [.06, -1, -.15], shR: [.02, -1, -.1] }),
    B: S({ sp: [0, 1, .18], ua: [.25, -.45, 1], fa: [-.15, -.4, 1], grip: 1, pm: [-1, 0, 0], th: [.06, -1, .1], sh: [.02, -1, -.05], thR: [.06, -1, -.15], shR: [.02, -1, -.1] }), props: [], eq: '', fx: 'hand',
  };
  const CAM = { cfly: 25, // giro de la cámara (grados) por patrón: 3/4 o de lado según dónde se vea mejor el recorrido
    bench: 38, incline: 45, fly: 30, skull: 45, pushup: 72, dip: 55, pullup: 28, hang: 28, legraise: 60, pulldown: 40,
    lateral: 15, front: 60, reardelt: 40, curl: 55, pushdown: 60, overhead: 65, row: 70, hinge: 70, swing: 75, squat: 50, lunge: 72,
    legext: 70, legcurl: 75, legpress: 75, thrust: 70, bridge: 70, crunch: 72, twist: 20, plank: 70, prone: 72, backext: 80, sidelie: 10,
    calf: 65, carry: 45, jump: 40, shrug: 30, wrist: 55, ohp: 35,
  };

  // ── Carga de dependencias ──
  const loadJS = (u) => new Promise((ok, ko) => { if ([...document.scripts].some((s) => s.src === u)) return ok(); const s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  let modelP = null;
  function loadModel() {
    if (modelP) return modelP;
    modelP = (async () => {
      if (!window.THREE) await loadJS(THREE_URL);
      if (!THREE.GLTFLoader) await loadJS(GLTF_URL);
      const raw = await fetch(MODEL_URL).then((r) => { if (!r.ok) throw new Error('atleta ' + r.status); return r.arrayBuffer(); });
      const ab = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer();
      return new Promise((ok, ko) => new THREE.GLTFLoader().parse(ab, '', ok, ko));
    })();
    modelP.catch(() => { modelP = null; });
    return modelP;
  }
  const webgl = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } };

  // ── Escena ──
  function build(el, i, gltf) {
    const T = THREE, e = EX[i];
    let pat = (window.vxPattern && window.vxPattern(e)) || 'curl';
    if (pat === 'fly' && e[4] === 'Polea') pat = 'cfly';
    if (!PATS[pat]) pat = 'curl';
    const P = PATS[pat];
    const W = () => Math.max(200, el.clientWidth), H = () => Math.round(W() * .9);
    const r = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(W(), H(), false);
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    r.domElement.className = 'vx3-cv'; r.domElement.setAttribute('aria-hidden', 'true');
    const sc = new T.Scene();
    const cam = new T.PerspectiveCamera(30, W() / H(), .05, 40);
    sc.add(new T.HemisphereLight(0xe6efe9, 0x1c2328, .75));
    const key = new T.DirectionalLight(0xffffff, 1.55); key.position.set(2.2, 4.2, 3.2); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.8, bottom: -1.2, near: .5, far: 12 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02;
    sc.add(key);
    const fill = new T.DirectionalLight(0xbfd4ff, .35); fill.position.set(-3, 1.5, 2); sc.add(fill);
    const rim = new T.DirectionalLight(0x9dff2e, .9); rim.position.set(-2.2, 2.6, -3.2); sc.add(rim);

    // Plataforma Volta: disco oscuro con aro verde
    const floor = new T.Mesh(new T.CircleGeometry(1.5, 64), new T.ShadowMaterial({ opacity: .42 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
    const ring = new T.Mesh(new T.RingGeometry(1.32, 1.36, 96), new T.MeshBasicMaterial({ color: 0x9dff2e, transparent: true, opacity: .55 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .002; sc.add(ring);
    const discM = new T.MeshStandardMaterial({ color: 0x10161a, roughness: .9, transparent: true, opacity: .7 }); discM.color.convertSRGBToLinear();
    const disc = new T.Mesh(new T.CircleGeometry(1.32, 64), discM); disc.rotation.x = -Math.PI / 2; disc.position.y = .001; disc.receiveShadow = true; sc.add(disc);

    // Personaje (clon con su propio esqueleto)
    const root = gltf.scene.clone(true);
    const skinned = []; root.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
    // clone() de r128 no re-enlaza los huesos: se hace a mano
    const bonesByName = {}; root.traverse((o) => { if (o.isBone) bonesByName[o.name] = o; });
    gltf.scene.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      const c = skinned.find((s) => s.name === o.name); if (!c) return;
      c.bind(new T.Skeleton(o.skeleton.bones.map((b) => bonesByName[b.name]), o.skeleton.boneInverses), o.bindMatrix);
    });
    const hi = new Float32Array(16);
    const tgt = ZONES.indexOf(e[1]);
    if (tgt >= 0) hi[tgt] = 1;
    const XDx = typeof XD === 'object' && XD[e[0]];
    (XDx && XDx.sec || []).forEach((s) => { const k = ZONES.indexOf(String(s).split(' ')[0].replace(/,$/, '')); if (k >= 0 && !hi[k]) hi[k] = .32; });
    const uni = { uHi: { value: hi }, uT: { value: 0 } };
    const mat = new T.MeshStandardMaterial({ color: 0x6b7579, roughness: .5, metalness: .06, skinning: true });
    mat.onBeforeCompile = (s) => {
      s.uniforms.uHi = uni.uHi; s.uniforms.uT = uni.uT;
      s.vertexShader = 'attribute float _muscle;attribute float _paint;uniform float uHi[16];varying float vI;varying float vP;\n' +
        s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nint mi=int(floor(_muscle+.5));vI=0.;for(int k=0;k<16;k++){if(k==mi)vI=uHi[k];}vP=_paint;');
      s.fragmentShader = 'uniform float uT;varying float vI;varying float vP;\n' +
        s.fragmentShader
          .replace('#include <color_fragment>', '#include <color_fragment>\n' +
            'float sh=step(.5,vP)*(1.-step(1.5,vP));float so=step(1.5,vP)*(1.-step(2.5,vP));float ey=step(2.5,vP);\n' +
            'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.045,.05,.055),sh);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.07,.075,.08),so);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.02),ey);\n' +
            'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.86,.12),clamp(vI,0.,1.)*.9);')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.36,.85,.08)*vI*(.22+.16*sin(uT*3.2));');
    };
    mat.color.convertSRGBToLinear();
    skinned.forEach((m) => { m.material = mat; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; });
    sc.add(root);
    const B = bonesByName;
    const rest = {}; Object.keys(B).forEach((k) => { rest[k] = B[k].quaternion.clone(); });
    const rootRest = B.Root.position.clone();
    root.updateMatrixWorld(true);
    const rootWQ = B.Root.getWorldQuaternion(new T.Quaternion()), rigWQ = B.Root.parent.getWorldQuaternion(new T.Quaternion());
    const wp = (b) => b.getWorldPosition(new T.Vector3());
    const pelRest = wp(B.pelvis).sub(wp(B.Root));

    // ── Aplicar una postura ──
    const vec = (a, side) => new T.Vector3(side * a[0], a[1], a[2]).normalize(); // marco del deportista → mundo (mirando a +z)
    const tmpQ = new T.Quaternion(), tmpQ2 = new T.Quaternion();
    function aim(b, child, dir) {
      b.updateMatrixWorld(true);
      const cur = wp(child).sub(wp(b)).normalize();
      tmpQ.setFromUnitVectors(cur, dir);
      const bw = b.getWorldQuaternion(new T.Quaternion());
      const pw = b.parent.getWorldQuaternion(new T.Quaternion());
      b.quaternion.copy(pw.invert().multiply(tmpQ.multiply(bw)));
      b.updateMatrixWorld(true);
    }
    function lerpPose(a, b, t) {
      const o = {};
      Object.keys(Object.assign({}, a, b)).forEach((k) => {
        const x = a[k] !== undefined ? a[k] : b[k], y = b[k] !== undefined ? b[k] : a[k];
        if (Array.isArray(x)) o[k] = x.map((v, j) => v + (y[j] - v) * t);
        else if (typeof x === 'number') o[k] = x + (y - x) * t;
        else if (x && typeof x === 'object') o[k] = lerpPose(x, y, t);
        else o[k] = t < .5 ? x : y;
      });
      return o;
    }
    function pose(p) {
      Object.keys(rest).forEach((k) => B[k].quaternion.copy(rest[k]));
      B.Root.position.copy(rootRest);
      // pelvis: base (izquierda, arriba, delante)
      const u = vec(p.pel.u, 1), f0 = vec(p.pel.f, 1), l = new T.Vector3().crossVectors(u, f0).normalize(), f = new T.Vector3().crossVectors(l, u).normalize();
      const m = new T.Matrix4().makeBasis(l, u, f);
      const qb = new T.Quaternion().setFromRotationMatrix(m);
      B.Root.quaternion.copy(rigWQ.clone().invert().multiply(qb.multiply(rootWQ)));
      root.updateMatrixWorld(true);
      const sp = vec(p.sp, 1);
      // la columna se reparte: cada vértebra apunta un poco más hacia la dirección final
      [['spine_01', 'spine_02', .45], ['spine_02', 'spine_03', .75], ['spine_03', 'neck_01', 1]].forEach(([a, c, k]) => aim(B[a], B[c], u.clone().lerp(sp, k).normalize()));
      aim(B.neck_01, B.head, vec(p.hd, 1).lerp(sp, .35).normalize());
      [['l', 1], ['r', -1]].forEach(([s, sg]) => {
        const R = s === 'r';
        const g = (k) => (R && p[k + 'R']) || p[k];
        if (p.shr) { const c = B['clavicle_' + s]; c.updateMatrixWorld(true); const d0 = wp(B['upperarm_' + s]).sub(wp(c)).normalize(); aim(c, B['upperarm_' + s], d0.add(new T.Vector3(0, .38 * p.shr, 0)).normalize()); }
        aim(B['upperarm_' + s], B['lowerarm_' + s], vec(g('ua'), sg));
        aim(B['lowerarm_' + s], B['hand_' + s], vec(g('fa'), sg));
        aim(B['hand_' + s], B['middle_01_' + s], vec(g('hn') || g('fa'), sg));
        const pm = g('pm');
        if (pm) { // gira el antebrazo para que la palma mire hacia donde toca (prono, supino, neutro)
          const la = B['lowerarm_' + s], ax = wp(B['hand_' + s]).sub(wp(la)).normalize();
          const v1 = wp(B['index_01_' + s]).sub(wp(B['pinky_01_' + s])), v2 = wp(B['middle_01_' + s]).sub(wp(B['hand_' + s]));
          const n = new T.Vector3().crossVectors(v1, v2).multiplyScalar(R ? 1 : -1);
          const want = vec(pm, sg), pn = n.sub(ax.clone().multiplyScalar(n.dot(ax))).normalize(), pw2 = want.sub(ax.clone().multiplyScalar(want.dot(ax))).normalize();
          if (pn.lengthSq() > .1 && pw2.lengthSq() > .1) {
            const ang = Math.atan2(new T.Vector3().crossVectors(pn, pw2).dot(ax), pn.dot(pw2));
            const qa = new T.Quaternion().setFromAxisAngle(ax, ang), lw = la.getWorldQuaternion(new T.Quaternion()), pw = la.parent.getWorldQuaternion(new T.Quaternion());
            la.quaternion.copy(pw.invert().multiply(qa.multiply(lw))); la.updateMatrixWorld(true);
          }
        }
        aim(B['thigh_' + s], B['calf_' + s], vec(g('th'), sg));
        aim(B['calf_' + s], B['foot_' + s], vec(g('sh'), sg));
        aim(B['foot_' + s], B['ball_' + s], vec(g('ft'), sg));
        const gr = p.grip || 0;
        if (gr) ['index', 'middle', 'ring', 'pinky'].forEach((fn) => [1, 2, 3].forEach((n) => { const fb = B[fn + '_0' + n + '_' + s]; if (fb) fb.rotateX(gr * (n === 1 ? .9 : .8)); }));
        if (gr && B['thumb_02_' + s]) B['thumb_02_' + s].rotateX(gr * .5);
      });
      root.updateMatrixWorld(true);
      // posición: pelvis donde diga la postura, o pies en el suelo
      const pel = wp(B.pelvis);
      const want = p.pel.p ? new T.Vector3(p.pel.p[0], p.pel.p[1], p.pel.p[2]) : new T.Vector3(0, pel.y, 0);
      const d = want.sub(pel);
      B.Root.position.add(B.Root.parent.worldToLocal(wp(B.Root).add(d)).sub(B.Root.position));
      root.updateMatrixWorld(true);
      if (p.ground) {
        const ys = ['foot_l', 'foot_r', 'ball_l', 'ball_r'].map((k) => wp(B[k]).y - (k.startsWith('foot') ? .075 : .012));
        let lo = Math.min.apply(null, ys);
        if (p.tip) lo = Math.min(wp(B.ball_l).y, wp(B.ball_r).y) - .03; // de puntillas sobre el escalón
        const up = (p.tip ? .06 : 0) - lo;
        B.Root.position.add(B.Root.parent.worldToLocal(wp(B.Root).add(new T.Vector3(0, up, 0))).sub(B.Root.position));
        root.updateMatrixWorld(true);
      }
    }

    // ── Material deportivo y apoyos ──
    const steel = new T.MeshStandardMaterial({ color: 0xc9d1d6, roughness: .28, metalness: .9 });
    const dark = new T.MeshStandardMaterial({ color: 0x1d2328, roughness: .55, metalness: .35 });
    const pad = new T.MeshStandardMaterial({ color: 0x252b30, roughness: .78 });
    const accent = new T.MeshStandardMaterial({ color: 0x9dff2e, roughness: .4, emissive: 0x3d7a00, emissiveIntensity: .5 });
    const matM = new T.MeshStandardMaterial({ color: 0x1f2a24, roughness: .95 });
    [steel, dark, pad, accent, matM].forEach((m) => m.color.convertSRGBToLinear());
    const cyl = (r1, len, m, seg) => { const o = new T.Mesh(new T.CylinderGeometry(r1, r1, len, seg || 24), m); o.castShadow = true; return o; };
    const box = (x, y, z, m) => { const o = new T.Mesh(new T.BoxGeometry(x, y, z), m); o.castShadow = true; o.receiveShadow = true; return o; };
    const props = new T.Group(); sc.add(props);
    const at = (o, x, y, z) => { o.position.set(x, y, z); props.add(o); return o; };
    const leg = (x, z, top) => at(box(.05, top, .05, dark), x, top / 2, z);
    // Banco/almohadilla entre dos puntos (a la altura que toque, por debajo del cuerpo)
    const padSeg = (a, b, w, th) => { const len = a.distanceTo(b); const o = box(w, th, len, pad); o.position.copy(a).add(b).multiplyScalar(.5); o.lookAt(b); props.add(o); return o; };
    // Equipo según el ejercicio (no solo según el patrón)
    const q = String(e[4] || ''), nm = String(e[0] || '').toLowerCase();
    let eq = P.eq;
    if (/mancuerna/i.test(q)) eq = ['bar', 'backbar', 'hipbar', 'kb', 'cablebar'].includes(eq) ? 'db' : eq || 'db';
    else if (q === 'Barra') eq = eq === 'db' || eq === 'db1' || eq === 'kb' ? 'bar' : eq;
    else if (q === 'Kettlebell') eq = eq === 'kb' ? 'kb' : 'kb2';
    else if (q === 'Polea') eq = ['bar', 'cablebar', 'backbar'].includes(eq) ? 'cablebar' : 'cable';
    else if (q === 'Bandas') eq = 'band';
    else if (/peso corporal|barra de dominadas|máquina/i.test(q)) eq = '';
    if (/goblet/.test(nm)) eq = 'db1c';
    if (pat === 'calf' && q !== 'Mancuernas') eq = '';
    pose(P.A);
    const A0 = {}; ['head', 'neck_01', 'spine_03', 'spine_02', 'pelvis', 'hand_l', 'hand_r', 'ball_l', 'ball_r', 'foot_l', 'foot_r', 'calf_l', 'thigh_l', 'upperarm_l'].forEach((k) => { A0[k] = wp(B[k]); });
    const lo = (a, d) => a.clone().add(new T.Vector3(0, -d, 0));
    P.props.forEach((k) => {
      if (k === 'bench') { // tumbado: de la pelvis a los hombros, bajo la espalda
        const a = lo(A0.pelvis, .13).add(new T.Vector3(0, 0, .22)), b = lo(A0.spine_03, .13).add(new T.Vector3(0, 0, -.22)); a.y = b.y = Math.min(a.y, b.y);
        padSeg(a, b, .3, .07); leg(0, a.z - .08, a.y - .035); leg(0, b.z + .08, b.y - .035); at(box(.32, .015, .05, accent), 0, a.y - .045, a.z - .02);
      }
      if (k === 'benchhigh') { const a = lo(A0.calf_l, .1), b = lo(A0.spine_03, .1); a.x = b.x = 0; a.z += .05; a.y = b.y = Math.min(a.y, b.y); padSeg(a, b, .32, .07); leg(0, a.z - .1, a.y - .035); leg(0, b.z + .1, b.y - .035); }
      if (k === 'benchlow') { const c = lo(A0.spine_03, .1).add(new T.Vector3(0, 0, -.05)); at(box(1, .08, .3, pad), 0, c.y, c.z); leg(.4, c.z, c.y - .04); leg(-.4, c.z, c.y - .04); }
      if (k === 'incline') { const up = A0.neck_01.clone().sub(A0.pelvis).normalize(), bk = new T.Vector3(0, up.z, -up.y).multiplyScalar(-.13); const a = A0.pelvis.clone().add(bk), b = A0.head.clone().add(bk); padSeg(a, b, .3, .07); const s0 = lo(A0.pelvis, .12).add(new T.Vector3(0, 0, .2)); at(box(.32, .07, .36, pad), 0, s0.y, s0.z); leg(0, s0.z, s0.y - .035); leg(0, b.z, b.y - .1); }
      if (k === 'seat') { const s0 = lo(A0.pelvis, .12); at(box(.4, .07, .42, pad), 0, s0.y, s0.z + .04); leg(0, s0.z + .04, s0.y - .035); const bk = A0.spine_03.clone().add(new T.Vector3(0, -.05, -.15)); at(box(.4, .6, .07, pad), 0, bk.y, bk.z); }
      if (k === 'highbar') { const y = Math.max(A0.hand_l.y, A0.hand_r.y) + .03, z = A0.hand_l.z; const b = at(cyl(.016, 1.3, steel), 0, y, z); b.rotation.z = Math.PI / 2; at(cyl(.03, y, dark), .66, y / 2, z); at(cyl(.03, y, dark), -.66, y / 2, z); }
      if (k === 'dipbar') { [A0.hand_l, A0.hand_r].forEach((h) => { const y = h.y - .03; const b = at(cyl(.02, .7, steel), h.x * 1.05, y, h.z); b.rotation.x = Math.PI / 2; at(cyl(.025, y, dark), h.x * 1.05, y / 2, h.z + .3); at(cyl(.025, y, dark), h.x * 1.05, y / 2, h.z - .3); }); }
      if (k === 'step') { const z = (A0.ball_l.z + A0.foot_l.z) / 2 + .03; at(box(.7, .07, .32, dark), 0, .035, z); at(box(.72, .012, .34, accent), 0, .076, z); }
      if (k === 'mat') at(box(.75, .012, 1.95, matM), 0, .006, (A0.head.z + A0.ball_l.z) / 2);
      if (k === 'legpress') { const bk = A0.spine_02.clone().add(new T.Vector3(0, -.12, -.1)); padSeg(lo(A0.pelvis, .14), bk.clone().add(A0.neck_01.clone().sub(A0.pelvis).multiplyScalar(.45)), .42, .08); leg(0, A0.pelvis.z, A0.pelvis.y - .18); }
      if (k === 'roman') { const fr = A0.pelvis.clone().add(new T.Vector3(0, -.13, .08)); const pd = at(box(.4, .07, .3, pad), 0, fr.y, fr.z); pd.rotation.x = .75; leg(0, fr.z + .1, fr.y - .1); const an = A0.foot_l.clone(); at(cyl(.04, .4, pad), 0, an.y + .06, an.z - .02).rotation.z = Math.PI / 2; }
    });
    // Polea: dónde está el cable según el ejercicio
    let pulleys = [];
    if (eq === 'cablebar' || eq === 'cable' || P.props.includes('cabletop')) {
      const high = ['pushdown', 'pulldown', 'crunch', 'overhead'].includes(pat) || /alto a bajo|polea alta/.test(nm), face = pat === 'reardelt' && /face pull/.test(nm);
      const zc = pat === 'pulldown' ? A0.hand_l.z : pat === 'overhead' ? -.6 : .55;
      const p0 = face ? new T.Vector3(0, 1.62, .95) : high ? new T.Vector3(0, 2.2, zc) : new T.Vector3(0, .18, .75);
      pulleys = [p0];
      const tw = at(box(.14, 2.3, .14, dark), 0, 1.15, p0.z + (p0.z > 0 ? .12 : -.12)); tw.receiveShadow = true;
      at(cyl(.05, .04, steel), 0, p0.y, p0.z).rotation.x = Math.PI / 2;
    }
    if (pat === 'cfly') {
      const hy = /bajo a alto/.test(nm) ? .2 : 1.95;
      pulleys = [new T.Vector3(.95, hy, -.15), new T.Vector3(-.95, hy, -.15)];
      pulleys.forEach((p0) => { at(box(.12, 2.3, .12, dark), p0.x * 1.06, 1.15, p0.z); at(cyl(.05, .04, steel), p0.x, p0.y, p0.z).rotation.z = Math.PI / 2; });
    }
    if (q === 'Smith') [-.62, .62].forEach((x) => at(cyl(.022, 2.2, steel), x, 1.1, (A0.hand_l.z + A0.hand_r.z) / 2));
    // Material que se mueve con las manos
    const plate = (r) => { const o = cyl(r, .05, dark, 40); o.rotation.z = Math.PI / 2; return o; };
    let bar = null, dbs = [], kb = null, cables = [], sled = null;
    if (['bar', 'backbar', 'cablebar', 'hipbar'].includes(eq)) {
      bar = new T.Group();
      const shaft = cyl(.014, eq === 'cablebar' ? .55 : 1.9, steel); shaft.rotation.z = Math.PI / 2; bar.add(shaft);
      if (eq !== 'cablebar') [-.72, .72].forEach((x) => { const p1 = plate(.21); p1.position.x = x; bar.add(p1); const p2 = plate(.16); p2.position.x = x + Math.sign(x) * .055; bar.add(p2); const c1 = cyl(.035, .03, accent, 20); c1.rotation.z = Math.PI / 2; c1.position.x = x - Math.sign(x) * .045; bar.add(c1); });
      sc.add(bar);
    }
    const dumb = () => { const g = new T.Group(); const h = cyl(.016, .15, steel); h.rotation.z = Math.PI / 2; g.add(h); [-.095, .095].forEach((x) => { const hb = cyl(.058, .05, dark, 6); hb.rotation.z = Math.PI / 2; hb.position.x = x; g.add(hb); }); sc.add(g); return g; };
    const kbell = () => { const g = new T.Group(); const bl = new T.Mesh(new T.SphereGeometry(.095, 24, 16), dark); bl.castShadow = true; bl.position.y = -.12; g.add(bl); const hd = new T.Mesh(new T.TorusGeometry(.055, .012, 8, 24, Math.PI), steel); hd.position.y = -.03; g.add(hd); sc.add(g); return g; };
    if (eq === 'db') dbs = [dumb(), dumb()];
    if (eq === 'db1' || eq === 'db1c') dbs = [dumb()];
    if (eq === 'kb') kb = kbell();
    if (eq === 'kb2') dbs = [kbell(), kbell()].map((g) => (g.isKb = true, g));
    const lineM = new T.LineBasicMaterial({ color: 0xaab4ba }), bandM = new T.LineBasicMaterial({ color: 0x9dff2e });
    const mkLine = (m) => { const l = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), m); sc.add(l); return l; };
    if (pulleys.length) cables = pat === 'cfly' ? [mkLine(lineM), mkLine(lineM)] : [mkLine(lineM)];
    if (eq === 'band') cables = [mkLine(bandM), mkLine(bandM)];
    if (pat === 'legpress') { sled = new T.Group(); const pl = box(.62, .05, .55, steel); sled.add(pl); sc.add(sled); }
    const gripPt = (s) => { const h = wp(B['hand_' + s]), m = wp(B['middle_01_' + s]); return h.lerp(m, .75); };
    const handAx = (s) => wp(B['index_01_' + s]).sub(wp(B['pinky_01_' + s])).normalize();
    const X = new T.Vector3(1, 0, 0);
    function placeGear() {
      const L = gripPt('l'), R = gripPt('r'), M = L.clone().add(R).multiplyScalar(.5);
      if (bar) {
        if (eq === 'backbar') { bar.position.copy(wp(B.neck_01).lerp(wp(B.spine_03), .45)).add(new T.Vector3(0, 0, -.1)); bar.quaternion.identity(); }
        else if (eq === 'hipbar') { const c = wp(B.pelvis); bar.position.set(0, c.y + .14, c.z + .06); bar.quaternion.identity(); }
        else { bar.position.copy(M); bar.quaternion.setFromUnitVectors(X, L.clone().sub(R).normalize()); }
      }
      if (dbs.length === 2) [L, R].forEach((pt, j) => { const s = j ? 'r' : 'l'; dbs[j].position.copy(pt); if (dbs[j].isKb) dbs[j].quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), wp(B['hand_' + s]).sub(wp(B['lowerarm_' + s])).normalize()); else dbs[j].quaternion.setFromUnitVectors(X, handAx(s)); });
      if (dbs.length === 1) { dbs[0].position.copy(M); if (eq === 'db1c') { dbs[0].position.y -= .02; dbs[0].quaternion.setFromUnitVectors(X, new T.Vector3(0, 1, 0)); } else dbs[0].quaternion.setFromUnitVectors(X, wp(B.hand_l).sub(wp(B.lowerarm_l)).normalize()); }
      if (kb) { kb.position.copy(M); kb.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), wp(B.hand_l).sub(wp(B.lowerarm_l)).normalize()); }
      if (cables.length) {
        if (eq === 'band') { const fl = wp(B.ball_l), fr = wp(B.ball_r); cables[0].geometry.setFromPoints([fl, L]); cables[1].geometry.setFromPoints([fr, R]); }
        else if (pat === 'cfly') { cables[0].geometry.setFromPoints([pulleys[0], L]); cables[1].geometry.setFromPoints([pulleys[1], R]); }
        else cables[0].geometry.setFromPoints([pulleys[0], bar && eq === 'cablebar' ? bar.position : (pat === 'legext' || pat === 'legcurl' ? wp(B.foot_l) : M)]);
      }
      if (sled) { const f = wp(B.ball_l).lerp(wp(B.ball_r), .5).lerp(wp(B.foot_l).lerp(wp(B.foot_r), .5), .5); const dir = f.clone().sub(wp(B.pelvis)).normalize(); sled.position.copy(f.add(dir.clone().multiplyScalar(.06))); sled.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.negate()); }
    }

    // ── Recorrido: línea del punto que más se mueve ──
    const fxPt = () => { const k = P.fx; if (k === 'bar' && bar) return bar.position.clone(); if (k === 'hand') return gripPt('l'); if (k === 'foot') return wp(B.ball_l); if (k === 'hip') return wp(B.pelvis); return wp(B.spine_03); };
    const path = [];
    for (let k = 0; k <= 24; k++) { pose(lerpPose(P.A, P.B, k / 24)); placeGear(); path.push(fxPt()); }
    const pathLine = new T.Line(new T.BufferGeometry().setFromPoints(path), new T.LineDashedMaterial({ color: 0x9dff2e, dashSize: .03, gapSize: .025, transparent: true, opacity: .9 }));
    pathLine.computeLineDistances(); sc.add(pathLine);
    const dotM = new T.MeshBasicMaterial({ color: 0x9dff2e });
    const dots = [path[0], path[path.length - 1]].map((p) => { const d = new T.Mesh(new T.SphereGeometry(.018, 12, 8), dotM); d.position.copy(p); sc.add(d); return d; });

    // ── Cámara ──
    const box3 = new T.Box3();
    [0, 1].forEach((t) => { pose(lerpPose(P.A, P.B, t)); placeGear(); root.updateMatrixWorld(true); skinned.forEach(() => {}); ['head', 'hand_l', 'hand_r', 'ball_l', 'ball_r', 'pelvis', 'foot_l', 'foot_r'].forEach((k) => box3.expandByPoint(wp(B[k]))); });
    props.children.forEach((o) => box3.expandByObject(o));
    if (bar) box3.expandByObject(bar);
    const ctr = box3.getCenter(new T.Vector3()), size = box3.getSize(new T.Vector3());
    ctr.y = Math.max(ctr.y, .5);
    const view = { yaw: (CAM[pat] || 45) * Math.PI / 180, pitch: .16, auto: true };
    const dist = () => { const s = Math.max(size.y + .22, (Math.max(size.x, size.z) + .2) / (W() / H())); return s / (2 * Math.tan(cam.fov * Math.PI / 360)) + .25; };
    function place() { const d = dist(); cam.position.set(ctr.x + Math.sin(view.yaw) * Math.cos(view.pitch) * d, ctr.y + Math.sin(view.pitch) * d, ctr.z + Math.cos(view.yaw) * Math.cos(view.pitch) * d); cam.lookAt(ctr); }
    place();

    // ── Bucle ──
    const st = { play: true, speed: 1, t: 0, last: 0 };
    const DUR = { hold: .35, go: 1.25 };
    const cyc = 2 * (DUR.hold + DUR.go);
    const ease = (x) => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    function phase(t) { const x = t % cyc; if (x < DUR.hold) return 0; if (x < DUR.hold + DUR.go) return ease((x - DUR.hold) / DUR.go); if (x < 2 * DUR.hold + DUR.go) return 1; return 1 - ease((x - 2 * DUR.hold - DUR.go) / DUR.go); }
    let raf = 0, visible = true;
    function frame(ts) {
      raf = 0;
      if (!el.isConnected) { dispose(); return; }
      const dt = st.last ? Math.min(.05, (ts - st.last) / 1000) : 0; st.last = ts;
      if (st.play) st.t += dt * st.speed;
      uni.uT.value = ts / 1000;
      pose(lerpPose(P.A, P.B, phase(st.t))); placeGear();
      r.render(sc, cam);
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }) : null;
    if (io) io.observe(el);
    const onVis = () => { if (!document.hidden && !raf) { st.last = 0; raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', onVis);
    // arrastrar para girar
    let drag = null;
    r.domElement.addEventListener('pointerdown', (ev) => { drag = [ev.clientX, ev.clientY, view.yaw, view.pitch]; r.domElement.setPointerCapture(ev.pointerId); });
    r.domElement.addEventListener('pointermove', (ev) => { if (!drag) return; view.yaw = drag[2] - (ev.clientX - drag[0]) * .01; view.pitch = Math.max(-.1, Math.min(.9, drag[3] + (ev.clientY - drag[1]) * .006)); place(); if (!st.play) frame(performance.now()); });
    ['pointerup', 'pointercancel'].forEach((t) => r.domElement.addEventListener(t, () => { drag = null; }));
    r.domElement.style.touchAction = 'pan-y';
    const onResize = () => { r.setSize(W(), H(), false); cam.aspect = W() / H(); cam.updateProjectionMatrix(); place(); };
    window.addEventListener('resize', onResize);
    function dispose() {
      if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('resize', onResize);
      sc.traverse((o) => { if (o.geometry && !o.isSkinnedMesh) o.geometry.dispose(); });
      r.dispose(); try { r.forceContextLoss(); } catch (e) { /* ya liberado */ }
    }
    raf = requestAnimationFrame(frame);
    return {
      canvas: r.domElement, pat, dbg() { const o = {}; Object.keys(B).forEach((k) => { if (!/_0[1-3]_/.test(k)) o[k] = wp(B[k]).toArray().map((x) => +x.toFixed(3)); }); return o; }, snap() { return r.domElement.toDataURL('image/png'); },
      toggle() { st.play = !st.play; if (st.play) { st.last = 0; if (!raf) raf = requestAnimationFrame(frame); } return st.play; },
      speed(v) { st.speed = v; },
      resize() { onResize(); if (!st.play) frame(performance.now()); },
      view(yaw) { view.yaw = yaw * Math.PI / 180; place(); if (!st.play) frame(performance.now()); },
      at(t) { st.play = false; st.t = DUR.hold + t * DUR.go; pose(lerpPose(P.A, P.B, t)); placeGear(); r.render(sc, cam); },
      dispose,
    };
  }

  // ── Uso en la ficha ──
  const TX = {
    load: ['Cargando atleta 3D…', 'Loading 3D athlete…', 'Chargement de l’athlète 3D…', 'Carregando atleta 3D…'],
    hint: ['Arrastra para girar', 'Drag to rotate', 'Glisse pour tourner', 'Arraste para girar'],
    pause: ['Pausa', 'Pause', 'Pause', 'Pausa'], play: ['Reproducir', 'Play', 'Lecture', 'Reproduzir'],
    slow: ['Lento', 'Slow', 'Lent', 'Lento'], side: ['Lado', 'Side', 'Côté', 'Lado'], front: ['Frente', 'Front', 'Face', 'Frente'],
    path: ['Recorrido completo', 'Full range of motion', 'Amplitude complète', 'Amplitude completa'],
    see: ['Ver atleta 3D', 'Show 3D athlete', 'Voir l’athlète 3D', 'Ver atleta 3D'],
    label: ['Atleta 3D de Volta haciendo el ejercicio', 'Volta 3D athlete doing the exercise', 'Athlète 3D Volta faisant l’exercice', 'Atleta 3D da Volta a fazer o exercício'],
  };
  const li = () => ({ es: 0, en: 1, fr: 2, pt: 3 })[typeof S === 'object' && S.lang] || 0;
  const tx = (k) => TX[k][li()];
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const saveData = () => { try { return !!(navigator.connection && navigator.connection.saveData); } catch (e) { return false; } };
  window.vxAtleta3D = {
    PATS, CAM, build, loadModel,
    async mount(el, i) {
      if (!el || !webgl()) return null;
      el.classList.add('vx3-wait'); el.setAttribute('data-load', tx('load'));
      try {
        const g = await loadModel();
        if (!el.isConnected) return null;
        const v = build(el, i, g);
        el.classList.remove('vx3-wait');
        el.innerHTML = '';
        el.appendChild(v.canvas);
        const bar = document.createElement('div'); bar.className = 'vx3-bar';
        bar.innerHTML = `<button type="button" data-a="p" aria-pressed="false">${tx('pause')}</button><button type="button" data-a="s" aria-pressed="false">${tx('slow')}</button><button type="button" data-a="f">${tx('front')}</button><button type="button" data-a="l">${tx('side')}</button><span class="vx3-hint">${tx('hint')}</span>`;
        bar.addEventListener('click', (ev) => {
          const b = ev.target.closest('button'); if (!b) return; ev.stopPropagation();
          const a = b.dataset.a;
          if (a === 'p') { const on = v.toggle(); b.textContent = on ? tx('pause') : tx('play'); b.setAttribute('aria-pressed', String(!on)); }
          if (a === 's') { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); v.speed(on ? .45 : 1); }
          if (a === 'f') v.view(18);
          if (a === 'l') v.view(88);
        });
        el.appendChild(bar);
        const lg = document.createElement('div'); lg.className = 'vx3-leg'; lg.innerHTML = `<i></i>${tx('path')}`; el.appendChild(lg);
        el._vx3 = v;
        if (reduce()) { const b0 = bar.querySelector('[data-a="p"]'); v.toggle(); b0.textContent = tx('play'); b0.setAttribute('aria-pressed', 'true'); }
        return v;
      } catch (err) {
        el.classList.remove('vx3-wait');
        return null;
      }
    },
  };

  // En la ficha: el atleta 3D sustituye a la animación 2D en cuanto está listo (si no carga, se queda la 2D)
  function attach(av) {
    if (av._vx3done) return; av._vx3done = true;
    const i = +av.getAttribute('data-ex'); if (!EX[i] || !webgl()) return;
    const box = document.createElement('div'); box.className = 'vx3'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', tx('label') + ': ' + EX[i][0]);
    const go = () => {
      av.parentNode.insertBefore(box, av); box.style.display = 'none';
      window.vxAtleta3D.mount(box, i).then((v) => {
        if (!v) { box.remove(); return; }
        box.style.display = ''; av.style.display = 'none'; v.resize();
        const ctl = av.nextElementSibling; if (ctl && ctl.classList.contains('vx-av-ctl')) ctl.style.display = 'none';
      });
    };
    if (saveData()) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip vx3-see'; b.textContent = '🧍 ' + tx('see'); b.onclick = () => { b.remove(); go(); }; av.parentNode.insertBefore(b, av); return; }
    go();
  }
  const scan = (n) => { if (n.querySelectorAll) n.querySelectorAll('.vx-avatar[data-ex]').forEach(attach); };
  if ('MutationObserver' in window) new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(scan))).observe(document.documentElement, { childList: true, subtree: true });
  scan(document);
})();
