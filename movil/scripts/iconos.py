#!/usr/bin/env python3
"""Genera los iconos y la pantalla de arranque de Android e iOS desde movil/recursos/ (icono.png, icono-adaptativo.png
y v.png, que crea scripts/logo.py).
Uso: python3 movil/scripts/iconos.py   (necesita Pillow)"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
M = os.path.dirname(HERE)
SRC = Image.open(os.path.join(M, 'recursos', 'icono.png')).convert('RGB')
SAFE = Image.open(os.path.join(M, 'recursos', 'icono-adaptativo.png')).convert('RGB')
V = Image.open(os.path.join(M, 'recursos', 'v.png')).convert('RGBA')
BG = (11, 12, 14)  # fondo de la pantalla de arranque y del icono adaptativo
RES = os.path.join(M, 'android', 'app', 'src', 'main', 'res')

def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, optimize=True)

def rounded(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], r, fill=255)
    out = im.convert('RGBA'); out.putalpha(m); return out

def circle(im):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).ellipse([0, 0, im.size[0] - 1, im.size[1] - 1], fill=255)
    out = im.convert('RGBA'); out.putalpha(m); return out

# Android: iconos clásicos, redondos y capa delantera del icono adaptativo (108 dp; la zona segura es 66 dp)
for dpi, s in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    ic = SRC.resize((s, s), Image.LANCZOS)
    save(rounded(ic, s // 6), os.path.join(RES, f'mipmap-{dpi}', 'ic_launcher.png'))
    save(circle(ic), os.path.join(RES, f'mipmap-{dpi}', 'ic_launcher_round.png'))
    fg = s * 108 // 48
    save(SAFE.resize((fg, fg), Image.LANCZOS), os.path.join(RES, f'mipmap-{dpi}', 'ic_launcher_foreground.png'))
with open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n' % BG)

# Pantallas de arranque: fondo oscuro con el logo en el centro
def splash(w, h):
    im = Image.new('RGB', (w, h), BG); s = min(w, h) * 2 // 5; v = V.resize((s, s * V.size[1] // V.size[0]), Image.LANCZOS)
    im.paste(v, ((w - v.size[0]) // 2, (h - v.size[1]) // 2), v); return im
for root, _, files in os.walk(RES):
    for fn in files:
        if fn == 'splash.png':
            p = os.path.join(root, fn); w, h = Image.open(p).size; save(splash(w, h), p)

# iOS: icono de 1024 sin transparencia y pantalla de arranque
IOS = os.path.join(M, 'ios', 'App', 'App', 'Assets.xcassets')
if os.path.isdir(IOS):
    for root, _, files in os.walk(os.path.join(IOS, 'AppIcon.appiconset')):
        for fn in files:
            if fn.endswith('.png'):
                p = os.path.join(root, fn); w, _ = Image.open(p).size; save(SRC.resize((w, w), Image.LANCZOS), p)
    for root, _, files in os.walk(os.path.join(IOS, 'Splash.imageset')):
        for fn in files:
            if fn.endswith('.png'):
                p = os.path.join(root, fn); w, h = Image.open(p).size; save(splash(w, h), p)
print('iconos y arranque generados')
