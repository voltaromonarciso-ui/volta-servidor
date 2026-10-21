// Vegetación con el estilo de la lámina de referencia (docs/referencias/arboles-cesped.png):
// árboles de copa redonda hecha de racimos de hojas grandes, tronco rojizo con raíces y
// ramas en horquilla; arbustos, plantas de hoja larga, flores blancas y rocas.
//
// Cada modelo devuelve un THREE.Group con pocas mallas (tronco, núcleo de la copa y hojas)
// que comparten materiales, así el colocador (streetfurniture.js) las funde por sector.
// La luz de la copa no sale de cada tarjeta suelta: la normal de cada hoja apunta hacia
// fuera del centro de la copa y el color por vértice oscurece la parte de abajo y la de
// dentro, que es lo que da el volumen redondo y blando de la referencia.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const geos = new Map(), texs = new Map(), mats = new Map();
const once = (map, k, f) => { if (!map.has(k)) map.set(k, f()); return map.get(k); };
const rng = (seed) => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

function canvasTex(key, w, h, draw, srgb = true) {
  return once(texs, key, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  });
}

// Mapa de normales a partir de un dibujo en grises (relieve barato: el bumpMap cuesta mucho
// más en móviles y en WebGL por software)
function normalFromHeight(key, w, h, draw, strength = 2) {
  return once(texs, key, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const src = g.getImageData(0, 0, w, h).data, out = g.createImageData(w, h);
    const at = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
// ---------- texturas ----------
// Racimo de hojas grandes y redondeadas, con degradado y nervio (fondo transparente)
const leafTex = () => canvasTex('veg-hojas', 256, 256, (c, w) => {
  const rnd = rng(11);
  const leaf = (x, y, l, ang, li) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    const g = c.createLinearGradient(-l, 0, l, 0);
    g.addColorStop(0, `hsl(104,52%,${li - 12}%)`); g.addColorStop(0.55, `hsl(96,58%,${li}%)`); g.addColorStop(1, `hsl(88,62%,${li + 9}%)`);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(-l, 0);
    c.bezierCurveTo(-l * 0.4, -l * 0.62, l * 0.55, -l * 0.5, l, 0);
    c.bezierCurveTo(l * 0.55, l * 0.5, -l * 0.4, l * 0.62, -l, 0); c.fill();
    c.strokeStyle = `hsla(90,45%,${li + 16}%,0.55)`; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-l * 0.85, 0); c.quadraticCurveTo(0, -l * 0.05, l * 0.8, 0); c.stroke();
    c.restore();
  };
  // primero las hojas de fondo (más oscuras), luego las de delante
  for (let pass = 0; pass < 2; pass++) for (let k = 0; k < 34; k++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * w * 0.33, x = w / 2 + Math.cos(a) * d, y = w / 2 + Math.sin(a) * d;
    leaf(x, y, 20 + rnd() * 16, a + (rnd() - 0.5) * 0.9, pass ? 40 + rnd() * 14 : 27 + rnd() * 8);
  }
});
// Relleno de hojas (opaco, se repite): el «cuerpo» de cada racimo de la copa
const leafFillTex = () => canvasTex('veg-relleno', 256, 256, (c, w) => {
  c.fillStyle = '#2f5a1c'; c.fillRect(0, 0, w, w);
  const rnd = rng(31);
  for (let k = 0; k < 520; k++) {
    const x = rnd() * w, y = rnd() * w, a = rnd() * Math.PI * 2, l = 9 + rnd() * 9, li = 24 + rnd() * 30;
    c.fillStyle = `hsl(${88 + rnd() * 22},${50 + rnd() * 18}%,${li}%)`;
    for (const dx of [-w, 0, w]) for (const dy of [-w, 0, w]) {
      c.save(); c.translate(x + dx, y + dy); c.rotate(a);
      c.beginPath(); c.moveTo(-l, 0); c.quadraticCurveTo(0, -l * 0.6, l, 0); c.quadraticCurveTo(0, l * 0.6, -l, 0); c.fill();
      c.restore();
    }
  }
});
// Corteza como la de la lámina: placas alargadas rojizas separadas por grietas que suben en
// espiral. Se dibujan dos lienzos iguales: el de color y uno en grises para el relieve (normales)
function drawBark(c, w, h, relief) {
  const rnd = rng(5);
  c.fillStyle = relief ? '#202020' : '#5a3020'; c.fillRect(0, 0, w, h);
  // placas: tiras inclinadas (la espiral) con el centro más claro
  for (let row = 0; row < 14; row++) for (let col = 0; col < 6; col++) {
    const pw = w / 6 - 3, ph = h / 7 + rnd() * 20;
    const x = col * (w / 6) + 1.5 + (row % 2) * (w / 12), y = row * (h / 14) - 10 + rnd() * 8;
    for (const dx of [-w, 0, w]) {
      c.save(); c.translate(x + dx + pw / 2, y + ph / 2); c.transform(1, -0.35, 0, 1, 0, 0);
      const g = c.createLinearGradient(-pw / 2, 0, pw / 2, 0);
      if (relief) { g.addColorStop(0, '#606060'); g.addColorStop(0.5, '#f0f0f0'); g.addColorStop(1, '#707070'); }
      else { const hue = 14 + rnd() * 8, l = 30 + rnd() * 10; g.addColorStop(0, `hsl(${hue},45%,${l - 8}%)`); g.addColorStop(0.5, `hsl(${hue + 4},48%,${l + 6}%)`); g.addColorStop(1, `hsl(${hue},42%,${l - 10}%)`); }
      c.fillStyle = g;
      c.beginPath(); c.ellipse(0, 0, pw / 2, ph / 2, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }
  // vetas finas a lo largo de cada placa
  c.globalAlpha = relief ? 0.35 : 0.22; c.strokeStyle = relief ? '#000' : '#2a140c'; c.lineWidth = 1;
  for (let k = 0; k < 60; k++) { const x = rnd() * w, y = rnd() * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8, y - 26); c.stroke(); }
  c.globalAlpha = 1;
}
const barkTex = () => canvasTex('veg-corteza2', 128, 256, (c, w, h) => drawBark(c, w, h, false));
const barkNormal = () => normalFromHeight('veg-corteza2-n', 128, 256, (c, w, h) => drawBark(c, w, h, true), 3);

// Briznas (matas y plantas de hoja larga): degradado de la base oscura a la punta clara
const bladeTex = () => canvasTex('veg-brizna', 128, 128, (c) => {
  const rnd = rng(23);
  for (let k = 0; k < 40; k++) {
    const x = 8 + rnd() * 112, hgt = 60 + rnd() * 66, lean = (rnd() - 0.5) * 40, bw = 2.5 + rnd() * 3;
    const g = c.createLinearGradient(0, 128, 0, 128 - hgt);
    g.addColorStop(0, '#2c5a1c'); g.addColorStop(0.6, `hsl(${92 + rnd() * 16},55%,${34 + rnd() * 10}%)`); g.addColorStop(1, `hsl(${80 + rnd() * 12},62%,${48 + rnd() * 10}%)`);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x - bw, 128); c.quadraticCurveTo(x + lean * 0.3, 128 - hgt * 0.6, x + lean, 128 - hgt); c.quadraticCurveTo(x + lean * 0.3 + bw * 0.6, 128 - hgt * 0.55, x + bw, 128); c.fill();
  }
});
// Flor blanca de cinco pétalos con centro amarillo
const flowerTex = () => canvasTex('veg-flor', 64, 64, (c) => {
  c.translate(32, 32);
  for (let k = 0; k < 5; k++) {
    c.save(); c.rotate((k / 5) * Math.PI * 2);
    const g = c.createLinearGradient(0, 0, 0, -26); g.addColorStop(0, '#f3e9d2'); g.addColorStop(1, '#ffffff');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, -14, 8, 14, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.fillStyle = '#f2b632'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
});

// ---------- materiales ----------
export const VMAT = {
  bark: () => once(mats, 'bark', () => {
    const t = barkTex(); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({ map: t, normalMap: barkNormal(), normalScale: new THREE.Vector2(1.2, 1.2), color: '#ffffff', roughness: 0.95 });
  }),
  core: () => once(mats, 'core', () => { const t = leafFillTex(); t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, color: '#ffffff', vertexColors: true, roughness: 0.9 }); }),
  leaves: () => once(mats, 'leaves', () => new THREE.MeshStandardMaterial({ map: leafTex(), vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 })),
  blades: () => once(mats, 'blades', () => new THREE.MeshStandardMaterial({ map: bladeTex(), vertexColors: true, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.85 })),
  flower: () => once(mats, 'flower', () => new THREE.MeshStandardMaterial({ map: flowerTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 })),
  rock: () => once(mats, 'rock', () => new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.92, flatShading: true })),
};

