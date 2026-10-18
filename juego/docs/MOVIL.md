# Bloque 9 en Android e iPhone: estado real

Última revisión: 17-10-2026. Este documento distingue entre lo **comprobado** (con
la prueba que lo demuestra) y lo **pendiente**. Nada de lo que hay aquí afirma que el
juego funcione en un dispositivo físico: en este entorno no hay ninguno.

## 1. Motor y arquitectura

| Pieza | Qué es | Implicación móvil |
|---|---|---|
| Motor | **Three.js 0.170** (WebGL 2) + **Vite 6**. No es Unity/Godot: es una web. | Corre en el WebView del sistema: Chrome WebView (Android) y WKWebView (iOS). |
| Empaquetado nativo | **Capacitor 7** (`@capacitor/android`, `@capacitor/ios`). | Una sola base de código web; los proyectos nativos solo envuelven `dist/`. |
| Guardado | `localStorage` + copia en `@capacitor/preferences` en la app nativa. | El WebView puede borrar `localStorage` con poco espacio; la copia nativa lo recupera al arrancar. |
| Sonido | Web Audio (MP3 + síntesis de respaldo). | iOS exige un toque antes de sonar: el audio se activa al pulsar en el menú. |
| Lógica de juego | `src/systems`, `src/core/state.js`, `src/data` | Independiente de la plataforma: no hay ramas por Android/iOS. |
| Controles | `src/core/input.js` (táctil + teclado/ratón), `src/ui/layout.js` (editor de controles) | La lógica de juego solo recibe acciones (`emit('btn', …)`), nunca eventos de dispositivo. |

La lógica de negocio (economía, inventario, cultivo, envasado, ventas, guardado) no
sabe en qué dispositivo corre; los controles táctiles y de escritorio llaman a las
mismas acciones (`runAction`, `G.act.*`).

## 2. Controles táctiles (ya existían; se conservan)

- Joystick fijo abajo a la izquierda (se acerca al dedo si tocas lejos), arrastre en la
  mitad derecha para mirar.
- Botones: usar (✋), acción secundaria con su texto (recoger, girar…), correr,
  agacharse, saltar, mochila, móvil, pausa, minimapa.
- Barra de objetos arriba (tocar una casilla la selecciona; tocar la que ya llevas abre
  la mochila).
- Editor de controles (Ajustes → Colocar controles): mover, escalar, opacidad.
- Empaquetado a mano: arrastrar con el dedo (también vale tocar).
- Ninguna acción depende de hover, clic derecho ni teclado.

## 3. Pruebas automáticas (referencia del comportamiento actual)

```bash
cd juego
npx playwright test --project=android     # Pixel 7 horizontal, táctil
npx playwright test --project=iphone      # iPhone 14 horizontal, táctil (Chromium, no Safari)
npx playwright test --project=escritorio
npx playwright test tests/mobile-ui.spec.js --project=android   # auditoría de interfaz
B9_PORT=5181 npx playwright test ...   # otra ejecución a la vez, en otro puerto
```

`tests/core.spec.js` juega el ciclo completo **con los botones táctiles reales**:
partida nueva → abrir la caja de Leo → inventario (apilar/hueco/quitar) → comprar en
la ferretería → pedir y recoger semillas → colocar maceta, tierra, plantar, regar,
crecer y cosechar → colocar la mesa y envasar a mano arrastrando con el dedo →
economía (aceptación según precio, límites de reputación) → vender en mano a un
cliente → guardar, recargar y continuar comparando el estado completo → sin errores.

`tests/mobile-ui.spec.js` abre HUD, mochila, tienda y móvil en 6 tamaños de
pantalla (iPhone SE, 15 Pro, 15 Pro Max, Android pequeño, Pixel 7 y tablet) con zonas
seguras emuladas, y comprueba que los controles miden ≥ 44 pt, no se solapan, no se
salen de la pantalla y no caen bajo la muesca o la barra de gestos.

`tests/vehicles.spec.js` compra en la tienda Rueda Libre con el dedo (sin dinero no
se compra, no se cobra dos veces), monta con la acción real, acelera y gira con el
joystick táctil (teclado en escritorio), frena manteniendo el botón FRENAR, se baja con
BAJAR, choca contra un escaparate sin atravesarlo, no deja bajarse sin sitio, usa la
grúa de pago, gasta la batería del patinete hasta 0, la carga en la nave (y no en la
calle), da el alto la policía y huir pedaleando inicia la persecución, detenido en bici
deja la bici donde estaba, guarda/carga sin duplicados y devuelve a la tienda un
vehículo guardado en un sitio imposible.

