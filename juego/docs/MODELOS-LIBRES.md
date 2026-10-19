# Modelos 3D libres: fuentes, licencias y conversión

Comprobado el 18-10-2026 desde el entorno de la nube (con los dominios nuevos permitidos).

## Acceso a las fuentes

| Fuente | Estado | Motivo |
|---|---|---|
| opengameart.org | ✅ descarga directa | — |
| kenney.nl, quaternius.com | ✅ web | Quaternius descarga por itch.io (ver abajo) |
| sketchfab.com | ⚠️ web sí, descargas no | media.sketchfab.com → «AccessDenied»: las descargas exigen cuenta y token de API |
| poly.pizza, static.poly.pizza | ❌ | el propio sitio responde con el desafío anti-bots de Cloudflare («Just a moment…») |
| api.poly.pizza | ⚠️ | accesible, pero pide clave de API (401) |
| itch.io | ⚠️ solo la portada | las páginas de descarga están en subdominios (`quaternius.itch.io`, `kenney.itch.io`…) que el proxy no deja pasar (CONNECT 403) |
| polyhaven.com | ⚠️ web sí | `api.polyhaven.com` bloqueado por el proxy; `dl.polyhaven.org` responde 521 (origen caído) |
| drive.google.com | ✅ alcanzable | (ningún paquete útil lo usa por ahora) |
| api.github.com (búsqueda) | ❌ | la sesión solo permite rutas de sus repositorios |

## Paquetes descargados y verificados (todos CC0, dominio público: uso comercial sin atribución)

| Paquete | Autor | Contenido | Formato original |
|---|---|---|---|
| [LowPoly Buildings](https://opengameart.org/content/lowpoly-buildings) | Quaternius | banco, 2 bloques de pisos, hospital, 5 casas, tienda | .blend / .fbx / .obj (paleta 32×32) |
| [City Buildings](https://opengameart.org/content/city-buildings) | (OGA) | 5 edificios × 6 colores + toldos, balcones, puertas, jardineras, aires | .blend |
| [Family House Collection](https://opengameart.org/content/family-house-collection) | Miloslav «drummyfish» Číž | 6 casas con textura 1024 (3 variantes) y AO | .blend / .obj / .dae (licencia CC0 en su readme.txt) |

## Conversión a GLB

`tools/to_glb.py` (Blender 5.2 como módulo de Python, `pip install bpy` en un venv):

    python tools/to_glb.py origen.blend salida.glb [objeto|-] [textura.png] [mapaUV]

- No ejecuta scripts incrustados en los .blend.
- Con `textura.png` sustituye los materiales antiguos / de nodos propios (que el exportador
  glTF no entiende y dejan el modelo blanco) por un Principled con esa imagen y deja el mapa UV
  indicado como TEXCOORD_0.
- `tools/blend_list.py archivo.blend` lista los objetos raíz con su tamaño.

Verificado en three.js 0.170 (vitrina `vitrina.html?glb=...`): todos cargan y se ven con su
textura salvo el banco de Quaternius (blanco, como su vista previa original).

## Texturas realistas (Poly Haven, CC0)

`dl.polyhaven.org` sí deja descargar archivos (la API no). Texturas usadas, reducidas a 512 px
(color + normal, JPEG) en `src/assets/textures/pbr/` (1,3 MB): red_brick_03, brick_wall_02,
brick_wall_10, plastered_wall_02, white_plaster_02, beige_wall_001, painted_plaster_wall,
concrete_wall_008, clay_roof_tiles_02, roof_slates_02, corrugated_iron_02, wood_planks, metal_plate.

`world/buildingkit.js` re-texturiza los modelos de estilo dibujo (q_*, cb_*): clasifica cada cara
por su color de paleta y su inclinación (pared, remate, cristal, marco, madera, tejado plano o
inclinado) y le pone un material realista con UV proyectadas en metros. Las texturas se cargan
antes de dar los edificios por listos (si no, lo dibujado antes sale negro un instante).
