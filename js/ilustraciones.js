// ============================================================
// ilustraciones.js — productos 3D estilo "chibi" para la estantería.
//
// Cada producto es un SVG dibujado en código (no imágenes externas):
// formas redondeadas y rechonchas, degradados que simulan volumen
// (cilindros, esferas, cajas), brillos blancos y una sombra en el
// piso, como los íconos 3D de plástico del moodboard.
//
// Uso:  ilustracion('lata', { tamano: 48 })  →  string <svg …>
//       productosDe('alimento-agua')          →  ['botellon', …]
// ============================================================

// --- Colores ------------------------------------------------------------

function hexARgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// f > 0 aclara hacia blanco, f < 0 oscurece hacia negro (−1…1).
function tono(hex, f) {
  const rgb = hexARgb(hex).map((c) => Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f)));
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// --- Contexto de dibujo: registra degradados con ids únicos -------------

let contador = 0;

function crearLienzo() {
  const uid = `il${++contador}`;
  const defs = [];
  let n = 0;
  const nuevoId = () => `${uid}-${++n}`;

  return {
    defs,
    // Cilindro visto de frente: oscuro en los bordes, brillo a la izquierda.
    cil(base) {
      const id = nuevoId();
      defs.push(`<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="${tono(base, -0.38)}"/>
        <stop offset="0.16" stop-color="${base}"/>
        <stop offset="0.32" stop-color="${tono(base, 0.38)}"/>
        <stop offset="0.52" stop-color="${base}"/>
        <stop offset="0.86" stop-color="${tono(base, -0.22)}"/>
        <stop offset="1" stop-color="${tono(base, -0.42)}"/></linearGradient>`);
      return `url(#${id})`;
    },
    // Esfera / forma blanda: brillo arriba a la izquierda.
    esf(base) {
      const id = nuevoId();
      defs.push(`<radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="${tono(base, 0.55)}"/>
        <stop offset="0.45" stop-color="${base}"/>
        <stop offset="1" stop-color="${tono(base, -0.38)}"/></radialGradient>`);
      return `url(#${id})`;
    },
    // Cara plana iluminada desde arriba.
    vert(base, claro = 0.22, oscuro = -0.18) {
      const id = nuevoId();
      defs.push(`<linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${tono(base, claro)}"/>
        <stop offset="1" stop-color="${tono(base, oscuro)}"/></linearGradient>`);
      return `url(#${id})`;
    },
  };
}

// Brillo blanco típico del plástico 3D.
const brillo = (cx, cy, rx, ry, rot = -20, op = 0.55) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;

// Sombra en el piso de la repisa.
const sombra = (ancho = 30) =>
  `<ellipse cx="50" cy="93" rx="${ancho}" ry="4.5" fill="#5a2a0c" opacity="0.28"/>`;

// --- Piezas reutilizables -----------------------------------------------

// Lata: cuerpo cilíndrico con etiqueta, tapa y aros metálicos.
function lata(g, { etiqueta, dibujo, x = 26, ancho = 48, arriba = 30, abajo = 88, tapa = null }) {
  const cx = x + ancho / 2;
  const rx = ancho / 2;
  const metal = g.cil('#c9ccd3');
  const tapaColor = tapa ? g.vert(tapa, 0.35, -0.1) : g.vert('#dfe2e8', 0.4, -0.15);
  return `
    <rect x="${x}" y="${arriba}" width="${ancho}" height="${abajo - arriba}" rx="4" fill="${g.cil(etiqueta)}"/>
    <rect x="${x - 1}" y="${abajo - 7}" width="${ancho + 2}" height="8" rx="4" fill="${metal}"/>
    ${dibujo}
    <rect x="${x - 1}" y="${arriba - 3}" width="${ancho + 2}" height="8" rx="4" fill="${metal}"/>
    <ellipse cx="${cx}" cy="${arriba - 2}" rx="${rx + 1}" ry="${rx * 0.28}" fill="${tapaColor}"/>
    <ellipse cx="${cx}" cy="${arriba - 2}" rx="${rx - 4}" ry="${rx * 0.2}" fill="none" stroke="${tono(tapa || '#c9ccd3', -0.2)}" stroke-width="1.4" opacity="0.7"/>
    ${brillo(x + ancho * 0.24, (arriba + abajo) / 2, 2.6, (abajo - arriba) * 0.32, 0, 0.5)}`;
}

