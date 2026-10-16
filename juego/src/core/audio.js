import { G } from '../game.js';

// Sonido: grabaciones reales CC0 (Kenney y OpenGameArt) para pasos, puertas,
// dinero, móvil, sirena y ambiente; los efectos sin grabación se sintetizan.
let ctx = null, master = null, siren = null;
const files = import.meta.glob('../assets/sounds/*.mp3', { query: '?url', import: 'default', eager: true });
const BUF = {};
let loading = null;

export function initAudio() {
  if (ctx) { ctx.resume?.(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch (e) { ctx = null; }
  if (ctx) loadSounds();
}

// Descarga y decodifica las grabaciones (en segundo plano: el juego no espera).
function loadSounds() {
  if (loading) return loading;
  loading = Promise.all(Object.entries(files).map(async ([path, url]) => {
    const name = path.slice(path.lastIndexOf('/') + 1, -4);
    try {
      const data = await (await fetch(url)).arrayBuffer();
      BUF[name] = await new Promise((res, rej) => ctx.decodeAudioData(data, res, rej));
    } catch (e) { /* sin esta grabación se usa el sintetizador */ }
  })).then(() => { BUF.day = BUF.day && seamless(BUF.day, 2); BUF.night = BUF.night && seamless(BUF.night, 1); startAmbience(); });
  return loading;
}

// Bucle sin cortes: el final se funde sobre el principio.
function seamless(buf, fade) {
  const sr = buf.sampleRate, F = Math.floor(fade * sr), N = buf.length - F;
  if (N <= F) return buf;
  const out = ctx.createBuffer(1, N, sr), src = buf.getChannelData(0), dst = out.getChannelData(0);
  for (let i = 0; i < N; i++) dst[i] = src[i];
  for (let i = 0; i < F; i++) { const k = i / F; dst[i] = src[i] * k + src[N + i] * (1 - k); }
  return out;
}

const soundOn = () => ctx && G.state?.settings.sound !== false;
function play(name, { vol = 0.5, rate = 1, delay = 0 } = {}) {
  const b = BUF[name];
  if (!b || !soundOn()) return false;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = b;
  src.playbackRate.value = rate;
  g.gain.value = vol;
  src.connect(g); g.connect(master);
  src.start(ctx.currentTime + delay);
  return true;
}
const rnd = (a, b) => a + Math.random() * (b - a);

// Grabaciones para cada efecto; si no están cargadas se usa el sintetizador.
const REC = {
  step: () => play('step' + Math.floor(Math.random() * 5), { vol: 0.32, rate: rnd(0.9, 1.08) }),
  door: () => play('door_open', { vol: 0.55 }),
  cash: () => play('cash1', { vol: 0.6 }) && play('coins', { vol: 0.25, delay: 0.12 }),
  pack: () => play('pack', { vol: 0.6 }),
  harvest: () => play('harvest', { vol: 0.6 }),
  click: () => play('click', { vol: 0.45 }),
  open: () => play('open', { vol: 0.45 }),
  close: () => play('close', { vol: 0.45 }),
  msg: () => play('msg1', { vol: 0.6 }) && play('msg2', { vol: 0.6, delay: 0.12 }),
  error: () => play('error', { vol: 0.45 }),
  pop: () => play('pop', { vol: 0.5 }),
  level: () => play('level', { vol: 0.55 }),
};

// ---- ambiente: pájaros de día, grillos de noche, tráfico cercano ----
const amb = {};
function loopSrc(name, vol = 0) {
  const b = BUF[name];
  if (!b) return null;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = b; src.loop = true;
  g.gain.value = vol;
  src.connect(g); g.connect(master);
  src.start();
  return { src, g };
}
function startAmbience() {
  if (!ctx || amb.day) return;
  amb.day = loopSrc('day');
  amb.night = loopSrc('night');
  amb.engine = loopSrc('engine');
}
// day: 0..1 (1 = pleno día); indoor reduce el exterior; car: {dist, speed} del coche más cercano
export function updateAmbience(day, indoor, car) {
  if (!ctx || !amb.day) return;
  const on = soundOn() ? 1 : 0, out = indoor ? 0.35 : 1, t = ctx.currentTime;
  amb.day?.g.gain.setTargetAtTime(on * out * 0.16 * day, t, 0.5);
  amb.night?.g.gain.setTargetAtTime(on * out * 0.12 * (1 - day), t, 0.5);
  if (amb.engine) {
    const k = car ? Math.max(0, 1 - car.dist / 28) : 0;
    amb.engine.g.gain.setTargetAtTime(on * out * 0.22 * k * k, t, 0.15);
    amb.engine.src.playbackRate.setTargetAtTime(0.7 + Math.min(1, (car?.speed || 0) / 12) * 0.6, t, 0.3);
  }
}

function tone(freq, dur, { type = 'sine', vol = 0.3, slide = 0, delay = 0 } = {}) {
  if (!ctx || !G.state?.settings.sound) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.2, freq = 1200, delay = 0 } = {}) {
  if (!ctx || !G.state?.settings.sound) return;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t);
}

