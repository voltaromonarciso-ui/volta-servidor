---
name: volta-imagenes-ejercicios
description: Genera las imágenes de los ejercicios de Volta copiando el estilo de la imagen de «Press de banca» (ilustración anatómica gris, músculo objetivo en verde suave, fondo #c4cfc9) con Google Gemini, las anima con Veo (vídeo corto en bucle) y las mete en la app. Úsala cuando pidan imágenes o animaciones de ejercicios, «imágenes como la del press banca», rehacer o añadir la imagen o el vídeo de un ejercicio, o completar los que faltan.
---

# Imágenes de ejercicios con el estilo del «Press de banca»

La referencia es `referencia/press_de_banca.png`, la imagen que ya usa la app.
Cada imagen nueva se pide a Gemini con esa referencia y la descripción del ejercicio, que sale de
`docs/IMAGENES_EJERCICIOS.md`: la guía de estilo y la tabla de los 182 ejercicios sin imagen, con su músculo, material,
movimiento y vista.

## Dos maneras de hacer las imágenes

1. **Ilustrador propio** (`dibujar.mjs`):
   - no necesita clave ni internet, y es lo que usa la app ahora mismo;
   - toma la postura de cada ejercicio de `avatar.js` (`window.vxPoseData`) y la dibuja con `ilustrador.js`;
   - cada músculo va por separado, con volumen y fibras orientadas;
   - el músculo trabajado va en verde, y el material y los apoyos con detalle, en el estilo de la referencia;
   - para mejorarlo se tocan las formas de `ilustrador.js` (`leg`, `arm`, tronco, `PROPS` y `GEAR`) y se ejecuta
     `dibujar.mjs --todos --rehacer`.
2. **Gemini y Veo** (`generar.mjs` y `animar.mjs`): imágenes con más detalle anatómico y vídeos en bucle. Necesitan
   `GEMINI_API_KEY` y gastan saldo de la API. Una imagen de Gemini sustituye a la dibujada en cuanto se integra.

```bash
NODE_PATH=$(npm root -g) node .claude/skills/volta-imagenes-ejercicios/scripts/dibujar.mjs --todos --rehacer
node .claude/skills/volta-imagenes-ejercicios/scripts/integrar.mjs && npm run build:app
```

Después de dibujar, se revisa con hojas de contacto: 30 imágenes por hoja, con el nombre de cada ejercicio debajo.

## Antes de usar Gemini

1. **Clave de la API**: hace falta `GEMINI_API_KEY`.
   - Se consigue en https://aistudio.google.com/apikey con una cuenta de Google.
   - En Claude Code en la web, se añade como variable del entorno, en la configuración del entorno.
   - Si no está, se pide al usuario. **Nunca se escribe la clave en el repositorio.**
2. **Red**: el entorno debe poder llegar a `generativelanguage.googleapis.com`.
3. **Coste**: cada imagen gasta saldo de la API, salvo que la cuenta tenga cuota gratuita. Antes de generar muchas,
   se avisa al usuario de cuántas son y se le pide que confirme. El precio por imagen está en la web de Google AI.
4. **Modelo**: por defecto `gemini-2.5-flash-image` (Nano Banana). Se cambia con `--modelo <id>` o con
   `GEMINI_IMAGE_MODEL` si Google publica uno mejor.

## Pasos

```bash
S=.claude/skills/volta-imagenes-ejercicios/scripts
node $S/generar.mjs --lista                         # qué ejercicios tienen ya imagen (✓) y cuáles no (·)
node $S/generar.mjs --ejercicio "Sentadilla" --prueba   # ver el prompt sin gastar nada
node $S/generar.mjs --ejercicio "Sentadilla"        # una imagen (para probar el estilo)
node $S/generar.mjs --todos --max 10                # por tandas; no rehace las que ya existen
node $S/generar.mjs --ejercicio "Sentadilla" --rehacer  # repetir una que salió mal
node $S/animar.mjs --ejercicio "Sentadilla"          # vídeo en bucle con Veo a partir de su imagen
node $S/animar.mjs --todos --max 5                  # por tandas (cada vídeo tarda 1-3 min y cuesta más que una imagen)
node $S/integrar.mjs                                # PNG → WebP 960×720, vídeos y frontend/imagenes.js
npm run build:app                                   # meterlas en Volta-app.html
```

- Las imágenes se guardan en `public/assets/ejercicios/<nombre>.webp`.
- La app las muestra en la lista y en la ficha del ejercicio; la animación sigue debajo, como guía del movimiento.
- Si el archivo no carga (por ejemplo, con el HTML abierto suelto, sin la carpeta `assets`), la app vuelve sola al
  dibujo.
- Las fotos que ya traía la app (pecho, espalda…) tienen prioridad y no se tocan.
- **Vídeos (Veo, modelo `veo-3.0-fast-generate-001`; se cambia con `--modelo` o `VEO_MODEL`):**
  - parten de la imagen ya generada, así que conservan su estilo;
  - ffmpeg los deja en 4:3 640×480 y sin audio, en MP4 (H.264) y en WebM (VP9), unos 25-40 KB cada uno;
  - la ficha del ejercicio reproduce el vídeo en bucle y debajo deja la animación con sus controles;
  - si el vídeo no carga, se ve la imagen.
- Al revisar un vídeo, se comprueba también que el movimiento sea correcto y que empiece y acabe en la misma postura,
  para que el bucle no dé saltos.

## Revisión de cada imagen (obligatoria antes de integrarla)

Hay que **abrir y mirar** cada imagen, con la herramienta de leer archivos. Una imagen que no cumple **no se integra**:
se repite con `--rehacer` o se borra.

1. El estilo coincide con la referencia:
   - maniquí gris con fibras;
   - fondo liso `#c4cfc9`;
   - sin texto, flechas ni logotipos.
2. Solo el músculo principal está en verde suave.
3. La técnica es correcta: espalda neutra, articulaciones alineadas, material posible, y manos y pies sin deformar.
4. El ejercicio es el que dice el nombre.
5. El formato es 4:3, sin nada cortado.

Al terminar, se enseña al usuario una muestra y se hace commit de `public/assets/ejercicios/`, `frontend/imagenes.js`
y `Volta-app.html`.
