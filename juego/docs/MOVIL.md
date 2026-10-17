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

Limitaciones de estas pruebas:
- Usan Chromium con WebGL por software (SwiftShader): **no miden el rendimiento real**
  de un móvil (aquí el juego va a 1–25 fps por la CPU, no por el juego).
- El perfil «iphone» es Chromium con medidas y táctil de iPhone, **no Safari/WebKit**.
  WebKit no está instalado en este entorno.

### Resultados (17-10-2026)

| Prueba | Android (Pixel 7) | iPhone 14* | Escritorio |
|---|---|---|---|
| Ciclo completo (`core.spec.js`, 11 pasos) | 11/11 ✔ | 11/11 ✔ | 11/11 ✔ |
| Interfaz en 6 pantallas (`mobile-ui.spec.js`) | sin problemas ✔ | — | — |

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
