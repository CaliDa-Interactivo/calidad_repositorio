// ============================================================
// mascota.js — el gato de CaliDa como componente independiente.
//
// VERSIÓN TEMPORAL 2D (SVG). Más adelante se reemplazará por un
// modelo 3D animado en three.js. Para hacerlo, basta con cambiar
// el contenido de dibujarGato() (o montar un <canvas> en su lugar):
// el resto de pantallas solo usa la API pública de este archivo:
//
//   renderMascota({ pose, mensaje, id })  → HTML del gato (+ burbuja)
//   decir(raiz, texto)                    → cambia el texto de la burbuja
//
// Poses: 'quieto' | 'saluda' (pata derecha en bucle) | 'senala'
// (pata derecha extendida hacia la izquierda, hacia el contenido).
// ============================================================

const COLOR = {
  cuerpo: '#F67751', // coral
  panza: '#FDD794', // amarillo
  panuelo: '#86B5A9', // salvia
  linea: '#4A4440',
  ojo: '#2B1E16',
};

const trazo = `stroke="${COLOR.linea}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

// Bigote que termina en espiral: una curva y, al final, tres medias
// vueltas cada vez más chicas (lado -1 = izquierda, 1 = derecha).
function bigote(x, y, lado) {
  const s = lado;
  const fx = x + s * 30; // fin del trazo recto
  const fy = y - 6;
  const giro = s > 0 ? 0 : 1; // sentido del espiral (se refleja a la izquierda)
  return `<path d="M${x} ${y} C${x + s * 12} ${y - 2} ${x + s * 22} ${y - 2} ${fx} ${fy}
    a6.5 6.5 0 0 ${giro} 0 -13 a4.5 4.5 0 0 ${giro} 0 9 a2.5 2.5 0 0 ${giro} 0 -5"
    fill="none" stroke="${COLOR.linea}" stroke-width="2" stroke-linecap="round"/>`;
}

function dibujarGato() {
  return `
  <svg class="mascota__svg" viewBox="0 0 240 300" role="img" aria-label="Gato de CaliDa" focusable="false">
    <!-- Cola grande enrollada en espiral, con franja salvia -->
    <g class="gato__cola">
      <path d="M140 238 C190 246 214 214 206 172 C200 136 168 118 150 136 C136 150 150 172 168 164"
        fill="none" stroke="${COLOR.linea}" stroke-width="40" stroke-linecap="round"/>
      <path d="M140 238 C190 246 214 214 206 172 C200 136 168 118 150 136 C136 150 150 172 168 164"
        fill="none" stroke="${COLOR.cuerpo}" stroke-width="34" stroke-linecap="round"/>
      <path d="M144 236 C188 242 208 212 201 174 C195 142 170 128 156 140"
        fill="none" stroke="${COLOR.panuelo}" stroke-width="5" stroke-linecap="round"/>
    </g>

    <!-- Patas -->
    <rect x="92" y="236" width="22" height="40" rx="9" fill="${COLOR.cuerpo}" ${trazo}/>
    <rect x="124" y="236" width="22" height="40" rx="9" fill="${COLOR.cuerpo}" ${trazo}/>
    <ellipse cx="102" cy="279" rx="16" ry="8" fill="${COLOR.cuerpo}" ${trazo}/>
    <ellipse cx="136" cy="279" rx="16" ry="8" fill="${COLOR.cuerpo}" ${trazo}/>
    <path d="M98 279 v4 M104 279 v4 M132 279 v4 M138 279 v4" stroke="${COLOR.linea}" stroke-width="2"/>

    <!-- Cuerpo y panza -->
    <ellipse cx="119" cy="196" rx="46" ry="56" fill="${COLOR.cuerpo}" ${trazo}/>
    <ellipse cx="119" cy="206" rx="26" ry="36" fill="${COLOR.panza}"/>

    <!-- Pata izquierda (del gato) en reposo -->
    <rect x="152" y="150" width="20" height="54" rx="10" fill="${COLOR.cuerpo}" ${trazo}
      transform="rotate(-14 162 154)"/>

    <!-- Pata derecha (del gato): saluda o señala -->
    <g class="gato__brazo">
      <rect x="64" y="106" width="20" height="56" rx="10" fill="${COLOR.cuerpo}" ${trazo}/>
      <circle cx="74" cy="106" r="13" fill="${COLOR.cuerpo}" ${trazo}/>
    </g>

    <!-- Pañoleta salvia -->
    <path d="M78 140 Q119 162 160 140 L156 156 Q119 174 82 156 Z" fill="${COLOR.panuelo}" ${trazo}/>
    <path d="M108 160 L130 160 L126 184 L119 176 L112 184 Z" fill="${COLOR.panuelo}" ${trazo}/>

    <!-- Cabeza -->
    <g class="gato__cabeza">
      <path d="M72 70 L78 20 L106 52 Z" fill="${COLOR.cuerpo}" ${trazo}/>
      <path d="M80 56 L83 33 L97 50 Z" fill="${COLOR.panza}"/>
      <path d="M166 70 L160 20 L132 52 Z" fill="${COLOR.cuerpo}" ${trazo}/>
      <path d="M158 56 L155 33 L141 50 Z" fill="${COLOR.panza}"/>
      <ellipse cx="119" cy="92" rx="56" ry="50" fill="${COLOR.cuerpo}" ${trazo}/>

      <!-- Cejas -->
      <path d="M86 64 Q96 58 106 64 M132 64 Q142 58 152 64" fill="none" stroke="${COLOR.linea}" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Ojos con aro amarillo -->
      <g class="gato__ojos">
        <circle cx="96" cy="86" r="17" fill="${COLOR.panza}" ${trazo}/>
        <circle cx="142" cy="86" r="17" fill="${COLOR.panza}" ${trazo}/>
        <circle cx="97" cy="88" r="11" fill="${COLOR.ojo}"/>
        <circle cx="141" cy="88" r="11" fill="${COLOR.ojo}"/>
        <circle cx="101" cy="83" r="4" fill="#fff"/>
        <circle cx="145" cy="83" r="4" fill="#fff"/>
        <circle cx="94" cy="93" r="1.8" fill="#fff"/>
        <circle cx="138" cy="93" r="1.8" fill="#fff"/>
      </g>

      <!-- Nariz y boca -->
      <path d="M114 104 L124 104 L119 110 Z" fill="${COLOR.linea}"/>
      <path d="M119 110 Q114 117 108 113 M119 110 Q124 117 130 113" fill="none" stroke="${COLOR.linea}" stroke-width="2.2" stroke-linecap="round"/>

      <!-- Bigotes en espiral -->
      ${bigote(78, 104, -1)}
      ${bigote(160, 104, 1)}
    </g>
  </svg>`;
}

/**
 * HTML del gato con su burbuja de diálogo (opcional).
 * @param {object} o
 * @param {'quieto'|'saluda'|'senala'} o.pose
 * @param {string|null} o.mensaje  null = sin burbuja
 * @param {string} o.clase         clases extra para el contenedor
 */
export function renderMascota({ pose = 'quieto', mensaje = null, clase = '' } = {}) {
  return `
    <div class="mascota mascota--${pose} ${clase}" data-mascota>
      ${
        mensaje !== null
          ? `<p class="mascota__burbuja" aria-live="polite">${mensaje}</p>`
          : ''
      }
      <div class="mascota__figura">${dibujarGato()}</div>
    </div>
  `;
}

/** Cambia lo que dice el gato (si el texto es distinto). */
export function decir(raiz, texto) {
  const burbuja = raiz.querySelector('[data-mascota] .mascota__burbuja');
  if (!burbuja || burbuja.textContent === texto) return;
  burbuja.textContent = texto;
  // Pequeño rebote para notar el cambio.
  burbuja.classList.remove('mascota__burbuja--cambio');
  void burbuja.offsetWidth;
  burbuja.classList.add('mascota__burbuja--cambio');
}
