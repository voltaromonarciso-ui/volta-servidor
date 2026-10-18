// Iconos ilustrados (SVG) de todos los objetos, con el estilo de las fichas de
// producto: contorno suave, cristal translúcido, brillos y cogollos esponjosos.
// Cada icono va en su propio <img> (data URL) para que los degradados no choquen.

import { ITEMS } from '../data/items.js';

const OL = '#3a4a52';          // contorno
const W = 1.7;                 // grosor de contorno
const cache = new Map();

const f = (n) => +n.toFixed(2);

// pseudoaleatorio estable para que cada icono salga siempre igual
function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

// ---------- piezas ----------
// Cogollo: racimo de bolitas con un único contorno, sombra abajo y brillo arriba.
function bud(x, y, r, seed = 1, col = ['#8cc456', '#679c3b', '#b4df7c']) {
  const R = rng(seed);
  const balls = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R() * 0.4;
    const d = r * (0.56 + R() * 0.1);
    balls.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.88, r * (0.34 + R() * 0.1), a]);
  }
  balls.push([x - r * 0.12, y - r * 0.08, r * 0.5, 4], [x + r * 0.2, y + r * 0.1, r * 0.42, 1]);
  let s = '';
  for (const [bx, by, br] of balls) s += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="${OL}" stroke="${OL}" stroke-width="${W * 1.5}"/>`;
  for (const [bx, by, br] of balls) s += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="${col[0]}"/>`;
  // sombra suave en la mitad de abajo
  s += `<ellipse cx="${f(x + r * 0.1)}" cy="${f(y + r * 0.42)}" rx="${f(r * 0.72)}" ry="${f(r * 0.38)}" fill="${col[1]}" opacity=".55"/>`;
  // pliegues entre bolitas
  for (const [bx, by, br, a] of balls.slice(0, n)) if (Math.sin(a) > 0.2) s += `<path d="M${f(bx - br * 0.6)} ${f(by - br * 0.2)}Q${f(bx)} ${f(by + br * 0.5)} ${f(bx + br * 0.6)} ${f(by - br * 0.2)}" fill="none" stroke="${col[1]}" stroke-width="${f(r * 0.08)}" stroke-linecap="round"/>`;
  // brillos solo arriba a la izquierda
  for (const [bx, by, br, a] of balls) if (Math.sin(a) < -0.1 || a === 4) s += `<ellipse cx="${f(bx - br * 0.25)}" cy="${f(by - br * 0.3)}" rx="${f(br * 0.45)}" ry="${f(br * 0.3)}" fill="${col[2]}" opacity=".9"/>`;
  // un par de pelillos ámbar
  for (let i = 0; i < 2; i++) {
    const a = R() * Math.PI * 2, d = r * 0.45 * R();
    s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(r * 0.06)}" fill="#d9883a" opacity=".8"/>`;
  }
  return s;
}

function sparkle(x, y, r, col = '#fff') {
  return `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${col}" stroke="${OL}" stroke-width=".8" stroke-opacity=".35"/>`;
}

