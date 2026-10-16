import * as THREE from 'three';

// Texturas procedurales dibujadas en canvas (fachadas, carteles, asfalto...).
function mk(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}

function grain(g, w, h, amt, r) {
  for (let i = 0; i < (w * h) / 40; i++) {
    const v = r() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${amt * r()})`;
    g.fillRect(r() * w, r() * h, 2, 2);
  }
}

const facadeCache = new Map();

// Fachada de un edificio: devuelve { map, emissive } con ventanas iluminables.
export function facade(o) {
  const key = JSON.stringify(o);
  if (facadeCache.has(key)) return facadeCache.get(key);
  const { wall = '#d9c6a5', trim = '#f2ece0', cols = 3, rows = 2, door = -1, style = 'house', seed = 1, awning = '#c0392b', labels } = o;
  const CW = 64, CH = 64, W = cols * CW, H = rows * CH;
  const r = rng(seed);
  const lit = [];
  const map = mk(W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    grain(g, W, H, 0.06, r);
    if (style === 'warehouse') {
      g.strokeStyle = shade(wall, 0.85); g.lineWidth = 2;
      for (let x = 0; x < W; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    }
    if (style === 'brick') {
      g.fillStyle = shade(wall, 0.88);
      for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) g.fillRect(x, y, 15, 7);
    }
    // zócalo y cornisas
    g.fillStyle = shade(wall, 0.7); g.fillRect(0, H - 6, W, 6);
    g.fillStyle = trim;
    for (let rI = 1; rI < rows; rI++) g.fillRect(0, rI * CH - 3, W, 3);
    g.fillRect(0, 0, W, 4);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x0 = col * CW, y0 = (rows - 1 - row) * CH;
        const isDoor = row === 0 && col === door;
        if (style === 'motel' && row === 0) {
          // puerta + ventana por habitación
          g.fillStyle = '#6b4a2f'; g.fillRect(x0 + 6, y0 + 16, 18, 46);
          g.fillStyle = '#e8c35a'; g.fillRect(x0 + 20, y0 + 40, 3, 3);
          g.fillStyle = trim; g.fillRect(x0 + 8, y0 + 20, 14, 8);
          g.fillStyle = '#333'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center';
          g.fillText(labels ? labels[col] : String(col + 1), x0 + 15, y0 + 27);
          drawWindow(g, x0 + 30, y0 + 18, 28, 24, trim, r, lit);
          continue;
        }
        if (isDoor) {
          if (style === 'shop') {
            g.fillStyle = '#3a4a56'; g.fillRect(x0 + 14, y0 + 14, 36, 50);
            g.fillStyle = 'rgba(160,210,235,0.75)'; g.fillRect(x0 + 17, y0 + 17, 30, 44);
            g.fillStyle = '#ccc'; g.fillRect(x0 + 31, y0 + 17, 2, 44);
            lit.push([x0 + 17, y0 + 17, 30, 44, 0.9]);
          } else if (style === 'warehouse') {
            g.fillStyle = '#7d858c'; g.fillRect(x0 + 4, y0 + 10, 56, 54);
            g.strokeStyle = '#646b71'; for (let y = y0 + 14; y < y0 + 64; y += 5) { g.beginPath(); g.moveTo(x0 + 4, y); g.lineTo(x0 + 60, y); g.stroke(); }
          } else {
            g.fillStyle = trim; g.fillRect(x0 + 19, y0 + 12, 26, 52);
            g.fillStyle = style === 'house' ? '#7a4e2d' : '#4d5b66'; g.fillRect(x0 + 22, y0 + 15, 20, 49);
            g.fillStyle = '#e8c35a'; g.fillRect(x0 + 37, y0 + 40, 3, 3);
          }
          continue;
        }
        if (style === 'shop' && row === 0) {
          g.fillStyle = '#2f3b44'; g.fillRect(x0 + 2, y0 + 14, 60, 46);
          g.fillStyle = 'rgba(150,200,225,0.8)'; g.fillRect(x0 + 5, y0 + 17, 54, 40);
          lit.push([x0 + 5, y0 + 17, 54, 40, 0.9]);
          continue;
        }
        if (style === 'warehouse') {
          if (row === rows - 1) drawWindow(g, x0 + 12, y0 + 14, 40, 14, trim, r, lit);
          continue;
        }
        drawWindow(g, x0 + 14, y0 + 14, 36, 34, trim, r, lit);
      }
    }
    if (style === 'shop') {
      // toldo a rayas sobre la planta baja
      const yA = (rows - 1) * CH + 2;
      for (let x = 0; x < W; x += 12) {
        g.fillStyle = (x / 12) % 2 ? '#f5f0e6' : awning;
        g.fillRect(x, yA, 12, 10);
      }
    }
  });
  const emissive = mk(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (const [x, y, w, h, p] of lit) {
      if (r() < p) {
        g.fillStyle = r() < 0.5 ? '#ffd38a' : '#ffe9b8';
        g.fillRect(x, y, w, h);
      }
    }
  });
  const res = { map, emissive };
  facadeCache.set(key, res);
  return res;
}

function drawWindow(g, x, y, w, h, trim, r, lit) {
  g.fillStyle = trim; g.fillRect(x - 3, y - 3, w + 6, h + 6);
  const grd = g.createLinearGradient(x, y, x + w, y + h);
  grd.addColorStop(0, '#9cc7dc'); grd.addColorStop(1, '#4f7186');
  g.fillStyle = grd; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.beginPath(); g.moveTo(x, y + h * 0.6); g.lineTo(x + w * 0.5, y); g.lineTo(x + w * 0.7, y); g.lineTo(x, y + h); g.fill();
  g.fillStyle = trim; g.fillRect(x + w / 2 - 1, y, 2, h); g.fillRect(x, y + h / 2 - 1, w, 2);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 3, y + h + 3, w + 6, 3);
  lit.push([x, y, w, h, 0.55]);
}

export function signTex(text, { bg = '#1e2a33', fg = '#ffffff', border = '#f4c542', w = 512, h = 128, font = 'bold 64px sans-serif' } = {}) {
  return mk(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = parseInt(font.match(/(\d+)px/)[1], 10);
    while (g.measureText(text).width > w - 40 && size > 10) { size -= 2; g.font = font.replace(/\d+px/, size + 'px'); }
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

export function roadTex() {
  const t = mk(256, 512, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = '#3c3f44'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, r, 40, '15,15,18', 0.28, 60);
    blotches(g, w, h, r, 25, '130,130,135', 0.07, 40);
    for (let i = 0; i < 7000; i++) {
      const v = 60 + r() * 90;
      g.fillStyle = `rgba(${v},${v},${v + 5},${0.3 * r()})`;
      g.fillRect(r() * w, r() * h, 1.5, 1.5);
    }
    // marcas de rodadas
    g.fillStyle = 'rgba(15,15,18,0.18)';
    g.fillRect(w * 0.18, 0, w * 0.12, h); g.fillRect(w * 0.7, 0, w * 0.12, h);
    // línea central discontinua y bordes
    g.fillStyle = 'rgba(232,196,72,0.92)';
    g.fillRect(w / 2 - 5, 30, 10, 200); g.fillRect(w / 2 - 5, 286, 10, 200);
    g.fillStyle = 'rgba(235,235,230,0.8)';
    g.fillRect(6, 0, 6, h); g.fillRect(w - 12, 0, 6, h);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function groundTex(base = '#6aa84f', seed = 3) {
  const t = mk(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 1600; i++) {
      const c = new THREE.Color(base).offsetHSL((r() - 0.5) * 0.04, (r() - 0.5) * 0.1, (r() - 0.5) * 0.1);
      g.fillStyle = '#' + c.getHexString();
      g.fillRect(r() * w, r() * h, 3 + r() * 6, 3 + r() * 6);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function tileTex(base = '#bdb7ab', line = '#a39d92', n = 4) {
  const t = mk(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    grain(g, w, h, 0.08, rng(11));
    g.strokeStyle = line; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo((i * w) / n, 0); g.lineTo((i * w) / n, h); g.stroke();
      g.beginPath(); g.moveTo(0, (i * h) / n); g.lineTo(w, (i * h) / n); g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function carpetTex(base = '#7b3f3f') {
  const t = mk(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(19);
    grain(g, w, h, 0.15, r);
    g.strokeStyle = shade(base, 1.25); g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(32 + (i % 2) * 64, 32 + Math.floor(i / 2) * 64, 18, 0, Math.PI * 2); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function woodTex(base = '#a0754b') {
  const t = mk(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(23);
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = shade(base, 0.85 + r() * 0.3); g.fillRect(0, y, w, 15);
      g.fillStyle = shade(base, 0.6); g.fillRect(0, y + 15, w, 1);
      g.fillRect(r() * w, y, 1, 15);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ------------------------------------------------------------------
//  Texturas "realistas estilizadas" (segunda versión visual)
// ------------------------------------------------------------------
function mkRepeat(w, h, draw, srgb = true) {
  const t = mk(w, h, draw, srgb);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function blotches(g, w, h, r, n, color, alpha, size) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = size * (0.4 + r());
    const grd = g.createRadialGradient(x, y, 0, x, y, s);
    grd.addColorStop(0, `rgba(${color},${alpha * r()})`);
    grd.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = grd;
    g.fillRect(x - s, y - s, s * 2, s * 2);
  }
}

// Hormigón pulido de nave (con juntas de dilatación).
export function concreteTex(base = '#8d9196', joints = 4, jointAlpha = 0.45) {
  return mkRepeat(512, 512, (g, w, h) => {
    const r = rng(41);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    blotches(g, w, h, r, 70, '255,255,255', 0.07, 60);
    blotches(g, w, h, r, 70, '20,20,25', 0.09, 50);
    grain(g, w, h, 0.07, r);
    g.strokeStyle = `rgba(30,30,35,${jointAlpha})`; g.lineWidth = 2;
    for (let i = 0; i <= joints; i++) {
      g.beginPath(); g.moveTo((i * w) / joints, 0); g.lineTo((i * w) / joints, h); g.stroke();
      g.beginPath(); g.moveTo(0, (i * h) / joints); g.lineTo(w, (i * h) / joints); g.stroke();
    }
    // pequeñas grietas
    g.strokeStyle = 'rgba(25,25,30,0.25)'; g.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; g.lineTo(x, y); }
      g.stroke();
    }
  });
}

// Losas de acera.
export function slabTex() {
  return mkRepeat(256, 256, (g, w, h) => {
    const r = rng(52);
    g.fillStyle = '#b8b2a7'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, r, 30, '255,250,240', 0.12, 40);
    blotches(g, w, h, r, 30, '60,55,50', 0.1, 30);
    grain(g, w, h, 0.08, r);
    g.fillStyle = 'rgba(60,55,50,0.55)';
    g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
    g.fillRect(0, h / 2, w, 2);
  });
}

export function asphaltTex() {
  return mkRepeat(512, 512, (g, w, h) => {
    const r = rng(63);
    g.fillStyle = '#3a3d42'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, r, 60, '15,15,18', 0.25, 70);
    blotches(g, w, h, r, 40, '120,120,125', 0.08, 50);
    for (let i = 0; i < 9000; i++) {
      const v = 60 + r() * 90;
      g.fillStyle = `rgba(${v},${v},${v + 5},${0.35 * r()})`;
      g.fillRect(r() * w, r() * h, 1.5, 1.5);
    }
    // parches de reparación
    for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(20,20,22,0.35)'; g.fillRect(r() * w, r() * h, 40 + r() * 80, 30 + r() * 60); }
  });
}

export function stuccoTex() {
  return mkRepeat(256, 256, (g, w, h) => {
    const r = rng(74);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) {
      const v = 200 + r() * 55;
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.fillRect(r() * w, r() * h, 2, 2);
    }
    blotches(g, w, h, r, 20, '120,110,100', 0.08, 50);
  });
}

// Caja de cartón: cinta, etiqueta con código de barras y pictogramas.
let _card;
export function cardboardTex() {
  if (_card) return _card;
  _card = mk(256, 256, (g, w, h) => {
    const r = rng(85);
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#c99a62'); grd.addColorStop(1, '#b8874f');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,60,30,${0.05 * r()})`; g.fillRect(0, r() * h, w, 1 + r() * 2); }
    grain(g, w, h, 0.06, r);
    // cinta
    g.fillStyle = 'rgba(214,180,128,0.95)'; g.fillRect(w * 0.42, 0, w * 0.16, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(w * 0.44, 0, w * 0.03, h);
    // etiqueta
    g.fillStyle = '#f4f1ea'; g.fillRect(w * 0.08, h * 0.1, w * 0.28, h * 0.16);
    g.fillStyle = '#222';
    for (let i = 0; i < 26; i++) if (r() > 0.35) g.fillRect(w * 0.1 + i * 2.4, h * 0.17, r() > 0.5 ? 2 : 1, h * 0.07);
    g.fillRect(w * 0.1, h * 0.12, w * 0.18, 3);
    // pictogramas
    g.strokeStyle = '#3b2a18'; g.lineWidth = 3;
    g.strokeRect(w * 0.66, h * 0.72, w * 0.12, h * 0.14); g.strokeRect(w * 0.8, h * 0.72, w * 0.12, h * 0.14);
    g.beginPath(); g.moveTo(w * 0.69, h * 0.84); g.lineTo(w * 0.69, h * 0.75); g.moveTo(w * 0.75, h * 0.84); g.lineTo(w * 0.75, h * 0.75); g.stroke();
    g.beginPath(); g.moveTo(w * 0.83, h * 0.75); g.lineTo(w * 0.89, h * 0.75); g.lineTo(w * 0.86, h * 0.8); g.closePath(); g.moveTo(w * 0.86, h * 0.8); g.lineTo(w * 0.86, h * 0.85); g.stroke();
  });
  return _card;
}