// ---------- geometría ----------
// Tubo que se estrecha (r0 → r1) a lo largo de una curva; `flare` ensancha la base (raíces)
function taperTube(pts, r0, r1, radial = 8, segs = 10, flare = 0) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const fr = curve.computeFrenetFrames(segs, false);
  const pos = [], uv = [], idx = [];
  const len = curve.getLength();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, P = curve.getPointAt(t), N = fr.normals[i], Bn = fr.binormals[i];
    let r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      // raíces: lóbulos que se abren en los primeros centímetros
      const f = flare ? 1 + flare * Math.exp(-t * len * 3.2) * (0.75 + 0.25 * Math.cos(a * 5)) : 1;
      const cx = Math.cos(a) * r * f, sy = Math.sin(a) * r * f;
      pos.push(P.x + N.x * cx + Bn.x * sy, P.y + N.y * cx + Bn.y * sy, P.z + N.z * cx + Bn.z * sy);
      uv.push((j / radial) * Math.max(1, Math.round(r * 9)), (t * len) / 1.1); // placas de ~1 m, más estrechas en las ramas
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Tarjetas de hojas alrededor de un racimo (centro c, radio r) de una copa con centro C.
// La normal sale del centro de la copa (volumen único); el color oscurece abajo y dentro.
function leafCards(list, c, r, C, R, rnd, n, o = {}) {
  const q = new THREE.Quaternion(), zf = new THREE.Vector3(0, 0, 1), m4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
  for (let k = 0; k < n; k++) {
    // repartidas por la mitad de arriba y los lados del racimo, pegadas a su superficie
    const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 1.5 - 0.35, rnd() * 2 - 1).normalize();
    // medio hundidas en el racimo: ninguna queda suelta ni sobresale flotando
    const p = c.clone().addScaledVector(dir, r * ((o.at ?? 0.68) + rnd() * 0.08));
    const out = p.clone().sub(C).normalize();
    const nrm = out.clone().lerp(new THREE.Vector3(0, 1, 0), 0.2).normalize();
    const size = r * ((o.size ?? 0.26) + rnd() * 0.12); // pequeñas: solo algún borde de hoja asoma
    const pg = new THREE.PlaneGeometry(size, size);
    // de cara hacia fuera (casi tumbadas sobre el racimo), con un poco de giro
    q.setFromUnitVectors(zf, dir.clone().lerp(out, 0.15).normalize());
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(dir, rnd() * 6.28));
    m4.compose(p, q, one); pg.applyMatrix4(m4);
    // misma luz que el cuerpo del racimo (sin parches más claros que el resto)
    const up = (p.y - C.y) / R, outw = p.distanceTo(C) / R;
    const self = (0.68 + 0.32 * Math.max(0, dir.y)) * (0.78 + 0.22 * Math.max(0, dir.dot(out)));
    const l = Math.min(1.2, Math.max(0.3, (0.62 + up * 0.4 + (outw - 0.75) * 0.45) * self + (rnd() - 0.5) * 0.06));
    const N = pg.attributes.normal, col = [];
    for (let i = 0; i < N.count; i++) { N.setXYZ(i, nrm.x, nrm.y, nrm.z); col.push(l * 1.02, l * 1.12, l * 0.66); } // verde vivo, algo amarillento al sol
    pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    list.push(pg);
  }
}
// Cuerpo de un racimo: bola blanda y algo abollada, con textura de hojas; la luz sale del
// centro de la copa (volumen redondo) y el color oscurece abajo y por dentro
function coreBall(out, c, r, C, R, detail = 2) {
  let g = new THREE.IcosahedronGeometry(r * 0.88, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const P = g.attributes.position, col = [], uv = [], nrm = [];
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i).normalize();
    const f = 0.94 + Math.sin(v.x * 7.1 + v.y * 5.3) * 0.03 + Math.sin(v.z * 6.7 - v.y * 4.1) * 0.03; // abollado suave (silueta redonda)
    P.setXYZ(i, c.x + v.x * r * 0.88 * f, c.y + v.y * r * 0.8 * f, c.z + v.z * r * 0.88 * f);
    w.fromBufferAttribute(P, i);
    const up = (w.y - C.y) / R, outw = w.distanceTo(C) / R;
    // cada racimo, claro arriba y oscuro en su borde: se leen los «bultos» de la copa
    const out = w.clone().sub(C).normalize(), self = (0.68 + 0.32 * Math.max(0, v.y)) * (0.78 + 0.22 * Math.max(0, v.dot(out)));
    const l = Math.min(1.25, Math.max(0.22, (0.55 + up * 0.42 + (outw - 0.75) * 0.5) * self));
    col.push(l * 1.02, l * 1.12, l * 0.66); // verde vivo, algo amarillento al sol
    uv.push((Math.atan2(v.z, v.x) / Math.PI + 1) * r * 1.4, (v.y + 1) * r * 1.4);
    const n = w.clone().sub(C).normalize().multiplyScalar(0.6).add(v.clone().multiplyScalar(0.4)).normalize();
    nrm.push(n.x, n.y, n.z);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  out.push(g);
}