// Tarro de cristal con tapón de corcho (con o sin cogollos).
function jar(x, y, w, h, full, seed = 3) {
  const x0 = x - w / 2, x1 = x + w / 2, top = y - h / 2, bot = y + h / 2, r = w * 0.18;
  const neck = w * 0.12;
  const body = `M${f(x0 + neck)} ${f(top + h * 0.1)}C${f(x0)} ${f(top + h * 0.13)} ${f(x0)} ${f(top + h * 0.2)} ${f(x0)} ${f(top + h * 0.28)}L${f(x0)} ${f(bot - r)}Q${f(x0)} ${f(bot)} ${f(x0 + r)} ${f(bot)}L${f(x1 - r)} ${f(bot)}Q${f(x1)} ${f(bot)} ${f(x1)} ${f(bot - r)}L${f(x1)} ${f(top + h * 0.28)}C${f(x1)} ${f(top + h * 0.2)} ${f(x1)} ${f(top + h * 0.13)} ${f(x1 - neck)} ${f(top + h * 0.1)}Z`;
  let s = `<path d="${body}" fill="#e2f3f8" opacity="${full ? 0.6 : 0.85}"/>`;
  if (full) {
    const R = rng(seed);
    const bw = w * 0.2;
    const rows = [[bot - bw * 1.05, 3], [bot - bw * 2.6, 3], [bot - bw * 4.0, 2]];
    let k = 0;
    for (const [cy, n] of rows) for (let i = 0; i < n; i++) {
      const cx = x - (n - 1) * bw * 0.95 + i * bw * 1.9 + (R() - 0.5) * 2;
      s += bud(cx, cy, bw * 1.15, seed * 10 + k++);
    }
  }
  s += `<path d="${body}" fill="#e8f6fa" fill-opacity="${full ? 0.18 : 0.35}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
  // reflejos
  s += `<path d="M${f(x0 + w * 0.13)} ${f(top + h * 0.32)}L${f(x0 + w * 0.13)} ${f(bot - h * 0.14)}" stroke="#fff" stroke-width="${f(w * 0.08)}" stroke-linecap="round" opacity=".8"/>`;
  s += `<path d="M${f(x1 - w * 0.12)} ${f(top + h * 0.38)}L${f(x1 - w * 0.12)} ${f(top + h * 0.52)}" stroke="#fff" stroke-width="${f(w * 0.05)}" stroke-linecap="round" opacity=".7"/>`;
  // tapón de corcho
  const lw = w * 0.92, lh = h * 0.17, ly = top - lh * 0.15;
  s += `<rect x="${f(x - lw / 2)}" y="${f(ly)}" width="${f(lw)}" height="${f(lh)}" rx="${f(lh * 0.35)}" fill="url(#cork)" stroke="${OL}" stroke-width="${W}"/>`;
  s += `<rect x="${f(x - lw / 2 + 2)}" y="${f(ly + 1.4)}" width="${f(lw - 4)}" height="${f(lh * 0.22)}" rx="1" fill="#e3b77e" opacity=".8"/>`;
  s += `<path d="M${f(x - lw / 2 + 1)} ${f(ly + lh * 0.75)}H${f(x + lw / 2 - 1)}" stroke="#8a5a2b" stroke-width=".8" opacity=".6"/>`;
  return s;
}

// Bolsita zip transparente (con o sin cogollos).
function zipBag(x, y, w, h, full, seed = 5, tilt = 0) {
  const x0 = x - w / 2, x1 = x + w / 2, top = y - h / 2, bot = y + h / 2;
  const shape = `M${f(x0 + 1)} ${f(top)}L${f(x1 - 1)} ${f(top)}Q${f(x1)} ${f(top)} ${f(x1)} ${f(top + 1)}L${f(x1 + 1)} ${f(bot - 2)}Q${f(x1 + 1)} ${f(bot)} ${f(x1 - 2)} ${f(bot)}L${f(x0 + 2)} ${f(bot + 0.6)}Q${f(x0 - 0.6)} ${f(bot + 0.6)} ${f(x0 - 0.4)} ${f(bot - 2)}L${f(x0)} ${f(top + 1)}Q${f(x0)} ${f(top)} ${f(x0 + 1)} ${f(top)}Z`;
  let s = `<g transform="rotate(${tilt} ${x} ${y})"><path d="${shape}" fill="#eef4f6" opacity=".7"/>`;
  if (full) {
    const R = rng(seed);
    const bw = w * 0.17;
    const pts = [[-1.1, 0.62], [0.05, 0.66], [1.15, 0.6], [-0.6, 0.18], [0.65, 0.2], [0.0, -0.22]];
    pts.forEach(([px, py], i) => { s += bud(x + px * bw * 1.6 + (R() - 0.5), y + py * h * 0.42, bw * 1.15, seed * 10 + i); });
  }
  s += `<path d="${shape}" fill="#f6fbfc" fill-opacity="${full ? 0.22 : 0.5}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
  // cierre zip y agujero de colgar
  s += `<path d="M${f(x0 + 1)} ${f(top + h * 0.17)}H${f(x1 - 1)}" stroke="${OL}" stroke-width="1.1" opacity=".7"/>`;
  s += `<path d="M${f(x0 + 1)} ${f(top + h * 0.22)}H${f(x1 - 1)}" stroke="#9fb6bf" stroke-width="1"/>`;
  s += `<rect x="${f(x - w * 0.11)}" y="${f(top + h * 0.05)}" width="${f(w * 0.22)}" height="${f(h * 0.06)}" rx="${f(h * 0.03)}" fill="none" stroke="${OL}" stroke-width="1" opacity=".7"/>`;
  s += `<path d="M${f(x0 + w * 0.12)} ${f(top + h * 0.32)}L${f(x0 + w * 0.1)} ${f(bot - h * 0.12)}" stroke="#fff" stroke-width="${f(w * 0.06)}" stroke-linecap="round" opacity=".75"/>`;
  return s + '</g>';
}