`tests/furniture.spec.js` compra en Muebles Nido con el dedo (sin dinero no se compra,
el carrito vacío no cobra), coloca la cama con vista previa, la gira con los botones
grandes a los dos lados, cancela sin perderla ni cobrar, mueve una maceta con planta
conservando la planta (y no deja guardarla en el inventario porque perdería la tierra),
cancela un movimiento dejándolo todo igual, valida sitios imposibles, comprueba la caja
fuerte frente a una multa, los 24 huecos del armario, el humidificador sobre el agua de
las macetas, la cama que despierta a las 6:00 y guardar/cargar.

Limitaciones de estas pruebas:
- Usan Chromium con WebGL por software (SwiftShader): **no miden el rendimiento real**
  de un móvil (aquí el juego va a 1–25 fps por la CPU, no por el juego).
- El perfil «iphone» es Chromium con medidas y táctil de iPhone, **no Safari/WebKit**.
  WebKit no está instalado en este entorno.

### Resultados (17-10-2026)

| Prueba | Android (Pixel 7) | iPhone 14* | Escritorio |
|---|---|---|---|
| Ciclo completo (`core.spec.js`, 11 pasos) | 11/11 ✔ | 11/11 ✔ | 11/11 ✔ |
| Peluquería, ropa y disfraz (`style.spec.js`, fase 3 bloque A) | 11/11 ✔ | 11/11 ✔ | 11/11 ✔ |
| Bici y patinete (`vehicles.spec.js`, fase 3 bloque B) | 13/13 ✔ | 13/13 ✔ | 13/13 ✔ |
| Muebles: comprar, colocar, girar, cancelar, mover y efectos (`furniture.spec.js`, fase 3 bloque C) | 13/13 ✔ | 13/13 ✔ | 13/13 ✔ |
| Empleados: contratar, trabajar, nómina y guardado (`employees.spec.js`, fase 4 bloque A) | 17/17 ✔ | 17/17 ✔ | 17/17 ✔ |
| Interfaz en 6 pantallas (`mobile-ui.spec.js`, incl. peluquería, probador, tienda de vehículos, conducción, mover muebles y app Personal) | sin problemas ✔ | — | — |

\* Chromium con medidas de iPhone, no Safari.

Problemas reales encontrados por estas pruebas y corregidos:
- El aviso «Mensaje de X», al ocultarse, quedaba invisible encima de las casillas
  centrales de la barra de objetos (arriba en móvil) y se comía los toques.
- La barra de objetos rehacía sus 10 imágenes en cada fotograma (y varios textos
  del HUD se reescribían igual): trabajo inútil en cada frame en el móvil.
- Casillas de la barra de 24–38 px en móviles estrechos → ahora 2 filas de ≥ 44 pt.
- −/+ de tiendas (30 px), cerrar paneles (34 px), botones (≈38 px) y navegación del
  móvil del juego (40 px) → 44 pt.
- En iPhone con muesca, joystick, correr y bordes de paneles caían bajo la muesca o
  la barra de gestos; los paneles anchos se salían de la pantalla y ocultaban «Pagar».

## Fase 4 · Empleados (bloque A): reglas

Código: `src/data/staff.js` (candidatos y números, todo ajustable en un sitio) y
`src/systems/staff.js` (trabajo, nómina, guardado). App «Personal» en el móvil del juego.

- **Dónde trabajan:** solo en la propiedad asignada (nave o bungalow si es tuyo), con
  los objetos colocados dentro de ella. Cogen materiales de sus estanterías y armarios y
  dejan ahí el resultado. Nunca usan tu inventario ni crean nada de la nada.
- **Puestos:** cultivo (riega cuando el agua baja del 30 % y cosecha; los cogollos van a
  las estanterías), envasado (sobres y Sweet Shards en la mesa, tarros en la envasadora;
  mismas recetas que el jugador), cocina (hornillo: 2 azúcar + 1 colorante + 1 catalizador,
  120 min, 6 cristales, igual que a mano). No plantan ni compran: eso sigue siendo tuyo.
- **Contratar:** la plantilla máxima depende del rango (Novato 0, Buscavidas 1,
  Trapichero 2, Distribuidor o más 3). Contratar cuesta 550–2.500 $ y el sueldo es de
  120–400 $/día (un trato típico deja 100–250 $). Trabajan más despacio que el jugador.
