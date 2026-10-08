---
name: volta-imagenes-ejercicios
description: Genera las imágenes de los ejercicios de Volta copiando el estilo de la imagen de «Press de banca» (ilustración anatómica gris, músculo objetivo en verde suave, fondo #c4cfc9) con la API de imágenes de Google Gemini, y las mete en la app. Úsala cuando pidan imágenes de ejercicios, «imágenes como la del press banca», rehacer o añadir la imagen de un ejercicio, o completar las imágenes que faltan.
---

# Imágenes de ejercicios con el estilo del «Press de banca»

La referencia es `referencia/press_de_banca.png`, la imagen que ya usa la app.
Cada imagen nueva se pide a Gemini con esa referencia y la descripción del ejercicio, que sale de
`docs/IMAGENES_EJERCICIOS.md`: la guía de estilo y la tabla de los 182 ejercicios sin imagen, con su músculo, material,
movimiento y vista.

## Antes de empezar

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
node $S/integrar.mjs                                # PNG → WebP 960×720 y frontend/imagenes.js
npm run build:app                                   # meterlas en Volta-app.html
```

- Las imágenes se guardan en `public/assets/ejercicios/<nombre>.webp`.
- La app las muestra en la lista y en la ficha del ejercicio; la animación sigue debajo, como guía del movimiento.
- Si el archivo no carga (por ejemplo, con el HTML abierto suelto, sin la carpeta `assets`), la app vuelve sola al
  dibujo.
- Las fotos que ya traía la app (pecho, espalda…) tienen prioridad y no se tocan.

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
