// ============================================================
// admin/insumos.js — A4. Gestionar insumos.
//   Estantería con las 5 categorías (punto de color = estado). Al
//   tocar una, su recuadro se acerca EN LA MISMA PANTALLA y muestra
//   cada subcategoría con su cantidad (0 a 5) sobre la repisa; con
//   − y + se cambia, y "Guardar" la hace oficial.
// ============================================================

import { estadoDeNivel, ETIQUETA_ESTADO, NIVEL_MAX } from '../data.js';
import { actualizarNivelInsumo, getCentroAdminActual } from '../store.js';
import { renderRepisaNivel } from '../ilustraciones.js';
import { activarZoomEstanteria, renderCapaZoom, renderCabeceraZoom } from '../zoom-estanteria.js';
import {
  ESTADOS,
  conSesion,
  renderEncabezado,
  renderEstanteriaAdmin,
  renderBuscador,
  activarBuscador,
  mostrarConfirmacion,
} from './comun.js';

const TAMANO = 54;

// Lo que se ve de cerca: cada subcategoría con su repisa y sus botones.
function renderCantidades(categoria) {
  const centro = getCentroAdminActual();
  const secciones = categoria.subcategorias
    .map((sub) => {
      const nivel = centro.insumos[sub.id];
      return `
        <article class="seccion-insumo seccion-nivel" data-estado="${estadoDeNivel(nivel)}" data-sub="${sub.id}" data-nivel="${nivel}">
          <h3 class="seccion-insumo__nombre hueco__etiqueta" id="titulo-${sub.id}">${sub.nombre}</h3>
          <div class="seccion-nivel__repisa">${renderRepisaNivel(sub.id, nivel, { tamano: TAMANO })}</div>
          <div class="seccion-nivel__control" role="group" aria-labelledby="titulo-${sub.id}">
            <button type="button" class="seccion-nivel__boton" data-cambio="-1" aria-label="Quitar uno de ${sub.nombre}">−</button>
            <output class="seccion-nivel__valor" aria-live="polite">
              <span class="seccion-nivel__numero">${nivel}</span> de ${NIVEL_MAX}
              <span class="seccion-nivel__estado">${ETIQUETA_ESTADO[estadoDeNivel(nivel)]}</span>
            </output>
            <button type="button" class="seccion-nivel__boton" data-cambio="1" aria-label="Agregar uno de ${sub.nombre}">+</button>
          </div>
          <span class="seccion-insumo__cambio" hidden>Sin guardar</span>
        </article>`;
    })
    .join('');

  return `
    ${renderCabeceraZoom(categoria.nombre, '¿Cuánto tienes de cada insumo? De 0 (vacío, urgente) a 5 (abastecido).')}
    <div class="mueble mueble--cerca">
      <div class="mueble__cuerpo secciones-insumo">${secciones}</div>
    </div>
    <div class="admin-acciones">
      <p class="admin-acciones__aviso" aria-live="polite"></p>
      <button class="boton boton--grande" type="button" data-guardar disabled>Guardar</button>
    </div>`;
}

// Conecta los botones − / + y "Guardar" del panel.
function activarCantidades(panel, categoria) {
  const secciones = [...panel.querySelectorAll('.seccion-nivel')];
  const botonGuardar = panel.querySelector('[data-guardar]');
  const aviso = panel.querySelector('.admin-acciones__aviso');
  const original = Object.fromEntries(secciones.map((s) => [s.dataset.sub, Number(s.dataset.nivel)]));
  let guardado = false;

  const cambios = () => secciones.filter((s) => Number(s.dataset.nivel) !== original[s.dataset.sub]);

  function refrescar() {
    const n = cambios().length;
    botonGuardar.disabled = n === 0;
    aviso.textContent = n ? `${n} ${n === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}` : '';
  }

  function pintar(seccion, nivel) {
    const sub = seccion.dataset.sub;
    const estado = estadoDeNivel(nivel);
    seccion.dataset.nivel = nivel;
    seccion.dataset.estado = estado;
    seccion.querySelector('.seccion-nivel__repisa').innerHTML = renderRepisaNivel(sub, nivel, { tamano: TAMANO });
    seccion.querySelector('.seccion-nivel__numero').textContent = nivel;
    seccion.querySelector('.seccion-nivel__estado').textContent = ETIQUETA_ESTADO[estado];
    seccion.querySelector('[data-cambio="-1"]').disabled = nivel <= 0;
    seccion.querySelector('[data-cambio="1"]').disabled = nivel >= NIVEL_MAX;
    seccion.querySelector('.seccion-insumo__cambio').hidden = nivel === original[sub];
  }

  secciones.forEach((seccion) => {
    pintar(seccion, Number(seccion.dataset.nivel));
    seccion.querySelectorAll('[data-cambio]').forEach((boton) =>
      boton.addEventListener('click', () => {
        const nivel = Math.max(0, Math.min(NIVEL_MAX, Number(seccion.dataset.nivel) + Number(boton.dataset.cambio)));
        pintar(seccion, nivel);
        seccion.classList.remove('seccion-insumo--latido');
        void seccion.offsetWidth;
        seccion.classList.add('seccion-insumo--latido');
        refrescar();
      })
    );
  });

  botonGuardar.addEventListener('click', () => {
    const pendientes = cambios();
    const centro = getCentroAdminActual();
    pendientes.forEach((s) => actualizarNivelInsumo(centro.id, s.dataset.sub, Number(s.dataset.nivel)));
    guardado = true;
    mostrarConfirmacion(
      'Se han realizado los cambios',
      `${categoria.nombre}: ${pendientes.length} ${pendientes.length === 1 ? 'insumo actualizado' : 'insumos actualizados'}. Los donantes ya lo ven en el mapa.`
    );
  });

  // Aviso si se intenta salir con cambios sin guardar (recargar o cerrar pestaña).
  const alSalir = (e) => {
    if (!guardado && cambios().length) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', alSalir);

  return {
    // Cerrar el zoom con cambios sin guardar pide confirmación.
    puedeCerrar: () =>
      guardado || !cambios().length || window.confirm('Tienes cambios sin guardar. ¿Salir sin guardar?'),
    limpiar: () => window.removeEventListener('beforeunload', alSalir),
  };
}

// A4 — Estantería (con el zoom abierto si la dirección trae una categoría)
export const renderEstanteria = conSesion(({ categoriaId = null } = {}, centro) => ({
  html: `
    <section class="vista vista-admin vista-estanteria">
      ${renderEncabezado({ atras: '#/admin/menu', titulo: 'Gestionar insumos', centro })}
      <div class="admin-barra">
        <ul class="leyenda-estados" aria-label="Leyenda de estados">
          ${ESTADOS.map((e) => `<li><span class="punto-estado punto-estado--${e.id}"></span>${e.nombre}</li>`).join('')}
        </ul>
        ${renderBuscador('buscador-insumos')}
      </div>
      <div class="mueble">
        <div class="mueble__cuerpo estanteria__repisas">
          ${renderEstanteriaAdmin({ centro })}
        </div>
        <div class="mueble__patas" aria-hidden="true"><span></span><span></span></div>
      </div>
      ${renderCapaZoom()}
    </section>
  `,
  init(contenedor) {
    activarBuscador(contenedor);
    return activarZoomEstanteria(contenedor, {
      categoriaInicial: categoriaId,
      rutaAbierta: (cat) => `#/admin/insumos/${cat}`,
      rutaCerrada: '#/admin/insumos',
      contenido: renderCantidades,
      alMontar: activarCantidades,
    });
  },
}));