// Tomate / fruta redonda con hojita.
const fruta = (g, cx, cy, r, color, hoja = '#3fae3a') => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${g.esf(color)}"/>
  <path d="M${cx - r * 0.5} ${cy - r * 0.78} L${cx} ${cy - r * 0.55} L${cx + r * 0.5} ${cy - r * 0.78} L${cx} ${cy - r * 1.05} Z" fill="${hoja}"/>
  ${brillo(cx - r * 0.35, cy - r * 0.3, r * 0.28, r * 0.18, -30, 0.6)}`;

const ALTO_CAPA = 16;
const ALTO_BASE = 75;

// Pila de ropa doblada (3 o 4 prendas). `cuello` cambia el detalle de arriba.
function pilaRopa(g, colores, cuello) {
  const capas = colores
    .map((c, i) => {
      const y = ALTO_BASE - i * ALTO_CAPA;
      const ancho = 80 - i * 3;
      const x = 50 - ancho / 2;
      return `
        <rect x="${x}" y="${y}" width="${ancho}" height="${ALTO_CAPA + 1}" rx="7" fill="${g.vert(c, 0.3, -0.2)}"/>
        <path d="M${x + 5} ${y + ALTO_CAPA - 4} Q50 ${y + ALTO_CAPA} ${x + ancho - 5} ${y + ALTO_CAPA - 4}" stroke="${tono(c, -0.3)}" stroke-width="1.4" fill="none" opacity="0.6"/>
        <rect x="${x + 7}" y="${y + 3}" width="${ancho * 0.4}" height="3" rx="1.5" fill="#fff" opacity="0.45"/>`;
    })
    .join('');
  const arriba = ALTO_BASE - (colores.length - 1) * ALTO_CAPA;
  const cArriba = colores.at(-1);
  const detalle = {
    // Camisa: cuello en V con botones.
    camisa: `<path d="M42 ${arriba} L50 ${arriba + 8} L58 ${arriba}" fill="${tono(cArriba, 0.35)}" stroke="${tono(cArriba, -0.3)}" stroke-width="1.2"/>
      <circle cx="50" cy="${arriba + 11}" r="1.3" fill="${tono(cArriba, -0.45)}"/>`,
    // Blusa: escote redondo con lacito.
    blusa: `<path d="M41 ${arriba} Q50 ${arriba + 9} 59 ${arriba}" fill="${tono(cArriba, 0.4)}" stroke="${tono(cArriba, -0.25)}" stroke-width="1.2"/>
      <circle cx="47.5" cy="${arriba + 9}" r="2" fill="#fff" opacity="0.9"/><circle cx="52.5" cy="${arriba + 9}" r="2" fill="#fff" opacity="0.9"/>`,
    // Niños: estrellita estampada.
    estrella: `<path d="M50 ${arriba + 2.5} l2.4 4.8 5.3 0.8 -3.9 3.7 0.9 5.2 -4.7 -2.5 -4.7 2.5 0.9 -5.2 -3.9 -3.7 5.3 -0.8z" fill="#fff" opacity="0.92"/>`,
  }[cuello];
  return sombra(38) + capas + detalle;
}

// --- Catálogo de productos -------------------------------------------------

const PRODUCTOS = {
  // ---------- Alimento ----------
  lata: (g) =>
    sombra(26) +
    lata(g, { etiqueta: '#5fc23b', dibujo: fruta(g, 50, 60, 12, '#f2462b') }),

  'lata-maiz': (g) =>
    sombra(26) +
    lata(g, {
      etiqueta: '#e8463a',
      dibujo: `<ellipse cx="50" cy="60" rx="8" ry="13" fill="${g.esf('#ffd23f')}"/>
        <path d="M42 66 Q38 52 46 46 Q44 58 50 72 Z" fill="#4caf50"/><path d="M58 66 Q62 52 54 46 Q56 58 50 72 Z" fill="#3e9b43"/>`,
    }),

  // Paquete de grano: bolsa con cierre arriba y ventanita con fríjoles.
  paquete: (g) => {
    const bolsa = g.vert('#f6c453', 0.3, -0.2);
    const granos = [[44, 64], [52, 62], [48, 70], [56, 69], [42, 72], [53, 76], [47, 77]]
      .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2.4" fill="${g.esf('#8b3a1e')}" transform="rotate(${(x * 7) % 50 - 25} ${x} ${y})"/>`)
      .join('');
    return `${sombra(26)}
      <path d="M28 30 Q24 60 25 86 Q50 93 75 86 Q76 60 72 30 Z" fill="${bolsa}"/>
      <rect x="26" y="21" width="48" height="12" rx="4" fill="${g.vert('#d9962b', 0.2, -0.2)}"/>
      <path d="M28 21 l4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4 4 4 Z" fill="#d9962b"/>
      <ellipse cx="50" cy="69" rx="15" ry="13" fill="#fff6dc" stroke="#d9962b" stroke-width="1.5"/>
      ${granos}
      ${brillo(34, 52, 3, 16, 5, 0.45)}`;
  },

  // Botellón de agua de 5 galones.
  botellon: (g) => {
    const cuerpo = g.cil('#7ec8ef');
    return `${sombra(28)}
      <rect x="24" y="34" width="52" height="56" rx="15" fill="${cuerpo}" opacity="0.95"/>
      <rect x="24" y="50" width="52" height="4" fill="${tono('#7ec8ef', -0.25)}" opacity="0.45"/>
      <rect x="24" y="70" width="52" height="4" fill="${tono('#7ec8ef', -0.25)}" opacity="0.45"/>
      <path d="M33 34 Q36 24 43 22 L57 22 Q64 24 67 34 Z" fill="${g.cil('#8fd3f5')}"/>
      <rect x="41" y="12" width="18" height="11" rx="3.5" fill="${g.cil('#1e6fd9')}"/>
      ${brillo(33, 60, 3.5, 20, 0, 0.6)}${brillo(62, 42, 2, 5, 20, 0.35)}`;
  },

  // Lata de leche en polvo: ancha, tapa plástica y etiqueta con gotita.
  'lata-leche': (g) =>
    sombra(30) +
    lata(g, {
      etiqueta: '#f4f8ff',
      x: 22,
      ancho: 56,
      arriba: 36,
      tapa: '#59a8f0',
      dibujo: `<rect x="22" y="52" width="56" height="16" fill="${g.cil('#4d9be6')}"/>
        <path d="M50 54 Q44 61 46 64.5 Q50 68 54 64.5 Q56 61 50 54 Z" fill="#fff"/>`,
    }),

  // Compota: frasquito de vidrio con contenido naranja y tapa roja.
  compota: (g) => `${sombra(20)}
    <rect x="32" y="46" width="36" height="44" rx="9" fill="${g.cil('#ffad42')}"/>
    <rect x="32" y="46" width="36" height="44" rx="9" fill="#fff" opacity="0.18"/>
    <rect x="34" y="60" width="32" height="16" rx="3" fill="#fffaf0"/>
    ${fruta(g, 50, 68, 5.5, '#ff8a1f')}
    <rect x="30" y="36" width="40" height="12" rx="4" fill="${g.cil('#e53935')}"/>
    <path d="M33 39 h34" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7"/>
    ${brillo(37, 64, 2, 12, 0, 0.55)}`,

  // Tetero.
  tetero: (g) => `${sombra(18)}
    <rect x="37" y="40" width="26" height="50" rx="11" fill="${g.cil('#e9f6ff')}"/>
    <rect x="38" y="62" width="24" height="27" rx="10" fill="${g.cil('#fffdf4')}"/>
    <path d="M42 52 h5 M42 60 h5 M42 68 h5" stroke="#7ab6e6" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="35" y="32" width="30" height="10" rx="4" fill="${g.cil('#ff8fb1')}"/>
    <path d="M42 32 Q42 20 50 14 Q58 20 58 32 Z" fill="${g.esf('#ffd59e')}"/>
    ${brillo(41, 70, 2, 13, 0, 0.6)}`,

  // ---------- Aseo ----------
  'papel-higienico': (g) => `${sombra(28)}
    <rect x="25" y="36" width="50" height="52" rx="5" fill="${g.cil('#ffffff')}"/>
    <path d="M25 50 h50" stroke="#e5e8ee" stroke-width="1.5"/>
    <path d="M60 88 L60 96 Q66 98 70 95 L70 88 Z" fill="#f4f6fa"/>
    <ellipse cx="50" cy="36" rx="25" ry="8" fill="${g.vert('#ffffff', 0, -0.06)}"/>
    <ellipse cx="50" cy="36" rx="8" ry="3" fill="#c7a27a"/>
    <ellipse cx="50" cy="35.6" rx="5.5" ry="1.8" fill="#8a6542"/>
    ${brillo(32, 62, 3, 17, 0, 0.8)}`,

  // Jabón en barra: ladrillo redondeado con espuma.
  jabon: (g) => `${sombra(30)}
    <path d="M22 66 L34 56 L80 56 L68 66 Z" fill="${g.vert('#ff9fc4', 0.35, 0)}"/>
    <rect x="22" y="66" width="46" height="22" rx="6" fill="${g.vert('#ff7fb0', 0.15, -0.2)}"/>
    <path d="M68 66 L80 56 L80 77 Q80 80 77 82 L68 88 Z" fill="${tono('#ff7fb0', -0.25)}"/>
    <circle cx="36" cy="50" r="6" fill="${g.esf('#e8f6ff')}" opacity="0.95"/>
    <circle cx="47" cy="46" r="4.5" fill="${g.esf('#e8f6ff')}" opacity="0.95"/>
    <circle cx="29" cy="44" r="3.4" fill="${g.esf('#e8f6ff')}" opacity="0.95"/>
    ${brillo(36, 74, 9, 2.4, 0, 0.55)}`,

  shampoo: (g) => `${sombra(20)}
    <rect x="32" y="34" width="36" height="56" rx="14" fill="${g.cil('#22b5a6')}"/>
    <ellipse cx="50" cy="64" rx="11" ry="13" fill="#e9fffb"/>
    <path d="M45 66 Q50 56 55 66 Q50 72 45 66 Z" fill="#22b5a6"/>
    <rect x="40" y="22" width="20" height="14" rx="4" fill="${g.cil('#ffffff')}"/>
    <rect x="45" y="16" width="10" height="7" rx="2" fill="${g.cil('#f0f0f0')}"/>
    ${brillo(38, 52, 2.6, 13, 0, 0.55)}`,

  cepillo: (g, { color = '#2f80ed' } = {}) => `${sombra(16)}
    <g transform="rotate(14 50 55)">
      <rect x="45" y="36" width="10" height="56" rx="5" fill="${g.cil(color)}"/>
      <rect x="47" y="52" width="6" height="22" rx="3" fill="${tono(color, 0.5)}" opacity="0.8"/>
      <rect x="44" y="10" width="12" height="28" rx="6" fill="${g.cil(color)}"/>
      <rect x="35" y="12" width="10" height="22" rx="3" fill="${g.vert('#ffffff', 0, -0.1)}"/>
      <path d="M37 15 v16 M40 15 v16 M43 15 v16" stroke="#9fd2ff" stroke-width="1.6"/>
    </g>`,

  'crema-dental': (g) => `${sombra(30)}
    <g transform="rotate(-18 50 70)">
      <path d="M20 62 Q20 56 26 56 L66 58 L66 78 L26 80 Q20 80 20 74 Z" fill="${g.vert('#ffffff', 0, -0.12)}"/>
      <path d="M20 62 L66 60 L66 66 L20 68 Z" fill="#e53935"/>
      <path d="M20 70 L66 70 L66 74 L20 74 Z" fill="#1e88e5"/>
      <rect x="66" y="61" width="7" height="14" rx="2" fill="${g.vert('#cfd8e3', 0.2, -0.2)}"/>
      <rect x="73" y="63" width="9" height="10" rx="3" fill="${g.cil('#1e88e5')}"/>
      <path d="M17 56 L17 82" stroke="#d7dde6" stroke-width="4" stroke-linecap="round"/>
    </g>`,

  escoba: (g) => `${sombra(22)}
    <rect x="47" y="6" width="6" height="64" rx="3" fill="${g.cil('#c47a3c')}"/>
    <rect x="44" y="2" width="12" height="7" rx="3" fill="${g.cil('#e53935')}"/>
    <rect x="38" y="64" width="24" height="9" rx="3" fill="${g.cil('#e53935')}"/>
    <path d="M36 72 L64 72 L72 92 L28 92 Z" fill="${g.vert('#f4c84a', 0.2, -0.15)}"/>
    <path d="M36 76 L31 91 M42 76 L39 91 M48 76 L47 91 M54 76 L55 91 M60 76 L63 91 M65 78 L69 91" stroke="#c99a1c" stroke-width="1.4"/>`,

  trapeador: (g) => `${sombra(22)}
    <rect x="47" y="4" width="6" height="66" rx="3" fill="${g.cil('#8e9bab')}"/>
    <rect x="41" y="64" width="18" height="9" rx="4" fill="${g.cil('#26a69a')}"/>
    ${[30, 36, 42, 48, 54, 60, 66]
      .map((x, i) => `<path d="M${50 + (x - 48) * 0.3} 72 Q${x - 3 + (i % 2) * 6} 82 ${x} 92" stroke="${i % 2 ? '#f1f3f6' : '#dfe4ea'}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`)
      .join('')}`,

  // Detergente en polvo: caja con estallido de color.
  detergente: (g) => `${sombra(28)}
    <path d="M26 34 L38 26 L78 26 L66 34 Z" fill="${g.vert('#5ab0ff', 0.35, 0.05)}"/>
    <rect x="26" y="34" width="40" height="56" rx="3" fill="${g.vert('#2f80ed', 0.15, -0.2)}"/>
    <path d="M66 34 L78 26 L78 82 L66 90 Z" fill="${tono('#2f80ed', -0.3)}"/>
    <path d="M46 46 l4 6 7 -2 -3 7 6 4 -7 2 1 7 -6 -4 -4 6 -2 -7 -7 0 5 -5 -4 -6 7 1z" fill="${g.esf('#ffd23f')}"/>
    <circle cx="40" cy="78" r="3" fill="#fff" opacity="0.85"/><circle cx="48" cy="80" r="2.2" fill="#fff" opacity="0.85"/><circle cx="34" cy="82" r="1.8" fill="#fff" opacity="0.85"/>
    ${brillo(30, 60, 2, 14, 0, 0.35)}`,

  // Jabón líquido: galón con asa.
  'jabon-liquido': (g) => `${sombra(26)}
    <path d="M28 40 Q28 32 36 32 L60 32 Q72 32 72 44 L72 84 Q72 90 66 90 L34 90 Q28 90 28 84 Z" fill="${g.cil('#8bd450')}"/>
    <path d="M52 36 L64 36 Q68 36 68 42 L68 52 L60 52 L60 44 L52 44 Z" fill="${tono('#8bd450', -0.35)}" opacity="0.55"/>
    <rect x="33" y="22" width="16" height="12" rx="3" fill="${g.cil('#7b3fe4')}"/>
    <rect x="33" y="58" width="34" height="20" rx="5" fill="#f4ffe9"/>
    <path d="M44 72 Q50 60 56 72 Q50 77 44 72 Z" fill="#7b3fe4" opacity="0.8"/>
    ${brillo(34, 64, 2.4, 14, 0, 0.5)}`,

  // ---------- Ropa (pilas dobladas, colores por tipo) ----------
  'ropa-hombre': (g) => pilaRopa(g, ['#1f3f73', '#2c5aa0', '#4a90d9', '#7fb8ee'], 'camisa'),
  'ropa-hombre-2': (g) => pilaRopa(g, ['#3a4a5c', '#5f7d95', '#8fa9bd'], 'camisa'),
  'ropa-mujer': (g) => pilaRopa(g, ['#9c1450', '#c2185b', '#f06292', '#f8bbd0'], 'blusa'),
  'ropa-mujer-2': (g) => pilaRopa(g, ['#6c3483', '#8e44ad', '#c39bd3'], 'blusa'),
  'ropa-ninos': (g) => pilaRopa(g, ['#ef5350', '#43a047', '#fbc02d', '#4fc3f7'], 'estrella'),
  'ropa-ninos-2': (g) => pilaRopa(g, ['#ff7043', '#ffd54f', '#81c784'], 'estrella'),

  // ---------- Medicamentos (distintas presentaciones) ----------
  blister: (g) => {
    const pastillas = [];
    for (let f = 0; f < 3; f++)
      for (let c = 0; c < 2; c++)
        pastillas.push(`<ellipse cx="${39 + c * 22}" cy="${48 + f * 15}" rx="7.5" ry="5.5" fill="${g.esf(f === 1 ? '#ff7a8a' : '#ffffff')}"/>`);
    return `${sombra(24)}
      <rect x="27" y="36" width="46" height="54" rx="7" fill="${g.vert('#d4d9e2', 0.4, -0.15)}"/>
      ${pastillas.join('')}
      ${brillo(32, 56, 1.8, 14, 0, 0.6)}`;
  },

  'frasco-pastillas': (g) => `${sombra(22)}
    <rect x="31" y="38" width="38" height="52" rx="8" fill="${g.cil('#f39c34')}" opacity="0.95"/>
    <rect x="31" y="56" width="38" height="20" fill="#fffaf0"/>
    <path d="M47 61 h6 v4 h4 v6 h-4 v4 h-6 v-4 h-4 v-6 h4 z" fill="#e53935"/>
    <rect x="28" y="26" width="44" height="14" rx="4" fill="${g.cil('#ffffff')}"/>
    <path d="M32 30 v6 M38 30 v6 M44 30 v6 M50 30 v6 M56 30 v6 M62 30 v6 M68 30 v6" stroke="#dde2ea" stroke-width="1.6"/>
    ${brillo(36, 48, 2.2, 7, 0, 0.55)}`,

  // Jarabe: frasco ámbar con vasito medidor encima.
  jarabe: (g) => `${sombra(22)}
    <rect x="32" y="40" width="36" height="50" rx="10" fill="${g.cil('#a0522d')}"/>
    <rect x="34" y="58" width="32" height="18" rx="3" fill="#fff4e6"/>
    <path d="M44 67 h12" stroke="#a0522d" stroke-width="3" stroke-linecap="round"/>
    <rect x="42" y="32" width="16" height="9" fill="${g.cil('#c96b39')}"/>
    <path d="M38 14 L62 14 L59 33 L41 33 Z" fill="${g.cil('#e8f4ff')}" opacity="0.95"/>
    <path d="M40 22 h20" stroke="#7ab6e6" stroke-width="1.4"/>
    ${brillo(38, 70, 2.4, 11, 0, 0.5)}`,

  gotero: (g) => `${sombra(16)}
    <rect x="36" y="52" width="28" height="38" rx="8" fill="${g.cil('#3f7fd8')}"/>
    <rect x="38" y="64" width="24" height="14" rx="2" fill="#f1f7ff"/>
    <path d="M50 66 Q46 71 47.5 74 Q50 76 52.5 74 Q54 71 50 66 Z" fill="#3f7fd8"/>
    <rect x="42" y="40" width="16" height="13" rx="2.5" fill="${g.cil('#ffffff')}"/>
    <path d="M42 41 Q42 22 50 20 Q58 22 58 41 Z" fill="${g.esf('#ff6f61')}"/>
    ${brillo(41, 74, 1.8, 9, 0, 0.5)}`,

  crema: (g) => `${sombra(28)}
    <g transform="rotate(-14 50 70)">
      <path d="M22 60 Q22 55 27 55 L66 57 L66 79 L27 81 Q22 81 22 76 Z" fill="${g.vert('#f7f0ff', 0.1, -0.12)}"/>
      <rect x="34" y="60" width="22" height="16" rx="4" fill="#9c6ade"/>
      <path d="M43 64 h4 v3 h3 v4 h-3 v3 h-4 v-3 h-3 v-4 h3 z" fill="#fff"/>
      <rect x="66" y="60" width="6" height="16" rx="2" fill="${g.vert('#cfd8e3', 0.2, -0.2)}"/>
      <rect x="72" y="61" width="11" height="14" rx="4" fill="${g.cil('#9c6ade')}"/>
      <path d="M19 55 L19 81" stroke="#e2d6f3" stroke-width="4" stroke-linecap="round"/>
    </g>`,

  // ---------- Construcción ----------
  martillo: (g) => `${sombra(26)}
    <g transform="rotate(-28 50 55)">
      <rect x="46" y="34" width="9" height="58" rx="4.5" fill="${g.cil('#d08b4a')}"/>
      <rect x="45" y="66" width="11" height="26" rx="5" fill="${g.cil('#e53935')}"/>
      <path d="M26 20 Q26 14 32 14 L66 14 Q74 14 76 22 L70 30 L32 30 Q26 30 26 24 Z" fill="${g.vert('#9aa5b4', 0.35, -0.25)}"/>
      <rect x="44" y="12" width="13" height="22" rx="3" fill="${g.cil('#7d8896')}"/>
      ${brillo(36, 18, 8, 2, 0, 0.5)}
    </g>`,

  tornillos: (g) => {
    const tornillo = (x, alto, rot) => `
      <g transform="rotate(${rot} ${x} 88)">
        <path d="M${x - 4} ${88 - alto} L${x + 4} ${88 - alto} L${x + 3} 84 L${x} 90 L${x - 3} 84 Z" fill="${g.cil('#b8c1cc')}"/>
        ${Array.from({ length: Math.floor(alto / 6) }, (_, i) => `<path d="M${x - 4} ${88 - alto + 8 + i * 6} l8 -3" stroke="#7d8896" stroke-width="1.3"/>`).join('')}
        <ellipse cx="${x}" cy="${88 - alto}" rx="8" ry="3.5" fill="${g.vert('#d6dde5', 0.3, -0.25)}"/>
        <path d="M${x - 4} ${88 - alto} h8" stroke="#6b7684" stroke-width="1.6"/>
      </g>`;
    return `${sombra(28)}${tornillo(34, 40, -8)}${tornillo(52, 52, 4)}
      <path d="M62 80 l8 -5 8 5 0 9 -8 5 -8 -5 z" fill="${g.vert('#c3cbd5', 0.3, -0.25)}"/>
      <circle cx="70" cy="84.5" r="3.4" fill="#6b7684"/>`;
  },

  llave: (g) => `${sombra(24)}
    <g transform="rotate(35 50 55)">
      <rect x="45" y="30" width="10" height="56" rx="5" fill="${g.cil('#9aa5b4')}"/>
      <path d="M36 22 Q36 8 50 8 Q64 8 64 22 Q64 32 55 34 L45 34 Q36 32 36 22 Z" fill="${g.vert('#b8c1cc', 0.3, -0.25)}"/>
      <rect x="45" y="6" width="10" height="16" rx="2" fill="#f6e6c4"/>
      <circle cx="50" cy="80" r="3" fill="${tono('#9aa5b4', -0.35)}"/>
    </g>`,

  // Costal de cemento.
  cemento: (g) => `${sombra(32)}
    <path d="M20 46 Q18 38 26 36 L74 36 Q82 38 80 46 L82 82 Q82 90 74 90 L26 90 Q18 90 18 82 Z" fill="${g.vert('#c9b99b', 0.25, -0.2)}"/>
    <path d="M26 36 L30 30 L70 30 L74 36" fill="${tono('#c9b99b', -0.15)}"/>
    <rect x="28" y="52" width="44" height="22" rx="3" fill="#7a7f87"/>
    <text x="50" y="67.5" font-family="Arial, sans-serif" font-size="9.5" font-weight="700" fill="#fff" text-anchor="middle">CEMENTO</text>
    ${brillo(28, 46, 6, 2, -5, 0.4)}`,

  // Plástico doblado (lona).
  plastico: (g) => `${sombra(30)}
    ${[0, 1, 2]
      .map((i) => `<rect x="${22 + i * 2}" y="${76 - i * 13}" width="${56 - i * 4}" height="13" rx="5" fill="${g.vert('#4fa3e0', 0.35, -0.15)}" opacity="0.92"/>
        <path d="M${26 + i * 2} ${85 - i * 13} h${48 - i * 4}" stroke="#fff" stroke-width="1.2" opacity="0.5"/>`)
      .join('')}
    ${brillo(36, 54, 8, 1.8, 0, 0.6)}`,

  // Cuerda enrollada: rollo visto de frente, con el trenzado marcado.
  cuerda: (g) => {
    const color = g.vert('#e6bd72', 0.25, -0.25);
    const anillos = [30, 22, 14]
      .map((r) => `<circle cx="50" cy="58" r="${r}" fill="none" stroke="${color}" stroke-width="8.5"/>
        <circle cx="50" cy="58" r="${r}" fill="none" stroke="#a8742c" stroke-width="8.5" stroke-dasharray="2.2 4.2" opacity="0.55"/>`)
      .join('');
    return `${sombra(30)}${anillos}
      <circle cx="50" cy="58" r="8" fill="${tono('#e6bd72', -0.45)}" opacity="0.6"/>
      <path d="M78 66 Q86 80 76 92" stroke="#dcae5f" stroke-width="7" stroke-linecap="round" fill="none"/>
      ${brillo(34, 40, 7, 2.4, -40, 0.5)}`;
  },

  casco: (g) => `${sombra(32)}
    <path d="M24 72 Q24 36 50 34 Q76 36 76 72 Z" fill="${g.esf('#ffc61a')}"/>
    <path d="M46 35 Q50 33 54 35 L55 72 L45 72 Z" fill="${tono('#ffc61a', -0.15)}"/>
    <path d="M14 74 Q14 68 22 68 L78 68 Q86 68 86 74 Q86 80 78 80 L22 80 Q14 80 14 74 Z" fill="${g.vert('#ffc61a', 0.1, -0.3)}"/>
    ${brillo(36, 48, 5, 9, -30, 0.6)}`,

  botas: (g) => `${sombra(32)}
    <path d="M30 30 L52 30 L54 64 Q76 64 80 76 L80 82 L26 82 L26 40 Q26 30 30 30 Z" fill="${g.vert('#a0612e', 0.2, -0.25)}"/>
    <rect x="24" y="80" width="58" height="10" rx="4" fill="${g.vert('#ffb300', 0.1, -0.3)}"/>
    <path d="M33 40 l14 4 M33 48 l14 4 M33 56 l14 4" stroke="#ffe0a3" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="28" y="26" width="26" height="8" rx="3" fill="${tono('#a0612e', -0.3)}"/>
    ${brillo(62, 70, 7, 2, -15, 0.45)}`,

  gafas: (g) => `${sombra(32)}
    <path d="M14 56 Q12 50 18 50 L82 50 Q88 50 86 56" stroke="#2f2f2f" stroke-width="4" fill="none"/>
    <path d="M18 54 Q18 46 28 46 L72 46 Q82 46 82 54 L80 70 Q78 78 68 76 L56 74 Q50 70 44 74 L32 76 Q22 78 20 70 Z" fill="${g.vert('#bfe8ff', 0.3, -0.1)}" opacity="0.85"/>
    <path d="M18 54 Q18 46 28 46 L72 46 Q82 46 82 54" stroke="#ffb300" stroke-width="4" fill="none"/>
    ${brillo(32, 58, 6, 2.2, -20, 0.8)}${brillo(64, 58, 6, 2.2, -20, 0.8)}`,

  // ---------- Pantalla de inicio ----------
  'caja-donacion': (g) => `${sombra(32)}
    <path d="M20 44 L50 34 L80 44 L50 54 Z" fill="${g.vert('#e0a96b', 0.35, 0.05)}"/>
    <path d="M20 44 L50 54 L50 90 L20 80 Z" fill="${g.vert('#d18f4c', 0.15, -0.15)}"/>
    <path d="M80 44 L50 54 L50 90 L80 80 Z" fill="${tono('#c27c38', -0.12)}"/>
    <path d="M20 44 L10 36 L40 26 L50 34 Z" fill="${g.vert('#e8b77c', 0.3, 0)}"/>
    <path d="M80 44 L90 36 L60 26 L50 34 Z" fill="${g.vert('#d9a062', 0.25, -0.05)}"/>
    <path d="M35 58 Q35 52 40 52 Q43 52 44 55 Q45 52 48 52 Q53 52 52 59 Q50 65 43 70 Q36 65 35 58 Z" fill="${g.esf('#e53935')}" transform="skewY(14) translate(0 -9)"/>`,

  portapapeles: (g) => `${sombra(28)}
    <rect x="24" y="22" width="52" height="68" rx="7" fill="${g.vert('#8d5a34', 0.2, -0.2)}"/>
    <rect x="30" y="30" width="40" height="54" rx="3" fill="${g.vert('#ffffff', 0, -0.06)}"/>
    <rect x="38" y="16" width="24" height="12" rx="4" fill="${g.cil('#b8c1cc')}"/>
    <path d="M36 44 l3 3 5 -6 M36 58 l3 3 5 -6" stroke="#43a047" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M49 45 h15 M49 59 h15 M36 72 h28" stroke="#c3cbd5" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="40" cy="72" r="0.1"/>`,
};

