# Escalar VOLTA a cientos de miles o millones de usuarios

Este documento explica qué aguanta el servidor, cómo se mide y qué hace falta para llegar al millón de
usuarios activos. **El código ya está preparado para crecer en horizontal; el millón de usuarios exige,
además, infraestructura** (varias máquinas, base de datos gestionada, Redis y una CDN). Ningún código
por sí solo, en un único servidor, atiende a un millón de personas a la vez.

## Qué está hecho en el código

| Pieza | Qué hace | Por qué importa a gran escala |
|---|---|---|
| `REDIS_URL` (opcional) | Los avisos en tiempo real (WebSocket) se publican en Redis y los entrega la instancia donde esté conectado cada usuario | Permite tener N servidores detrás de un balanceador |
| Límites de peticiones en Redis | Los contadores (login, envíos, denuncias…) son comunes a todas las instancias | Sin esto, con 10 instancias cada límite valdría 10 veces más |
| `npm run start:cluster` | Un proceso por núcleo (`WEB_CONCURRENCY`) con reinicio automático si uno cae | Aprovecha todos los núcleos de cada máquina |
| Latido condicional | `last_seen_at` solo se escribe si tiene más de 45 s | Con varias pestañas o latidos seguidos no se reescribe la fila (menos WAL y vacuum) |
| Ranking cacheado | El top de cada ranking se cachea 15 s y se invalida solo si una puntuación nueva entraría en él | Miles de personas abriendo la Arena no repiten la misma consulta |
| Posición por histograma | "¿En qué puesto voy?" se resuelve con un histograma puntos→usuarios cacheado y búsqueda binaria | Evita contar cientos de miles de filas en cada petición |
| Índices parciales de ranking | `(week_key, week_score DESC)` y `(week_key, league, week_score DESC)` sin cuentas marcadas | El top-50 se lee directamente del índice |
| Pool de PostgreSQL configurable | `PG_POOL_MAX`, `PG_STATEMENT_TIMEOUT_MS` (10 s) y 5 s para obtener conexión | Ninguna consulta lenta bloquea el servidor; falla rápido en vez de encolar sin fin |
| App precomprimida | gzip al arrancar y Brotli en segundo plano, con ETag/304 | Las visitas repetidas no descargan nada; el arranque no se bloquea |
| `/health` | Estado, proceso y conexiones WebSocket abiertas | Para el balanceador y las alertas |

## Medidas reales (esta máquina de pruebas)

Máquina de 4 núcleos compartidos donde además corrían PostgreSQL, Redis y el propio generador de carga,
con **200 000 usuarios** en el ranking de la semana. Son cifras pesimistas: en producción cada pieza va
en su propia máquina.

| Operación | 1 proceso | Cluster (3 procesos + Redis) |
|---|---|---|
| Latido | 1 871 pet/s | 2 227 pet/s |
| Foro (20 mensajes) | 1 410 pet/s | 2 086 pet/s |
| Clasificación de amigos | 1 920 pet/s | 2 145 pet/s |
| Arena: ranking global + tu posición | 1 080 pet/s | 1 536 pet/s |
| Login (bcrypt coste 12) | 14 pet/s | 14 pet/s (limitado por CPU) |
| Descargar la app completa (2 MB) | 55 pet/s | 46 pet/s (limitado por ancho de banda) |

Sin errores en ninguna prueba. También se comprobó con dos instancias reales y Redis que un aviso enviado
desde una llega a un usuario conectado a la otra, y que el límite de intentos de login se cuenta entre ambas.

## Cuánta carga es "un millón de usuarios activos"

Un millón de usuarios **activos al día** no están todos conectados a la vez. Una estimación razonable:

- Pico simultáneo ≈ 10 % → **100 000 conectados**.
- Latido cada 60 s → ≈ 1 700 pet/s; con el resto de pantallas, **5 000–10 000 pet/s en el pico**.
- **100 000 WebSockets** abiertos (cada uno ocupa pocos KB de memoria).
- Logins: el token dura 7 días, así que son pocos, pero bcrypt es caro a propósito (protege las contraseñas).

## Arquitectura recomendada para el millón

```
            CDN (app HTML, iconos, manifest)  ← la app pesa 2 MB: sin CDN, 1 M de primeras visitas = 2 TB desde tu servidor
                        │
              Balanceador (HTTPS + WebSocket)
          ┌─────────────┼─────────────┐
     API #1 … API #N  (npm run start:cluster, 2–4 vCPU cada una, TRUST_PROXY=1)
          └─────────────┼─────────────┘
              Redis gestionado (pub/sub + límites)
                        │
               PgBouncer (modo transacción)
                        │
        PostgreSQL gestionado (primario 8+ vCPU) + réplica de lectura
```

Orden de magnitud orientativo para el pico estimado:

| Pieza | Tamaño de partida |
|---|---|
| Instancias de API | 6–10 de 2–4 vCPU (escalado automático por CPU) |
| WebSockets | 20 000–30 000 por instancia → las mismas instancias bastan |
| PostgreSQL | 8 vCPU / 32 GB, con PgBouncer; réplica para rankings y perfiles si hace falta |
| Redis | 1 nodo gestionado pequeño (1–2 GB) con réplica |
| CDN | Imprescindible para la app; el service worker ya la guarda en el móvil |

## Lista de comprobación antes de abrir al público

1. `npm run migrate` en la base de producción (columnas, índices de ranking y tabla de denuncias).
2. `REDIS_URL` configurado en **todas** las instancias (con más de una, es obligatorio).
3. `TRUST_PROXY=1` detrás del balanceador (si no, todos los usuarios comparten el límite por IP del balanceador).
4. `CORS_ORIGINS` con tu dominio real y `NODE_ENV=production`.
5. `PG_POOL_MAX` × número de procesos ≤ conexiones que admite PgBouncer.
6. Servir `Volta-app.html` desde la CDN o poner la CDN delante del servidor (respeta el ETag).
7. Nunca uses `RATE_LIMIT_OFF=1` en producción: es solo para pruebas de carga.
8. Pruebas de carga en el entorno real antes del lanzamiento, subiendo poco a poco (10 k → 100 k usuarios simulados).

## Lo que queda fuera del código (y conviene saber)

- **Revisión de denuncias**: las cuentas con 3 denuncias de trampas salen del ranking automáticamente, pero
  alguien debe revisarlas (tabla `reports`) para devolverlas o expulsarlas.
- **Logins masivos**: si un día miles de personas inician sesión a la vez (p. ej. un anuncio en televisión),
  bcrypt será el cuello de botella. Se puede bajar `BCRYPT_ROUNDS` a 11 o dedicar instancias solo a `/api/auth`.
- **Copias de seguridad y monitorización**: activa las copias automáticas de la base gestionada y alertas
  sobre `/health`, CPU, latencia p95 y errores 5xx.
