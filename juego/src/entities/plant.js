// Planta de cultivo en maceta negra de tela (estilo low-poly): tallo central con ramas en
// pares alternos, hojas palmeadas de foliolos dentados, forma de abeto y cogollos claros en
// la punta de las ramas y arriba del todo. Cuatro fases de crecimiento (plántula, crecimiento,
// prefloración y floración); la geometría de cada fase se crea una vez y la comparten todas
// las macetas, así cada planta son solo tres mallas visibles.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const POT_H = 0.46;
export const PLANT_BASE = POT_H; // la planta arranca a ras de tierra

// pseudoaleatorio estable (cada fase sale siempre igual)
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

// Foliolo dentado: lanza estrecha en el plano XY, de la base (0,0) a la punta (0,len)
function leaflet(len, wid) {
  const sh = new THREE.Shape();
  const n = 7, side = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const w = wid * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - t * 0.25);
    side.push([w, t * len], [w * 0.7, (t + 0.5 / n) * len]); // diente y entrante
  }
  sh.moveTo(0, 0);
  for (const [x, y] of side) sh.lineTo(x, y);
  sh.lineTo(0, len);
  for (let i = side.length - 1; i >= 0; i--) sh.lineTo(-side[i][0], side[i][1]);
  sh.lineTo(0, 0);
  const g = new THREE.ShapeGeometry(sh);
  // un pliegue suave por el nervio central y la punta un poco caída
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.abs(x) * 0.5 - (y / len) * (y / len) * len * 0.18);
  }
  return g;
}

// Hoja palmeada: n foliolos en abanico (el central, el más largo)
function fanLeaf(size, n) {
  const parts = [];
  const spread = n >= 7 ? 1.45 : n >= 5 ? 1.2 : 0.9;
  for (let i = 0; i < n; i++) {
    const k = n === 1 ? 0 : i / (n - 1) - 0.5;          // -0.5 … 0.5
    const len = size * (1 - Math.abs(k) * 1.15);
    const lf = leaflet(Math.max(size * 0.25, len), size * 0.15);
    lf.rotateZ(-k * 2 * spread);
    parts.push(lf);
  }
  return mergeGeometries(parts);
}

// Coloca una hoja: tumbada mirando hacia fuera en la dirección `ang`, con caída `tilt`
function placeLeaf(geo, x, y, z, ang, tilt) {
  const g = geo.clone();
  g.rotateX(-Math.PI / 2 - tilt);           // tumbada (punta hacia -z) y caída hacia abajo
  g.rotateY(-ang - Math.PI / 2);             // la punta hacia (cos ang, sin ang)
  g.translate(x, y, z);
  return g;
}

// Cogollo: cono apretado de bolitas facetadas (se solapan: se lee como una sola pieza
// puntiaguda) con unas hojitas de azúcar asomando
function bud(x, y, z, r, h, rand, sugar) {
  const parts = [];
  const n = Math.max(4, Math.ceil(h / (r * 0.4)));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const rr = r * (1 - t * 0.75) * (0.9 + rand() * 0.2);
    const b = new THREE.IcosahedronGeometry(rr, 0);
    b.rotateY(rand() * 3); b.translate(x + (rand() - 0.5) * r * 0.25, y + t * h, z + (rand() - 0.5) * r * 0.25);
    parts.push(b);
  }
  const tip = new THREE.ConeGeometry(r * 0.3, r * 1.1, 5);
  tip.translate(x, y + h + r * 0.35, z);
  parts.push(tip);
  if (sugar) for (let k = 0; k < 4; k++) {
    const lf = leaflet(r * 2.4, r * 0.55);
    lf.rotateX(-0.5); lf.rotateY((k / 4) * Math.PI * 2 + rand());
    lf.translate(x, y + h * (0.15 + k * 0.18), z);
    sugar.push(lf);
  }
  return parts;
}

function stemPiece(x0, y0, z0, x1, y1, z1, r0, r1) {
  const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1);
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, 5);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.applyQuaternion(q);
  g.translate(x0, y0, z0);
  return g;
}