// Copa: racimos repartidos por una cúpula (achatada) de radio R y altura media y0
function canopy(clusters, C, R, rnd, cardsPer, o) {
  const cores = [], cards = [];
  for (const [c, r] of clusters) { coreBall(cores, c, r, C, R, o?.detail ?? 2); leafCards(cards, c, r, C, R, rnd, cardsPer, o); }
  return { core: mergeGeometries(cores), leaves: mergeGeometries(cards) };
}

// ---------- modelos ----------
// Árbol de copa redonda. variant 0: grande y ancho; 1: mediano alto; 2: pequeño.
export function arbolCopa(variant = 0, seed = 1) {
  const key = 'arbol' + variant + ':' + seed;
  const parts = once(geos, key, () => {
    const rnd = rng(seed * 7 + variant * 31 + 3);
    const H = [6.4, 5.8, 4.6][variant], R = [3.0, 2.4, 1.9][variant], tr = [0.36, 0.28, 0.22][variant];
    const lean = (rnd() - 0.5) * 0.4;
    const fork = H * 0.36;
    const trunk = [taperTube([[0, 0, 0], [lean * 0.3, fork * 0.5, 0], [lean, fork, lean * 0.4]], tr, tr * 0.72, 10, 8, 0.9)];
    const C = new THREE.Vector3(lean, H - R * 0.72, lean * 0.4); // copa alta: se ven tronco y ramas
    // ramas en horquilla hacia los racimos principales
    const nb = 3 + Math.floor(rnd() * 2), clusters = [];
    for (let k = 0; k < nb; k++) {
      const a = (k / nb) * Math.PI * 2 + rnd() * 0.6, sp = R * (0.45 + rnd() * 0.2);
      const end = [C.x + Math.cos(a) * sp, C.y + (rnd() - 0.2) * R * 0.35, C.z + Math.sin(a) * sp];
      trunk.push(taperTube([[lean, fork - 0.1, lean * 0.4], [(lean * 0.6 + end[0] * 0.4), fork + (end[1] - fork) * 0.45, (lean * 0.24 + end[2] * 0.4)], end], tr * 0.66, tr * 0.22, 7, 6));
      // ramilla secundaria que asoma por debajo de la copa
      trunk.push(taperTube([[(lean * 0.6 + end[0] * 0.4), fork + (end[1] - fork) * 0.45, (lean * 0.24 + end[2] * 0.4)], [end[0] * 1.05 + Math.sin(a) * 0.3, end[1] - R * 0.35, end[2] * 1.05 - Math.cos(a) * 0.3]], tr * 0.28, tr * 0.08, 5, 3));
      clusters.push([new THREE.Vector3(...end), R * (0.5 + rnd() * 0.12)]);
    }
    // racimos de relleno: corona alta, anillo medio y algunos bajos
    clusters.push([C.clone().add(new THREE.Vector3(0, R * 0.62, 0)), R * 0.52]);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + 0.4, el = k % 2 ? 0.5 + rnd() * 0.35 : -0.25 + rnd() * 0.4; // dos pisos: cúpula redonda
      const d = R * (0.62 + rnd() * 0.15);
      clusters.push([C.clone().add(new THREE.Vector3(Math.cos(a) * d * Math.cos(el), Math.sin(el) * R * 0.55, Math.sin(a) * d * Math.cos(el))), R * (0.38 + rnd() * 0.12)]);
    }
    const { core, leaves } = canopy(clusters, C, R, rnd, 6);
    return { trunk: mergeGeometries(trunk), core, leaves };
  });
  const g = new THREE.Group();
  const add = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; g.add(o); };
  add(parts.trunk, VMAT.bark()); add(parts.core, VMAT.core()); add(parts.leaves, VMAT.leaves());
  return g;
}