// Cristal facetado.
function shard(x, y, w, h, col, rot = 0) {
  const [c0, c1, c2] = col;
  const pts = [[0, -h / 2], [w / 2, -h / 2 + w * 0.5], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2 + w * 0.5]];
  const P = (arr) => arr.map(([a, b]) => `${f(a)},${f(b)}`).join(' ');
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
  s += `<polygon points="${P(pts)}" fill="${c0}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
  s += `<polygon points="${P([[0, -h / 2], [0, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2 + w * 0.5]])}" fill="${c2}"/>`;
  s += `<polygon points="${P([[0, -h / 2], [w / 2, -h / 2 + w * 0.5], [w / 2, h / 2], [w * 0.15, h / 2], [w * 0.15, -h / 2 + w * 0.3]])}" fill="${c1}"/>`;
  s += `<polygon points="${P(pts)}" fill="none" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
  s += `<path d="M${f(-w * 0.28)} ${f(-h * 0.1)}V${f(h * 0.3)}" stroke="#fff" stroke-width="${f(w * 0.12)}" stroke-linecap="round" opacity=".7"/>`;
  return s + '</g>';
}
const GEM = {
  blue: ['#3fa9f5', '#1f6fd1', '#8fd3ff'],
  purple: ['#a463f2', '#6b35c4', '#cfa6ff'],
  green: ['#2fc28a', '#178a5c', '#8ff0c4'],
  red: ['#f0506e', '#b82c48', '#ff9fb2'],
  teal: ['#36c9d6', '#1c8fa0', '#9ff0f6'],
};
function crystalCluster(x, y, s = 1) {
  return shard(x - 9 * s, y + 3 * s, 8 * s, 16 * s, GEM.blue, -18) + shard(x + 9 * s, y + 3 * s, 8 * s, 15 * s, GEM.red, 20) +
    shard(x + 3 * s, y - 2 * s, 9 * s, 22 * s, GEM.purple, 8) + shard(x - 3 * s, y + 4 * s, 8 * s, 14 * s, GEM.green, -6) +
    shard(x + 1 * s, y + 9 * s, 6 * s, 8 * s, GEM.teal, 40);
}

// Bolsa metalizada Sweet Shards con boca dentada y ventana de cristales.
function shardsBag(x, y, w, h, full = true) {
  const x0 = x - w / 2, x1 = x + w / 2, top = y - h / 2, bot = y + h / 2;
  let teeth = `M${f(x0)} ${f(top + 3)}`;
  const n = 8;
  for (let i = 0; i < n; i++) teeth += `L${f(x0 + (i + 0.5) * w / n)} ${f(top)}L${f(x0 + (i + 1) * w / n)} ${f(top + 3)}`;
  const shape = `${teeth}L${f(x1 + 0.6)} ${f(bot - 3)}Q${f(x1 + 0.6)} ${f(bot)} ${f(x1 - 2.5)} ${f(bot)}L${f(x0 + 2.5)} ${f(bot)}Q${f(x0 - 0.6)} ${f(bot)} ${f(x0 - 0.6)} ${f(bot - 3)}Z`;
  let s = `<path d="${shape}" fill="url(#foil)" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
  s += `<path d="M${f(x0 + 1)} ${f(top + 6)}H${f(x1 - 1)}" stroke="#c9c3cf" stroke-width="1"/>`;
  if (full) s += crystalCluster(x, y + h * 0.12, w / 42);
  else s += `<rect x="${f(x - w * 0.3)}" y="${f(y)}" width="${f(w * 0.6)}" height="${f(h * 0.3)}" rx="3" fill="#efe9f6" stroke="#c7b6dc"/>` + shard(x, y + h * 0.16, w * 0.16, h * 0.24, GEM.purple, 10);
  // etiqueta rosa con el nombre
  const ly = top + h * 0.2;
  s += `<rect x="${f(x - w * 0.36)}" y="${f(ly)}" width="${f(w * 0.72)}" height="${f(h * 0.2)}" rx="${f(h * 0.1)}" fill="#fff" stroke="#e05aa8" stroke-width="1.3"/>`;
  s += `<text x="${f(x)}" y="${f(ly + h * 0.095)}" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${f(h * 0.085)}" fill="#7b4fd6" text-anchor="middle">SWEET</text>`;
  s += `<text x="${f(x)}" y="${f(ly + h * 0.175)}" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${f(h * 0.085)}" fill="#e0428f" text-anchor="middle">SHARDS</text>`;
  s += `<path d="M${f(x0 + 3)} ${f(top + h * 0.48)}L${f(x0 + 3)} ${f(bot - 4)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
  return s;
}

function sack(x, y, w, h, col, label) {
  const x0 = x - w / 2, x1 = x + w / 2, top = y - h / 2, bot = y + h / 2;
  let s = `<path d="M${f(x0 + 3)} ${f(top + 4)}Q${f(x)} ${f(top - 1)} ${f(x1 - 3)} ${f(top + 4)}L${f(x1 + 1)} ${f(bot - 5)}Q${f(x1 + 1)} ${f(bot)} ${f(x1 - 4)} ${f(bot)}L${f(x0 + 4)} ${f(bot)}Q${f(x0 - 1)} ${f(bot)} ${f(x0 - 1)} ${f(bot - 5)}Z" fill="${col[0]}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
  s += `<path d="M${f(x0 + 2)} ${f(top + 5)}Q${f(x)} ${f(top + 9)} ${f(x1 - 2)} ${f(top + 5)}" fill="none" stroke="${col[1]}" stroke-width="1.6"/>`;
  s += `<path d="M${f(x)} ${f(top + 1.5)}L${f(x - 3)} ${f(top - 2)}M${f(x)} ${f(top + 1.5)}L${f(x + 3)} ${f(top - 2)}" stroke="${OL}" stroke-width="1.3" stroke-linecap="round"/>`;
  s += `<path d="M${f(x0 + 3)} ${f(top + 10)}V${f(bot - 4)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/>`;
  s += label;
  return s;
}

