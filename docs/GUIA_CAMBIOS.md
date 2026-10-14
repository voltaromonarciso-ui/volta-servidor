# Volta · guía de los cambios de diseño y funcionalidad

Todas las mejoras viven en `frontend/*.js` y `frontend/mejoras.css`. `npm run build:app` las inyecta en
`Volta-app.html`, entre los marcadores `VOLTA-MEJORAS`. El orden de carga está en `scripts/build-app.js`.

El patrón es siempre el mismo: cada módulo envuelve una vista (`V.home`, `V.train`, `V.prof`…) y modifica el HTML
que devuelve. Nunca se edita el núcleo de la app.

```
platos → mejoras → recetas → ejercicios → avatar → tecnica → engage → compete → olimpo → rutinas → arreglos → temas → a11y
```

## 1. Inicio y secciones

| Cambio | Dónde | Cómo |
|---|---|---|
| "Los 12 Trabajos de **Hércules**" (ES/EN/FR/PT; el título final también es Hércules) | `frontend/olimpo.js` (`T.labors`, `T.laborsSub`, `T.titles`) | Solo textos. Los ids internos (`nemea`, `hidra`…) no cambian, así que el progreso guardado se mantiene. |
| Misiones diarias y Recuperación muscular → **Entrenos** | `frontend/engage.js`, envoltorio `V.train` | Se insertan justo antes de `<h2>Ejercicios</h2>`. |
| 12 Trabajos → **Entrenos**, a continuación de las anteriores | `frontend/olimpo.js`, envoltorio `V.train` | Como `olimpo` se carga después de `engage`, su tarjeta queda detrás de las de `engage`. |
| **Racha** en Inicio | `frontend/engage.js` (`streakCard`, `streakIn`) | Sustituye la antigua tarjeta "Tu progreso empieza hoy". Muestra los días seguidos, el récord, los congeladores 🧊 y la semana con 🔥 en los días abiertos. |
| **Logros solo en Perfil** | `frontend/engage.js` | `achCard()` se pinta únicamente en `V.prof`; Inicio ya no la añade. |

Orden de Inicio: saludo → racha → Oráculo → Arena → calorías → plan de hoy → frase del día.
Si se quiere mover una tarjeta, basta con cambiar el marcador de texto donde se inserta.

## 2. Imágenes de ejercicios con el estilo del "Press de banca"

- Los ejercicios **sin imagen propia** (182) se dibujan con el estilo de referencia `REF` de `frontend/avatar.js`:
  - fondo liso `#c4cfc9`;
  - figura anatómica gris con textura de fibras;
  - músculo objetivo en verde suave `#82be97`, sin neón;
  - material gris pizarra;
  - formato 4:3.

  Se aplica en las miniaturas animadas (`crop`) y en la ficha (`zoom`). Los colores se midieron sobre la propia imagen.
- Los 36 ejercicios que ya tienen foto real la conservan. En su ficha, la animación aparece debajo.
- `docs/IMAGENES_EJERCICIOS.md` contiene la **especificación para los recursos definitivos**: guía de estilo, plantilla
  de prompt, lista de comprobación y los 182 ejercicios con su músculo, material, movimiento y vista sugerida. En cuanto
  un ejercicio recibe su imagen en `e.image` (o `EMB`), la app la usa automáticamente.

> Las ilustraciones de la app son vectoriales y dibujadas por código. Una imagen *idéntica* en detalle a la del press
> banca exige producirla con un ilustrador o un generador de imágenes siguiendo esa especificación.

## 3. Oráculo de Delfos: tus avances

Archivo: `frontend/olimpo.js` (`oracleCard`, `favor`, `sessions`, `sessionXP`, `remember`).

- **Solo avances, ningún entrenamiento.** No hay grupos recomendados, ni "Entrenar esto", ni "Empezar esta rutina", ni
  enlace a la IA.