// --- Qué productos van en cada hueco de la estantería ---------------------

const PRODUCTOS_SUBCATEGORIA = {
  'alimento-agua': ['botellon', 'botellon', 'botellon'],
  'alimento-no-perecederos': ['lata', 'paquete', 'lata-maiz'],
  'alimento-bebe': ['lata-leche', 'compota', 'tetero'],
  'aseo-corporal': ['papel-higienico', 'jabon', 'shampoo'],
  'aseo-bucal': ['cepillo', 'crema-dental', 'cepillo-verde'],
  'aseo-limpieza-hogar': ['escoba', 'detergente', 'jabon-liquido', 'trapeador'],
  'ropa-hombre': ['ropa-hombre-2', 'ropa-hombre'],
  'ropa-mujer': ['ropa-mujer-2', 'ropa-mujer'],
  'ropa-ninos': ['ropa-ninos-2', 'ropa-ninos'],
  'medicamentos-analgesicos': ['blister', 'frasco-pastillas', 'gotero'],
  'medicamentos-antibioticos': ['jarabe', 'blister', 'frasco-pastillas'],
  'medicamentos-cronicos': ['crema', 'frasco-pastillas', 'jarabe'],
  'construccion-herramientas': ['martillo', 'tornillos', 'llave'],
  'construccion-materiales': ['cemento', 'plastico', 'cuerda'],
  'construccion-proteccion': ['casco', 'botas', 'gafas'],
};

