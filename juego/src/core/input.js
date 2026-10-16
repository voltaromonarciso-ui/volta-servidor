import { G, emit } from '../game.js';

// Entrada unificada: teclado + ratón en escritorio, joystick + arrastre en móvil.
export const input = {
  mx: 0, my: 0,          // movimiento (-1..1), my>0 = adelante
  lookX: 0, lookY: 0,    // píxeles acumulados de giro de cámara
  sprint: false,
  jump: false,
  locked: false,
};

const keys = new Set();
let joy = null;   // { id, ox, oy, x, y }
let look = null;  // { id, x, y }
let joyEl, knobEl;

export function initInput() {
  joyEl = document.getElementById('joy');
  knobEl = document.getElementById('joy-knob');
  const layer = document.getElementById('touch-layer');

  // ---------------- teclado ----------------
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Space') { input.jump = true; e.preventDefault(); }
    if (e.code === 'KeyE') emit('btn', 'primary');
    if (e.code === 'KeyR') emit('btn', 'secondary');
    if (e.code === 'Tab' || e.code === 'KeyP') { emit('btn', 'phone'); e.preventDefault(); }
    if (e.code === 'KeyI') emit('btn', 'bag');
    if (e.code === 'KeyC' || e.code === 'ControlLeft') input.crouch = !input.crouch;
    if (e.code === 'Escape') emit('btn', 'escape');
    if (e.code.startsWith('Digit')) {
      const n = (parseInt(e.code.slice(5), 10) + 9) % 10;
      emit('select', n);
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  // ---------------- ratón (pointer lock) ----------------
  G.renderer.domElement.addEventListener('click', () => {
    if (!G.touch && !G.uiOpen && !G.paused) G.renderer.domElement.requestPointerLock?.();
  });
  document.addEventListener('pointerlockchange', () => {
    input.locked = document.pointerLockElement === G.renderer.domElement;
  });
  document.addEventListener('mousemove', (e) => {
    if (input.locked) { input.lookX += e.movementX; input.lookY += e.movementY; }
  });
  window.addEventListener('wheel', (e) => {
    if (G.uiOpen || G.paused) return;
    emit('select', (G.state.sel + (e.deltaY > 0 ? 1 : 9)) % 10);
  }, { passive: true });

  // ---------------- táctil ----------------
  layer.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    G.touch = true;
    document.body.classList.add('touch');
    // zona del joystick: el lado de la pantalla donde esté colocado
    const jr = joyEl.getBoundingClientRect(), jLeft = jr.left + jr.width / 2 < window.innerWidth / 2;
    const inJoyZone = jLeft ? e.clientX < window.innerWidth * 0.42 : e.clientX > window.innerWidth * 0.58;
    if (inJoyZone && !joy) {
      // joystick fijo: si tocas lejos de la base, la base se acerca al dedo
      const r = joyEl.getBoundingClientRect();
      let ox = r.left + r.width / 2, oy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - ox, e.clientY - oy) > r.width * 0.9) {
        joyEl.style.left = e.clientX + 'px';
        joyEl.style.top = e.clientY + 'px';
        joyEl.style.bottom = 'auto';
        ox = e.clientX; oy = e.clientY;
      }
      joy = { id: e.pointerId, ox, oy, x: 0, y: 0 };
      joyEl.classList.add('on');
      moveJoy(e.clientX, e.clientY);
    } else if (!look) {
      look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
    layer.setPointerCapture?.(e.pointerId);
  });
  layer.addEventListener('pointermove', (e) => {
    if (joy && e.pointerId === joy.id) {
      moveJoy(e.clientX, e.clientY);
    } else if (look && e.pointerId === look.id) {
      input.lookX += (e.clientX - look.x) * 1.6;
      input.lookY += (e.clientY - look.y) * 1.6;
      look.x = e.clientX; look.y = e.clientY;
    }
  });
  const end = (e) => {
    if (joy && e.pointerId === joy.id) { joy = null; joyEl.classList.remove('on'); resetJoyEl(); }
    if (look && e.pointerId === look.id) look = null;
  };
  layer.addEventListener('pointerup', end);
  layer.addEventListener('pointercancel', end);
}

function moveJoy(x, y) {
  let dx = x - joy.ox, dy = y - joy.oy;
  const R = joyEl.clientWidth * 0.36, d = Math.hypot(dx, dy);
  if (d > R) { dx *= R / d; dy *= R / d; }
  joy.x = dx / R; joy.y = -dy / R;
  knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function resetJoyEl() {
  joyEl.style.left = ''; joyEl.style.top = ''; joyEl.style.bottom = '';
  input.onJoyReset?.();
  knobEl.style.transform = 'translate(-50%,-50%)';
}

export function resetTouch() {
  joy = null; look = null;
  if (joyEl) { joyEl.classList.remove('on'); resetJoyEl(); }
}

export function pollInput() {
  let mx = 0, my = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) my -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (joy) { mx += joy.x; my += joy.y; }
  input.mx = Math.max(-1, Math.min(1, mx));
  input.my = Math.max(-1, Math.min(1, my));
  if (!G.touch) input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  else input.sprint = !!input.sprintToggle && my > 0.2;
}
