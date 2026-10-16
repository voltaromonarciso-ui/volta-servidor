# BLOQUE 9 · Puerto Lomas

Juego 3D en primera persona para móvil (y escritorio), con estética estilizada de "golden hour": montas un negocio de cultivo y venta callejera en un pueblo costero, esquivando a la policía. Género "simulador de camello" inspirado en las mecánicas del género, con **nombre, pueblo, personajes, textos, efectos, ingredientes, modelos y estética propios** (nada copiado de otros juegos).

Hecho con **Three.js + Vite** (todo procedural: no hay modelos ni texturas externas) y empaquetado para Android con **Capacitor**.

## Probarlo

```bash
cd juego
npm install
npm run dev        # abre la URL "Network" desde el móvil (misma wifi)
```

En el móvil se juega en horizontal. También se puede "Añadir a pantalla de inicio" (PWA a pantalla completa).

Controles:
- **Móvil:** joystick abajo a la izquierda, arrastra en la derecha para mirar, ✋ usar, agacharse, correr, botón pequeño = acción secundaria (recoger / girar), saltar. Minimapa (tócalo para abrir el mapa), móvil y mochila arriba.
- **Escritorio:** WASD · ratón · E usar · R secundaria · Shift correr · C agacharse · Espacio saltar · Tab móvil · I mochila · 1-0 / rueda inventario · Esc pausa.

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
| Gráficos | Materiales PBR, sombras suaves, reflejos del cielo, resplandor (bloom), corrección de color y viñeta; manos en primera persona (cajas con las dos manos, objetos pequeños en la palma); calidad Alta/Media/Baja. |
| Mundo | Ciudad costera de palmeras: calle comercial con escaparates iluminados, neones, rótulos y valla publicitaria, semáforos, postes con cables, marquesina, papeleras, hidrantes, plaza, ferretería, gasolinera, comisaría, polígono, barrios, playa, muelle, faro, montañas y el skyline de la gran ciudad al otro lado de la bahía. Tráfico y ciclo día/noche. |
| Propiedades | Tu nave del polígono (estanterías, banco de trabajo, carretilla, persiana enrollable; alquiler semanal $100) y bungalow en venta ($2.500). |
| Producto (ficticio) | **Lumaflor**, una flor luminosa inventada que está prohibida en Puerto Lomas. No representa ninguna sustancia real. 4 variedades (Verde, Violeta, Dorada, Azul). |
| Cultivo | Macetas, tierra normal/abonada, semillas de Lumaflor, riego (la regadera se rellena en el fregadero), fertilizante, lámpara de cultivo, flores que crecen y brillan, cosecha de pétalos. |
| Producción | Mesa de empaquetado con tres formas: **sobres** (1 ud.), **viales** de líquido luminoso (5 uds.) y **gominolas** (3 uds.). Mezcladora: 12 ingredientes, 22 efectos, transformaciones y productos nuevos con nombre propio. |
| Ventas | 17 vecinos con gustos, presupuesto y nivel de exigencia. Cada uno prefiere una forma (sobres, viales o gominolas) y deja propina si se la das así. Te escriben pedidos al móvil: aceptar, contraofertar (+20%) o rechazar; quedas en un punto de encuentro y entregas en mano (el cliente coge el producto y te da el dinero). Confianza, enganche, recomendaciones y muestras gratis para captar clientes. |
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

## Habilidades de Claude Code instaladas

En `../.claude/skills/` hay habilidades que ayudan a desarrollar este proyecto con Claude Code: 10 de Three.js (MIT, de CloudAI-X/threejs-skills), `webapp-testing` y `frontend-design` (Apache 2.0, de anthropics/skills).

## Personajes

Los vecinos, Leo, los dependientes y la policía son personas realistas del
[Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox)
(licencia MIT, © 2020 Microsoft), con sus animaciones de andar, correr, esperar
con el móvil y dar/recibir objetos. Se convirtieron de FBX a GLB, con texturas a
512 px (WebP) y geometría simplificada y comprimida con meshopt, en
`src/assets/people/`. El creador de personaje permite elegir nombre, sexo y
aspecto (piel, pelo y ropa) entre estos modelos; en primera persona las manos y
mangas toman su tono de piel y color de ropa.

## Coches, productos y sonidos

- **Coches**: "LowPoly Cars" de Quaternius (CC0, OpenGameArt). Una malla por
  coche con textura-paleta recoloreable; faros que se encienden de noche.
- **Productos de las tiendas**: Kenney Food Kit (CC0), dibujados con mallas
  instanciadas (una llamada de dibujo por tipo de producto).
- **Sonidos**: Kenney Impact/Interface/RPG/Casino Audio (CC0) y, de OpenGameArt
  (CC0), grillos, ambiente de parque, sirena y motor de coche.