const DEFS = `<defs>
<linearGradient id="cork" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d49a5a"/><stop offset="1" stop-color="#a86b34"/></linearGradient>
<linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8fd"/><stop offset=".5" stop-color="#e6e0ec"/><stop offset="1" stop-color="#f7f3fa"/></linearGradient>
<linearGradient id="note" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd18a"/><stop offset="1" stop-color="#4f9d55"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5eaee"/><stop offset="1" stop-color="#9aa6af"/></linearGradient>
<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a066"/><stop offset="1" stop-color="#a8703c"/></linearGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#ff8a2b" stop-opacity="0"/></radialGradient>
</defs>`;

const shadow = (x, y, w) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f(w * 0.18)}" fill="#000" opacity=".16"/>`;

function banknote(x, y, w, h, rot = 0) {
  let s = `<g transform="rotate(${rot} ${x} ${y})">`;
  s += `<rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${w}" height="${h}" rx="2" fill="url(#note)" stroke="${OL}" stroke-width="${W}"/>`;
  s += `<rect x="${f(x - w / 2 + 3)}" y="${f(y - h / 2 + 3)}" width="${w - 6}" height="${h - 6}" rx="1.5" fill="none" stroke="#2f6b35" stroke-width=".9" opacity=".7"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${f(h * 0.28)}" fill="#c9eec4" stroke="#2f6b35" stroke-width=".9"/>`;
  s += `<text x="${x}" y="${f(y + h * 0.13)}" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${f(h * 0.36)}" fill="#2f6b35" text-anchor="middle">$</text>`;
  return s + '</g>';
}

