# VOLTA · Backend social (Node.js + Express + PostgreSQL)

API REST + WebSocket para usuarios, amigos y foro comunitario con anti-spam.

```
src/
  index.js              app Express, CORS, helmet, rate limit global, errores
  config.js · db.js     entorno y pool de PostgreSQL (+ transacciones)
  ws.js                 WebSocket /ws (autenticación por primer mensaje)
  middleware/auth.js    JWT (HS256) · requireAuth
  middleware/cooldown.js  429 si publicas antes de 10 s
  routes/               auth · users · friends · forum
  lib/moderation.js     filtro ES/EN de nombres y mensajes (el mismo que ya traía Volta-5.html)
sql/schema.sql          tablas, índices, RLS
client/volta-api.js     cliente fetch() para tu index.html
```

## 1. Puesta en marcha

```bash
npm install
cp .env.example .env          # rellena DATABASE_URL y JWT_SECRET
npm run migrate               # aplica sql/schema.sql  (o pégalo en el SQL Editor de Supabase)
npm run dev                   # http://localhost:3000
```

**Tests** (necesitan un PostgreSQL de pruebas; se vacía en cada test):

```bash
createdb volta_test
TEST_DATABASE_URL=postgres://usuario:clave@localhost:5432/volta_test npm test
```

`npm run mock` arranca un servidor simulado sin base de datos para probar la interfaz.

**Supabase:** usa la cadena de conexión de *Project Settings → Database* en `DATABASE_URL` y pon `PGSSL=true`.
El esquema activa RLS sin políticas: la *anon key* no puede tocar las tablas; solo este servidor.
**Firebase/Firestore:** no se ha usado; el modelo es relacional (parejas únicas de amigos, cursor por `created_at`).

## 2. Endpoints

Errores siempre como `{ "error": "codigo", "message": "texto para el usuario" }`.
Rutas con 🔒 requieren `Authorization: Bearer <token>`.

| Método y ruta | Cuerpo / query | Respuesta |
|---|---|---|
| `POST /api/auth/register` | `{username, email, password}` | `201 {token, user}` · `400` nombre malsonante o formato · `409` usuario/correo en uso |
| `POST /api/auth/login` | `{identifier, password}` (correo **o** usuario) | `200 {token, user}` · `401` |
| 🔒 `GET /api/auth/me` | | `{user}` |
| 🔒 `DELETE /api/auth/me` | `{password}` | `204` borra la cuenta, sus mensajes y amistades · `403` contraseña incorrecta (la sesión sigue abierta) |
| `GET /api/users/check-username?username=xyz` | | `{available, reason?, message?}` (`reason`: `banned` · `format` · `taken`) |
| 🔒 `GET /api/users/search?q=an` | mín. 2 letras | `{users:[{username}]}` |
| 🔒 `POST /api/users/stats` | `{days, sets, volume}` (semana en curso) | `204` |
| 🔒 `GET /api/friends/leaderboard` | | `{week, entries:[{username, days, sets, volume, me}]}` tú + amigos, por volumen |
| 🔒 `POST /api/users/heartbeat` | | `204` (actualiza "en línea") |
| 🔒 `GET /api/friends` | | `{friends, incoming, outgoing}` |
| 🔒 `POST /api/friends/request` | `{username}` | `201 {status:"pending"}` · `200 {status:"accepted"}` si ya te había invitado · `404` · `409` |
| 🔒 `PUT /api/friends/respond` | `{requestId \| username, action:"accept"\|"reject"}` | `200` · `404` si no hay solicitud pendiente tuya |
| 🔒 `GET /api/forum/posts?limit=20&cursor=` | | `{posts, nextCursor}` (más recientes primero) |
| 🔒 `POST /api/forum/posts` | `{content?, progressData?}` (tarjeta: `{type?, icon, title, stats:[[etiqueta, valor]…] (máx. 8), note}`) | `201 {post}` · **`429`** `{message:"Debes esperar 10 segundos entre mensajes.", retryAfter}` + cabecera `Retry-After` · `422` mensaje no permitido |

**Cooldown de 10 s:** el middleware consulta el `created_at` del último post del `user_id` con el reloj de la base de datos.
Además, dentro de la transacción se toma un candado por usuario (`pg_advisory_xact_lock`) y se vuelve a comprobar, así que dos peticiones simultáneas no pueden saltárselo.

**WebSocket** (`/ws`): tras conectar, envía `{"type":"auth","token":"<JWT>"}` (el token no va en la URL). Eventos recibidos:
`forum:new_post` (a todos) · `friend:request` y `friend:accepted` (al usuario afectado).

## 3. Integración desde `index.html`

