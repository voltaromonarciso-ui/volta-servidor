// Uso: npm run build:app
// Inyecta frontend/mejoras.css, frontend/mejoras.js y frontend/engage.js al final de Volta-app.html (entre marcadores,
// así se puede volver a ejecutar tantas veces como haga falta sin duplicar nada).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const file = path.join(root, 'Volta-app.html');
const css = fs.readFileSync(path.join(root, 'frontend/mejoras.css'), 'utf8');
// Orden importante: engage.js se apoya en lo que define mejoras.js (vxTr, vxCelebrate)
const js = ['platos.js', 'mejoras.js', 'recetas.js', 'ejercicios.js', 'catalogo.js', 'imagenes.js', 'avatar.js', 'atleta3d.js', 'tecnica.js', 'engage.js', 'compete.js', 'olimpo.js', 'rutinas.js', 'arreglos.js', 'textos.js', 'temas.js', 'a11y.js'].map((f) => fs.readFileSync(path.join(root, 'frontend', f), 'utf8')).join('\n');

const START = '<!-- VOLTA-MEJORAS:START -->';
const END = '<!-- VOLTA-MEJORAS:END -->';
const block = `${START}\n<style>\n${css}</style>\n<script>\n${js.replace(/<\/script/gi, '<\\/script')}</script>\n${END}\n`;

let html = fs.readFileSync(file, 'utf8');
const a = html.indexOf(START);
if (a !== -1) {
  const b = html.indexOf(END, a);
  if (b === -1) throw new Error('Falta el marcador de cierre en Volta-app.html');
  html = html.slice(0, a) + block + html.slice(b + END.length + 1);
} else {
  const i = html.lastIndexOf('</body>');
  if (i === -1) throw new Error('No se encontró </body> en Volta-app.html');
  html = html.slice(0, i) + block + html.slice(i);
}
fs.writeFileSync(file, html);
console.log(`Volta-app.html actualizado (${(html.length / 1048576).toFixed(2)} MB)`);
