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

## Complemento — Seis estaciones, empaquetado y El Cartel (18-10-2026)
Referencias: 15-estaciones.png, 16-formatos-producto.png. Mecánicas ficticias: solo
interacciones abstractas, animaciones y barras de progreso (nada de recetas reales).
- Interacción: tocar la estación → valida desbloqueo, recursos y que esté libre → pasa
  los recursos del inventario a la estación solos (sin pantalla de depositar) → se ven en
  la mesa → animación y progreso → «Lista para recoger» → se recoge una sola vez. Si falta
  algo, mensaje claro y no se consume nada.
- Estaciones (exactamente seis): 1 cogollos (existe), 2 cristales (existe: el hornillo),
  3 polvos (nueva), 4 pastillas (nueva), 5 líquidos/extracto (nueva), 6 empaquetadora
  avanzada (nueva, lotes, más rápida, valores configurables). Producción y empaquetado son
  etapas distintas.
- Mesa de empaquetado manual: aparte, se compra en la tienda de muebles. Formatos:
  cogollos y cristales sobre/tarro; polvos vial/sobre; pastillas blíster/frasco; extracto
  gotero (+ caja). Formatos bloqueados no se muestran como disponibles.
- El Cartel: dos mostradores con un único NPC cada uno (dos NPC en total). A: las tres
  armas existentes (mismo catálogo). B: polvos, pastillas, líquidos, empaquetadora
  avanzada, lámparas de cultivo y mejoras (cristales solo si procede).
- Orden de desbloqueo: cogollos → cristales → polvos → pastillas → extracto, con el
  sistema de rangos existente. Compras y resultados una sola vez; persistencia al cargar.

## Respuestas del usuario (18-10-2026, 1.ª tanda)
- Armas: machete en lugar del spray → exactamente pistola, machete y porra.
- Locales: manda la segunda imagen (02-locales-b.png): La Esquina = cafetería con tienda,
  Corte Fino = tienda de ropa; incluye El Eclipse, Apartamentos, Muebles, Almacén Delta, El Cartel.
- HUD: sin botón de la mano (se interactúa tocando la etiqueta).
- Casino: solo tragaperras jugables; la ruleta queda como decoración.

## Respuestas del usuario (2.ª tanda)
- Orden: PRIMERO EL MAPA (isla de 11-mapa.png con barrios y calles), después los sistemas.
- Inicio: piso pequeño en Apartamentos.
- Progresión de productos por rango: cogollos 0 (Novato) · cristales 2 (Trapichero) ·
  polvos 3 (Distribuidor) · pastillas 4 (Mayorista) · extracto 5 (Capo).
- Logotipo de Rooktown: lo pasa el usuario; mientras, solo texto.

## Respuestas del usuario (3.ª tanda: mapa)
- Isla de unos 400 × 300 m.
- Interiores solo en edificios con juego (tiendas, gasolineras, Casino, El Cartel,
  lavandería, almacenes, piso inicial, Motel, Mansión, negocios tapadera); el resto,
  fachadas detalladas según las imágenes.
- Almacenes Alfa, Bravo y Delta: propiedades que se compran (progresión piso → almacén
  pequeño → mayores); la nave actual pasa a ser uno de ellos.
- Mansión: solo de la familia rica (sus encargos); no se compra.