export function corrugatedTex(base = '#6f7a86') {
  return mkRepeat(128, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 8) {
      const grd = g.createLinearGradient(0, y, 0, y + 8);
      const c = new THREE.Color(base);
      grd.addColorStop(0, '#' + c.clone().multiplyScalar(1.2).getHexString());
      grd.addColorStop(0.5, '#' + c.getHexString());
      grd.addColorStop(1, '#' + c.clone().multiplyScalar(0.7).getHexString());
      g.fillStyle = grd; g.fillRect(0, y, w, 8);
    }
    grain(g, w, h, 0.08, rng(96));
  });
}

// Valla metálica de rombos (con transparencia).
export function chainTex() {
  return mkRepeat(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#b9bec4'; g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath();
    g.stroke();
  });
}

export function pegboardTex() {
  return mk(512, 256, (g, w, h) => {
    g.fillStyle = '#c9a678'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,45,20,0.6)';
    for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) { g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill(); }
    // herramientas
    g.fillStyle = '#4b5258';
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 36;
      g.fillRect(x, 50, 8, 120 - i * 6);
      g.beginPath(); g.arc(x + 4, 50, 12, Math.PI, 0); g.fill();
    }
    g.fillStyle = '#2d3135';
    g.fillRect(340, 60, 10, 110); g.fillRect(320, 50, 50, 22);
    g.fillStyle = '#c0392b'; g.fillRect(400, 60, 14, 80); g.fillStyle = '#4b5258'; g.fillRect(403, 140, 8, 40);
    g.fillStyle = '#e1b12c'; g.fillRect(440, 70, 24, 70); g.fillStyle = '#2d3135'; g.fillRect(446, 140, 12, 30);
  });
}

