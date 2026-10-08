---
name: volta-atleta-3d
description: Crea, anima y revisa el atleta 3D propio de Volta que hace cada ejercicio en su ficha (Three.js + cuerpo base CC0 de MakeHuman). Úsala para cambiar el físico del personaje, añadir o corregir el movimiento de un ejercicio, sus aparatos o la cámara, o revisar las posturas con hojas de contacto.
---

# Atleta 3D de Volta

Es un personaje propio y gratuito. No copia el de ninguna otra app.

- **Cuerpo**: el modelo base de MakeHuman, con licencia **CC0**, creado con MPFB (extensión gratuita de Blender, GPL).
  - MPFB solo sirve para crearlo; no va dentro de la app.
  - Físico atlético: hombre, muscle 1.0, más V en la espalda, pectoral, dorsal, brazos y piernas.
  - Esqueleto `game_engine` de 53 huesos.
  - Cada vértice lleva su zona muscular (atributo `_MUSCLE`, con las 15 zonas de la app) y su pintura (atributo `_PAINT`):
    piel, pantalón corto, zapatillas u ojos.
- **Archivo**: `public/assets/models/atleta.bin`. Es un GLB comprimido con deflate y pesa unos 480 KB.
  - La app lo descarga solo al abrir la ficha de un ejercicio, junto con Three.js r128 desde cdnjs.
  - Si el móvil no tiene WebGL o falla la descarga, se queda la animación 2D.
  - Con «ahorro de datos» activado, sale un botón para cargarlo.
- **Código**: `frontend/atleta3d.js`.
  - `PATS`: dos posturas por patrón de movimiento, inicio (A) y final (B). El patrón sale de `window.vxPattern`.
  - Cada postura da la dirección de cada segmento como vector `[lado, arriba, delante]`:
    - `ua`/`fa`: brazo y antebrazo; `th`/`sh`/`ft`: muslo, espinilla y pie;
    - `sp`: tronco; `hd`: cabeza; `pel`: orientación y posición de la pelvis;
    - `pm`: hacia dónde mira la palma (prono, supino o neutro); `grip`: cerrar la mano.
    - En brazos y piernas, «lado» es hacia fuera, y se refleja solo en el lado derecho. Para un lado distinto se usa el
      sufijo `R`, por ejemplo `thR`.
  - El material (barra, mancuernas, kettlebell, polea, bandas o Smith) sale de la columna de material del ejercicio.
    Los bancos, la barra de dominadas, las paralelas, el escalón y la prensa se colocan solos según la postura.
  - El músculo trabajado brilla en verde Volta y los secundarios (`XD[nombre].sec`) más suaves.
  - La línea discontinua marca el recorrido completo del punto que más se mueve.
  - `CAM`: el ángulo de cámara con el que mejor se ve cada patrón.

## Rehacer el cuerpo

```bash
pip download bpy --no-deps -d /tmp/bpy && python3 -m venv /tmp/bv && /tmp/bv/bin/pip install /tmp/bpy/bpy-*.whl
git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
# instalar MPFB como extensión de Blender (una vez)
/tmp/bv/bin/python -c "import bpy,os,shutil;d=os.path.join(bpy.utils.user_resource('EXTENSIONS',path='user_default',create=True),'mpfb');os.path.exists(d) or shutil.copytree('/tmp/mpfb2/src/mpfb',d)"
/tmp/bv/bin/python .claude/skills/volta-atleta-3d/scripts/crear_atleta.py /tmp/atleta.glb
python3 -c "import zlib;open('public/assets/models/atleta.bin','wb').write(zlib.compress(open('/tmp/atleta.glb','rb').read(),9))"
```

El físico se cambia en `crear_atleta.py`: valores de `md` y lista de targets con su peso.

## Revisar las posturas

Las posturas se revisan con hojas de contacto. Cada ejercicio sale en su inicio y en su final, con el nombre y el
patrón.

```bash
npm run build:app
APP_URL=http://localhost:8100/Volta-app.html THREE_JS=/ruta/three.min.js GLTF_JS=/ruta/GLTFLoader.js \
  NODE_PATH=$(npm root -g) node .claude/skills/volta-atleta-3d/scripts/hoja.js '["bench","Sentadilla"]' hoja.png
```

- La lista admite patrones o nombres de ejercicio.
- Three.js r128 sale de `npm pack three@0.128.0`, en `build/three.min.js` y en `examples/js/loaders/GLTFLoader.js`.
- Chromium debe arrancar con SwiftShader para tener WebGL sin GPU. `hoja.js` ya lo hace.

Al revisar cada postura se comprueba que:

1. las manos están en la barra o en las mancuernas;
2. los pies están en el suelo o en su apoyo;
3. el cuerpo descansa en el banco;
4. el recorrido es completo;
5. la espalda está neutra;
6. el músculo en verde es el correcto.
