// Recorte por distancia de los objetos pequeños (sin tocar modelos ni texturas): de cerca todo
// se dibuja igual; un objeto pequeño sólo deja de dibujarse cuando está tan lejos que ocuparía
// uno o dos píxeles (y casi siempre está detrás de una pared o en la niebla). Es lo que más
// pesa en un móvil: miles de botellas, cajas, sillas y plantas por toda la isla, con sombra.
//   - Distancia según el tamaño: radio × 80 m, nunca menos de 30 m (una botella, ~30–40 m;
//     una silla, ~80 m; un sofá, ~160 m). Lo grande (más de 6 m de radio) no se toca.
//   - Se hace con las capas de dibujo (layers): no pisa la visibilidad que maneja el juego.
//   - Si un objeto se mueve (coches, gente, muebles que llevas), se recalcula su posición.
//   - Interiores: lo que va dentro de un grupo con userData.cullZone ({x0,x1,z0,z1}) sólo se
//     dibuja con el jugador dentro o a menos de 6 m del edificio (desde la calle no se distingue
//     tras los cristales), y no proyecta sombra del sol (el tejado no la deja ver).
//   - Sombras: un objeto pequeño deja de proyectar sombra a partir de 25 m + radio × 10 (a esa
//     distancia su sombra es un borrón de pocos píxeles en el mapa de sombras).
//   - Lo que aparece después (modelos que cargan al acercarte, objetos que colocas) se recoge
//     en la siguiente pasada.
import * as THREE from 'three';
import { G } from '../game.js';

const HIDDEN = 31;                 // capa que no dibuja ninguna cámara
const K = 80, MIN = 30, MAX_R = 6; // distancia = max(MIN, radio × K); sólo radios < MAX_R
const items = [];
const sph = new THREE.Sphere();
let scanT = 0, cullT = 0, on = true;

function add(o) {
  o.userData.cullReg = true;
  if (!o.isMesh || o.isInstancedMesh || o.userData.noCull) return;
  const g = o.geometry;
  if (!g) return;
  if (!g.boundingSphere) g.computeBoundingSphere();
  if (!g.boundingSphere || !isFinite(g.boundingSphere.radius)) return;
  sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
  if (sph.radius > MAX_R) return;
  const d = Math.max(MIN, sph.radius * K);
  const e = o.matrixWorld.elements;
  let zone = null;
  for (let p = o.parent; p; p = p.parent) if (p.userData.cullZone) { zone = p.userData.cullZone; break; }
  // (sólo lo que está de verdad dentro del edificio: el jardín y la fachada se ven siempre)
  const c = sph.center;
  if (zone && !(c.x > zone.x0 && c.x < zone.x1 && c.z > zone.z0 && c.z < zone.z1)) zone = null;
  if (zone) o.castShadow = false;
  const ds = 25 + sph.radius * 10;
  items.push({ o, c: sph.center.clone(), d2: d * d, s2: ds * ds, cast: o.castShadow, mx: e[12], my: e[13], mz: e[14], zone });
}
// Recoge los objetos nuevos de la escena (los de las manos van en otra escena)
function scan() {
  const skip = new Set(G.interactables || []);
  G.scene.traverse((o) => { if (!o.userData.cullReg && !skip.has(o)) add(o); });
}

export function setCulling(v) {
  on = v;
  if (!v) for (const it of items) it.o.layers.set(0);
}

export function updateCull(dt, pos) {
  if (!on || !G.scene) return;
  scanT -= dt;
  if (scanT <= 0) { scanT = 2; G.scene.updateMatrixWorld(); scan(); }
  cullT -= dt;
  if (cullT > 0) return;
  cullT = 0.2;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i], o = it.o;
    if (!o.parent) { items.splice(i, 1); o.userData.cullReg = false; continue; } // (quitado de la escena)
    const e = o.matrixWorld.elements;
    if (e[12] !== it.mx || e[13] !== it.my || e[14] !== it.mz) { // se ha movido
      sph.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      it.c.copy(sph.center); it.mx = e[12]; it.my = e[13]; it.mz = e[14];
    }
    const z = it.zone, M = 6;
    const vis = it.c.distanceToSquared(pos) < it.d2 && (!z || (pos.x > z.x0 - M && pos.x < z.x1 + M && pos.z > z.z0 - M && pos.z < z.z1 + M));
    const layer = vis ? 0 : HIDDEN;
    if (o.layers.mask !== 1 << layer) o.layers.set(layer);
    if (it.cast) { const cs = vis && it.c.distanceToSquared(pos) < it.s2; if (o.castShadow !== cs) o.castShadow = cs; }
  }
}
// Recalcula en el acto (al teletransportarse, al cargar la partida y en las pruebas)
export function cullNow(pos) { scanT = 0; cullT = 0; updateCull(0, pos); }