export function clipboardTex() {
  return mk(128, 160, (g, w, h) => {
    g.fillStyle = '#8b6a43'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f5f2ea'; g.fillRect(10, 18, w - 20, h - 26);
    g.fillStyle = '#9aa1a8'; g.fillRect(40, 6, 48, 18);
    g.fillStyle = '#7d858c';
    for (let y = 36; y < h - 16; y += 12) g.fillRect(18, y, (w - 36) * (0.5 + ((y * 7) % 10) / 20), 3);
  });
}

// Ventanas de rascacielos (para el skyline).
export function towerTex(seed = 1) {
  const r = rng(seed);
  const map = mk(64, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) g.fillRect(x, y, 5, 5);
  });
  const emissive = mk(64, 256, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) {
      if (r() < 0.35) { g.fillStyle = r() < 0.6 ? '#ffcf7a' : '#bfe0ff'; g.fillRect(x, y, 5, 5); }
    }
  });
  map.wrapS = map.wrapT = emissive.wrapS = emissive.wrapT = THREE.RepeatWrapping;
  return { map, emissive };
}

export function hazardTex() {
  return mkRepeat(128, 32, (g, w, h) => {
    g.fillStyle = '#e8b923'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d1d1d';
    for (let x = -h; x < w; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.fill(); }
  });
}

