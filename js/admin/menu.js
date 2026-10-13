// ============================================================
// admin/menu.js — A3. Menú principal. Todas las confirmaciones
// vuelven aquí.
// ============================================================

import { logout } from '../store.js';
import { conSesion, renderEncabezado } from './comun.js';

const OPCIONES = [
  {
    ruta: '#/admin/insumos',
    icono: '📦',
    titulo: 'Gestionar insumos',
    texto: 'Cambia el estado de lo que tiene tu centro.',
  },
  {
    ruta: '#/admin/donacion',
    icono: '📝',
    titulo: 'Registrar donación',
    texto: 'Anota a quien acaba de entregar en el centro.',
  },
  {
    ruta: '#/admin/despacho',
    icono: '🚚',
    titulo: 'Registrar despacho',
    texto: 'Registra el camión que sale con el lote de la semana.',
  },
];

export const render = conSesion((_params, centro) => ({
  html: `
    <section class="vista vista-admin">
      ${renderEncabezado({ titulo: 'Menú principal', centro })}
      <nav class="menu-admin" aria-label="Tareas del administrador">
        ${OPCIONES.map(
          (o) => `
            <button type="button" class="menu-admin__opcion" data-navegar="${o.ruta}">
              <span class="menu-admin__icono" aria-hidden="true">${o.icono}</span>
              <span class="menu-admin__texto">
                <span class="menu-admin__titulo">${o.titulo}</span>
                <span class="menu-admin__descripcion">${o.texto}</span>
              </span>
              <span class="menu-admin__flecha" aria-hidden="true">›</span>
            </button>`
        ).join('')}
      </nav>
      <div class="menu-admin__pie">
        <a class="boton-texto" href="#/correos-enviados">Bandeja de correos (prueba)</a>
        <button type="button" class="boton-texto" data-cerrar-sesion>Cerrar sesión</button>
      </div>
    </section>
  `,
  init(contenedor) {
    contenedor.querySelector('[data-cerrar-sesion]').addEventListener('click', () => {
      logout();
      location.hash = '#/';
    });
  },
}));