const SFX = {
  click: () => tone(900, 0.05, { type: 'square', vol: 0.08 }),
  open: () => { tone(520, 0.08, { vol: 0.15 }); tone(780, 0.1, { vol: 0.12, delay: 0.05 }); },
  close: () => { tone(700, 0.07, { vol: 0.12 }); tone(460, 0.09, { vol: 0.1, delay: 0.05 }); },
  cash: () => { tone(1320, 0.08, { type: 'triangle', vol: 0.2 }); tone(1760, 0.25, { type: 'triangle', vol: 0.2, delay: 0.08 }); noise(0.12, { vol: 0.08, freq: 5000 }); },
  msg: () => { tone(988, 0.09, { vol: 0.18 }); tone(1319, 0.14, { vol: 0.18, delay: 0.1 }); },
  error: () => tone(180, 0.2, { type: 'square', vol: 0.12, slide: -60 }),
  pop: () => tone(500, 0.08, { vol: 0.2, slide: 400 }),
  step: () => noise(0.06, { vol: 0.05, freq: 700 }),
  water: () => noise(0.6, { vol: 0.12, freq: 2500 }),
  harvest: () => { noise(0.15, { vol: 0.15, freq: 3000 }); tone(660, 0.1, { vol: 0.12, delay: 0.1 }); tone(880, 0.15, { vol: 0.12, delay: 0.2 }); },
  door: () => { noise(0.18, { vol: 0.14, freq: 500 }); tone(140, 0.15, { type: 'triangle', vol: 0.15 }); },
  pack: () => { noise(0.1, { vol: 0.12, freq: 4000 }); tone(1200, 0.05, { vol: 0.08, delay: 0.08 }); },
  mix: () => { for (let i = 0; i < 6; i++) tone(300 + i * 90, 0.12, { type: 'triangle', vol: 0.08, delay: i * 0.07 }); },
  level: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.18, delay: i * 0.12 })); },
  whistle: () => { tone(2200, 0.25, { vol: 0.15 }); tone(2200, 0.35, { vol: 0.15, delay: 0.3 }); },
  jump: () => tone(300, 0.08, { vol: 0.06, slide: 120 }),
};

export function sfx(name) { try { if (!REC[name]?.()) SFX[name]?.(); } catch (e) { /* audio no disponible */ } }

export function setSiren(on) {
  if (!ctx) return;
  if (on && !siren && soundOn() && BUF.siren) {
    const l = loopSrc('siren', 0);
    l.g.gain.setTargetAtTime(0.22, ctx.currentTime, 0.3);
    siren = { o: l.src, lfo: null, g: l.g };
    return;
  }
  if (!on && siren && !siren.lfo) {
    const sv = siren; siren = null;
    sv.g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    setTimeout(() => { try { sv.o.stop(); } catch (e) { /* ya parado */ } }, 2000);
    return;
  }
  if (on && !siren && G.state.settings.sound) {
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 720;
    lfo.frequency.value = 1.6; lg.gain.value = 220;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.value = 0.035;
    o.connect(g); g.connect(master);
    o.start(); lfo.start();
    siren = { o, lfo };
  } else if (!on && siren) {
    siren.o.stop(); siren.lfo.stop(); siren = null;
  }
}

// Para depurar: qué grabaciones se han cargado y si suena el ambiente.
export const audioStatus = () => ({ loaded: Object.keys(BUF).sort(), ambience: !!amb.day, state: ctx?.state });
