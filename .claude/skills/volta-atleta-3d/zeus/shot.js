const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('E', e.message)); p.on('console', m => console.log('c', m.text()));
await p.goto('http://localhost:8100/zeus/zeus.html'); await p.waitForFunction(() => document.title === 'ready');
for (const m of ['feliz', 'anima', 'piensa', 'preocupado', 'guino']) { const d = await p.evaluate((m) => render(m), m); fs.writeFileSync(__dirname + '/z-' + m + '.png', Buffer.from(d.split(',')[1], 'base64')); }
await b.close(); })();
