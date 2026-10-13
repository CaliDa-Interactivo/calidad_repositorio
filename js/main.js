// ============================================================
// main.js — router por hash de CaliDa.
// Cada pantalla se registra con registrarRuta(patron, render) y
// se monta dentro de #app con una transición de entrada suave.
// `render` puede devolver un string de HTML, o un objeto
// { html, init(contenedor) } cuando la vista necesita enganchar
// listeners (buscador, formularios, etc.) después de montarse.
// Si `init` devuelve una función, el router la llama al salir de
// la pantalla (p. ej. para liberar el mapa 3D y su animación).
// ============================================================

import { inicializarStore } from './store.js';
import * as inicio from './inicio.js';
import * as estanteriaDonante from './donante/estanteria.js';
import * as mapaDonante from './donante/mapa.js';
import * as fichaDonante from './donante/ficha.js';
import * as prerregistroDonante from './donante/prerregistro.js';
import * as llegarDonante from './donante/llegar.js';
import * as loginAdmin from './admin/login.js';
import * as bienvenidaAdmin from './admin/bienvenida.js';
import * as menuAdmin from './admin/menu.js';
import * as insumosAdmin from './admin/insumos.js';
import * as donacionAdmin from './admin/donacion.js';
import * as despachoAdmin from './admin/despacho.js';
import * as confirmacionAdmin from './admin/confirmacion.js';
import * as bandejaCorreos from './correos.js';

const contenedor = document.getElementById('app');

// Cada ruta es { patron: RegExp, render: (params) => string|{html, init} }
const rutas = [];

// Función de limpieza de la vista actual (si la vista la definió).
let limpiezaActual = null;

