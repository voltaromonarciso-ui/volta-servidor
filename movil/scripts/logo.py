#!/usr/bin/env python3
"""Rehace el icono de Volta desde una imagen del logo (la V verde sobre fondo negro) con un fondo limpio.
Uso: python3 movil/scripts/logo.py ruta/al/logo.png  → movil/recursos/icono*.png y public/icon-*.png"""
import os, sys
from PIL import Image
M = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); ROOT = os.path.dirname(M)
src = Image.open(sys.argv[1]).convert('RGB'); px = src.load(); W, H = src.size
# 1) zona de la V: píxeles claramente verdes
xs, ys = [], []
for y in range(0, H, 2):
    for x in range(0, W, 2):
        r, g, b = px[x, y]
        if g > 70 and g > r and g > b + 30: xs.append(x); ys.append(y)
pad = 18; box = (max(0, min(xs) - pad), max(0, min(ys) - pad), min(W, max(xs) + pad), min(H, max(ys) + pad))
c = src.crop(box); w, h = c.size; P = c.load()
# 2) la V sin fondo: transparencia según el brillo sobre el negro (se descarta el fondo y sus manchas)
B = (8, 8, 10); v = Image.new('RGBA', (w, h)); O = v.load()
for y in range(h):
    for x in range(w):
        r, g, b = P[x, y]; a = max(0.0, min(1.0, (max(r, g, b) - 34) / (150 - 34)))
        O[x, y] = (0, 0, 0, 0) if a <= 0 else tuple(max(0, min(255, round((q - (1 - a) * bq) / a))) for q, bq in zip((r, g, b), B)) + (int(a * 255),)
# 3) fondo oscuro con un degradado suave y la V centrada
def icon(n, frac):
    bg = Image.new('RGB', (n, n)); top, bot = (22, 23, 27), (6, 6, 8)
    for y in range(n):
        t = y / (n - 1); bg.paste(tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)), (0, y, n, y + 1))
    s = int(n * frac); vv = v.resize((s, int(h * s / w)), Image.LANCZOS)
    bg.paste(vv, ((n - vv.size[0]) // 2, (n - vv.size[1]) // 2), vv); return bg
v.save(os.path.join(M, 'recursos', 'v.png'))  # la V sola (para la pantalla de arranque)
full, safe = icon(1024, 0.58), icon(1024, 0.50)  # «safe»: cabe en la zona segura de los iconos adaptativos
full.save(os.path.join(M, 'recursos', 'icono.png')); safe.save(os.path.join(M, 'recursos', 'icono-adaptativo.png'))
full.resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'public', 'icon-512.png'), optimize=True)
full.resize((192, 192), Image.LANCZOS).save(os.path.join(ROOT, 'public', 'icon-192.png'), optimize=True)
safe.resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'public', 'icon-maskable-512.png'), optimize=True)
print('logo listo')