// Producto representativo de cada subcategoría (estantería de categorías).
const PRODUCTO_PRINCIPAL = {
  'alimento-agua': 'botellon',
  'alimento-no-perecederos': 'lata',
  'alimento-bebe': 'tetero',
  'aseo-corporal': 'papel-higienico',
  'aseo-bucal': 'crema-dental',
  'aseo-limpieza-hogar': 'detergente',
  'ropa-hombre': 'ropa-hombre',
  'ropa-mujer': 'ropa-mujer',
  'ropa-ninos': 'ropa-ninos',
  'medicamentos-analgesicos': 'blister',
  'medicamentos-antibioticos': 'jarabe',
  'medicamentos-cronicos': 'crema',
  'construccion-herramientas': 'martillo',
  'construccion-materiales': 'cemento',
  'construccion-proteccion': 'casco',
};

// Variantes de color sin dibujo propio.
const VARIANTES = {
  'cepillo-verde': ['cepillo', { color: '#2eb872' }],
};

// --- API ---------------------------------------------------------------

// Productos bajitos y anchos (pilas de ropa): se dibujan más grandes
// para que tengan el mismo peso visual que una lata o un botellón.
const ANCHOS = new Set(['ropa-hombre', 'ropa-hombre-2', 'ropa-mujer', 'ropa-mujer-2', 'ropa-ninos', 'ropa-ninos-2']);