// ---------- dibujos de cada objeto ----------
const DRAW = {
  cash: () => banknote(33, 40, 44, 22, -8) + banknote(31, 33, 44, 22, 4) + banknote(32, 27, 44, 22, -3) +
    `<rect x="27" y="16" width="9" height="22" rx="1.5" fill="#f4d35e" stroke="${OL}" stroke-width="1.4" transform="rotate(-3 32 27)"/>`,
  semilla: () => {
    // ovalada con punta suave, cáscara gris parda lisa con jaspeado oscuro y brillo
    const seed = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})">` +
      `<path d="M${x} ${y - 10}C${x + 5} ${y - 9} ${x + 7.5} ${y - 2} ${x + 7.5} ${y + 2}C${x + 7.5} ${y + 7} ${x + 4} ${y + 10} ${x} ${y + 10}C${x - 4} ${y + 10} ${x - 7.5} ${y + 7} ${x - 7.5} ${y + 2}C${x - 7.5} ${y - 2} ${x - 5} ${y - 9} ${x} ${y - 10}Z" fill="#9a8a72" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>` +
      `<path d="M${x - 4} ${y - 3}q2 -2 3 1q1 3 3 1M${x - 3} ${y + 4}q3 1 4 -1q2 -2 4 0M${x + 2} ${y - 6}q2 1 1 3M${x - 5} ${y + 1}q1 2 0 3" stroke="#3e3022" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>` +
      `<path d="M${x} ${y - 10}V${y + 10}" stroke="#6d5c45" stroke-width=".9" opacity=".6"/>` +
      `<ellipse cx="${x - 3}" cy="${y - 4}" rx="1.6" ry="3" fill="#fff" opacity=".45"/></g>`;
    return shadow(32, 54, 20) + seed(22, 40, -30) + seed(41, 41, 25) + seed(32, 25, 4);
  },
  cogollo: () => shadow(32, 52, 22) + bud(23, 41, 11, 4) + bud(41, 41, 11, 7) + bud(32, 28, 12.5, 9) + sparkle(52, 16, 4) + sparkle(12, 20, 3),
  bolsa: () => zipBag(32, 33, 38, 46, true, 6, -6) + sparkle(54, 12, 4),
  tarro: () => shadow(32, 58, 20) + jar(32, 35, 36, 44, true, 4) + sparkle(54, 12, 4) + sparkle(10, 24, 3),
  tarro_v: () => shadow(32, 58, 20) + jar(32, 35, 36, 44, false) + sparkle(54, 14, 4),
  bolsita: () => zipBag(36, 34, 34, 42, false, 1, 8) + zipBag(28, 31, 34, 42, false, 2, -6),
  cristal: () => shadow(32, 54, 22) + crystalCluster(32, 36, 1.25) + sparkle(54, 14, 4) + sparkle(10, 22, 3),
  shards: () => shardsBag(32, 33, 40, 50, true) + sparkle(56, 14, 4),
  bolsa_ss: () => `<g opacity=".95">${shardsBag(37, 35, 34, 44, false)}</g>` + shardsBag(28, 31, 34, 44, false),
  caja: () => {
    let s = shadow(32, 54, 24);
    s += `<path d="M10 24L32 14L54 24L54 46L32 56L10 46Z" fill="#c8955a" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M10 24L32 34L54 24M32 34V56" fill="none" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M32 34L54 24L54 46L32 56Z" fill="#a8743f"/><path d="M32 34L54 24L54 46L32 56Z" fill="none" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M21 19L43 29L43 33L21 23Z" fill="#e6c48f" stroke="${OL}" stroke-width="1"/>`;
    s += `<path d="M14 33L24 37.5V42L14 37.5Z" fill="#fff" stroke="${OL}" stroke-width=".7"/><path d="M16 35.5L22 38.2M16 37L21 39.3" stroke="${OL}" stroke-width=".6"/>`;
    return s;
  },
  maceta: () => {
    let s = shadow(32, 56, 20);
    s += `<path d="M14 26H50L45 54Q44 56 42 56H22Q20 56 19 54Z" fill="#d0703c" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M30 26H50L45 54Q44 56 42 56H34Z" fill="#b65a2b" opacity=".6"/>`;
    s += `<rect x="11" y="20" width="42" height="9" rx="3" fill="#e0844c" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<ellipse cx="32" cy="21.5" rx="18" ry="2.4" fill="#5b3a22"/>`;
    s += `<path d="M18 33V48" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>`;
    return s;
  },
  tierra: () => shadow(32, 58, 20) + sack(32, 34, 36, 44, ['#8a6340', '#6d4b2e'], `<rect x="20" y="30" width="24" height="14" rx="3" fill="#f1e3c8" stroke="${OL}" stroke-width="1.1"/><path d="M24 40Q32 32 40 40" fill="#6b4a2d"/>`),
  tierra_plus: () => shadow(32, 58, 20) + sack(32, 34, 36, 44, ['#5d7a3a', '#465e2b'], `<rect x="20" y="29" width="24" height="16" rx="3" fill="#f3f0d9" stroke="${OL}" stroke-width="1.1"/><path d="M32 42C26 40 25 33 31 30C33 35 33 38 32 42Z" fill="#5fb84a" stroke="${OL}" stroke-width=".8"/><path d="M33 42C38 40 39 35 35 32" fill="#7fd060" stroke="${OL}" stroke-width=".8"/>`) +
    `<circle cx="49" cy="16" r="7" fill="#ffd23f" stroke="${OL}" stroke-width="1.4"/><path d="M49 12V20M45 16H53" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`,
  fertil: () => {
    let s = shadow(32, 58, 16);
    s += `<rect x="27" y="7" width="10" height="7" rx="2" fill="#2f7d3a" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<path d="M24 16Q24 13 28 13H36Q40 13 40 16L44 22V52Q44 56 40 56H24Q20 56 20 52V22Z" fill="#4fb35a" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<rect x="22" y="28" width="20" height="18" rx="2" fill="#f4f9ec" stroke="${OL}" stroke-width="1"/>`;
    s += `<path d="M32 43C27 41 27 35 31 32C33 36 33 39 32 43Z" fill="#4fb35a"/><path d="M32 43C37 40 37 35 34 33" fill="none" stroke="#2f7d3a" stroke-width="1.4"/>`;
    s += `<path d="M24 22V27M24 48V52" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`;
    return s;
  },
  regadera: () => {
    let s = shadow(30, 56, 22);
    s += `<path d="M44 34L58 20L60 23L48 40Z" fill="#3a9bd9" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<ellipse cx="59" cy="21" rx="3" ry="4.5" transform="rotate(-45 59 21)" fill="#2b7bb3" stroke="${OL}" stroke-width="1.2"/>`;
    s += `<path d="M14 26H44L46 50Q46 54 42 54H16Q12 54 12 50Z" fill="#4cb0ef" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M20 26Q28 10 38 26" fill="none" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M20 26Q28 10 38 26" fill="none" stroke="#2b7bb3" stroke-width="3" stroke-linecap="round"/>`;
    s += `<path d="M18 31V48" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>`;
    s += `<circle cx="61" cy="30" r="1.4" fill="#7fd3ff"/><circle cx="58" cy="34" r="1.2" fill="#7fd3ff"/>`;
    return s;
  },
  mesa_emp: () => {
    let s = shadow(32, 57, 26);
    s += `<path d="M6 30L30 22L58 28L34 38Z" fill="url(#wood)" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M6 30V34L34 42V38ZM34 38V42L58 32V28Z" fill="#8f5c2e" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>`;
    s += `<path d="M9 34V54M32 41V58M55 32V50" stroke="#46525a" stroke-width="3" stroke-linecap="round"/>`;
    s += `<rect x="13" y="23" width="12" height="6" rx="1.5" fill="url(#steel)" stroke="${OL}" stroke-width="1.1" transform="skewY(-8)"/>`;
    s += `<g transform="translate(32 7) scale(.5)">${zipBag(14, 30, 20, 26, true, 11, 6)}</g>`;
    s += `<g transform="translate(13 2) scale(.42)">${bud(30, 40, 12, 3)}</g>`;
    return s;
  },
  envasadora: () => {
    let s = shadow(32, 58, 24);
    s += `<rect x="12" y="18" width="40" height="38" rx="4" fill="#5a6772" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<rect x="12" y="10" width="40" height="11" rx="3" fill="#7d8b96" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<rect x="16" y="22" width="32" height="26" rx="3" fill="#2a3238" stroke="${OL}" stroke-width="1.2"/>`;
    s += `<g transform="translate(17 13) scale(.48)">${jar(32, 40, 30, 36, true, 8)}</g>`;
    s += `<circle cx="18" cy="52" r="2" fill="#2ecc71"/><circle cx="24" cy="52" r="2" fill="#e74c3c"/><rect x="32" y="50" width="14" height="4" rx="1" fill="#55d6ff"/>`;
    return s;
  },
  hornillo: () => {
    let s = shadow(32, 58, 24);
    s += `<rect x="8" y="34" width="48" height="22" rx="4" fill="#3c454d" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<rect x="6" y="30" width="52" height="7" rx="2" fill="url(#steel)" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<circle cx="32" cy="32" r="14" fill="url(#glow)"/>`;
    s += `<path d="M24 31Q26 24 28 28Q30 21 32 27Q34 22 36 28Q38 24 40 31Z" fill="#ff9a2b" stroke="#c4561a" stroke-width=".8"/>`;
    s += `<path d="M16 14H48L46 28Q46 30 44 30H20Q18 30 18 28Z" fill="#b9c3cb" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<ellipse cx="32" cy="14" rx="16" ry="3.2" fill="#c76cf0" stroke="${OL}" stroke-width="1.3"/>`;
    s += `<path d="M48 18H55" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<circle cx="16" cy="46" r="3" fill="#20262b" stroke="#888" stroke-width="1"/><circle cx="48" cy="46" r="3" fill="#20262b" stroke="#888" stroke-width="1"/>`;
    s += `<path d="M26 9Q24 5 27 2M34 9Q32 5 35 2" fill="none" stroke="#c9b6dc" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`;
    return s;
  },
  catalizador: () => {
    let s = shadow(32, 58, 18);
    s += `<path d="M27 8H37V24L50 50Q52 56 46 56H18Q12 56 14 50L27 24Z" fill="#e8f6fa" fill-opacity=".6" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M20 38H44L50 50Q52 55 46 55H18Q12 55 14 50Z" fill="#36c9d6"/>`;
    s += `<path d="M27 8H37V24L50 50Q52 56 46 56H18Q12 56 14 50L27 24Z" fill="none" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<rect x="25" y="5" width="14" height="5" rx="1.5" fill="#6b7a85" stroke="${OL}" stroke-width="1.2"/>`;
    s += `<circle cx="28" cy="46" r="2" fill="#bff6fb"/><circle cx="36" cy="42" r="1.4" fill="#bff6fb"/><circle cx="33" cy="49" r="1.2" fill="#bff6fb"/>`;
    s += `<path d="M21 46L25 40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    return s + sparkle(50, 16, 4, '#bff6fb');
  },
  azucar: () => {
    let s = shadow(32, 58, 20);
    s += `<path d="M14 18H50V52Q50 56 46 56H18Q14 56 14 52Z" fill="#f7f7f2" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M14 18L18 10H46L50 18" fill="#ececE4" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<rect x="14" y="26" width="36" height="16" fill="#4a90d9" stroke="${OL}" stroke-width="1.2"/>`;
    s += `<text x="32" y="38" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="9" fill="#fff" text-anchor="middle">AZÚCAR</text>`;
    const cube = (x, y) => `<path d="M${x} ${y}l5 -2.5l5 2.5v5.5l-5 2.5l-5 -2.5z" fill="#fff" stroke="${OL}" stroke-width="1"/><path d="M${x} ${y}l5 2.5l5 -2.5M${x + 5} ${y + 2.5}v5.5" fill="none" stroke="${OL}" stroke-width=".7"/>`;
    return s + cube(40, 48) + cube(48, 50);
  },
  colorante: () => {
    const bottle = (x, col) => `<path d="M${x - 6} 30Q${x - 6} 26 ${x - 3} 25V20H${x + 3}V25Q${x + 6} 26 ${x + 6} 30V52Q${x + 6} 55 ${x + 3} 55H${x - 3}Q${x - 6} 55 ${x - 6} 52Z" fill="${col}" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>` +
      `<path d="M${x - 2} 20V12Q${x - 2} 8 ${x} 8Q${x + 2} 8 ${x + 2} 12V20Z" fill="#f2f2f2" stroke="${OL}" stroke-width="1.2"/>` +
      `<rect x="${x - 5}" y="36" width="10" height="9" fill="#fff" opacity=".85"/><path d="M${x - 3.5} 29V33" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
    return shadow(32, 58, 24) + bottle(18, '#ef4b6c') + bottle(46, '#3fa9f5') + bottle(32, '#a463f2') +
      `<path d="M50 60q2 -4 4 0q-2 3 -4 0z" fill="#3fa9f5"/>`;
  },
  lampara: () => {
    let s = `<path d="M22 4V14M42 4V14" stroke="${OL}" stroke-width="1.5"/>`;
    s += `<path d="M14 24L50 24L56 44L8 44Z" fill="#c0569b" opacity=".25"/>`;
    s += `<rect x="10" y="14" width="44" height="12" rx="3" fill="#2f363c" stroke="${OL}" stroke-width="${W}"/>`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${15 + i * 6.8}" cy="22" r="1.8" fill="${i % 2 ? '#ff5fd2' : '#8f6bff'}"/>`;
    s += `<path d="M10 52Q20 40 30 52M30 52Q40 38 52 52" fill="#5fb84a" stroke="${OL}" stroke-width="1.2"/>`;
    return s + sparkle(54, 40, 3, '#ffd6f4');
  },
  estante: () => {
    let s = shadow(32, 60, 22);
    s += `<path d="M12 6V58M52 6V58" stroke="#2f5d8a" stroke-width="4" stroke-linecap="round"/>`;
    for (const y of [16, 32, 48]) s += `<rect x="10" y="${y}" width="44" height="4" rx="1" fill="#e07b2e" stroke="${OL}" stroke-width="1.1"/>`;
    s += `<rect x="16" y="8" width="12" height="8" fill="#c8955a" stroke="${OL}" stroke-width="1"/><rect x="31" y="10" width="9" height="6" fill="#d9a066" stroke="${OL}" stroke-width="1"/>`;
    s += `<rect x="17" y="24" width="10" height="8" fill="#c8955a" stroke="${OL}" stroke-width="1"/><rect x="34" y="22" width="14" height="10" fill="#b98550" stroke="${OL}" stroke-width="1"/>`;
    s += `<rect x="20" y="40" width="22" height="8" fill="#c8955a" stroke="${OL}" stroke-width="1"/>`;
    return s;
  },
  cama: () => {
    let s = shadow(32, 58, 28);
    s += `<rect x="6" y="20" width="8" height="34" rx="2" fill="#8a5a3a" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<path d="M10 36H56V50H10Z" fill="#a8744c" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M12 30H56Q58 30 58 33V38H12Z" fill="#f4f1ea" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<path d="M28 30H57Q59 30 59 34V40H28Z" fill="#3f78c4" stroke="${OL}" stroke-width="${W}" stroke-linejoin="round"/>`;
    s += `<rect x="14" y="25" width="13" height="7" rx="3.5" fill="#fff" stroke="${OL}" stroke-width="1.2"/>`;
    s += `<path d="M12 50V56M54 50V56" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
    return s + `<text x="46" y="20" font-family="Arial Black,Arial" font-weight="900" font-size="9" fill="#8fb6ff">z</text><text x="52" y="13" font-family="Arial Black,Arial" font-weight="900" font-size="7" fill="#8fb6ff">z</text>`;
  },
  armario: () => {
    let s = shadow(32, 60, 20);
    s += `<rect x="13" y="4" width="38" height="54" rx="3" fill="#6f7d88" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<rect x="16" y="7" width="15" height="48" rx="1.5" fill="#8796a1" stroke="${OL}" stroke-width="1.1"/><rect x="33" y="7" width="15" height="48" rx="1.5" fill="#8796a1" stroke="${OL}" stroke-width="1.1"/>`;
    for (const y of [12, 16, 20]) s += `<path d="M19 ${y}H28M36 ${y}H45" stroke="#56636c" stroke-width="1.4" stroke-linecap="round"/>`;
    s += `<rect x="28" y="28" width="2" height="9" rx="1" fill="#e0e4e7"/><rect x="34" y="28" width="2" height="9" rx="1" fill="#e0e4e7"/>`;
    return s;
  },
  caja_fuerte: () => {
    let s = shadow(32, 58, 24);
    s += `<rect x="10" y="12" width="44" height="44" rx="4" fill="#3d4650" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<rect x="14" y="16" width="36" height="36" rx="2" fill="#56616c" stroke="${OL}" stroke-width="1.2"/>`;
    s += `<circle cx="32" cy="34" r="9" fill="#c9a227" stroke="${OL}" stroke-width="1.4"/><circle cx="32" cy="34" r="3" fill="#7a5f12"/>`;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<path d="M${(32 + Math.cos(a) * 6).toFixed(1)} ${(34 + Math.sin(a) * 6).toFixed(1)}L${(32 + Math.cos(a) * 8).toFixed(1)} ${(34 + Math.sin(a) * 8).toFixed(1)}" stroke="#7a5f12" stroke-width="1"/>`; }
    s += `<rect x="44" y="28" width="4" height="12" rx="2" fill="#c8ccd0" stroke="${OL}" stroke-width="1"/>`;
    s += `<path d="M14 56V60M50 56V60" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
    return s;
  },
  humidificador: () => {
    let s = shadow(32, 58, 16);
    s += `<path d="M20 26Q20 22 24 22H40Q44 22 44 26V54Q44 57 41 57H23Q20 57 20 54Z" fill="#eef3f6" stroke="${OL}" stroke-width="${W}"/>`;
    s += `<path d="M21 40H43V54Q43 56 41 56H23Q21 56 21 54Z" fill="#7cc7ef" opacity=".85"/>`;
    s += `<rect x="27" y="17" width="10" height="6" rx="2" fill="#c8d2d8" stroke="${OL}" stroke-width="1.2"/>`;
    s += `<circle cx="32" cy="47" r="3" fill="#2ecc71" stroke="${OL}" stroke-width="1"/>`;
    s += `<path d="M30 15Q26 11 30 7Q34 3 30 0M36 14Q40 10 36 6" fill="none" stroke="#b9e3f7" stroke-width="2.4" stroke-linecap="round"/>`;
    return s;
  },
};

export function iconSVG(id) {
  const d = DRAW[id];
  if (!d) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${DEFS}${d()}</svg>`;
}