// --- Dirección de la transición ------------------------------------
// Cada pantalla tiene un "nivel" de profundidad en su flujo. Ir a un
// nivel más profundo desliza la vista desde la derecha (avanzar);
// volver a uno menor la desliza desde la izquierda (retroceder).
const NIVELES = [
  [/^#\/$/, 0], // bienvenida
  [/^#\/entrar$/, 1], // elegir perfil
  [/^#\/admin\/login$/, 2],
  [/^#\/admin\/bienvenida$/, 3],
  [/^#\/admin\/menu$/, 4],
  [/^#\/admin\/(insumos|donacion|despacho)$/, 5],
  [/^#\/admin\/donacion\/[\w-]+\/[\w-]+$/, 6], // formulario de donación
  [/^#\/admin\/(insumos|donacion)\//, 5], // estantería con el zoom abierto
  [/^#\/admin\/confirmacion$/, 7],
  [/^#\/correos-enviados$/, 5],
  [/^#\/donante\/estanteria$/, 2],
  [/^#\/donante\/subcategorias\//, 2],
  [/^#\/donante\/mapa\//, 4],
  [/^#\/donante\/ficha\//, 5],
  [/^#\/donante\/prerregistro\//, 6],
  [/^#\/donante\/llegar\//, 7],
];

function nivelDe(hash) {
  return NIVELES.find(([patron]) => patron.test(hash))?.[1] ?? 0;
}

let nivelAnterior = null;
let esPrimeraCarga = true;

// Después de montar una vista: título de la pestaña y foco en el título
// de la pantalla, para que los lectores de pantalla anuncien el cambio.
function anunciarVista() {
  const titulo = contenedor.querySelector('h1');
  const texto = titulo?.textContent.trim();
  document.title = !texto || texto === 'CaliDa'
    ? 'CaliDa · Ayuda que llega donde hace falta'
    : `${texto} · CaliDa`;

  if (esPrimeraCarga || !titulo) return;
  // Si la vista ya puso el foco en algo (p. ej. el login), se respeta.
  const activo = document.activeElement;
  if (activo && activo !== document.body && contenedor.contains(activo)) return;
  titulo.setAttribute('tabindex', '-1');
  titulo.focus({ preventScroll: true });
}

export function registrarRuta(patron, render) {
  rutas.push({ patron, render });
}

function encontrarRuta(hash) {
  for (const ruta of rutas) {
    const coincidencia = hash.match(ruta.patron);
    if (coincidencia) {
      return { render: ruta.render, params: coincidencia.groups ?? {} };
    }
  }
  return null;
}

function navegar() {
  const hash = location.hash || '#/';
  const encontrada = encontrarRuta(hash);

  if (limpiezaActual) {
    try {
      limpiezaActual();
    } catch (error) {
      console.error('Error al limpiar la vista anterior:', error);
    }
    limpiezaActual = null;
  }

  const nivel = nivelDe(hash);
  contenedor.dataset.direccion =
    nivelAnterior === null || nivel >= nivelAnterior ? 'avanzar' : 'retroceder';
  nivelAnterior = nivel;

  contenedor.classList.remove('vista--entrando');
  // Reinicia la animación de entrada aunque se repita la misma vista.
  void contenedor.offsetWidth;

  if (!encontrada) {
    contenedor.innerHTML = renderNoEncontrada(hash);
  } else {
    const resultado = encontrada.render(encontrada.params);
    const esObjeto = typeof resultado === 'object' && resultado !== null;
    contenedor.innerHTML = esObjeto ? resultado.html : resultado;
    if (esObjeto && typeof resultado.init === 'function') {
      const limpiar = resultado.init(contenedor);
      if (typeof limpiar === 'function') limpiezaActual = limpiar;
    }
  }

  contenedor.classList.add('vista--entrando');
  window.scrollTo(0, 0);
  anunciarVista();
  esPrimeraCarga = false;
}

function renderNoEncontrada(hash) {
  return `
    <section class="vista">
      <h1>Pantalla no encontrada</h1>
      <p>No hay ninguna vista registrada para <code>${hash}</code> todavía.</p>
      <a class="boton" href="#/">Volver al inicio</a>
    </section>
  `;
}

// --- Rutas del donante (D1–D6) -------------------------------
// D4 (mapa.js) monta el mapa 3D de mapa3d.js.
registrarRuta(/^#\/$/, inicio.renderBienvenida);
registrarRuta(/^#\/entrar$/, inicio.renderEntrar);
// La bienvenida del donante ahora es la pantalla inicial (#/).
registrarRuta(/^#\/donante\/bienvenida$/, () => {
  location.replace('#/donante/estanteria');
  return '<section class="vista"></section>';
});
registrarRuta(/^#\/donante\/estanteria$/, estanteriaDonante.render);
// El zoom a una categoría vive en la misma pantalla de la estantería.
registrarRuta(/^#\/donante\/subcategorias\/(?<categoriaId>[\w-]+)$/, estanteriaDonante.render);
registrarRuta(/^#\/donante\/mapa\/(?<subcategoriaId>[\w-]+)$/, mapaDonante.render);
registrarRuta(
  /^#\/donante\/ficha\/(?<centroId>[\w-]+)\/(?<subcategoriaId>[\w-]+)$/,
  fichaDonante.render
);
registrarRuta(
  /^#\/donante\/prerregistro\/(?<centroId>[\w-]+)\/(?<subcategoriaId>[\w-]+)$/,
  prerregistroDonante.render
);
registrarRuta(
  /^#\/donante\/llegar\/(?<centroId>[\w-]+)\/(?<subcategoriaId>[\w-]+)$/,
  llegarDonante.render
);

// --- Rutas del administrador (A1–A6) --------------------------
// Todas, salvo el login, exigen sesión (ver admin/comun.js).
registrarRuta(/^#\/admin\/login$/, loginAdmin.render);
registrarRuta(/^#\/admin\/bienvenida$/, bienvenidaAdmin.render);
registrarRuta(/^#\/admin\/menu$/, menuAdmin.render);
registrarRuta(/^#\/admin\/insumos$/, insumosAdmin.renderEstanteria);
// El zoom a una categoría se abre en la misma pantalla de la estantería.
registrarRuta(/^#\/admin\/insumos\/(?<categoriaId>[\w-]+)$/, insumosAdmin.renderEstanteria);
registrarRuta(/^#\/admin\/donacion$/, donacionAdmin.renderEstanteria);
registrarRuta(/^#\/admin\/donacion\/(?<categoriaId>[\w-]+)$/, donacionAdmin.renderEstanteria);
registrarRuta(
  /^#\/admin\/donacion\/(?<categoriaId>[\w-]+)\/(?<subcategoriaId>[\w-]+)$/,
  donacionAdmin.renderFormulario
);
registrarRuta(/^#\/admin\/despacho$/, despachoAdmin.render);
registrarRuta(/^#\/admin\/confirmacion$/, confirmacionAdmin.render);

// --- Bandeja de correos de prueba (Fase 5) ---------------------
registrarRuta(/^#\/correos-enviados$/, bandejaCorreos.render);

// Delegación de eventos para los controles comunes a toda vista:
// navegación simple y el botón "Cómo llegar" (D6).
contenedor.addEventListener('click', (evento) => {
  const elementoNavegar = evento.target.closest('[data-navegar]');
  if (elementoNavegar) {
    location.hash = elementoNavegar.dataset.navegar;
    return;
  }

  const elementoComoLlegar = evento.target.closest('[data-como-llegar]');
  if (elementoComoLlegar) {
    const [lat, lng] = elementoComoLlegar.dataset.comoLlegar.split(',');
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank',
      'noopener'
    );
  }
});

window.addEventListener('hashchange', navegar);
window.addEventListener('DOMContentLoaded', () => {
  inicializarStore();
  navegar();
});