- **Qué muestra la tarjeta:**
  - el nivel y el título;
  - la barra de XP;
  - cuántos entrenos cuentan;
  - la XP del último entreno;
  - la XP que falta para el siguiente nivel;
  - un desplegable **¿Cómo funciona?**.
- **Favor del Oráculo (XP)**:
  - se gana con **cualquier entrenamiento finalizado** (`S.done`);
  - por sesión: 40 + 4 por serie (hasta 30 series) + volumen/250 (hasta 80);
  - las series sueltas sin finalizar no cuentan;
  - ya no hay bonus por "profecía".
- **Niveles**: el nivel *n* necesita `100·n·(n−1)/2` XP, con los títulos Peregrino → Devoto → Iniciado → Sacerdote →
  Profeta → Pitia.
- Cada sesión nueva muestra un aviso "+X XP Favor del Oráculo" y lo deja en la campana de Actividad.

## 4. Temas de color (Perfil → Temas)

Archivo: `frontend/temas.js`.

- **Temas** es una opción más de la lista de Perfil y muestra el color actual. Al tocarla se abre `vx:themes` con cuatro
  opciones:
  - **Verde** (predeterminado);
  - **Azul**;
  - **Amarillo**;
  - **Rojo**.
- El cambio es inmediato y se recuerda en `localStorage` (`vx:accent`). Elegir Verde borra esa clave y vuelve al color
  de serie.
- **Cómo recolorea toda la interfaz**: sustituye los verdes *de la interfaz* (lista `GREENS`, agrupados por intensidad) por los
  tonos del tema en estos sitios:
  1. todas las hojas de estilo, guardando el original para poder cambiar de tema sin recargar;
  2. los atributos `style`, `fill`, `stroke` y `stop-color` de todo lo que se dibuja, mediante un `MutationObserver`;
  3. las imágenes SVG en línea, como las miniaturas de los ejercicios;
  4. el logo, con `hue-rotate`.
- Los verdes de la comida (verduras y hierbas) no están en la lista, así que los platos no cambian.
- En el tema claro se usa una variante más oscura del color (`light`) para que el texto de acento tenga contraste suficiente.
- **Añadir un tema**: una entrada nueva en `THEMES` con `b`, `m`, `d`, `k` y `o` (neón, principal, profundo, fondo y texto encima),
  `light` (dos tonos para el tema claro), `hue` (giro del logo) y su nombre en los cuatro idiomas.
- **Nuevo código**: los colores de acento deben usar `var(--ac)` / `var(--ac2)`, nunca un hexadecimal fijo. Si alguno
  se cuela, basta con añadirlo a `GREENS`.

## 5. Otros cambios del 8 de octubre

- **Rango máximo: Kratos**, el dios griego de la fuerza, con el lema «Dios de la Fuerza». Se quita el renombrado a Cronos.
- **Guía de rangos**: el botón (i) quedaba tapado por el nombre del rango y no se podía tocar. Ahora está encima, es más
  grande y el lector de pantalla lo anuncia como «Guía de rangos».
- **León de bienvenida**: «Siguiente» no avanzaba porque el cuestionario inicial redefine `obGo`. La guía usa ahora su
  propia función, `obTour`.
- **Perfil → Cuestionario** (`vxEditQuiz`): vuelve a abrir las 10 preguntas con tus respuestas, y ✕ cancela sin
  cambiar nada.
  - Al terminar solo se actualizan tus datos.
  - Las rutinas, el plan y el historial se conservan.

## 6. Accesibilidad (WCAG 2.2 AA)

Archivo: `frontend/a11y.js`, que se carga el último. Revisa la pantalla después de cada pintado y al cambiar de tema.

- **Teclado y lector de pantalla**:
  - los `<div>`/`<span>` con `onclick` reciben foco (Tab) y se activan con Intro o Espacio;
  - si no llevan otros botones dentro, también tienen rol de botón;
  - los chips de un grupo indican si están elegidos (`aria-pressed`);
  - la lupa se anuncia como «Buscar»;
  - los puntos de la gráfica de peso se anuncian con su fecha y su valor.
