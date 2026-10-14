/* VOLTA · dibujante de platos: cada ingrediente con su forma real, en plato, cuenco o vaso, con luz y sombra.
   Sustituye a foodArt() de la app (mismas llamadas, mismo SVG 100×100). */
(function () {
  'use strict';
  if (typeof foodArt !== 'function') return;

  let seed = 1;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const R = (a, b) => a + rnd() * (b - a);
  const f1 = (v) => Math.round(v * 10) / 10;

  // ── Formas por tipo de ingrediente. Cada una dibuja UNA pieza en (x, y) con rotación a y escala s ──
  const g = (x, y, a, s, body) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${Math.round(a)}) scale(${f1(s * 100) / 100})">${body}</g>`;
  const SH = {
    penne: (c) => `<rect x="-5" y="-1.6" width="10" height="3.2" rx="1.5" fill="${c || '#e8c15a'}" stroke="#b8902e" stroke-width=".25"/><path d="M-3.5 -1.4v2.8M-1.5 -1.5v3M.5 -1.5v3M2.5 -1.5v3" stroke="#c99f3c" stroke-width=".25"/><ellipse cx="5" cy="0" rx=".7" ry="1.5" fill="#a77d28"/>`,
    grain: (c) => `<ellipse rx="1.15" ry=".5" fill="${c || '#f6f1e2'}" stroke="#cfc7ad" stroke-width=".15"/>`,
    tiny: (c) => `<circle r=".55" fill="${c || '#efe1b8'}"/>`,
    chicken: () => `<rect x="-6" y="-2.6" width="12" height="5.2" rx="2.4" fill="#e9c891"/><rect x="-6" y="-2.6" width="12" height="5.2" rx="2.4" fill="url(#gLit)" opacity=".5"/><path d="M-4 -2.4l2 4.8M-.8 -2.5l2 5M2.4 -2.4l2 4.6" stroke="#8a5a26" stroke-width=".7" stroke-linecap="round" opacity=".75"/>`,
    beef: () => `<rect x="-5.5" y="-2.4" width="11" height="4.8" rx="1.6" fill="#7a3f22"/><rect x="-4.6" y="-1.5" width="9.2" height="3" rx="1" fill="#c0614a"/><rect x="-3.8" y="-.8" width="7.6" height="1.6" rx=".8" fill="#d98a78" opacity=".8"/>`,
    pork: () => `<rect x="-5.5" y="-2.4" width="11" height="4.8" rx="2" fill="#c98b5a"/><rect x="-4.5" y="-1.4" width="9" height="2.8" rx="1.2" fill="#f0c9b0"/>`,
    salmon: () => `<path d="M-10 -4c5 -2 14 -2 20 0c1 3 1 5 0 8c-6 2 -15 2 -20 0c-1.4 -3 -1.4 -5 0 -8z" fill="#f08a5d"/><path d="M-8 -3.2c1.5 2.4 1.5 4.6 0 6.6M-4 -3.6c1.5 2.4 1.5 5 0 7.2M0 -3.6c1.5 2.4 1.5 5 0 7.2M4 -3.6c1.5 2.4 1.5 5 0 7.2" stroke="#ffd3bd" stroke-width=".6" fill="none" opacity=".9"/><path d="M-10 -4c5 -2 14 -2 20 0" stroke="#b5502c" stroke-width="1" fill="none"/>`,
    whitefish: () => `<path d="M-10 -4c5 -2 14 -2 20 0c1 3 1 5 0 8c-6 2 -15 2 -20 0c-1.4 -3 -1.4 -5 0 -8z" fill="#f5efe3"/><path d="M-10 -4c5 -2 14 -2 20 0c1 3 1 5 0 8c-6 2 -15 2 -20 0" fill="url(#gCrust)" opacity=".7"/><path d="M-6 -2.6c1 2 1 4 0 5.8M-1 -3c1 2 1 4.4 0 6.2M4 -2.6c1 2 1 4 0 5.8" stroke="#e2d6bf" stroke-width=".5" fill="none"/>`,
    tuna: () => `<rect x="-3" y="-2.4" width="6" height="4.8" rx="1.2" fill="#d97a7a"/><rect x="-3" y="-2.4" width="6" height="1.6" rx=".8" fill="#e8a0a0" opacity=".8"/>`,
    prawn: () => `<path d="M-4 1c0 -4 4 -6 7 -4c2 1.4 1.6 4 -.6 4.4c-1.6 .3 -2.6 -1 -4.6 .8" fill="none" stroke="#f07a4a" stroke-width="2.4" stroke-linecap="round"/><path d="M-4 1c0 -4 4 -6 7 -4" fill="none" stroke="#ffb08a" stroke-width=".7"/>`,
    sardine: () => `<path d="M-9 0c4 -3 12 -3 16 0c-4 3 -12 3 -16 0z" fill="#9fb1bf"/><path d="M-9 0c4 -1.6 12 -1.6 16 0" fill="none" stroke="#5f7486" stroke-width=".6"/><path d="M7 0l3 -2.2v4.4z" fill="#8296a6"/>`,
    eggFried: () => `<path d="M-7 -1c-1 -5 5 -7 8 -5c4 -1 7 3 5 6c2 4 -3 7 -6 5c-3 2 -8 0 -7 -6z" fill="#fbfaf4"/><circle cx="0" cy="0" r="3.3" fill="#f3b723"/><circle cx="-1" cy="-1" r="1.1" fill="#ffe08a" opacity=".85"/>`,
    eggHalf: () => `<ellipse rx="4.6" ry="3.4" fill="#fbfaf4" stroke="#e6e0d0" stroke-width=".3"/><circle r="2" fill="#f2b51e"/>`,
    omelette: () => `<circle r="14" fill="#f2cf5b"/><circle r="14" fill="url(#gLit)" opacity=".55"/><circle cx="-5" cy="-3" r="1.2" fill="#d9a83a" opacity=".6"/><circle cx="4" cy="4" r="1.6" fill="#d9a83a" opacity=".5"/><circle cx="3" cy="-6" r="1" fill="#d9a83a" opacity=".6"/>`,
    tofu: (c) => `<rect x="-2.6" y="-2.6" width="5.2" height="5.2" rx=".9" fill="${c || '#f2e6c4'}"/><rect x="-2.6" y="-2.6" width="5.2" height="1.7" rx=".9" fill="#d9a85a" opacity=".7"/>`,
    cube: (c) => `<rect x="-2.3" y="-2.3" width="4.6" height="4.6" rx="1" fill="${c}"/><rect x="-2.3" y="-2.3" width="4.6" height="1.6" rx="1" fill="#fff" opacity=".25"/>`,
    wedge: (c) => `<path d="M-4.5 2c0 -4 3 -6 9 -4.4c-1.6 3 -4.4 5 -9 4.4z" fill="${c || '#e7c06a'}"/><path d="M-4.5 2c3 .4 6 -1.6 9 -4.4" stroke="#b07a2a" stroke-width=".7" fill="none"/>`,
    floret: () => `<path d="M0 0v4.5" stroke="#7aa84a" stroke-width="1.6" stroke-linecap="round"/><circle cx="-1.7" cy="-.6" r="2" fill="#3f7f2a"/><circle cx="1.7" cy="-.6" r="2" fill="#3f7f2a"/><circle cx="0" cy="-2.2" r="2.1" fill="#4f9a34"/><circle cx="-.6" cy="-2.8" r=".7" fill="#76b84f"/>`,
    stick: (c) => `<rect x="-6.5" y="-.8" width="13" height="1.6" rx=".8" fill="${c || '#6bb22e'}"/><path d="M5 -1.1l2 1.1l-2 1.1" fill="${c || '#5a9a26'}"/>`,
    leaf: (c) => `<path d="M-6 0c2 -4.6 9 -4.6 12 0c-3 4.6 -10 4.6 -12 0z" fill="${c || '#5fae3a'}"/><path d="M-5 0h10M-1 0l2 -2M1.5 0l2 -1.6M-1 0l2 2M1.5 0l2 1.6" stroke="#2f6e1e" stroke-width=".35" fill="none" opacity=".7"/>`,
    tomato: () => `<circle r="3.6" fill="#d9442f"/><circle r="2.7" fill="#e8634a"/><path d="M0 -2.4v4.8M-2.1 -1.2l4.2 2.4M-2.1 1.2l4.2 -2.4" stroke="#f3a08a" stroke-width=".5"/><circle cx="-1" cy="-1" r=".5" fill="#fbe9a0"/><circle cx="1.1" cy=".8" r=".5" fill="#fbe9a0"/>`,
    cherry: () => `<circle r="2.4" fill="#d9442f"/><circle cx="-.7" cy="-.8" r=".7" fill="#ff9c86" opacity=".8"/>`,
    cucumber: () => `<circle r="3.3" fill="#3f7f2a"/><circle r="2.8" fill="#d8eab0"/><circle r="1.5" fill="#c3dd92"/><circle cx="-.5" cy="-.4" r=".25" fill="#f4f6e0"/><circle cx=".6" cy=".3" r=".25" fill="#f4f6e0"/>`,
    zucchini: () => `<circle r="3.2" fill="#3c7a2a"/><circle r="2.7" fill="#eef3c8"/><circle r="1.1" fill="#dfe8aa"/>`,
    coin: (c) => `<circle r="2.6" fill="${c || '#e8913a'}"/><circle r="1.6" fill="none" stroke="#fff" stroke-width=".3" opacity=".35"/>`,
    strip: (c) => `<path d="M-5 -.4c3 -1.6 7 -1.6 10 0c-3 2.4 -7 2.4 -10 0z" fill="${c || '#d9442f'}"/><path d="M-4 -.5c2.6 -1 5.4 -1 8 0" stroke="#fff" stroke-width=".35" opacity=".4" fill="none"/>`,
    onion: () => `<circle r="2.8" fill="none" stroke="#b07ab0" stroke-width=".9"/><circle r="1.6" fill="none" stroke="#d2a8d2" stroke-width=".6"/>`,
    avocado: () => `<path d="M-6 2c0 -5 5 -8 9 -6c3 1.4 3 4 1 6c-2 2 -6 3 -10 0z" fill="#2f5a1e"/><path d="M-5.2 1.6c0 -4 4.2 -6.6 7.6 -5c2.4 1.2 2.4 3.4.8 5c-1.8 1.6 -5 2.4 -8.4 0z" fill="#bfd96a"/><path d="M-4.4 1.2c0 -3 3.4 -5 6 -3.8" stroke="#e3ee9e" stroke-width=".8" fill="none"/>`,
    banana: () => `<circle r="3" fill="#f6ecc2"/><circle r="3" fill="none" stroke="#e8d68a" stroke-width=".5"/><circle cx="0" cy="0" r=".9" fill="#d8c788"/><circle cx="-.4" cy="1" r=".3" fill="#b9a76a"/><circle cx=".7" cy="-.5" r=".3" fill="#b9a76a"/>`,
    berry: (c) => `<circle r="1.9" fill="${c || '#c8263a'}"/><circle cx="-.6" cy="-.6" r=".55" fill="#fff" opacity=".45"/>`,
    blueberry: () => `<circle r="1.6" fill="#3d4f9a"/><circle r="1.6" fill="#2a3570" opacity=".35"/><path d="M-.4 -.8l.4 .4l.4 -.4" stroke="#9aa6d8" stroke-width=".3" fill="none"/>`,
    strawberry: () => `<path d="M0 3.4c-3 -1 -3.8 -4 -2.6 -5.4c1 -1 4.2 -1 5.2 0c1.2 1.4 .4 4.4 -2.6 5.4z" fill="#d7263d"/><path d="M-2 -2.2l1 .9l1 -1.2l1 1.2l1 -.9" stroke="#3f8a2a" stroke-width=".9" fill="none" stroke-linejoin="round"/><circle cx="-.9" cy=".2" r=".2" fill="#ffd36b"/><circle cx=".8" cy="-.4" r=".2" fill="#ffd36b"/><circle cx="0" cy="1.4" r=".2" fill="#ffd36b"/>`,
    apple: (c) => `<path d="M-6 2c2 -6 10 -6 12 0c-2 1.6 -10 1.6 -12 0z" fill="${c || '#c93a2a'}"/><path d="M-5.2 1.6c2 -4.6 8.4 -4.6 10.4 0c-2.2 1.2 -8.2 1.2 -10.4 0z" fill="#fbf1d8"/>`,
    kiwi: () => `<circle r="3.6" fill="#7a5a2a"/><circle r="3.2" fill="#8fbf3a"/><circle r="1.2" fill="#f4f1d8"/><g fill="#2a2a1a">${[0, 60, 120, 180, 240, 300].map((d) => `<circle cx="${f1(2 * Math.cos(d * Math.PI / 180))}" cy="${f1(2 * Math.sin(d * Math.PI / 180))}" r=".25"/>`).join('')}</g>`,
    mango: () => `<rect x="-2.4" y="-2.4" width="4.8" height="4.8" rx="1.1" fill="#f7a91e"/><rect x="-2.4" y="-2.4" width="4.8" height="1.6" rx="1.1" fill="#ffd36b" opacity=".7"/>`,
    pineapple: () => `<path d="M-3 -2.6h6l-1.2 5.2h-3.6z" fill="#f4d34a"/><path d="M-2 -1.6h4" stroke="#e0b52a" stroke-width=".4"/>`,
    grape: () => `<circle r="2" fill="#7fa83a"/><circle cx="-.6" cy="-.6" r=".6" fill="#d8f0a0" opacity=".6"/>`,
    nut: (c) => `<ellipse rx="2.4" ry="1.5" fill="${c || '#b07a45'}"/><path d="M-1.6 0h3.2" stroke="#7a4f26" stroke-width=".3"/>`,
    walnut: () => `<path d="M-2.6 0c0 -2 1.6 -2.6 2.6 -1.6c1 -1 2.6 -.4 2.6 1.6c0 2 -1.6 2.6 -2.6 1.6c-1 1 -2.6 .4 -2.6 -1.6z" fill="#a8743f"/><path d="M0 -1.6v3.2" stroke="#6e4a22" stroke-width=".3"/>`,
    bean: (c) => `<ellipse rx="1.6" ry="1.05" fill="${c || '#c8a26a'}"/><ellipse cx="-.4" cy="-.3" rx=".5" ry=".3" fill="#fff" opacity=".3"/>`,
    lentil: (c) => `<ellipse rx="1" ry=".75" fill="${c || '#9a5a2a'}"/>`,
    pea: () => `<circle r="1.4" fill="#79b83f"/><circle cx="-.4" cy="-.4" r=".4" fill="#c4e88a" opacity=".7"/>`,
    edamame: () => `<path d="M-5 0c0 -2.4 10 -2.4 10 0c0 2.4 -10 2.4 -10 0z" fill="#6aa83a"/><circle cx="-2.6" cy="0" r="1.2" fill="#8cc456"/><circle cx="0" cy="0" r="1.2" fill="#8cc456"/><circle cx="2.6" cy="0" r="1.2" fill="#8cc456"/>`,
    toast: (c) => `<path d="M-9 -7c0 -4 3.6 -5.4 9 -5.4s9 1.4 9 5.4v16h-18z" fill="#b8793a"/><path d="M-7.8 -6.4c0 -3 3 -4.4 7.8 -4.4s7.8 1.4 7.8 4.4v14.4h-15.6z" fill="${c || '#e4bf86'}"/><g fill="#c99a5a" opacity=".6"><circle cx="-3" cy="-2" r=".6"/><circle cx="2.4" cy="1" r=".6"/><circle cx="-1" cy="4" r=".6"/><circle cx="4" cy="-4" r=".5"/></g>`,
    wrap: () => `<rect x="-11" y="-4.4" width="22" height="8.8" rx="4.4" fill="#e8c9a0"/><rect x="-11" y="-4.4" width="22" height="8.8" rx="4.4" fill="url(#gLit)" opacity=".5"/><ellipse cx="11" cy="0" rx="2.6" ry="4.4" fill="#f4dfbf"/><circle cx="11" cy="-1.4" r="1.2" fill="#7fbf4a"/><circle cx="10.4" cy="1.4" r="1.3" fill="#e9c891"/><circle cx="11.6" cy=".2" r=".8" fill="#d9442f"/>`,
    tortilla: () => `<circle r="16" fill="#ecd3a2"/><g fill="#c9984f" opacity=".55">${[[-6, -4], [5, -7], [7, 5], [-4, 7], [0, 0], [-9, 2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g>`,
    cheese: () => `<circle r="3" fill="#fbf8ef"/><circle cx="-.8" cy="-.8" r=".9" fill="#fff"/>`,
    lemon: () => `<path d="M-5 0a5 5 0 0 1 10 0z" fill="#f4d22a"/><path d="M-4.2 0a4.2 4.2 0 0 1 8.4 0z" fill="#fbef8a"/><path d="M0 0l-2.6 -3.2M0 0l0 -4.2M0 0l2.6 -3.2" stroke="#f4d22a" stroke-width=".4"/>`,
    pumpkin: () => `<rect x="-2.6" y="-2.6" width="5.2" height="5.2" rx="1.2" fill="#ef8a2a"/>`,
    aubergine: () => `<ellipse rx="9" ry="5" fill="#4a2a5a"/><ellipse rx="7.6" ry="3.8" fill="#c99a6a"/><ellipse rx="7.6" ry="3.8" fill="url(#gLit)" opacity=".4"/>`,
    flake: (c) => `<ellipse rx="1.3" ry=".9" fill="${c || '#d8c29a'}"/>`,
    olive: () => `<ellipse rx="1.8" ry="1.3" fill="#4a5a2a"/><ellipse cx="-.5" cy="-.4" rx=".5" ry=".3" fill="#9aa86a" opacity=".6"/>`,
    cheesecake: () => `<path d="M-14 9l14 -24l14 24z" fill="#f7ecc9"/><path d="M-14 9h28l-1.6 3.2h-24.8z" fill="#b9874a"/><path d="M-12.6 6.6h25.2" stroke="#e8d7a8" stroke-width=".8"/><path d="M-6 -4c3 2 6 2 9 0" stroke="#e8d7a8" stroke-width=".6" fill="none"/><path d="M-3 -12c2 1 4 1 6 0l2 4c-3 2 -7 2 -10 0z" fill="#c8263a"/>`,
    dollop: (c) => `<circle r="9" fill="${c || '#f7f4ec'}"/><path d="M-5 -2c3 -4 8 -1 6 2c-1.6 2.4 -6 1.4 -4 -1.4" stroke="#e4ded0" stroke-width="1" fill="none"/><circle cx="-3" cy="-3" r="2.6" fill="#fff" opacity=".7"/>`,
    pancake: () => `<ellipse rx="13" ry="12" fill="#b97a34"/><ellipse rx="12" ry="11" fill="#dba25a"/><ellipse cx="-2" cy="-2" rx="7" ry="6" fill="#e9bb72" opacity=".7"/>`,
    mushroom: () => `<path d="M-4.4 0c0 -3.6 8.8 -3.6 8.8 0z" fill="#8a6a4a"/><path d="M-4.4 0h8.8" stroke="#5e4630" stroke-width=".5"/><rect x="-1.1" y="0" width="2.2" height="3" rx=".8" fill="#efe2c8"/><path d="M-3 -1.2c1.6 -1.2 4.4 -1.2 6 0" stroke="#b08e6a" stroke-width=".4" fill="none"/>`,
    ring: () => `<circle r="3" fill="none" stroke="#f3e7d6" stroke-width="1.6"/><circle r="3" fill="none" stroke="#d9b98f" stroke-width=".35" opacity=".8"/>`,
    date: () => `<ellipse rx="2.6" ry="1.4" fill="#5a3218"/><ellipse cx="-.6" cy="-.5" rx="1" ry=".4" fill="#8a5a32" opacity=".7"/>`,
    seed: (c) => `<ellipse rx=".5" ry=".35" fill="${c || '#2e2e2e'}"/>`,
    herb: () => `<path d="M-1 0c.6 -1.4 1.6 -1.4 2 0c-.4 1.4 -1.4 1.4 -2 0z" fill="#3f8a2a"/>`,
  };

  // ── Qué forma y color usa cada ingrediente (por nombre de la base de alimentos) ──
  const MAP = [
    [/^(pasta|pasta integral|pasta de legumbres|gnocchi)$/, 'penne', null, 'pile'],
    [/^fideos de arroz$/, 'stick', '#f4ecd4', 'pile'],
    [/^(arroz|arroz integral|basmati|jazmín|arroz inflado)$/, 'grain', null, 'grains'],
    [/^(quinoa|cuscús|bulgur|trigo sarraceno|polenta)$/, 'tiny', '#e6d29a', 'grains'],
    [/^(pollo|pavo)$/, 'chicken', null, 'slices'],
    [/^(ternera|ternera magra)$/, 'beef', null, 'slices'],
    [/^cerdo magro$/, 'pork', null, 'slices'],
    [/^(salmón|trucha)$/, 'salmon', null, 'single'],
    [/^(merluza|bacalao|dorada|lubina|lenguado)$/, 'whitefish', null, 'single'],
    [/^(atún|bonito)$/, 'tuna', null, 'chunks'],
    [/^(sardina|caballa)$/, 'sardine', null, 'fan'],
    [/^(gambas|langostinos)$/, 'prawn', null, 'chunks'],
    [/^(huevos)$/, 'eggFried', null, 'few'],
    [/^claras$/, 'eggHalf', null, 'few'],
    [/^(tofu|tempeh|seitán|soja texturizada)$/, 'tofu', null, 'chunks'],
    [/^patata$/, 'wedge', '#e7c06a', 'chunks'],
    [/^boniato$/, 'cube', '#ef8a3a', 'chunks'],
    [/^calabaza$/, 'pumpkin', null, 'chunks'],
    [/^(brócoli|coliflor|coles de Bruselas)$/, 'floret', null, 'chunks'],
    [/^(espárragos|judías verdes)$/, 'stick', '#6bb22e', 'bundle'],
    [/^(espinacas|kale|rúcula|lechuga|canónigos|acelgas)$/, 'leaf', null, 'leaves'],
    [/^tomate$/, 'tomato', null, 'chunks'],
    [/^pepino$/, 'cucumber', null, 'chunks'],
    [/^calabacín$/, 'zucchini', null, 'chunks'],
    [/^zanahoria$/, 'coin', '#e8913a', 'chunks'],
    [/^pimiento$/, 'strip', '#d9442f', 'chunks'],
    [/^cebolla$/, 'onion', null, 'scatter'],
    [/^aguacate$/, 'avocado', null, 'fan'],
    [/^plátano$/, 'banana', null, 'chunks'],
    [/^fresas$/, 'strawberry', null, 'chunks'],
    [/^(frambuesas)$/, 'berry', '#d7264d', 'scatter'],
    [/^(moras)$/, 'berry', '#3a1f3a', 'scatter'],
    [/^arándanos$/, 'blueberry', null, 'scatter'],
    [/^(manzana|pera|melocotón)$/, 'apple', null, 'fan'],
    [/^kiwi$/, 'kiwi', null, 'chunks'],
    [/^(mango|melón)$/, 'mango', null, 'chunks'],
    [/^piña$/, 'pineapple', null, 'chunks'],
    [/^uvas$/, 'grape', null, 'scatter'],
    [/^(almendras|anacardos|avellanas|cacahuetes|pistachos|frutos secos)$/, 'nut', null, 'scatter'],
    [/^(nueces|nueces pecanas)$/, 'walnut', null, 'scatter'],
    [/^(garbanzos|alubias)$/, 'bean', null, 'grains'],
    [/^lentejas$/, 'lentil', null, 'grains'],
    [/^(guisantes|maíz)$/, 'pea', null, 'scatter'],
    [/^edamame$/, 'edamame', null, 'chunks'],
    [/^(pan|pan integral|pan de centeno|pan multicereal|tortitas de arroz|tortitas de maíz)$/, 'toast', null, 'single'],
    [/^(tortilla de trigo|tortilla de maíz)$/, 'wrap', null, 'single'],
    [/^(mozzarella|queso fresco|ricotta)$/, 'cheese', null, 'scatter'],
    [/^limón$/, 'lemon', null, 'one'],
    [/^berenjena$/, 'aubergine', null, 'single'],
    [/^(avena|muesli|granola|cereales integrales|copos de maíz|harina de avena)$/, 'flake', null, 'scatter'],
    [/^aceitunas$/, 'olive', null, 'scatter'],
    [/^(champiñones|setas)$/, 'mushroom', null, 'chunks'],
    [/^calamar$/, 'ring', null, 'chunks'],
    [/^dátiles$/, 'date', null, 'scatter'],
    [/^chía$/, 'seed', '#3a3a3a', 'scatter'],
    [/^sésamo$/, 'seed', '#f1e6c8', 'scatter'],
    [/^cacao$/, 'tiny', '#4a2c1e', 'scatter'],
    [/^(perejil|albahaca|menta|cilantro)$/, 'herb', null, 'scatter'],
  ];
  // Bases cremosas o líquidas (cuenco / vaso)
  const BASE = { hummus: '#d6b98a', 'crema de cacahuete': '#b0783e', yogur: '#f7f4ec', 'yogur griego': '#f7f4ec', 'yogur griego 0 %': '#f7f4ec', skyr: '#f6f3ee', kéfir: '#f3f0e6', requesón: '#f6f2e8', cottage: '#f4f1e6', 'queso fresco batido': '#f7f4ec', 'yogur alto en proteína': '#f7f4ec', leche: '#f3eee2', 'bebida de avena': '#efe4cc', 'bebida de almendras': '#f1e8d8', 'bebida de soja': '#efe8d4', avena: '#dcc39a', 'crema de arroz': '#efe6d0' };
  const shapeOf = (ing) => { for (const [re, sh, col, lay] of MAP) if (re.test(ing)) return { sh, col, lay }; return null; };

  // ── Recipiente ──
  function vesselOf(m) {
    if (/paella/i.test(m.n || '')) return 'paella';
    if (/shakshuka|fajitas/i.test(m.n || '')) return 'pan';
    if (m.v) return m.v;
    const n = (m.n || '').toLowerCase();
    if (/batido|smoothie/.test(n)) return 'glass';
    if (/paella/.test(n)) return 'paella';
    if (/shakshuka|fajitas/.test(n)) return 'pan';
    if (/gazpacho|crema de|sopa|lentejas estofadas|curry|porridge|yogur|skyr|bowl|poke|avena con|avena nocturna|helado|edamame|mix de|hummus/.test(n)) return 'bowl';
    return 'plate';
  }

  // Coloca piezas dentro de un sector del plato (ángulos en radianes) o de un círculo
  function place(n, a0, a1, r0, r1, cx, cy) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = R(a0, a1), d = Math.sqrt(R(r0 * r0, r1 * r1));
      out.push([cx + d * Math.cos(a), cy + d * Math.sin(a)]);
    }
    return out;
  }
  function drawIng(ing, sector, cx, cy, maxR, fallbackCol) {
    const S2 = shapeOf(ing) || { sh: 'coin', col: fallbackCol, lay: 'chunks' };
    const fn = SH[S2.sh], [a0, a1] = sector, mid = (a0 + a1) / 2;
    let s = '';
    const piece = (x, y, a, sc) => g(x, y, a, sc, fn(S2.col));
    switch (S2.lay) {
      case 'grains': place(240, a0, a1, 2, maxR - 1.5, cx, cy).forEach(([x, y]) => { s += piece(x, y, R(0, 180), R(1.05, 1.3)); }); break;
      case 'pile': place(30, a0, a1, 3, maxR - 4, cx, cy).forEach(([x, y]) => { s += piece(x, y, R(0, 180), R(1.25, 1.45)); }); break;
      case 'slices': { // filete cortado en tiras paralelas
        const d = maxR * .52, x0 = cx + d * Math.cos(mid), y0 = cy + d * Math.sin(mid), rot = mid * 57.3 + 90;
        for (let i = 0; i < 4; i++) { const o = (i - 1.5) * 4.6; s += piece(x0 + o * Math.cos(mid), y0 + o * Math.sin(mid), rot + R(-6, 6), 1.55); }
        break;
      }
      case 'single': { const d = maxR * .45; s += piece(cx + d * Math.cos(mid), cy + d * Math.sin(mid), mid * 57.3 + 90 + R(-12, 12), S2.sh === 'toast' ? 1.4 : S2.sh === 'aubergine' ? 1.6 : 1.45); break; }
      case 'fan': { const d = maxR * .52, x0 = cx + d * Math.cos(mid), y0 = cy + d * Math.sin(mid); for (let i = 0; i < 4; i++) { const o = (i - 1.5) * 3.6, t = mid + Math.PI / 2; s += piece(x0 + o * Math.cos(t), y0 + o * Math.sin(t), mid * 57.3 + 90 + (i - 1.5) * 9, 1.45); } break; }
      case 'few': place(2, a0 + .25, a1 - .25, maxR * .4, maxR * .6, cx, cy).forEach(([x, y]) => { s += piece(x, y, R(0, 360), 1.6); }); break;
      case 'one': { const d = maxR * .82; s += piece(cx + d * Math.cos(mid), cy + d * Math.sin(mid), mid * 57.3 + 90, 1.4); break; }
      case 'bundle': { const d = maxR * .52, x0 = cx + d * Math.cos(mid), y0 = cy + d * Math.sin(mid), t = mid + Math.PI / 2; for (let i = 0; i < 7; i++) { const o = (i - 3) * 2.3; s += piece(x0 + o * Math.cos(mid), y0 + o * Math.sin(mid), t * 57.3 + R(-7, 7), 1.55); } break; }
      case 'leaves': place(12, a0, a1, 4, maxR - 4, cx, cy).forEach(([x, y]) => { s += piece(x, y, R(0, 360), R(1.3, 1.6)); }); break;
      case 'scatter': place(13, a0, a1, 3, maxR - 3, cx, cy).forEach(([x, y]) => { s += piece(x, y, R(0, 360), R(1.35, 1.6)); }); break;
      default: place(9, a0, a1, 5, maxR - 5, cx, cy).forEach(([x, y]) => { s += piece(x, y, R(0, 360), R(1.45, 1.7)); });
    }
    return s;
  }

  const DEFS = (k) => `<defs>
<radialGradient id="tb${k}" cx=".3" cy=".2" r="1.1"><stop offset="0" stop-color="#3a2c22"/><stop offset="1" stop-color="#1c1510"/></radialGradient>
<radialGradient id="pl${k}" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".75" stop-color="#f1efe9"/><stop offset="1" stop-color="#d9d5cb"/></radialGradient>
<radialGradient id="pi${k}" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#fbfaf6"/><stop offset="1" stop-color="#ebe7dd"/></radialGradient>
<radialGradient id="sh${k}" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="gLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="gCrust" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2b86a"/><stop offset=".5" stop-color="#e2b86a" stop-opacity="0"/><stop offset="1" stop-color="#d9a54f" stop-opacity=".6"/></linearGradient>
<filter id="ds${k}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx=".5" dy=".9" stdDeviation=".6" flood-color="#000" flood-opacity=".28"/></filter>
</defs>`;

  function table(k) {
    // Mesa de madera con vetas + servilleta de lino y tenedor
    let s = `<rect width="100" height="100" fill="url(#tb${k})"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M0 ${f1(i * 12 + R(-2, 2))}c30 ${f1(R(-3, 3))} 70 ${f1(R(-3, 3))} 100 0" stroke="#4a3a2c" stroke-width="${f1(R(.3, 1))}" fill="none" opacity=".5"/>`;
    s += `<rect x="70" y="-8" width="40" height="34" rx="2" transform="rotate(18 90 9)" fill="#e9e4d8" opacity=".95"/><path d="M74 -4l34 11" stroke="#d6cfbf" stroke-width=".6" transform="rotate(18 90 9)"/>`;
    s += `<g transform="translate(91 60) rotate(8)" opacity=".9"><rect x="-1" y="-24" width="2" height="34" rx="1" fill="#c9ccd1"/><rect x="-3" y="-34" width="6" height="11" rx="1.5" fill="#d8dbe0"/><path d="M-2 -34v-6M0 -34v-6M2 -34v-6" stroke="#d8dbe0" stroke-width="1"/></g>`;
    return s;
  }

  function plate(m, k) {
    const ings = (m.ing || []).filter(Boolean);
    let s = `<ellipse cx="47" cy="54" rx="43" ry="43" fill="url(#sh${k})"/><circle cx="46" cy="50" r="40" fill="url(#pl${k})"/><circle cx="46" cy="50" r="30" fill="url(#pi${k})" stroke="#ddd8cc" stroke-width=".6"/>`;
    const cx = 46, cy = 50, maxR = 29;
    // Tortilla / tortilla de patata ocupan todo el plato
    if (/tortilla de (verduras|patata)/i.test(m.n)) return s + `<g filter="url(#ds${k})">${g(cx, cy, 0, 1.75, SH.omelette())}<path d="M${cx} ${cy}l22 -8M${cx} ${cy}l-8 23M${cx} ${cy}l-17 -15" stroke="#d9a83a" stroke-width=".8" opacity=".7"/>${/patata/i.test(m.n) ? '' : drawIng('calabacín', [-.4, .6], cx, cy, 20, '')}</g>`;
    if (/tortitas de avena|pancake/i.test(m.n)) {
      let st = '';
      for (let i = 0; i < 4; i++) st += g(cx - 2 + i * .8, cy + 6 - i * 3.2, R(-6, 6), 1.25, SH.pancake());
      return s + `<g filter="url(#ds${k})">${st}${drawIng('arándanos', [0, 6.283], cx - 1, cy - 4, 9, '')}${g(cx + 4, cy - 6, 0, 1.2, SH.banana())}${g(cx - 5, cy - 3, 0, 1.2, SH.banana())}</g>` + drawIng('arándanos', [.4, 1.6], cx, cy, 28, '');
    }
    if (/pizza/i.test(m.n)) {
      let top = '';
      for (let i = 0; i < 9; i++) { const [x, y] = place(1, 0, 6.283, 3, 20, cx, cy)[0]; top += g(x, y, R(0, 360), 1.5, SH.cheese()); }
      for (let i = 0; i < 6; i++) { const [x, y] = place(1, 0, 6.283, 3, 20, cx, cy)[0]; top += g(x, y, R(0, 360), 1.2, SH.pork()); }
      return s + `<g filter="url(#ds${k})">${g(cx, cy, 0, 1.75, SH.tortilla())}<circle cx="${cx}" cy="${cy}" r="24" fill="#c8402a"/><circle cx="${cx}" cy="${cy}" r="24" fill="url(#gLit)" opacity=".25"/>${top}${[0, 60, 120].map((d) => `<path d="M${cx} ${cy}l${f1(27 * Math.cos(d * Math.PI / 180))} ${f1(27 * Math.sin(d * Math.PI / 180))}M${cx} ${cy}l${f1(-27 * Math.cos(d * Math.PI / 180))} ${f1(-27 * Math.sin(d * Math.PI / 180))}" stroke="#a8322a" stroke-width=".6" opacity=".6"/>`).join('')}</g>` + drawIng('rúcula', [0, 1], cx, cy, 14, '');
    }
    if (/tarta/i.test(m.n)) return s + `<g filter="url(#ds${k})">${g(cx, cy + 2, -8, 1.6, SH.cheesecake())}${drawIng('fresas', [.6, 1.6], cx, cy, 27, '')}</g>`;
    if (/wrap/i.test(m.n)) return s + `<g filter="url(#ds${k})">${g(cx - 2, cy - 6, -18, 1.35, SH.wrap())}${g(cx + 2, cy + 8, 160, 1.35, SH.wrap())}${drawIng('lechuga', [2.2, 3.4], cx, cy, 27, '')}</g>`;
    const cream = ings.find((x) => BASE[x]);
    let pre = '';
    if (cream) { pre = g(cx + 9, cy + 6, 0, 1.4, SH.dollop(BASE[cream])); ings.splice(ings.indexOf(cream), 1); }
    const w = ings.map((_, i) => (i === 0 ? 1.5 : 1)); const tot = w.reduce((a, b) => a + b, 0) || 1;
    let a = R(-2.2, -1.6), body = '';
    ings.forEach((ing, i) => { const span = (w[i] / tot) * Math.PI * 2; body += drawIng(ing, [a + .06, a + span - .06], cx, cy, maxR, (m.col || [])[i] || '#c9a56a'); a += span; });
    s += `<g filter="url(#ds${k})">${pre}${body}</g>`;
    // Hierbas y un hilo de aceite para dar vida
    for (let i = 0; i < 7; i++) { const [x, y] = place(1, 0, 6.283, 4, 26, cx, cy)[0]; s += g(x, y, R(0, 360), 1, SH.herb()); }
    return s;
  }

  function bowl(m, k) {
    const ings = (m.ing || []).filter(Boolean), cx = 46, cy = 50;
    const n = (m.n || '').toLowerCase();
    let baseCol = null, toppings = ings;
    const b = ings.find((x) => BASE[x]);
    if (b) { baseCol = BASE[b]; toppings = ings.filter((x) => x !== b); }
    toppings = toppings.filter((x) => x !== 'cebolla' && !(/hummus/.test(n) && x === 'garbanzos'));
    if (/gazpacho/.test(n)) baseCol = '#d9442f';
    if (/crema de calabaza/.test(n)) { baseCol = '#ef9a3a'; toppings = []; }
    if (/curry/.test(n)) baseCol = '#e0a24a';
    if (/lentejas estofadas/.test(n)) baseCol = '#8a5a32';
    if (/hummus/.test(n)) baseCol = '#e8d4a0';
    if (/helado/.test(n)) baseCol = '#f2dba0';
    let s = `<ellipse cx="47" cy="55" rx="40" ry="40" fill="url(#sh${k})"/><circle cx="46" cy="50" r="37" fill="#e9e5dc"/><circle cx="46" cy="50" r="37" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/><circle cx="46" cy="50" r="32" fill="#cfc9bb"/>`;
    s += `<circle cx="46" cy="51" r="31" fill="${baseCol || '#f3efe5'}"/><circle cx="46" cy="51" r="31" fill="url(#gLit)" opacity=".18"/>`;
    if (baseCol && /gazpacho|crema de calabaza/.test(n)) s += `<path d="M34 46c4 -3 8 3 12 0s8 3 12 0" stroke="#fff" stroke-width="1.4" fill="none" opacity=".7"/><circle cx="52" cy="58" r="1.4" fill="#3f8a2a"/><circle cx="40" cy="58" r="1" fill="#3f8a2a"/>`;
    if (/hummus/.test(n)) s += `<path d="M46 51m-16 0a16 16 0 1 0 32 0a16 16 0 1 0 -32 0M46 51m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" stroke="#d2b57a" stroke-width="1.6" fill="none"/><path d="M38 47c5 3 11 3 16 0" stroke="#c8b02a" stroke-width="1.6" fill="none" opacity=".7"/>${[[42, 44], [50, 56], [55, 47]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#c0392b"/>`).join('')}`;
    // Ingredientes encima, en franjas (estilo bowl)
    let a = R(-2.4, -1.8), body = '';
    toppings.forEach((ing, i) => { const span = (Math.PI * 2) / Math.max(1, toppings.length); body += drawIng(ing, [a + .08, a + span - .08], cx, cy + 1, 27, (m.col || [])[i] || '#c9a56a'); a += span; });
    return s + `<g filter="url(#ds${k})">${body}</g>`;
  }


  // Sartén de hierro (shakshuka, fajitas): se sirve en la propia sartén, con mango
  function pan(m, k) {
    const cx = 44, cy = 50, n = (m.n || '').toLowerCase(), ings = (m.ing || []).filter(Boolean);
    const sauce = /shakshuka/.test(n);
    let s = `<g transform="rotate(32 ${cx} ${cy})"><rect x="${cx + 34}" y="${cy - 5.5}" width="30" height="11" rx="5.5" fill="#1d1d20"/><rect x="${cx + 34}" y="${cy - 5.5}" width="30" height="4" rx="2" fill="#fff" opacity=".07"/><circle cx="${cx + 58}" cy="${cy}" r="2.2" fill="#0d0d0f"/></g>`;
    s += `<ellipse cx="${cx + 2}" cy="${cy + 5}" rx="41" ry="40" fill="url(#sh${k})"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="38" fill="#2a2a2e"/><circle cx="${cx}" cy="${cy}" r="38" fill="none" stroke="#45454b" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="33.5" fill="#18181b"/>`;
    s += `<path d="M${cx - 30} ${cy - 16}a34 34 0 0 1 22 -17" stroke="#fff" stroke-width="1.2" fill="none" opacity=".18" stroke-linecap="round"/>`;
    if (sauce) {
      s += `<circle cx="${cx}" cy="${cy}" r="32" fill="#b02f1b"/><circle cx="${cx}" cy="${cy}" r="32" fill="url(#gLit)" opacity=".16"/>`;
      for (let i = 0; i < 26; i++) { const [x, y] = place(1, 0, 6.283, 2, 30, cx, cy)[0]; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R(.8, 2.2))}" fill="${['#8f2414', '#d0492d', '#7c1f12'][i % 3]}" opacity=".7"/>`; }
      let top = '';
      top += drawIng('pimiento', [.3, 2.4], cx, cy, 29, '') + drawIng('cebolla', [2.6, 5.6], cx, cy, 29, '');
      [[cx - 11, cy - 9], [cx + 12, cy - 4], [cx - 2, cy + 13]].forEach(([x, y]) => { top += g(x, y, R(0, 360), 1.55, SH.eggFried()); });
      for (let i = 0; i < 9; i++) { const [x, y] = place(1, 0, 6.283, 4, 28, cx, cy)[0]; top += g(x, y, R(0, 360), 1.2, SH.herb()); }
      s += `<g filter="url(#ds${k})">${top}</g>`;
      // Pan de centeno al lado de la sartén
      if (ings.some((x) => /^pan/.test(x))) s += `<g filter="url(#ds${k})">${g(14, 86, -28, 1.05, SH.toast('#b8915e'))}</g>`;
      return s;
    }
    // Fajitas: tiras salteadas que chisporrotean
    let body = '';
    const pieces = [];
    if (ings.some((x) => /pollo|pavo|ternera/.test(x))) for (let i = 0; i < 9; i++) pieces.push(() => SH[ings.some((x) => /ternera/.test(x)) ? 'beef' : 'chicken']());
    if (ings.includes('pimiento')) for (let i = 0; i < 12; i++) pieces.push(() => SH.strip(['#d9442f', '#f2b51e', '#4f9a34'][i % 3]));
    if (ings.includes('cebolla')) for (let i = 0; i < 6; i++) pieces.push(() => SH.onion());
    pieces.sort(() => R(-1, 1));
    const spots = place(pieces.length, 0, 6.283, 3, 27, cx, cy);
    pieces.forEach((mk, i) => { const [x, y] = spots[i]; body += g(x, y, R(0, 360), R(.95, 1.25), mk()); });
    if (ings.includes('aguacate')) body += g(cx + 18, cy + 16, -30, 1.2, SH.avocado());
    s += `<g filter="url(#ds${k})">${body}</g>`;
    for (let i = 0; i < 5; i++) { const x = cx - 18 + i * 9; s += `<path d="M${x} ${cy - 30}c-3 -5 3 -8 0 -13" stroke="#fff" stroke-width="1" fill="none" opacity=".22" stroke-linecap="round"/>`; }
    if (ings.some((x) => /tortilla/.test(x))) s += `<g filter="url(#ds${k})">${g(15, 85, 0, .9, SH.tortilla())}${g(17, 82, 0, .8, SH.tortilla())}</g>`;
    return s;
  }

  // Paellera: ancha y baja, con dos asas; arroz con azafrán y el marisco encima
  function paella(m, k) {
    const cx = 48, cy = 50, ings = (m.ing || []).filter(Boolean);
    let s = `<ellipse cx="${cx + 2}" cy="${cy + 5}" rx="47" ry="45" fill="url(#sh${k})"/>`;
    s += [-1, 1].map((d) => `<path d="M${cx + d * 41} ${cy - 7}c${d * 9} 0 ${d * 9} 14 0 14" stroke="#8b8f96" stroke-width="3.2" fill="none" stroke-linecap="round"/>`).join('');
    s += `<circle cx="${cx}" cy="${cy}" r="43" fill="#6d7178"/><circle cx="${cx}" cy="${cy}" r="43" fill="none" stroke="#a7abb2" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="40" fill="#3c3f44"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="39" fill="#e3a72f"/><circle cx="${cx}" cy="${cy}" r="39" fill="url(#gLit)" opacity=".2"/>`;
    // socarrat (borde tostado)
    s += `<circle cx="${cx}" cy="${cy}" r="37" fill="none" stroke="#b5741c" stroke-width="3" opacity=".55"/>`;
    let rice = '';
    place(420, 0, 6.283, 1, 37, cx, cy).forEach(([x, y]) => { rice += g(x, y, R(0, 180), 1.1, SH.grain(R(0, 1) > .5 ? '#f2c24e' : '#e9b03a')); });
    s += rice;
    let top = '';
    place(6, 0, 6.283, 14, 31, cx, cy).forEach(([x, y]) => { top += g(x, y, R(0, 360), 1.6, SH.prawn()); });
    if (ings.includes('calamar')) place(5, 0, 6.283, 6, 30, cx, cy).forEach(([x, y]) => { top += g(x, y, 0, 1.3, SH.ring()); });
    if (ings.includes('pimiento')) place(5, 0, 6.283, 6, 30, cx, cy).forEach(([x, y]) => { top += g(x, y, R(0, 360), 1.5, SH.strip('#d9442f')); });
    if (ings.includes('guisantes')) place(22, 0, 6.283, 3, 34, cx, cy).forEach(([x, y]) => { top += g(x, y, 0, 1.1, SH.pea()); });
    top += g(cx + 26, cy - 22, 40, 1.5, SH.lemon()) + g(cx - 27, cy + 21, 220, 1.5, SH.lemon());
    for (let i = 0; i < 6; i++) { const [x, y] = place(1, 0, 6.283, 4, 33, cx, cy)[0]; top += g(x, y, R(0, 360), 1.1, SH.herb()); }
    return s + `<g filter="url(#ds${k})">${top}</g>`;
  }

  function glass(m, k) {
    const col = (m.col || [])[0] || '#f0e6c8', ings = m.ing || [];
    const liquid = /espinacas|kale/.test(ings.join(',')) ? '#9cc76a' : /fresas|frambuesas|arándanos/.test(ings.join(',')) ? '#d98aa0' : /plátano|mango/.test(ings.join(',')) ? '#f1dfa0' : col;
    return `<rect width="100" height="100" fill="url(#tb${k})"/>` +
      `<ellipse cx="50" cy="91" rx="22" ry="4" fill="#000" opacity=".35"/>` +
      `<path d="M30 18h40l-5 70c-.3 3 -2.6 4 -5 4h-20c-2.4 0 -4.7 -1 -5 -4z" fill="#ffffff" opacity=".16" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>` +
      `<path d="M32.4 32h35.2l-4 54c-.2 2.4 -2 3.2 -4 3.2h-19.2c-2 0 -3.8 -.8 -4 -3.2z" fill="${liquid}"/>` +
      `<path d="M32.4 32h35.2l-.6 8c-11 3 -23 3 -34 0z" fill="#fff" opacity=".55"/>` +
      `<path d="M36 36l3 48" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>` +
      `<rect x="56" y="4" width="3.4" height="44" rx="1.7" transform="rotate(14 57 26)" fill="#9dff2e"/>` +
      `${/plátano/.test(ings.join(',')) ? g(64, 24, 20, 1.5, SH.banana()) : ''}${/fresas/.test(ings.join(',')) ? g(36, 26, -10, 1.5, SH.strawberry()) : ''}${/kiwi/.test(ings.join(',')) ? g(64, 26, 0, 1.4, SH.kiwi()) : ''}`;
  }

  const _orig = foodArt;
  foodArt = function (m, st) {
    try {
      let h = 7; for (const ch of String(m.id || m.n || 'x')) h = (h * 31 + ch.charCodeAt(0)) % 233280;
      seed = h || 1;
      const k = 'v' + h.toString(36);
      const v = vesselOf(m);
      const body = v === 'glass' ? glass(m, k) : table(k) + (v === 'bowl' ? bowl(m, k) : v === 'pan' ? pan(m, k) : v === 'paella' ? paella(m, k) : plate(m, k));
      return `<svg viewBox="0 0 100 100" role="img" aria-label="${String(m.n || '').replace(/"/g, '&quot;')}" style="width:100%;height:auto;display:block;${st || ''}">${DEFS(k)}${body}</svg>`;
    } catch (e) {
      return _orig.apply(this, arguments);
    }
  };
  window.vxFoodArt = foodArt; // para pruebas
})();
