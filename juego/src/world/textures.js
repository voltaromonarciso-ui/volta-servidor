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
  const t = mk(128, 256, (g, w, h) => {
    g.fillStyle = '#3b3f45'; g.fillRect(0, 0, w, h);
    const r = rng(7);
    grain(g, w, h, 0.12, r);
    g.fillStyle = '#e9d36a';
    g.fillRect(w / 2 - 3, 20, 6, 110);
    g.fillStyle = 'rgba(240,240,240,0.85)';
    g.fillRect(4, 0, 4, h); g.fillRect(w - 8, 0, 4, h);
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