- **Formularios**: cada `<label>` suelto se asocia al campo que tiene detrás.
- **Contraste**: si un texto no llega a 4,5:1 (3:1 si es grande) sobre su fondo real, se oscurece o se aclara sin cambiar
  su tono.
  - Se mide cuando termina el fundido de entrada o el cambio de tema, porque a mitad de una animación los colores engañan.
  - Los textos sobre degradados o imágenes no se tocan: hay que darles colores legibles en CSS, como en `.hero2`.
- **Acentos del tema claro**, todos ≥ 4,5:1 sobre blanco y sobre las tarjetas:

  | Tema | Acento claro |
  |---|---|
  | Verde | `#3b7700` |
  | Amarillo | `#8a6500` |
  | Azul | `#1660c4` |
  | Rojo | `#c41e1e` |
- **Foco visible**: un contorno del color del tema, solo al usar el teclado (`:focus-visible`).
- **Nuevo código**: usa `<button>` para lo que se toca, pon `<label for>` en los campos y `aria-label` en los botones que
  solo llevan un icono. El módulo es una red de seguridad, no un sustituto.

## 7. Logros escalables y misiones del día

Archivo: `frontend/engage.js`.

- **112 logros en 19 familias con niveles** (I, II, III…), en la lista `FAM`.
  - Cada familia tiene una métrica y sus umbrales; cada umbral es un logro.
  - Las métricas: días entrenados, racha, kg levantados, series, repeticiones, récords, ejercicios distintos, grupos
    musculares, días perfectos, agua, comidas, semanas sólidas, madrugador, noctámbulo, fin de semana, sesiones largas,
    rutinas creadas, los 12 Trabajos y el nivel del Oráculo.
  - El color del nivel va de bronce a mítico.
  - **Añadir una familia**: una entrada nueva en `FAM`; si la métrica es nueva, se calcula en `stats()`.
  - Al subir `ACH_VER`, lo ya conseguido se marca sin avisos.
  - Los logros se revisan al registrar una serie y al moverse por la app, como mucho una vez cada 5 s.
- **Misiones: 3 fijas + 2 del día.** Las fijas son entrenar, 2 comidas y 2 L de agua.
  - Las 2 del día salen por sorteo de un grupo de 11 (`POOL`), con la fecha como semilla: son las mismas todo el día y
    cambian al siguiente.
  - El grupo: 12 series, 5.000 kg, 2 grupos musculares, ejercicio nuevo, objetivo de proteína, 3 comidas, 3 L de agua,
    registrar el peso, batir un récord, entrenar antes de las 10:00 y finalizar un entreno.
  - El **día perfecto** (que da congeladores de racha) se gana con las 3 fijas; las del día son un extra.

## 8. Revisión del catálogo de ejercicios

Archivo nuevo: `frontend/catalogo.js`. Se carga justo después de `ejercicios.js`. Ahora hay **252 ejercicios**; antes había 218.

- **Ningún ejercicio se borra ni cambia de posición.** El historial guarda cada ejercicio por su posición.
  - Un ejercicio repetido se convierte en otro que faltaba, en la misma posición.
  - Ejemplo: «Flexiones con pies elevados» era igual que «Flexiones declinadas» y ahora es «Flexiones con palmada».
- **41 correcciones de nombre, grupo, músculo o material.** Algunos ejemplos:
  - «Encogimientos de trapecio» estaba en Espalda y repetía otro ejercicio. Ahora es «Encogimientos con barra por detrás»,
    en Trapecio.
  - «Face pull» pasa a Hombros (deltoides posterior).
  - «Peso muerto», «Rack pull» y «Superman» ya no dicen «Dorsal ancho»: ahora indican los erectores de la columna.
    «Superman» pasa al grupo Lumbar.
  - «Rotación externa en polea» y «Press cubano» trabajan el manguito rotador.
  - Las abducciones pasan a Abductores (glúteo medio).
  - «Gemelos tibial anterior» pasa a ser «Elevación de tibial anterior».
  - Nombres más claros, por ejemplo «Press de banca en Smith», «Sentadilla con barra baja», «Press Tate» y
    «Suspensión en barra».
  - Se quitan tres ejercicios repetidos de tríceps sobre la cabeza: ahora hay uno con polea, uno con mancuerna y uno
    tumbado.