// Colores por vértice: las hojas de abajo más oscuras y las de arriba más claras
function shade(geo, H, dark, light) {
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  const a = new THREE.Color(dark), b = new THREE.Color(light), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    t.copy(a).lerp(b, Math.min(1, Math.max(0, p.getY(i) / H)));
    c.set([t.r, t.g, t.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}

const clean = (g) => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g.index ? g.toNonIndexed() : g; };
const merge = (list) => { const g = mergeGeometries(list.map(clean)); g.computeVertexNormals(); return g; };

// Una fase: { H: altura, nodes: nudos, leafN: foliolos, size: hoja grande, buds: 0..1 }
const STAGES = [
  { H: 0.16, nodes: 1, leafN: 3, size: 0.1, buds: 0 },     // plántula
  { H: 0.55, nodes: 5, leafN: 5, size: 0.26, buds: 0 },     // crecimiento
  { H: 1.0, nodes: 8, leafN: 7, size: 0.33, buds: 0.4 },   // prefloración
  { H: 1.4, nodes: 11, leafN: 7, size: 0.4, buds: 1 },   // floración
];
let CACHE = null;

function buildStage(st, seed) {
  const rand = rng(seed);
  const leaves = [], stems = [], buds = [];
  const { H, nodes, leafN, size } = st;
  stems.push(stemPiece(0, 0, 0, 0, H, 0, 0.026 + H * 0.014, 0.008));
  if (nodes === 1) {
    // plántula: dos cotiledones redondos y la primera hoja de tres foliolos
    for (const s of [-1, 1]) { const c = new THREE.SphereGeometry(0.035, 6, 4); c.scale(1.4, 0.3, 0.8); c.translate(s * 0.045, H * 0.65, 0); leaves.push(c); }
    const f = fanLeaf(size, 3);
    leaves.push(placeLeaf(f, 0, H, 0.005, Math.PI / 2, 0.3), placeLeaf(f, 0, H, -0.005, -Math.PI / 2, 0.3));
  } else {
    for (let i = 0; i < nodes; i++) {
      const t = (i + 0.5) / nodes;                         // altura relativa del nudo
      const y = 0.07 + t * H * 0.78;
      const L = Math.pow(1 - t, 0.9) * H * 0.36 + 0.04;    // ramas largas abajo: forma de abeto
      const base = i * 1.94 + (rand() - 0.5) * 0.3;        // cada par girado (filotaxia)
      for (const s of [0, Math.PI]) {
        const ang = base + s;
        const dx = Math.cos(ang), dz = Math.sin(ang);
        const ex = dx * L, ez = dz * L, ey = y + L * 0.9;   // rama subiendo a ~45°
        stems.push(stemPiece(0, y, 0, ex, ey, ez, 0.011, 0.006));
        const big = size * (0.55 + (1 - t) * 0.75);
        // hoja grande que sale del nudo, caída hacia fuera; otra a media rama y otra en la punta
        leaves.push(placeLeaf(fanLeaf(big, leafN), dx * 0.02, y, dz * 0.02, ang + 0.45, 0.3 + t * 0.5)); // (las de abajo caen menos: no atraviesan la maceta)
        leaves.push(placeLeaf(fanLeaf(big * 0.85, leafN), ex * 0.5, (y + ey) / 2, ez * 0.5, ang - 0.5, 0.55));
        leaves.push(placeLeaf(fanLeaf(big * 0.65, Math.max(5, leafN - 2)), ex, ey, ez, ang, 0.25));
        // más follaje: otra hoja a un cuarto de la rama, hacia un lado
        leaves.push(placeLeaf(fanLeaf(big * 0.9, leafN), ex * 0.25, y + (ey - y) * 0.25, ez * 0.25, ang + 0.9, 0.6));
        if (st.buds > 0 && t > 0.3) buds.push(...bud(ex, ey - 0.01, ez, (0.028 + st.buds * 0.018) * (0.7 + t * 0.4), (0.06 + st.buds * 0.09) * (0.6 + t * 0.5), rand, st.buds > 0.5 ? leaves : null));
      }
    }
    for (let i = 0; i < nodes; i++) {
      const t = (i + 0.3) / nodes, ang = i * 2.4 + 0.7;
      leaves.push(placeLeaf(fanLeaf(size * (0.5 + (1 - t) * 0.4), leafN), Math.cos(ang) * 0.02, 0.08 + t * H * 0.78, Math.sin(ang) * 0.02, ang, 0.2 + t * 0.4));
    }
    // la punta: un cono de hojas hacia arriba y, en flor, el cogollo principal
    const top = fanLeaf(size * 0.5, 5);
    for (let k = 0; k < 6; k++) leaves.push(placeLeaf(top, 0, H * (0.82 + (k % 2) * 0.06), 0, (k / 6) * Math.PI * 2 + 0.4, -0.5));
    if (st.buds > 0) buds.push(...bud(0, H * 0.8, 0, 0.04 + st.buds * 0.03, 0.12 + st.buds * 0.2, rand, st.buds > 0.5 ? leaves : null));
  }
  const lg = merge(leaves);
  shade(lg, H, '#2c5e1c', '#86bb48');
  return { leaves: lg, stem: merge(stems), buds: buds.length ? merge(buds) : null };
}

function stages() {
  if (!CACHE) CACHE = STAGES.map((st, i) => buildStage(st, 11 + i * 7));
  return CACHE;
}

// Maceta negra de tela, hexagonal, con su tierra (devuelve la tierra para cambiarle el color)
export function buildFabricPot(g) {
  const cloth = new THREE.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.95, flatShading: true });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, POT_H, 6), cloth);
  body.position.y = POT_H / 2; body.rotation.y = Math.PI / 6;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.37, 0.05, 6), new THREE.MeshStandardMaterial({ color: 0x2c2f34, roughness: 0.9, flatShading: true }));
  rim.position.y = POT_H - 0.02; rim.rotation.y = Math.PI / 6;
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0x5a3c22, roughness: 1, flatShading: true }));
  soil.position.y = POT_H - 0.04; soil.rotation.y = Math.PI / 6;
  for (const m of [body, rim, soil]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  return soil;
}

