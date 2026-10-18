# Encargo «Rooktown» (partes 1–4), recibido el 18-10-2026 — PENDIENTE

Se empieza cuando termine la regresión del encargo anterior. Orden: auditoría y plan →
pedir imágenes que falten (agrupadas) → implementar en pasos pequeños → pruebas → informe.

Regla principal: las imágenes del usuario (docs/referencias/) son la fuente de verdad
visual. Nada de diseños propios, recursos de internet ni imágenes generadas sin permiso.
Si una referencia es ambigua o contradictoria, preguntar.

## Parte 1 — Auditoría y progresión
- Auditoría verificable de todos los sistemas (clientes, encargos, niveles, dinero, banco,
  inventario, producción, propiedades, vehículos, mapa, guardado).
- Progresión equilibrada: vehículos no demasiado pronto, producción por niveles, sin grindeo.
- Nuevo comienzo: el jugador empieza en una habitación pequeña y modesta, no en el almacén.

## Parte 2 — Gameplay, economía y propiedades
- Cada cliente: una sola petición/compra por día de juego (en la lógica, no solo en la UI).
- Familia rica de la mansión con encargos importantes (desbloqueo por nivel).
- Desbloqueo gradual de las categorías de producción.
- ~10 cajeros repartidos por el mapa para ingresar/retirar en la cuenta bancaria; icono
  propio en el mapa (no un círculo azul). Visual y ubicaciones según referencias.
- Los artículos de la tienda pequeña (bolsitas, abonos…) pasan a venderse en gasolineras.
- Construir/colocar solo en propiedades propias habilitadas (validación real).
- Lavado de dinero: establecimientos normales con oficina interior para la interacción.

## Parte 3 — Mapa, mundo 3D e interfaz
- Rediseño completo del mapa según 11-mapa.png; barrios con edificios secundarios.
- Encargos bien marcados en el mapa (disponible/activo/completado/bloqueado).
- Poder mover la cama (reutilizar el sistema de colocación).
- Bolsas y tarros: que el contenido no atraviese el recipiente.
- Importes grandes en el HUD sin salirse.
- Calidad gráfica que no se degrade exageradamente a ~5 m.
- Coches de NPC de varios colores.
- Vehículos del jugador sin combustible ni batería.

## Parte 4 — Interacciones y armas
- Todas las mesas de trabajo con interacción real (como la de empaquetado).
- Mesas avanzadas y de armas se compran en El Cartel; solo instalables en propiedades propias.
- Solo tres armas: pistola, machete, porra (05-armas.jpg).

## Decisiones previas que siguen vigentes
- Multijugador aplazado. Dinero limpio = saldo del banco (icono de tarjeta).
- Prompt 2 del dinero (tapaderas, blanqueo, banco) requería aprobación: este encargo lo pide.

## Complemento — Rooktown: red urbana, callejones, NPC y cambio de nombre (18-10-2026)
- Nombre visible del juego: de «BLOQUE 9 / Block 9» a **Rooktown**. Solo textos visibles
  (menú, carga, títulos, metadatos de la app). Conservar identificadores técnicos por
  compatibilidad (clave de guardado `bloque9_save_v3`, id de paquete Capacitor, rutas…)
  salvo que se compruebe su impacto. Documentar las referencias que se conserven.
  Logotipo: pedir imagen antes de rediseñarlo.
- El mapa (11-mapa.png) es la estructura general: añadir calles secundarias,
  residenciales, accesos, pasajes, calles sin salida y callejones (Barrio Alto, Bungalós
  y demás), sin cuadrícula idéntica y sin caminos que acaben contra paredes.
- Callejones y rincones discretos con ambiente propio (según referencias).
- Clientes que piden encuentro: puntos discretos válidos, repartidos por zona y tipo de
  cliente, accesibles y con alternativa si el punto está ocupado o no es accesible. El
  resto de NPC sigue su comportamiento normal.
- Ampliar la navegación existente (world/nav.js), no crear otra. Verificar conectividad.
- Pedir imágenes de zonas/callejones que falten antes del diseño visual definitivo.
- El juego no tiene nada que ver con «Volta» (el usuario, 18-10-2026). Donde el juego diga
  volta, pasa a rooktown: id de la app `com.volta.bloque9` (capacitor.config.json,
  android/app/build.gradle, strings.xml, carpeta java com/volta/bloque9, proyecto iOS,
  README y docs/MOVIL.md). La app no está publicada, así que cambiar el id no rompe
  instalaciones; se hace junto al cambio de nombre y se comprueba que compila la parte web.
- NO tocar el backend social «VOLTA» de la raíz del repositorio (src/, sql/, client/,
  Volta-5.html): es otra aplicación distinta.

- Al empezar este encargo: hacer al usuario todas las preguntas necesarias para aclararlo bien (instrucción del usuario, 18-10-2026).
