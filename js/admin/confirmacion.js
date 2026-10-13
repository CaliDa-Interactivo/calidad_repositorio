// ============================================================
// admin/confirmacion.js — confirmación con el gato. Vuelve sola
// al menú principal después de unos segundos.
// ============================================================

import { renderGato } from '../gato.js';
import { conSesion, tomarConfirmacion } from './comun.js';

const SEGUNDOS = 4;

export const render = conSesion(() => {
  const confirmacion = tomarConfirmacion();
  if (!confirmacion) {
    // Se llegó por recarga o por el botón "atrás" del navegador.
    location.replace('#/admin/menu');
    return '<section class="vista"></section>';
  }

  return {
    html: `
      <section class="vista vista-admin vista-confirmacion" role="status">
        <div class="confirmacion">
          <div class="confirmacion__check" aria-hidden="true">✓</div>
          <h1>${confirmacion.titulo}</h1>
          ${confirmacion.detalle ? `<p class="confirmacion__detalle">${confirmacion.detalle}</p>` : ''}
          ${renderGato('¡Listo! Gracias por mantener todo al día.', { tamano: 'grande' })}
          <div class="confirmacion__progreso" aria-hidden="true"><span></span></div>
          <button class="boton boton--secundario" data-navegar="#/admin/menu">Volver al menú ahora</button>
        </div>
      </section>
    `,
    init(contenedor) {
      contenedor.querySelector('.confirmacion__progreso span').style.animationDuration = `${SEGUNDOS}s`;
      const temporizador = setTimeout(() => location.replace('#/admin/menu'), SEGUNDOS * 1000);
      return () => clearTimeout(temporizador);
    },
  };
});