// La planta (todas las fases; refreshPlant enseña la que toca)
export function buildPlant(parent) {
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.75, flatShading: true, side: THREE.DoubleSide });
  const budMat = new THREE.MeshStandardMaterial({ color: 0xb8d46a, roughness: 0.6, flatShading: true });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f6a26, roughness: 0.8, flatShading: true });
  const plant = new THREE.Group();
  plant.position.y = PLANT_BASE - 0.03;
  parent.add(plant);
  const groups = stages().map((s) => {
    const sg = new THREE.Group();
    for (const [geo, m] of [[s.leaves, leafMat], [s.stem, stemMat], [s.buds, budMat]]) {
      if (!geo) continue;
      const me = new THREE.Mesh(geo, m);
      me.castShadow = true; me.receiveShadow = true;
      sg.add(me);
    }
    sg.visible = false;
    plant.add(sg);
    return sg;
  });
  return { plant, groups, leafMat, budMat };
}

const DRY = new THREE.Color(0xb59a5a), WHITE = new THREE.Color(0xffffff), BUD = new THREE.Color(0xb8d46a);
// g: crecimiento 0..1 · dry: sin agua · tint: color de la variedad (matiza los cogollos)
export function refreshPlant(p, g, dry, tint) {
  const i = g < 0.18 ? 0 : g < 0.5 ? 1 : g < 0.8 ? 2 : 3;
  p.groups.forEach((sg, k) => { sg.visible = k === i; });
  // dentro de cada fase crece un poco hasta el tamaño de la siguiente
  const from = [0, 0.18, 0.5, 0.8][i], to = [0.18, 0.5, 0.8, 1][i];
  const k = 0.82 + 0.18 * Math.min(1, (g - from) / (to - from));
  p.plant.scale.setScalar(k);
  p.leafMat.color.copy(WHITE);
  if (dry) p.leafMat.color.lerp(DRY, 0.55);
  p.budMat.color.copy(BUD);
  if (tint) p.budMat.color.lerp(new THREE.Color(tint), 0.18);
}
