// ============================================================
// llegar.js — D6 · Después del pre-registro.
// Dos opciones: "Cómo llegar" (abre Google Maps hacia el centro)
// y "Regresar al mapa".
// ============================================================

import { getCentro } from '../store.js';
import { obtenerSubcategoria } from '../data.js';
import { ilustracion, productoPrincipal } from '../ilustraciones.js';
import { renderGato } from '../gato.js';
import { prerregistroVigente, horaVencimiento } from './prerregistro-sesion.js';

export function render({ centroId, subcategoriaId }) {
  const centro = getCentro(centroId);
  const subcategoria = obtenerSubcategoria(subcategoriaId);
  const mapa = `#/donante/mapa/${subcategoriaId}`;

  if (!centro || !subcategoria) {
    return `<section class="vista"><a class="boton-atras" href="#/donante/estanteria">← Volver</a><h1>Centro no encontrado</h1></section>`;
  }

  const pre = prerregistroVigente(centroId, subcategoriaId);

  return `
    <section class="vista vista-llegar">
      <div class="tarjeta llegar">
        <div class="llegar__resumen">
          ${ilustracion(productoPrincipal(subcategoriaId), { tamano: 72 })}
          <div>
            <h1>¡Todo listo para llevar tu donación!</h1>
            <p class="llegar__que">${subcategoria.nombre} para <strong>${centro.nombre}</strong></p>
          </div>
        </div>

        <ul class="llegar__datos">
          <li><strong>Zona:</strong> ${centro.zona}</li>
          <li><strong>Horario:</strong> ${centro.horario}</li>
          <li><strong>Teléfono:</strong> ${centro.telefono}</li>
          ${pre ? `<li class="llegar__plazo"><strong>Llévala antes del:</strong> ${horaVencimiento(pre)}</li>` : ''}
        </ul>

        ${renderGato('Te espero en el centro. ¡Buen viaje!')}

        <div class="llegar__acciones">
          <button class="boton boton--grande" type="button" data-como-llegar="${centro.lat},${centro.lng}">
            📍 Cómo llegar
          </button>
          <button class="boton boton--secundario boton--grande" type="button" data-navegar="${mapa}">
            Regresar al mapa
          </button>
        </div>
      </div>
    </section>
  `;
}
