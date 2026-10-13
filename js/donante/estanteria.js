// ============================================================
// estanteria.js — D2. "¿Qué deseas donar?"
// 5 repisas (una por categoría). Cada producto de la repisa es una
// subcategoría (p. ej. en Alimento: botellón = agua, lata = no
// perecederos, tetero = comida de bebé). Al tocar una repisa se hace
// zoom a ese recuadro AQUÍ MISMO (sin cambiar de pantalla): el
// recuadro crece hasta llenar la vista y muestra cada producto con
// su nombre. Al tocar un producto se abre el mapa. Buscador que resalta coincidencias.
// El gato NO aparece en esta pantalla.
// ============================================================

import { CATEGORIAS } from '../data.js';
import { ilustracion, productoPrincipal } from '../ilustraciones.js';
import { activarZoomEstanteria, renderCapaZoom, renderCabeceraZoom } from '../zoom-estanteria.js';

function renderRepisa(categoria) {
  const objetos = categoria.subcategorias
    .map(
      (sub) => `
        <span class="repisa__objeto" data-texto-busqueda="${sub.nombre.toLowerCase()}">
          ${ilustracion(productoPrincipal(sub.id), { tamano: 48 })}
          <span class="repisa__objeto-nombre">${sub.nombre}</span>
        </span>
      `
    )
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
    </button>
  `;
}

// Contenido del recuadro visto de cerca.
function renderRecuadroCerca(categoria) {
  const productos = categoria.subcategorias
    .map(
      (sub) => `
        <button class="producto-zoom" type="button" data-navegar="#/donante/mapa/${sub.id}">
          <span class="producto-zoom__figura">${ilustracion(productoPrincipal(sub.id), { tamano: 120 })}</span>
          <span class="producto-zoom__nombre">${sub.nombre}</span>
        </button>`
    )
    .join('');
  return `
    ${renderCabeceraZoom(categoria.nombre, '¿Qué vas a donar? Toca un producto.')}
    <div class="mueble mueble--cerca">
      <div class="mueble__cuerpo">
        <div class="hueco-zoom">
          <span class="hueco__etiqueta">${categoria.nombre}</span>
          <div class="hueco-zoom__productos">${productos}</div>
        </div>
      </div>
    </div>`;
}

export function render({ categoriaId = null } = {}) {
  const repisas = CATEGORIAS.map(renderRepisa).join('');

  return {
    html: `
      <section class="vista vista-estanteria">
        <header class="estanteria__encabezado">
          <a class="boton-atras" href="#/entrar">← Volver</a>
          <h1>¿Qué deseas donar?</h1>
          <label class="buscador">
            <span class="visually-hidden">Buscar categoría o subcategoría</span>
            <span class="buscador__icono" aria-hidden="true">🔍</span>
            <input type="search" id="buscador-estanteria" placeholder="Buscar..." />
          </label>
        </header>
        <div class="mueble">
        <div class="mueble__cuerpo estanteria__repisas">
          ${repisas}
        </div>
        <div class="mueble__patas" aria-hidden="true"><span></span><span></span></div>
      </div>

        <!-- Recuadro de cerca (zoom en la misma pantalla) -->
        ${renderCapaZoom()}
      </section>
    `,
    init(contenedor) {
      const limpiarZoom = activarZoomEstanteria(contenedor, {
        categoriaInicial: categoriaId,
        rutaAbierta: (cat) => `#/donante/subcategorias/${cat}`,
        rutaCerrada: '#/donante/estanteria',
        contenido: renderRecuadroCerca,
      });
      const input = contenedor.querySelector('#buscador-estanteria');
      const repisasEl = contenedor.querySelectorAll('.repisa');

      input.addEventListener('input', () => {
        const termino = input.value.trim().toLowerCase();

        repisasEl.forEach((repisa) => {
          if (!termino) {
            repisa.classList.remove('repisa--opaca');
            repisa.querySelectorAll('.repisa__objeto').forEach((obj) =>
              obj.classList.remove('repisa__objeto--resaltado')
            );
            return;
          }

          const coincideCategoria = repisa.dataset.textoBusqueda.includes(termino);
          let coincideAlgo = coincideCategoria;

          repisa.querySelectorAll('.repisa__objeto').forEach((objeto) => {
            const coincide = objeto.dataset.textoBusqueda.includes(termino);
            objeto.classList.toggle('repisa__objeto--resaltado', coincide);
            if (coincide) coincideAlgo = true;
          });

          repisa.classList.toggle('repisa--opaca', !coincideAlgo);
        });
      });

      return limpiarZoom;
    },
  };
}
