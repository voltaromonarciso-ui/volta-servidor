# BLOQUE 9 · Puerto Lomas

Juego 3D low-poly en primera persona para móvil (y escritorio): montas un negocio de cultivo y venta callejera en un pueblo costero, esquivando a la policía. Género "simulador de camello" inspirado en las mecánicas del género, con **nombre, pueblo, personajes, textos, efectos, ingredientes, modelos y estética propios** (nada copiado de otros juegos).

Hecho con **Three.js + Vite** (todo procedural: no hay modelos ni texturas externas) y empaquetado para Android con **Capacitor**.

## Probarlo

```bash
cd juego
npm install
npm run dev        # abre la URL "Network" desde el móvil (misma wifi)
```

En el móvil se juega en horizontal. También se puede "Añadir a pantalla de inicio" (PWA a pantalla completa).

Controles:
- **Móvil:** joystick en la mitad izquierda, arrastra en la derecha para mirar, botón grande = usar, botón pequeño = acción secundaria (recoger / girar), ⤒ saltar, 🏃 correr, 📱 móvil, 🎒 mochila.
- **Escritorio:** WASD · ratón · E usar · R secundaria · Shift correr · Espacio saltar · Tab móvil · I mochila · 1-0 / rueda inventario · Esc pausa.

## Android (Play Store)

Requiere Android Studio (JDK 17+ y Android SDK).

```bash
npm run build
npx cap sync android
npx cap open android      # Build > Generate Signed Bundle (.aab) para Play Store
```

El proyecto nativo ya está generado en `android/` (id `com.volta.bloque9`, orientación horizontal forzada).

## Qué incluye esta versión

| Sistema | Detalle |
|---|---|
| Mundo | 9 manzanas con calles, aceras, pasos de cebra, farolas, plaza con fuente, motel, ferretería, gasolinera, comisaría, ayuntamiento, bar, café, lavandería, polígono, 3 barrios residenciales, playa, muelle y faro. Tráfico, nubes, ciclo día/noche con ventanas iluminadas y estrellas. |
| Propiedades | Habitación 3 del motel (alquiler semanal $100) y bungalow en venta ($2.500). Puertas que se abren. |
| Cultivo | Macetas, tierra normal/abonada, 4 variedades de semilla, riego (la regadera se rellena en el lavabo), fertilizante, lámpara de cultivo, crecimiento visible y cosecha. |
| Producción | Mesa de empaquetado (bolsitas de 1 ud. y tarros de 5) y mezcladora: 12 ingredientes, 22 efectos, transformaciones entre efectos y productos nuevos con nombre personalizable. |
| Ventas | 17 vecinos con gustos, presupuesto y nivel de exigencia. Te escriben pedidos al móvil: aceptar, contraofertar (+20%) o rechazar; quedas en un punto de encuentro y entregas en persona. Confianza, enganche, recomendaciones y muestras gratis para captar clientes. |
| Móvil del juego | Mensajes, Clientes, Productos (precios y venta), Mapa con destinos, Proveedor de semillas (entrega en contenedor), Objetivos, Perfil y Ajustes. |
| Policía | Patrullas a pie, toque de queda 21:00–05:00, cacheos aleatorios (cooperar o huir), persecuciones con nivel de búsqueda, escondite y arresto con multa y requisa. |
| Progreso | 7 rangos que desbloquean objetos y semillas, 12 objetivos de historia que hacen de tutorial, resumen diario, guardado automático. |
| Rendimiento | Geometría estática fusionada por zonas (~140 draw calls), sombras y resolución configurables. |

## Estructura

```
src/
  main.js            arranque, bucle, menú
  game.js            contexto global + eventos
  core/              estado y guardado, controles, sonido sintetizado
  data/              objetos, efectos/ingredientes, vecinos, objetivos
  world/             construcción del pueblo, texturas en canvas, cielo, navegación
  entities/          jugador, personajes, NPC y policía, coches
  systems/           objetos colocables, economía/clientes, policía, tiempo, interacción
  ui/                HUD, paneles (tiendas, mesas, entregas), teléfono
```