// Arbusto como el de la lámina: un montículo de muchos racimos pequeños (no una bola), más
// claro arriba, con hojas que asoman por el borde
export function arbusto(seed = 1, s = 1) {
  const parts = once(geos, 'arbusto2-' + seed + ':' + s, () => {
    const rnd = rng(seed * 13 + 5), R = 0.8 * s, C = new THREE.Vector3(0, R * 0.35, 0), clusters = [];
    const n = 7 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.28 + rnd() * 0.5, d = R * (0.45 + rnd() * 0.3);
      clusters.push([new THREE.Vector3(Math.cos(a) * d, R * (0.22 + rnd() * 0.15), Math.sin(a) * d * 0.85), R * (0.34 + rnd() * 0.1)]);
    }
    for (let k = 0; k < 3; k++) { const a = rnd() * 6.28; clusters.push([new THREE.Vector3(Math.cos(a) * R * 0.2, R * (0.55 + rnd() * 0.15), Math.sin(a) * R * 0.2), R * (0.36 + rnd() * 0.08)]); }
    return canopy(clusters, C, R, rnd, 8, { at: 0.74, size: 0.42, detail: 1 }); // racimos pequeños: menos polígonos
  });
  const g = new THREE.Group();
  for (const [geo, m] of [[parts.core, VMAT.core()], [parts.leaves, VMAT.leaves()]]) { const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; g.add(o); }
  return g;
}