export function iconURL(id) {
  if (!cache.has(id)) {
    const svg = iconSVG(id);
    cache.set(id, svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : null);
  }
  return cache.get(id);
}

// HTML del icono de un objeto (cae al emoji si no hay dibujo).
export function icon(id, fallback = '', cls = 'ico') {
  const url = iconURL(id);
  return url ? `<img class="${cls}" src="${url}" alt="" draggable="false">` : `<span class="${cls} emo">${fallback}</span>`;
}

// Icono de un objeto del catálogo, en línea con el texto.
export const ii = (id, cls = 'ico') => icon(id, ITEMS[id]?.icon || '', cls);

// Cara frontal de la bolsa Sweet Shards (para la textura del modelo 3D).
export function shardsFaceURL() {
  const body = `<rect width="64" height="80" fill="url(#foil)"/>` +
    Array.from({ length: 16 }, (_, i) => `<rect x="${i * 4}" y="0" width="2" height="7" fill="#d9d2e2"/>`).join('') +
    `<path d="M0 9H64" stroke="#cfc6da" stroke-width="1.2"/>` +
    `<rect x="9" y="15" width="46" height="17" rx="8.5" fill="#fff" stroke="#e05aa8" stroke-width="1.6"/>` +
    `<text x="32" y="23" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="7.4" fill="#7b4fd6" text-anchor="middle">SWEET</text>` +
    `<text x="32" y="30" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="7.4" fill="#e0428f" text-anchor="middle">SHARDS</text>` +
    crystalCluster(32, 56, 1.25) + sparkle(8, 40, 3) + sparkle(56, 44, 3.4) + sparkle(52, 70, 2.4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="256" height="320">${DEFS}${body}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
