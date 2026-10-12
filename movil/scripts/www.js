#!/usr/bin/env node
/* Prepara movil/www/ para Capacitor: la app (Volta-app.html → index.html) y los archivos de public/
   (iconos, diccionarios de idiomas, imágenes de ejercicios, modelo 3D…). Se ejecuta antes de cada «cap sync». */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WWW = path.resolve(__dirname, '..', 'www');
const APP = path.join(ROOT, 'Volta-app.html');
if (!fs.existsSync(APP)) { console.error('Falta Volta-app.html: ejecuta antes «npm run build:app» en la raíz.'); process.exit(1); }

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), WWW, { recursive: true });
// el service worker no hace falta dentro de la app (los archivos ya van en el paquete)
fs.rmSync(path.join(WWW, 'sw.js'), { force: true });
let html = fs.readFileSync(APP, 'utf8');
// Puente de Capacitor (8 KB) y registro de los plugins nativos que usa la app: quedan en Capacitor.Plugins
fs.copyFileSync(require.resolve('@capacitor/core/dist/capacitor.js'), path.join(WWW, 'capacitor.js'));
const PLUGINS = ['App', 'LocalNotifications', 'StatusBar'];
html = html.replace('<head>', '<head><meta name="volta-native" content="capacitor"><script src="capacitor.js"></script>' +
  `<script>try{${JSON.stringify(PLUGINS)}.forEach(function(n){Capacitor.registerPlugin(n)})}catch(e){}</script>`);
fs.writeFileSync(path.join(WWW, 'index.html'), html);
const kb = (f) => Math.round(fs.statSync(f).size / 1024);
console.log(`movil/www listo · index.html ${kb(path.join(WWW, 'index.html'))} KB`);
