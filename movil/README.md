# Volta en el móvil (Android e iOS)

La app de móvil es la misma Volta de siempre (`Volta-app.html`) empaquetada con **Capacitor** (gratis y de código
abierto). Además lleva funciones del móvil:
- **Notificaciones de verdad:** plan del día y racha en peligro, aunque la app esté cerrada.
- **Botón «atrás» de Android.**
- **Barra de estado oscura.**
- **Icono y pantalla de arranque de Volta.**

## Probarla en Android (sin instalar nada en el ordenador)

1. GitHub construye el APK solo cada vez que cambia la app. En el repositorio, entra en **Actions** › **App de móvil**
   y abre la última ejecución en verde.
2. Abajo, en **Artifacts**, descarga **volta-android** (un .zip con `volta-android.apk`).
3. Pasa el `.apk` al móvil (por ejemplo por Google Drive o WhatsApp), ábrelo y acepta **«Instalar apps de origen
   desconocido»** cuando lo pida.

Es una **versión de pruebas** (firmada con una clave de depuración). Sirve para probarla, no para Google Play.

## iPhone

Para instalarla en un iPhone hace falta un **Mac con Xcode** (gratis):
1. `cd movil && npm install && npm run sync`
2. `npx cap open ios`
3. En Xcode, elige tu iPhone y pulsa ▶. Con un Apple ID gratuito la app dura 7 días en tu iPhone.

Para **TestFlight** y la **App Store** hace falta la cuenta Apple Developer (99 $/año).

## Publicar en las tiendas (más adelante)

- **Google Play:**
  - Cuenta de desarrollador (25 $, un solo pago).
  - Una clave de firma propia para la versión final (se guarda fuera del repositorio).
  - Política de privacidad y ficha de la tienda.
- **App Store:** Apple Developer, ficha de la tienda, política de privacidad y la revisión de Apple.
- **Textos legales:** los dos piden política de privacidad y condiciones. Van en la fase legal, como acordamos.

## Para desarrolladores

```bash
npm run build:app          # en la raíz: genera Volta-app.html
cd movil && npm install
npm run sync               # copia la app a www/ y la sincroniza con android/ e ios/
npm run android            # abre Android Studio
npm run apk                # construye el APK (necesita el SDK de Android)
python3 scripts/iconos.py  # regenera iconos y pantallas de arranque desde recursos/icono.png
```

- `scripts/www.js` prepara `www/` con:
  - `Volta-app.html` como `index.html`;
  - los archivos de `public/`;
  - el puente de Capacitor (`capacitor.js`), con los plugins App, LocalNotifications y StatusBar registrados.
- Identificador de la app: `app.volta.fitness`.
