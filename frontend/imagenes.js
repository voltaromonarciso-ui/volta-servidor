/* VOLTA · Imágenes de ejercicios generadas con la skill volta-imagenes-ejercicios (estilo «Press de banca»).
   Archivo generado por .claude/skills/volta-imagenes-ejercicios/scripts/integrar.mjs: no editar a mano.
   Cada ejercicio de la lista usa public/assets/ejercicios/<archivo> como imagen propia. */
(function () {
  if (typeof EX === 'undefined' || typeof EMB !== 'object') return;
  const M = {};
  const done = [];
  EX.forEach((e) => {
    const m = M[e[0]];
    if (!m || (e.cid && EMB[e.cid])) return; // las fotos que ya trae la app tienen prioridad
    const f = m[0];
    done.push([e, e.cid, e.image]);
    e.cid = 'gen_' + f.replace(/\.\w+$/, '');
    EMB[e.cid] = 'assets/ejercicios/' + f;
    e.image = EMB[e.cid];
    if (m[1]) { e.vgen = 'assets/ejercicios/' + m[1]; if (m[2]) e.vgenW = 'assets/ejercicios/' + m[2]; } // vídeo en bucle (Veo) para la ficha
  });
  // Si las imágenes no están a mano (el HTML abierto suelto, sin la carpeta assets), se vuelve a los dibujos
  if (done.length) {
    const t = new Image();
    t.onerror = () => { done.forEach(([e, cid, img]) => { delete EMB[e.cid]; e.cid = cid; e.image = img; delete e.vgen; }); try { R(); } catch (x) { /* sin pantalla */ } };
    t.src = EMB[done[0][0].cid];
  }
})();