export function ilustracion(nombre, { tamano = 48, clase = '' } = {}) {
  const [base, opciones] = VARIANTES[nombre] ?? [nombre, undefined];
  if (ANCHOS.has(nombre)) clase = `${clase} producto3d--ancho`;
  const dibujar = PRODUCTOS[base];
  if (!dibujar) return '';
  const g = crearLienzo();
  const cuerpo = dibujar(g, opciones);
  return `<svg class="producto3d ${clase}" viewBox="0 0 100 100" width="${tamano}" height="${tamano}" aria-hidden="true" focusable="false"><defs>${g.defs.join('')}</defs>${cuerpo}</svg>`;
}

export function productosDe(subcategoriaId) {
  return PRODUCTOS_SUBCATEGORIA[subcategoriaId] ?? [];
}

export function productoPrincipal(subcategoriaId) {
  return PRODUCTO_PRINCIPAL[subcategoriaId] ?? productosDe(subcategoriaId)[0];
}

// Los productos de un hueco, el del medio más grande (como en una vitrina).
export function renderProductosHueco(subcategoriaId, { chico = 40, grande = 56 } = {}) {
  const lista = productosDe(subcategoriaId);
  const medio = Math.floor((lista.length - 1) / 2);
  return lista
    .map((nombre, i) => ilustracion(nombre, { tamano: i === medio ? grande : chico }))
    .join('');
}

export const _catalogo = Object.keys(PRODUCTOS);

// --- Repisa con cantidad (0 a 5) ---------------------------------------
// Muestra tantos productos como la cantidad, y huecos punteados para lo
// que falta. Se usa en la ficha del centro (donante) y en la gestión de
// insumos (administrador).
export function renderRepisaNivel(subcategoriaId, nivel, { tamano = 52, maximo = 5 } = {}) {
  const producto = productoPrincipal(subcategoriaId);
  const llenos = Array.from({ length: nivel }, () =>
    `<span class="nivel__item nivel__item--lleno">${ilustracion(producto, { tamano })}</span>`
  );
  const vacios = Array.from({ length: maximo - nivel }, () =>
    `<span class="nivel__item nivel__item--vacio" style="width:${tamano}px;height:${tamano}px"></span>`
  );
  return `<span class="nivel__productos" aria-hidden="true">${[...llenos, ...vacios].join('')}</span>`;
}