export function posterTex() {
  return mk(128, 192, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#ff8a3d'); grd.addColorStop(0.55, '#d6407a'); grd.addColorStop(1, '#3a1f5c');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(w / 2, h * 0.5, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b1030';
    g.fillRect(w * 0.58, h * 0.25, 4, h * 0.6);
    for (let i = 0; i < 7; i++) { g.save(); g.translate(w * 0.6, h * 0.25); g.rotate(-1.4 + i * 0.45); g.fillRect(0, -2, 34, 4); g.restore(); }
    g.fillRect(0, h * 0.82, w, h * 0.18);
    g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
  });
}

// Interior de tienda iluminado (se ve a través del escaparate).
export function shopInteriorTex(seed = 1, tint = '#f3e2b8') {
  const r = rng(seed);
  return mk(512, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, tint); grd.addColorStop(0.35, '#a8977a'); grd.addColorStop(1, '#3a332b');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // fluorescentes del techo (en perspectiva)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = 'rgba(255,251,233,0.95)';
      g.fillRect(40 + i * 120, 10 + (i % 2) * 6, 80, 5);
      const lg = g.createRadialGradient(80 + i * 120, 14, 2, 80 + i * 120, 14, 90);
      lg.addColorStop(0, 'rgba(255,245,215,0.35)'); lg.addColorStop(1, 'rgba(255,245,215,0)');
      g.fillStyle = lg; g.fillRect(i * 120 - 20, 0, 200, 120);
    }
    // estanterías al fondo (más pequeñas, sensación de profundidad)
    for (let s = 0; s < 5; s++) {
      const x0 = 14 + s * 100, y0 = 70, sw = 80, sh = 120;
      g.fillStyle = '#2f2c29'; g.fillRect(x0, y0, sw, sh);
      for (let row = 0; row < 5; row++) {
        const y = y0 + 6 + row * 23;
        g.fillStyle = '#6f6a62'; g.fillRect(x0, y + 17, sw, 3);
        for (let x = x0 + 3; x < x0 + sw - 6; x += 5 + r() * 4) {
          const hh = 7 + r() * 9;
          const c = ['#b8473a', '#3a6fb8', '#d8ad4a', '#4c9a52', '#d8d4cc', '#d8793a', '#875bb0'][Math.floor(r() * 7)];
          g.fillStyle = c; g.fillRect(x, y + 17 - hh, 3.5 + r() * 2.5, hh);
        }
      }
    }
    // suelo y mostrador
    const fg = g.createLinearGradient(0, 190, 0, h);
    fg.addColorStop(0, '#5a5148'); fg.addColorStop(1, '#2a2520');
    g.fillStyle = fg; g.fillRect(0, 190, w, h - 190);
    g.fillStyle = '#1f1d1b'; g.fillRect(w * 0.6, 170, w * 0.35, 60);
    g.fillStyle = 'rgba(255,240,200,0.25)'; g.fillRect(w * 0.6, 170, w * 0.35, 3);
    // viñeta
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  });
}

