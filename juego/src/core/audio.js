import { G } from '../game.js';

// Efectos de sonido sintetizados con WebAudio (sin archivos externos).
let ctx = null, master = null, siren = null;

export function initAudio() {
  if (ctx) { ctx.resume?.(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch (e) { ctx = null; }
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

export function sfx(name) { try { SFX[name]?.(); } catch (e) { /* audio no disponible */ } }

export function setSiren(on) {
  if (!ctx) return;
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
