/* VOLTA · cliente de la API (JavaScript nativo, sin dependencias).
   Uso en index.html:  <script src="volta-api.js"></script>  →  window.VoltaAPI
   Todas las funciones devuelven Promesas y lanzan Error con .status, .code y .retryAfter si falla. */
(function (root) {
  'use strict';
  const TOKEN_KEY = 'volta_token';
  const S = { base: '', token: '' };
  try { S.token = localStorage.getItem(TOKEN_KEY) || ''; } catch (_) {}

  async function http(path, { method = 'GET', body, auth = true } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && S.token) headers.Authorization = 'Bearer ' + S.token;

    let res;
    try {
      res = await fetch(S.base + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch (_) {
      const e = new Error('Sin conexión con el servidor.'); e.status = 0; e.code = 'network'; throw e;
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(data.message || 'Error ' + res.status);
      e.status = res.status; e.code = data.error; e.data = data;
      e.retryAfter = data.retryAfter || Number(res.headers.get('Retry-After')) || 0; // 429 del foro
      if (res.status === 401 && auth && S.token) setToken(''); // sesión caducada
      throw e;
    }
    return data;
  }

  function setToken(t) {
    S.token = t || '';
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (_) {}
  }
  const qs = (o) => Object.entries(o).filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');

  const VoltaAPI = {
    /** configure('https://api.tudominio.com')  ·  sin barra final */
    configure(base) { S.base = String(base || '').replace(/\/$/, ''); },
    isLoggedIn: () => !!S.token,

    // ── Auth ──
    async register({ username, email, password }) {
      const d = await http('/api/auth/register', { method: 'POST', body: { username, email, password }, auth: false });
      setToken(d.token); return d.user;
    },
    async login(identifier, password) { // identifier = correo o usuario
      const d = await http('/api/auth/login', { method: 'POST', body: { identifier, password }, auth: false });
      setToken(d.token); return d.user;
    },
    logout() { setToken(''); VoltaAPI.disconnect(); },
    me: () => http('/api/auth/me').then((d) => d.user),
    /** Borra la cuenta en el servidor (pide la contraseña) y cierra la sesión. */
    async deleteAccount(password) {
      await http('/api/auth/me', { method: 'DELETE', body: { password } });
      VoltaAPI.logout();
    },

    // ── Usuarios ──
    /** → { available, reason?, message? }  (reason: banned | format | taken) */
    checkUsername: (username) => http('/api/users/check-username?' + qs({ username }), { auth: false }),
    searchUsers: (q) => http('/api/users/search?' + qs({ q })).then((d) => d.users),
    heartbeat: () => http('/api/users/heartbeat', { method: 'POST', body: {} }),
    /** Resumen de la semana en curso: { days, sets, volume } */
    submitStats: (s) => http('/api/users/stats', { method: 'POST', body: s }),
    /** → { week, entries: [{ username, days, sets, volume, me }] } (tú + amigos, por volumen) */
    leaderboard: () => http('/api/friends/leaderboard'),

    // ── Amigos ──
    friends: () => http('/api/friends'),                       // { friends, incoming, outgoing }
    requestFriend: (username) => http('/api/friends/request', { method: 'POST', body: { username } }),
    /** idOrUsername: uuid de la solicitud o nombre de usuario de quien la envió · action: 'accept' | 'reject' */
    respondFriend(idOrUsername, action) {
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername);
      return http('/api/friends/respond', { method: 'PUT', body: isId ? { requestId: idOrUsername, action } : { username: idOrUsername, action } });
    },

    sendFriendRequest(username) { return VoltaAPI.requestFriend(username); },   // alias
    respondFriendRequest(idOrUsername, action) { return VoltaAPI.respondFriend(idOrUsername, action); }, // alias

    // ── Foro ──
    posts: ({ limit = 20, cursor } = {}) => http('/api/forum/posts?' + qs({ limit, cursor })), // { posts, nextCursor }
    /** Lanza error con status 429 y e.retryAfter (segundos) si publicas antes de 10 s. */
    publish: ({ content = '', progressData } = {}) =>
      http('/api/forum/posts', { method: 'POST', body: { content, progressData } }).then((d) => d.post),

    // ── Tiempo real (WebSocket) ──
    /** connect(evt => ...)  eventos: forum:new_post · friend:request · friend:accepted */
    connect(onEvent) {
      VoltaAPI.disconnect();
      let tries = 0, stop = false;
      const url = (S.base || location.origin).replace(/^http/, 'ws') + '/ws';
      const open = () => {
        const ws = (VoltaAPI._ws = new WebSocket(url));
        ws.onopen = () => { tries = 0; ws.send(JSON.stringify({ type: 'auth', token: S.token })); };
        ws.onmessage = (m) => { try { onEvent(JSON.parse(m.data)); } catch (_) {} };
        ws.onclose = (ev) => {
          if (stop || ev.code === 4401) return; // 4401 = token inválido: no reintentar
          setTimeout(open, Math.min(30000, 1000 * 2 ** tries++));
        };
      };
      VoltaAPI._stop = () => { stop = true; if (VoltaAPI._ws) VoltaAPI._ws.close(); };
      open();
    },
    disconnect() { if (VoltaAPI._stop) { VoltaAPI._stop(); VoltaAPI._stop = null; } },
  };

  root.VoltaAPI = VoltaAPI;
})(window);