- **34 ejercicios nuevos**, con su técnica y su nombre en los 4 idiomas:
  - Aductores: 7 (antes 0);
  - Abductores: 9 (antes 0);
  - Lumbar: 7 (antes 0);
  - Antebrazo: 11 (antes 6);
  - Trapecio: 12 (antes 7);
  - Gemelos: 15 (antes 10).
- **Animaciones**:
  - posturas nuevas para tumbado de lado, boca abajo, banco de lumbares y colgado de la barra;
  - músculo resaltado de Aductores, Abductores y Lumbar.
- **Técnica**: familias nuevas, una de abducción y aducción de cadera y otra de lumbares.
- **Volumen semanal y mapa muscular**: incluyen los grupos nuevos.
- **Rutinas predefinidas**: usan los nombres nuevos.

## 9. Atleta 3D propio de Volta

Archivo: `frontend/atleta3d.js`. El modelo está en `public/assets/models/atleta.bin` y pesa unos 480 KB. La skill
`volta-atleta-3d` explica cómo rehacerlo y cómo revisar las posturas.

- **Personaje propio y gratuito**:
  - el cuerpo sale del modelo base de MakeHuman, con licencia CC0, con físico atlético y esqueleto de 53 huesos;
  - el estilo es de Volta: piel gris grafito, pantalón corto negro y una plataforma con aro verde;
  - no copia el personaje de ninguna otra app.
- **Cómo se ve en la ficha**:
  - El atleta sustituye a la animación 2D en la ficha de cada ejercicio, en cuanto termina de cargar.
  - El músculo principal brilla en verde y los secundarios, más suave.
  - Una línea discontinua marca el **recorrido completo**, con un punto al inicio y otro al final.
- **Controles**:
  - botones Pausa, Lento, Frente y Lado;
  - se gira arrastrando con el dedo;
  - con «reducir movimiento» empieza en pausa;
  - con «ahorro de datos» no se descarga solo: sale un botón para cargarlo.
- **Movimientos**:
  - 52 patrones de movimiento con su postura inicial y final, más las variantes por nombre (goblet, frontal, sumo,
    cosaca, face pull, remo sentado, etc.);
  - el material sale de cada ejercicio: barra, mancuernas, kettlebell, polea con su cable, bandas o Smith;
  - bancos, paralelas, barra de dominadas, escalón, prensa y banco de lumbares se colocan solos bajo el cuerpo.
- **Rendimiento**:
  - Three.js y el modelo se descargan solo al abrir una ficha;
  - la animación se para fuera de pantalla y con la pestaña oculta.
- **Si falla**: sin WebGL, o si falla la descarga, se queda la animación 2D de siempre.

## Pruebas

Navegador (Playwright), con capturas en todas las pantallas:

- `layout_test` (Inicio / Entrenos / Perfil): 14 comprobaciones;
- `oracle2` (XP y recomendaciones): 11;
- `theme` (tres temas, sin verdes restantes en ninguna pantalla, comida intacta, persistencia y tema claro): 14;
- `a11ytest` (WCAG 2.2 AA con axe-core en verde/amarillo/rojo, claro y oscuro; teclado, etiquetas, foco y que no corrige de más): 15;
- auditoría completa con axe-core: 20 pantallas × 4 colores × claro/oscuro, **0 fallos**;
- el resto de suites anteriores, todas en verde.

Servidor: `npm test`, 22/22.
