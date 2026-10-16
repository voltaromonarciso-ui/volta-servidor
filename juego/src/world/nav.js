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

  nearest(x, z, los) {
    const order = this.nodes
      .map((n, i) => [i, (n.x - x) ** 2 + (n.z - z) ** 2])
      .sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < Math.min(8, order.length); k++) {
      const n = this.nodes[order[k][0]];
      if (!los || los(x, z, n.x, n.z)) return order[k][0];
    }
    return order[0][0];
  }

  // Devuelve una lista de puntos {x,z} desde A hasta B.
  path(ax, az, bx, bz, los) {
    if (los && Math.hypot(bx - ax, bz - az) < 40 && los(ax, az, bx, bz)) return [{ x: bx, z: bz }];
    const s = this.nearest(ax, az, los), t = this.nearest(bx, bz, los);
    const dist = new Array(this.nodes.length).fill(Infinity);
    const prev = new Array(this.nodes.length).fill(-1);
    const done = new Array(this.nodes.length).fill(false);
    dist[s] = 0;
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < dist.length; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0 || u === t) break;
      done[u] = true;
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
