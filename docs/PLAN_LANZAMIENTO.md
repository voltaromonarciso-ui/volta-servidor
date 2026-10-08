# Volta · decisiones del equipo y plan de lanzamiento

Respuestas del equipo, del 8 de octubre de 2026. Este documento es la referencia para todo lo que se haga a partir de ahora.

## Decisiones

| Tema | Decisión |
|---|---|
| Plataforma | **Apps en Google Play y App Store, a la vez** |
| Mercado | **Todo el mundo**, desde el principio (la app ya está en ES/EN/FR/PT) |
| Público | Todos: principiantes, habituales, entrenadores y gimnasios. Objetivo: facilitar la vida al usuario |
| Negocio | **Gratis con anuncios + Premium** |
| Premium incluye | **Sin anuncios**, **IA ilimitada** (rutinas, planes de comida, Coach) y **contenido exclusivo** (programas, recetas, temas y emblemas) |
| Anuncios | **Discretos**: un banner pequeño en Nutrición y Progreso, **nunca durante el entreno** |
| Juego limpio | Premium **nunca** da puntos ni ventajas en la Arena: la competición es igual para todos |
| Fecha | Lanzamiento en **2–3 meses** |
| Servidores | **20–100 €/mes** al principio |
| Equipo | **Pequeño** (2–5 personas) |
| Cuentas | **Nada todavía**: hay que crear las de Google Play (25 $, pago único) y Apple (99 $/año), y conseguir un Mac para la versión de iPhone, o un servicio de compilación en la nube |
| Siguiente paso | **Pulir lo que hay** antes de añadir funciones nuevas |

## Plan (2–3 meses)

### Fase 1 · Pulir (semanas 1–3), lo que toca ahora
1. **Velocidad**: la app pesa unos 3 MB. Objetivo: carga inicial por debajo de 1 MB y bien puntuada en Core Web Vitals.
   Pasos: separar las imágenes, cargarlas bajo demanda y comprimirlas.
   **Hecho (8 oct)**: imágenes integradas a WebP (1388 → 353 KB) y el modelo 3D (≈450 KB, hoy sin pantalla que lo use)
   se sirve aparte, solo si se abre la vista 3D. Medido en 4G con CPU ×4 lenta:

   | | Antes | Ahora |
   |---|---|---|
   | Transferido | 2026 KB | **572 KB** |
   | Primer pintado | 2,5 s | **0,9 s** |
   | App lista | 3,1 s | **1,5 s** |
   | Memoria | 16 MB | 9 MB |

   El archivo suelto `Volta-app.html` conserva el modelo dentro para funcionar sin servidor. Minificar el JS apenas
   ahorra un 1,5 %, así que no se hace.
2. **Accesibilidad** (WCAG 2.2 AA): contraste en los tres temas, tamaño de los botones táctiles, lector de pantalla y teclado.
3. **Fallos y estabilidad**: repaso completo de todas las pantallas en móvil pequeño y grande, sin conexión y con datos antiguos.
4. **Textos**: botones, avisos y mensajes claros en los cuatro idiomas.
5. **Seguridad**: revisión del servidor (autenticación, límites, antitrampas) con pruebas aleatorias de la puntuación.

### Fase 2 · Preparar las tiendas (semanas 3–6)
1. Empaquetar la app para Android e iOS con **Capacitor**, reutilizando el mismo código.
2. Iconos, pantallas de presentación, capturas y fichas de las tiendas en cuatro idiomas.
3. **Textos legales**: política de privacidad, condiciones y consentimiento de RGPD. En la ficha de las tiendas se declaran los datos de salud que se recogen.
4. Notificaciones push nativas: fin del descanso, racha y misiones.
5. Crear las cuentas de desarrollador y conseguir un Mac (o un servicio en la nube) para compilar la versión de iPhone.

### Fase 3 · Negocio (semanas 5–8)
1. **Premium** con suscripción integrada en las tiendas (Google Play Billing y App Store, con RevenueCat), con prueba gratuita.
2. **Límite de IA** en la versión gratuita y IA ilimitada en Premium. El servidor controla el uso, para evitar abusos y costes.
3. **Anuncios discretos** (AdMob): un banner en Nutrición y Progreso, nunca durante el entreno, que desaparece con Premium.
4. **Contenido exclusivo**: programas de varias semanas, recetas, temas y emblemas Premium. Nada que dé puntos en la Arena.

### Fase 4 · Servidor y pruebas con usuarios (semanas 6–10)
1. Puesta en marcha con 20–100 €/mes: base de datos PostgreSQL gestionada y servidor de la app con HTTPS, más Redis cuando haga falta.
   El escalado está explicado en `ESCALADO.md`.
2. Copias de seguridad, monitorización y avisos de errores.
3. **Beta cerrada**: Google Play (pruebas internas) y TestFlight, con amigos y algún gimnasio. Recoger opiniones y corregir.

### Fase 5 · Lanzamiento (semanas 10–12)
Publicación simultánea en las dos tiendas y en todo el mundo, y seguimiento de las primeras semanas.

## Cosas a tener en cuenta
- **Apple** revisa con lupa las apps de salud y las suscripciones: la política de privacidad y los textos sobre datos de salud tienen que estar impecables.
- **Mercado mundial**: impuestos y precios por país (las tiendas los gestionan) y la normativa de privacidad de cada región (RGPD en Europa, CCPA en California).
- **IA**: la clave de la API debe vivir en el servidor, nunca en la app, y hay que controlar el gasto por usuario.