```html
<script src="volta-api.js"></script>
<script>
  VoltaAPI.configure('http://localhost:3000');   // en producción: 'https://api.tudominio.com'

  // 3.1 Registro con comprobación en tiempo real del nombre
  let t;
  usernameInput.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const v = usernameInput.value.trim();
      if (!v) return (msg.textContent = '');
      const r = await VoltaAPI.checkUsername(v);
      msg.textContent = r.available ? '✓ Disponible' : r.message;
    }, 350);                                      // debounce: no una petición por tecla
  });

  async function registrar() {
    try {
      const user = await VoltaAPI.register({ username: usernameInput.value.trim(), email: emailInput.value, password: passInput.value });
      console.log('Bienvenido', user.username);
    } catch (e) { msg.textContent = e.message; }  // 400 malsonante · 409 en uso · 400 contraseña corta
  }

  // 3.2 Foro: cargar, publicar y respetar el cooldown
  async function cargarForo() {
    const { posts } = await VoltaAPI.posts({ limit: 20 });
    feed.innerHTML = posts.map(p => `<div><b>${esc(p.author.username)}</b> ${esc(p.content)}</div>`).join('');
  }
  async function publicar() {
    try {
      await VoltaAPI.publish({ content: texto.value, progressData: tarjetaOpcional });
      texto.value = '';
    } catch (e) {
      if (e.status === 429) iniciarCuentaAtras(e.retryAfter);   // bloquea el botón e.retryAfter segundos
      else alert(e.message);
    }
  }

  // 3.3 Tiempo real
  VoltaAPI.connect(ev => {
    if (ev.type === 'forum:new_post') prependPost(ev.post);
    if (ev.type === 'friend:request')  toast(ev.from + ' quiere ser tu amigo');
    if (ev.type === 'friend:accepted') toast(ev.from + ' aceptó tu solicitud');
  });
  setInterval(() => VoltaAPI.isLoggedIn() && VoltaAPI.heartbeat(), 45000);
</script>
```

> Escapa siempre el texto que viene del servidor (`esc()`/`textContent`) antes de ponerlo en `innerHTML`: el servidor lo guarda tal cual.
> Si abres el HTML desde `file://`, el origen es `null`: deja `CORS_ORIGINS` vacío en desarrollo y sirve el HTML desde tu dominio en producción.

## 4. Seguridad: lo que hay y lo que debes saber

- Contraseñas con **bcrypt** (coste 12); límite de 72 bytes porque bcrypt ignora el resto.
- **JWT** HS256 con caducidad (`JWT_EXPIRES`). `JWT_SECRET` ≥ 32 caracteres; cámbialo → se invalidan todas las sesiones.
- Login con tiempos igualados (no revela si el usuario existe) y límite de 20 intentos / 15 min por IP. Detrás de proxy pon `TRUST_PROXY=1`.
- Todas las consultas van parametrizadas; entrada validada con zod; cuerpo máx. 16 KB; tarjeta de progreso máx. 4 KB.
- Usernames únicos sin distinguir mayúsculas (índice `lower(username)`).
- **El filtro de palabras es heurístico**, no infalible (se burla con variantes nuevas). Para producción añade denuncias y revisión manual.
- Usa HTTPS siempre (el JWT viaja en cabecera). Si guardas el token en `localStorage`, cualquier XSS lo puede leer: escapa el contenido de usuarios.

## 5. Integración ya hecha en `Volta-5.html`

El módulo Social de `Volta-5.html` ya usa esta API a través de `client/volta-api.js` (el HTML debe quedar junto a la carpeta `client/`):
registro/login con correo y contraseña, comprobación de usuario con debounce, foro con cuenta atrás por `429 retryAfter`,
amigos, WebSocket en tiempo real y heartbeat cada 45 s. La URL del servidor se define al final del HTML
(`VoltaAPI.configure(window.VOLTA_API_BASE||"http://localhost:3000")`).

**Probar la interfaz sin base de datos:** `node test/mock-server.js` levanta un servidor simulado con los mismos contratos (puerto 3000).
Para el servidor real: `npm install`, `npm run migrate`, `npm run dev`.

**Corrección en el filtro de nombres:** `lib/moderation.js` (y la copia dentro del HTML) rechazaba por error cualquier nombre con la letra «k»
(la palabra «kkk» se reducía a «k»). Ya está corregido en ambos sitios.

## 4. App web (`Volta-app.html`) e instalación como app

El servidor también sirve la app en `/` (además de `manifest.webmanifest`, iconos y `sw.js` desde `public/`):

- **Misma dirección para app y API:** al servirla, el servidor añade `<meta name="volta-api">` y la app usa su propio origen como API (sin CORS).
- **Instalable y sin conexión:** desde el móvil, abre la URL del servidor → *Añadir a pantalla de inicio*. El service worker guarda la app; la API y el WebSocket siempre van a la red.
- **Comprimida:** viaja con gzip (≈2,0 MB en vez de 2,9 MB).

Las mejoras sobre el HTML original están en `frontend/mejoras.js` y `frontend/mejoras.css`. Tras editarlas:

```bash
npm run build:app      # las inyecta en Volta-app.html (entre los marcadores VOLTA-MEJORAS)
```

Qué añaden: series prerrellenadas con el objetivo de sobrecarga progresiva, pantalla siempre encendida al entrenar,
confeti y vibración al batir un récord, resumen de la sesión con imagen para compartir, traducción completa
(EN/FR/PT, incluidos los 145 ejercicios), imágenes incrustadas sin 404, etiquetas accesibles y foco visible.
