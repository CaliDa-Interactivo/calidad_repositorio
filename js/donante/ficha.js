// ============================================================
// ficha.js — D5 · Información del centro de acopio.
// Muestra el recuadro de la estantería con la cantidad (0 a 5) de
// la subcategoría elegida y el botón de pre-registro. "Cómo llegar"
// NO va aquí: está en la pantalla que se abre después del pre-registro
// (llegar.js).
// ============================================================

import { getCentro } from '../store.js';
import { obtenerSubcategoria, estadoDeNivel, ETIQUETA_ESTADO, NIVEL_MAX } from '../data.js';
import { renderRepisaNivel } from '../ilustraciones.js';
import { urlEmoji, EMOJI_CENTRO } from '../iconos.js';
import { prerregistroVigente, horaVencimiento } from './prerregistro-sesion.js';

export function renderNivel(subcategoria, nivel, { tamano = 52 } = {}) {
  const estado = estadoDeNivel(nivel);
  return `
    <div class="nivel ${nivel === 0 ? 'nivel--vacio' : ''}">
      <div class="nivel__repisa">${renderRepisaNivel(subcategoria.id, nivel, { tamano })}</div>
      <p class="nivel__texto">
        <span>${subcategoria.nombre}: ${nivel} de ${NIVEL_MAX}</span>
        <span class="nivel__chip nivel__chip--${estado}">${ETIQUETA_ESTADO[estado]}</span>
      </p>
    </div>
  `;
}

export function render({ centroId, subcategoriaId }) {
  const centro = getCentro(centroId);
  const subcategoria = obtenerSubcategoria(subcategoriaId);
  const volverAtras = `#/donante/mapa/${subcategoriaId}`;

  if (!centro || !subcategoria) {
    return `
      <section class="vista">
        <a class="boton-atras" href="#/donante/estanteria">← Volver</a>
        <h1>Centro no encontrado</h1>
      </section>
    `;
  }

  const nivel = centro.insumos[subcategoriaId];
  const pre = prerregistroVigente(centroId, subcategoriaId);

  const acciones = pre
    ? `
      <div class="ficha-prerregistro-ok" role="status">
        <p><strong>✓ Ya hiciste tu pre-registro.</strong> Lleva tu donación antes del ${horaVencimiento(pre)}</p>
      </div>
      <button class="boton boton--grande" type="button"
              data-navegar="#/donante/llegar/${centro.id}/${subcategoria.id}">
        Continuar
      </button>`
    : `
      <button class="boton boton--grande" type="button"
              data-navegar="#/donante/prerregistro/${centro.id}/${subcategoria.id}">
        Pre-registrar mi donación
      </button>
      <p class="ficha-centro__nota">Toma un minuto y avisa al centro que vas en camino.</p>`;

  return `
    <section class="vista vista-ficha">
      <a class="boton-atras" href="${volverAtras}">← Volver</a>
      <div class="tarjeta ficha-centro">
        <div class="ficha-centro__foto">
          <img src="${urlEmoji(EMOJI_CENTRO)}" alt="" width="64" height="64" />
        </div>
        <h1 class="ficha__nombre">${centro.nombre}</h1>
        <p class="ficha-centro__dato"><strong>Zona:</strong> ${centro.zona}</p>
        <p class="ficha-centro__dato"><strong>Horario:</strong> ${centro.horario}</p>
        <p class="ficha-centro__dato"><strong>Teléfono:</strong> ${centro.telefono}</p>

        <h2 class="ficha-centro__subtitulo">Así está su repisa de ${subcategoria.nombre.toLowerCase()}</h2>
        ${renderNivel(subcategoria, nivel)}

        ${acciones}
      </div>
    </section>
  `;
}