// Hoja larga curvada (tira de 4 tramos) para plantas tipo agave/lirio
function bladeStrip(out, a, len, w, lean, rnd, dark = 0.5) {
  const segs = 4, pos = [], uv = [], col = [], idx = [];
  const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, ww = w * (1 - t * 0.85), out_ = Math.sin(t * lean) * len * 0.55, y = Math.sin(t * Math.PI * 0.42) * len;
    for (const s of [-1, 1]) {
      pos.push(dx * out_ + px * ww * s * 0.5, y, dz * out_ + pz * ww * s * 0.5);
      uv.push(0.5 + s * 0.08, t * 0.95);
      const l = dark + t * 0.62 + (rnd() - 0.5) * 0.06;
      col.push(l * 0.78, l, l * 0.55);
    }
  }
  for (let i = 0; i < segs; i++) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // normales hacia arriba y fuera: luz blanda, sin caras negras por detrás
  const N = g.attributes.normal; for (let i = 0; i < N.count; i++) N.setXYZ(i, dx * 0.4, 0.9, dz * 0.4);
  out.push(g.toNonIndexed());
}
// Planta de hojas largas (como la de la lámina)
export function plantaHojas(seed = 1, s = 1) {
  const geo = once(geos, 'planta' + seed + ':' + s, () => {
    const rnd = rng(seed * 3 + 1), out = [];
    const n = 11 + Math.floor(rnd() * 5);
    for (let k = 0; k < n; k++) bladeStrip(out, (k / n) * 6.28 + rnd() * 0.5, (0.7 + rnd() * 0.45) * s, 0.16 * s, 0.9 + rnd() * 1.1, rnd);
    return mergeGeometries(out);
  });
  const g = new THREE.Group(), o = new THREE.Mesh(geo, VMAT.blades()); o.castShadow = true; o.receiveShadow = true; g.add(o);
  return g;
}

