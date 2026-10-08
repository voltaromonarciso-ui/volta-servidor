/* VOLTA · arreglos generales que se cargan al final */
(function () {
  if (typeof V !== 'object' || typeof R !== 'function') return;

  // La pantalla "Rangos" del perfil se retiró, pero la tarjeta de rango de Progreso aún enlaza a ella:
  // ahora abre la guía de rangos de Progreso en vez de dejar la app en blanco.
  if (typeof V['p:ranks'] !== 'function') {
    V['p:ranks'] = function () {
      S.stack = S.stack.filter((x) => x !== 'p:ranks');
      S.tab = 'prog'; S.rkm = 1;
      return V.prog();
    };
  }

  // "Filtros" era una pantalla de relleno ("Opción A / Opción B") sin efecto: ahora abre la biblioteca
  // con su panel de filtros real (material, nivel, tipo y orden) ya desplegado.
  V.filters = function () {
    S.stack = S.stack.filter((x) => x !== 'filters');
    if (S.stack[S.stack.length - 1] !== 'lib') S.stack.push('lib');
    S.xfo = true;
    return V.lib();
  };

  // Comparador: sin "No especificado". La lateralidad se deduce del nombre y el banco recibe ángulos reales.
  const UNI = /una pierna|un brazo|unilateral|alterna|altern|concentraci|kroc|pistol|zancad|búlgar|arquer|cruzad|single|step.?up|subida al caj/i;
  const lat = (i) => (EX[i] && UNI.test(EX[i][0]) ? 'Unilateral' : 'Bilateral');
  if (typeof V.xcmp === 'function') {
    const _x = V.xcmp;
    V.xcmp = function () {
      let h = _x.apply(this, arguments);
      try {
        const c = S.xc || [], a = lat(c[0]), b = lat(c[1]);
        h = h.replace(/(Lateralidad<\/div><div class="row sp"><span>)No especificado/, '$1' + a)
          .replace(/(Lateralidad<\/div><div class="row sp"><span>[^<]*<\/span><span[^>]*>)No especificado/, '$1' + b)
          .replace(/Lateralidad: ([^.<]*?) frente a ([^.<]*?)\./, (m, x, y) => {
            x = x === 'No especificado' ? a : x; y = y === 'No especificado' ? b : y;
            return x === y ? '' : `Lateralidad: ${x} frente a ${y}.`;
          })
          .replace(/No necesita \/ No especificado/g, 'No necesita')
          .replace(/Inclinado \(ángulo: No especificado\)/g, 'Inclinado (30°–45°)')
          .replace(/Declinado \(ángulo: No especificado\)/g, 'Declinado (−15°–−30°)')
          .replace(/No especificado/g, '—');
      } catch (e) { /* comparador original */ }
      return h;
    };
  }

  // Red de seguridad: si algún botón apunta a una pantalla que no existe, se vuelve atrás con un aviso
  // en lugar de romper el dibujado (que dejaba la pantalla vacía).
  const known = (v) => /^(ex|anat|meal)\d+$/.test(v) || typeof V[v] === 'function';
  const _R = R;
  R = function () {
    let guard = 0;
    while (S.stack && S.stack.length && !known(S.stack[S.stack.length - 1]) && guard++ < 10) {
      console.warn('[volta] pantalla inexistente:', S.stack.pop());
    }
    if (!known(S.tab)) S.tab = 'home';
    return _R.apply(this, arguments);
  };
})();