- **Horario:** de 8:00 a 20:00 de juego. Cada tarea dura unos minutos de juego
  (`STAFF.minutes`). Al terminarla se vuelve a comprobar todo y se consume y produce de
  una vez; si falta material o hueco no se produce nada (sin duplicados ni pérdidas).
- **Tiempo:** avanzan con el reloj del juego, jugando o a saltos (dormir, comisaría).
  Con la partida cerrada el reloj no avanza, así que tampoco trabajan ni cobran.
- **Nómina:** cada día a las 7:00 (también si las 7:00 pasan mientras duermes). Se cobra
  el sueldo más lo que se deba, todo o nada. `paidDay` guarda el último día liquidado, así
  que un día nunca se cobra dos veces, ni al recargar. Si no llega el dinero: el empleado
  deja de trabajar y apunta la deuda; se puede pagar desde el móvil; a los 2 días sin
  cobrar se va. Al contratar se paga la contratación y ese día ya está cubierto.
- **Filtraciones:** quien se va (despedido o por impago) **con deudas pendientes** tiene
  una probabilidad `0,8 − lealtad` de dar tu descripción a la policía: usa la memoria
  policial existente (te reconocen y te cachean más hasta que cambies de ropa o pelo, o
  pasen 3 días). En el móvil se ve la «discreción» de cada candidato.
- **Guardado:** `state.employees` (sin cambiar la versión del formato). Al cargar se quitan
  duplicados y candidatos inexistentes; los asignados a una propiedad que ya no tienes
  quedan «Sin propiedad válida» hasta que les asignes otra. Las partidas antiguas cargan
  con la lista vacía.

## 4. Compilación

### Android — estado: proyecto listo, compilación BLOQUEADA en este entorno

Comprobado:
- `npm run build && npx cap sync android` funciona (copia `dist/` y registra el plugin
  de preferencias).
- Gradle 8.11 y JDK 21 funcionan (`./gradlew --version`).

Bloqueo: `./gradlew assembleDebug` falla porque el plugin de Android para Gradle
(`com.android.tools.build:gradle:8.7.2`) y el **Android SDK** solo se descargan de
`dl.google.com`, y la política de red del entorno lo deniega (403). Para compilar:
- en un ordenador con **Android Studio** (incluye JDK 17+ y SDK 35):
  `npm run build && npx cap sync android && npx cap open android`, o
- añadir `dl.google.com` (y `maven.google.com`) a los dominios permitidos del entorno.

Configuración actual: `com.volta.bloque9`, minSdk 23 (Android 6), target/compileSdk 35,
horizontal (`sensorLandscape`), versionCode 1.

Pendiente para Google Play (no verificado):
- Firmar con una clave de subida y generar **.aab** (`Build > Generate Signed Bundle`).
- targetSdk exigido por Play en la fecha de publicación (revisarlo en la consola).
- Icono adaptativo y pantalla de inicio propios (ahora son los de Capacitor).
- Ficha: política de privacidad, clasificación de contenido (el juego trata de venta
  de un producto prohibido ficticio: rellenar el cuestionario con cuidado), capturas.
- Prueba en dispositivos reales de gama baja/media.

### iOS — estado: proyecto generado, compilación imposible aquí

Comprobado:
- `npx cap add ios` genera `ios/` con **Swift Package Manager** (sin CocoaPods);
  `npx cap sync ios` copia la web y registra el plugin de preferencias.
- `Info.plist`: solo horizontal, barra de estado oculta, pantalla completa.

Bloqueo: compilar para iOS requiere **macOS con Xcode** (y una cuenta de Apple
Developer para instalar en un iPhone o publicar). En Linux no se puede.
En un Mac: `npm run build && npx cap sync ios && npx cap open ios` → elegir equipo de
firma → ejecutar en el iPhone.

Pendiente para App Store (no verificado): iconos (1024 px y conjunto), pantalla de
inicio, firma, privacidad (`PrivacyInfo.xcprivacy`), revisión de contenido.

## 5. Rendimiento en móvil (lo que ya hace el juego)

- Calidad Alta/Media/Baja con bajada automática si los fps caen < 24 durante 5 s.
- Geometría estática fusionada, sombras que se actualizan cada 2–3 fotogramas,
  modelos con compresión meshopt y texturas webp, personajes fusionados por material.
- La resolución interna se limita según la calidad.

Sin verificar en dispositivo: fps reales, temperatura y memoria en gama baja/media.
Hay que medirlo en teléfonos reales (Chrome remote debugging en Android, Safari Web
Inspector en iOS).