// Mata de flores blancas: briznas y flores sueltas a distintas alturas
export function flores(seed = 1) {
  const parts = once(geos, 'flores' + seed, () => {
    const rnd = rng(seed * 17 + 9), blades = [], heads = [];
    for (let k = 0; k < 9; k++) bladeStrip(blades, (k / 9) * 6.28 + rnd(), 0.32 + rnd() * 0.2, 0.07, 0.6 + rnd() * 0.6, rnd, 0.45);
    for (let k = 0; k < 7; k++) {
      const a = rnd() * 6.28, d = rnd() * 0.22, y = 0.28 + rnd() * 0.25, sz = 0.11 + rnd() * 0.05;
      const p = new THREE.PlaneGeometry(sz, sz); p.rotateX(-Math.PI / 2 + (rnd() - 0.5) * 0.7); p.rotateY(rnd() * 6.28);
      p.translate(Math.cos(a) * d, y, Math.sin(a) * d);
      const N = p.attributes.normal; for (let i = 0; i < N.count; i++) N.setXYZ(i, 0, 1, 0);
      heads.push(p);
      // tallo
      const st = new THREE.PlaneGeometry(0.012, y); st.translate(Math.cos(a) * d, y / 2, Math.sin(a) * d);
      const sc = [], SN = st.attributes.normal;
      for (let i = 0; i < SN.count; i++) { sc.push(0.35, 0.55, 0.25); SN.setXYZ(i, 0, 1, 0); }
      st.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
      blades.push(st.toNonIndexed());
    }
    return { blades: mergeGeometries(blades), heads: mergeGeometries(heads) };
  });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(parts.blades, VMAT.blades()), new THREE.Mesh(parts.heads, VMAT.flower()));
  return g;
}

// Roca redondeada (malva grisácea, como la de la lámina)
export function roca(seed = 1, s = 1) {
  const geo = once(geos, 'roca' + seed + ':' + s, () => {
    const rnd = rng(seed * 5 + 2), out = [];
    for (let k = 0; k < (rnd() < 0.5 ? 1 : 2); k++) {
      const g = new THREE.IcosahedronGeometry(0.42 * s * (k ? 0.6 : 1), 1);
      const P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const f = 0.85 + rnd() * 0.25; P.setXYZ(i, P.getX(i) * f * 1.15, Math.max(-0.05, P.getY(i) * f * 0.75), P.getZ(i) * f); }
      g.translate(k ? 0.45 * s : 0, 0.18 * s * (k ? 0.6 : 1), k ? 0.2 * s : 0);
      const col = []; for (let i = 0; i < P.count; i++) { const l = 0.5 + Math.max(0, P.getY(i)) * 0.5; col.push(l * 0.72, l * 0.62, l * 0.64); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.deleteAttribute('uv'); g.deleteAttribute('normal');
      out.push(g);
    }
    const m = mergeGeometries(out); m.computeVertexNormals(); return m;
  });
  const g = new THREE.Group(), o = new THREE.Mesh(geo, VMAT.rock()); o.castShadow = true; o.receiveShadow = true; g.add(o);
  return g;
}
