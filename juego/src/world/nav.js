// Grafo de navegación por las aceras (nodos en las esquinas de cada manzana).
export class Nav {
  constructor() {
    this.nodes = [];
    this.adj = [];
  }

  add(x, z) {
    this.nodes.push({ x, z });
    this.adj.push([]);
    return this.nodes.length - 1;
  }

  link(a, b) {
    const d = Math.hypot(this.nodes[a].x - this.nodes[b].x, this.nodes[a].z - this.nodes[b].z);
    this.adj[a].push([b, d]);
    this.adj[b].push([a, d]);
  }

  // (los 8 nodos más cercanos sin ordenar el grafo entero ni crear listas: se llama a menudo)
  nearest(x, z, los) {
    const K = Math.min(8, this.nodes.length), bi = (this._bi ||= new Int32Array(8)), bd = (this._bd ||= new Float64Array(8));
    let m = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i], d = (n.x - x) ** 2 + (n.z - z) ** 2;
      if (m === K && d >= bd[m - 1]) continue;
      let j = m < K ? m++ : m - 1;
      while (j > 0 && bd[j - 1] > d) { bd[j] = bd[j - 1]; bi[j] = bi[j - 1]; j--; }
      bd[j] = d; bi[j] = i;
    }
    for (let k = 0; k < m; k++) {
      const n = this.nodes[bi[k]];
      if (!los || los(x, z, n.x, n.z)) return bi[k];
    }
    return bi[0];
  }

  // Devuelve una lista de puntos {x,z} desde A hasta B.
  path(ax, az, bx, bz, los) {
    if (los && Math.hypot(bx - ax, bz - az) < 40 && los(ax, az, bx, bz)) return [{ x: bx, z: bz }];
    const s = this.nearest(ax, az, los), t = this.nearest(bx, bz, los);
    // (búferes reutilizados entre búsquedas)
    const N = this.nodes.length;
    if (!this._dist || this._dist.length !== N) { this._dist = new Float64Array(N); this._prev = new Int32Array(N); this._done = new Uint8Array(N); }
    const dist = this._dist.fill(Infinity), prev = this._prev.fill(-1), done = this._done.fill(0);
    dist[s] = 0;
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < dist.length; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0 || u === t) break;
      done[u] = 1;
      for (const [v, w] of this.adj[u]) {
        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
      }
    }
    const pts = [];
    for (let v = t; v >= 0; v = prev[v]) { pts.unshift({ ...this.nodes[v] }); if (v === s) break; }
    pts.push({ x: bx, z: bz });
    return pts;
  }
}