// Texto luminoso con halo (neones y letras de fachada) sobre fondo transparente.
export function glowTextTex(text, { color = '#ffd34d', glow = '#ffb300', font = 'bold 90px sans-serif', w = 1024, h = 192, border = null } = {}) {
  return mk(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = parseInt(font.match(/(\d+)px/)[1], 10);
    while (g.measureText(text).width > w - 60 && size > 10) { size -= 4; g.font = font.replace(/\d+px/, size + 'px'); }
    if (border) {
      g.strokeStyle = border; g.lineWidth = 10; g.shadowColor = border; g.shadowBlur = 24;
      g.strokeRect(16, 16, w - 32, h - 32);
    }
    g.shadowColor = glow; g.shadowBlur = 28;
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2 + 4);
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

// Valla publicitaria: atardecer con montañas y palmera.
export function billboardTex(seed = 1) {
  const r = rng(seed);
  return mk(512, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#2a1b5c'); grd.addColorStop(0.55, '#c2477d'); grd.addColorStop(0.75, '#ff9a4d'); grd.addColorStop(1, '#2b1640');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(w * 0.5, h * 0.66, 46, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a1f55';
    g.beginPath(); g.moveTo(0, h * 0.8);
    for (let x = 0; x <= w; x += 32) g.lineTo(x, h * (0.55 + r() * 0.25));
    g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#1b0f2c'; g.fillRect(0, h * 0.86, w, h * 0.14);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = 'bold 34px sans-serif'; g.textAlign = 'left';
    g.fillText('PUERTO LOMAS', 24, 46);
    g.font = '20px sans-serif'; g.fillText('Donde el sol se pone despacio', 24, 74);
    g.strokeStyle = '#111'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
  });
}
