// Uso: node p3d.js '<lista de patrones o nombres>' salida.png [t]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.route(/cdnjs\.cloudflare\.com.*three\.min\.js/, r => r.fulfill({ path: process.env.THREE_JS, contentType: 'text/javascript' }));
await p.route(/GLTFLoader\.js/, r => r.fulfill({ path: process.env.GLTF_JS, contentType: 'text/javascript' }));
await p.goto(process.env.APP_URL || 'http://localhost:8100/Volta-app.html'); await p.waitForTimeout(1200);
const list = JSON.parse(process.argv[2]), ts = JSON.parse(process.argv[4] || '[0,1]');
await p.evaluate(async ({ list, ts }) => {
  document.body.innerHTML = '<div id="g" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:#11161a;width:1400px"></div>';
  const g = document.getElementById('g'); await vxAtleta3D.loadModel();
  for (const n of list) {
    let i = EX.findIndex(e => e[0] === n); if (i < 0) i = EX.findIndex(e => vxPattern(e) === n);
    for (const t of ts) {
      const c = document.createElement('div'); c.style.cssText = 'position:relative;color:#9dff2e;font:11px sans-serif'; g.appendChild(c);
      c.style.width='340px'; const v = vxAtleta3D.build(c, i, await vxAtleta3D.loadModel()); v.at(t); const im=new Image(); im.src=v.snap(); im.style.width='100%'; c.appendChild(im); v.dispose(); v.canvas.width=1;
      const l = document.createElement('div'); l.textContent = EX[i][0] + ' · ' + v.pat + ' t=' + t; l.style.cssText = 'position:absolute;left:4px;top:2px'; c.appendChild(l);
      v.dispose = v.dispose; c._v = v;
    }
  }
}, { list, ts });
await p.waitForTimeout(500);
await p.screenshot({ path: process.argv[3], fullPage: true });
console.log('errs', errs.slice(0, 5)); await b.close();
})();
