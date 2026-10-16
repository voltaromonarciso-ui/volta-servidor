import * as THREE from 'three';
import { G } from '../game.js';
import { updatePlacement } from './objects.js';

// Rayo desde el centro de la pantalla: decide qué acción ofrecen los botones.
const ray = new THREE.Raycaster();
ray.far = 3.4;
const _v = new THREE.Vector3();
export const target = { actions: [], info: '', key: null };

let t = 0;
export function updateInteract(dt) {
  t -= dt;
  if (t > 0) return target;
  t = 0.08;
  target.actions = [];
  target.info = '';
  if (G.uiOpen) return target;

  ray.setFromCamera({ x: 0, y: 0 }, G.camera);
  const hits = ray.intersectObjects(G.interactables, false);
  for (const h of hits) {
    const ia = h.object.userData.ia;
    if (!ia || (ia.enabled && !ia.enabled())) continue;
    // muro de por medio?
    _v.copy(h.point).sub(G.camera.position);
    const d = _v.length() - 0.35;
    if (d > 0.2) {
      const ex = G.camera.position.x + (_v.x / _v.length()) * d, ez = G.camera.position.z + (_v.z / _v.length()) * d;
      if (!G.world.los(G.camera.position.x, G.camera.position.z, ex, ez, 2.5)) continue;
    }
    target.actions = ia.actions() || [];
    target.info = ia.info ? ia.info() : '';
    target.key = h.object;
    return target;
  }
  const place = updatePlacement();
  if (place) target.actions = place.actions;
  return target;
}

export function runAction(secondary) {
  const list = target.actions.filter((a) => !!a.secondary === !!secondary);
  const a = list[0];
  if (a) { a.fn(); t = 0; }
}
