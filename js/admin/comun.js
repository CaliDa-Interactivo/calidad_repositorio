// ============================================================
// admin/comun.js — piezas compartidas del flujo de administrador:
// protección de rutas (login), encabezado, estantería, fechas y
// la pantalla de confirmación con el gato.
// ============================================================

import { CATEGORIAS, estadoDeNivel } from '../data.js';
import { isLoggedIn, getCentroAdminActual } from '../store.js';
import { ilustracion, productoPrincipal } from '../ilustraciones.js';

// Estados derivados de la cantidad (0 a 5) — ver estadoDeNivel en data.js.
export const ESTADOS = [
  { id: 'abastecido', nombre: 'Abastecido (5)' },
  { id: 'medio', nombre: 'Alcanza (3–4)' },
  { id: 'desabastecido', nombre: 'Se necesita (1–2)' },
  { id: 'urgente', nombre: 'Urgente (0)' },
];

// --- Protección de rutas ---------------------------------------------
// Envuelve el render de una pantalla: sin sesión, manda al login.
export function conSesion(render) {
  return (params) => {
    if (!isLoggedIn()) {
      location.replace('#/admin/login');
      return '<section class="vista"></section>';
    }
    return render(params, getCentroAdminActual());
  };
}

// --- Encabezado común -----------------------------------------------
export function renderEncabezado({ atras = null, titulo = '', centro = null }) {
  return `
    <header class="admin-encabezado">
      ${atras ? `<a class="boton-atras" href="${atras}">← Volver</a>` : ''}
      <div class="admin-encabezado__texto">
        ${titulo ? `<h1>${titulo}</h1>` : ''}
        ${centro ? `<p class="admin-encabezado__centro">${centro.nombre}</p>` : ''}
      </div>
    </header>
  `;
}

// --- Estantería (misma metáfora que el donante) ----------------------
// Cada repisa abre el zoom en la misma pantalla (zoom-estanteria.js).
// Con `centro`, cada objeto muestra un punto con su estado actual.
export function renderEstanteriaAdmin({ centro = null } = {}) {
  return CATEGORIAS.map((categoria) => {
    const objetos = categoria.subcategorias
      .map((sub) => {
        const nivel = centro?.insumos[sub.id];
        const estado = nivel === undefined ? null : estadoDeNivel(nivel);
        return `
          <span class="repisa__objeto" data-texto-busqueda="${sub.nombre.toLowerCase()}">
            <span class="repisa__objeto-icono">
              ${ilustracion(productoPrincipal(sub.id), { tamano: 48 })}
              ${estado ? `<span class="punto-estado punto-estado--${estado}" title="${nivel} de 5"></span>` : ''}
            </span>
            <span class="repisa__objeto-nombre">${sub.nombre}</span>
          </span>`;
      })
      .join('');

    return `
      <button
        class="repisa"
        type="button"
        data-categoria="${categoria.id}"
        aria-haspopup="dialog"
        data-texto-busqueda="${categoria.nombre.toLowerCase()}"
      >
        <span class="repisa__encabezado">
          <span class="repisa__nombre">${categoria.nombre}</span>
        </span>
        <span class="repisa__objetos">${objetos}</span>
        <span class="repisa__tabla" aria-hidden="true"></span>
      </button>`;
  }).join('');
}

// Buscador de la estantería (mismo comportamiento que en D2).
export function activarBuscador(contenedor) {
  const input = contenedor.querySelector('.buscador input');
  if (!input) return;
  const repisas = contenedor.querySelectorAll('.repisa');
  input.addEventListener('input', () => {
    const termino = input.value.trim().toLowerCase();
    repisas.forEach((repisa) => {
      let coincide = !termino || repisa.dataset.textoBusqueda.includes(termino);
      repisa.querySelectorAll('.repisa__objeto').forEach((obj) => {
        const c = Boolean(termino) && obj.dataset.textoBusqueda.includes(termino);
        obj.classList.toggle('repisa__objeto--resaltado', c);
        if (c) coincide = true;
      });
      repisa.classList.toggle('repisa--opaca', !coincide);
    });
  });
}

export function renderBuscador(id) {
  return `
    <label class="buscador">
      <span class="visually-hidden">Buscar categoría o subcategoría</span>
      <span class="buscador__icono" aria-hidden="true">🔍</span>
      <input type="search" id="${id}" placeholder="Buscar..." />
    </label>`;
}

// --- Fechas -----------------------------------------------------------
// El formulario usa <input type="date"> (AAAA-MM-DD, con calendario
// nativo en el celular) y el store guarda DD/MM/AAAA.

export function hoyISO() {
  const hoy = new Date();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mm}-${dd}`;
}

export function isoADDMMAAAA(iso) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

// --- Confirmación con el gato -------------------------------------------
// Las pantallas guardan aquí el mensaje y navegan a #/admin/confirmacion,
// que vuelve sola al menú principal.

let confirmacionPendiente = null;

export function mostrarConfirmacion(titulo, detalle = '') {
  confirmacionPendiente = { titulo, detalle };
  location.hash = '#/admin/confirmacion';
}

export function tomarConfirmacion() {
  const c = confirmacionPendiente;
  confirmacionPendiente = null;
  return c;
}

// --- Formularios: mostrar u ocultar el error de un campo ----------------
export function marcarError(campo, mensaje) {
  const error = campo.closest('.campo').querySelector('.campo__error');
  campo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  error.textContent = mensaje || '';
  error.hidden = !mensaje;
}
