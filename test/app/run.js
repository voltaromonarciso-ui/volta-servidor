#!/usr/bin/env node
/* Pruebas de la app (Playwright): sirve Volta-app.html y public/assets en un puerto local y ejecuta cada suite de esta carpeta.
   Cada suite imprime «OK …» o «FAIL …» por comprobación. Uso: npm run test:app [-- nombre1 nombre2]
   Variables: CHROMIUM_PATH (si Chromium no es el de Playwright), APP_URL (para probar otra URL ya servida). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'out');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.json': 'application/json', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const file = u === '/' || u === '/Volta-app.html' ? path.join(ROOT, 'Volta-app.html') : path.join(ROOT, 'public', path.normalize(u).replace(/^([.][.][/\\])+/, ''));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

function run(file, env) {
  return new Promise((ok) => {
    let out = '';
    const p = spawn(process.execPath, [file], { cwd: OUT, env });
    const t = setTimeout(() => { out += '\nFAIL tiempo agotado (240 s)'; p.kill('SIGKILL'); }, 240000);
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => { clearTimeout(t); ok({ out, code }); });
  });
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const only = process.argv.slice(2);
  const suites = fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && f !== 'run.js' && (!only.length || only.some((o) => f.startsWith(o)))).sort();
  let srv = null, url = process.env.APP_URL;
  if (!url) { srv = await serve(); url = `http://127.0.0.1:${srv.address().port}/Volta-app.html`; }
  const env = Object.assign({}, process.env, { APP_URL: url, NODE_PATH: [path.join(ROOT, 'node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter) });
  let fails = 0, oks = 0;
  for (const s of suites) {
    const { out, code } = await run(path.join(__dirname, s), env);
    const f = (out.match(/^FAIL.*$/gm) || []), o = (out.match(/^OK.*$/gm) || []).length;
    oks += o;
    const bad = f.length || code !== 0;
    if (bad) { fails++; console.log(`✗ ${s}  (${o} OK, ${f.length} FAIL, salida ${code})\n${out.split('\n').filter((l) => /FAIL|Error|error/.test(l)).slice(0, 12).join('\n')}`); }
    else console.log(`✓ ${s}  (${o} comprobaciones)`);
  }
  if (srv) srv.close();
  console.log(`\n${suites.length - fails}/${suites.length} suites en verde · ${oks} comprobaciones`);
  process.exit(fails ? 1 : 0);
})();
