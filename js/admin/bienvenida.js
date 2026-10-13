// ============================================================
// admin/bienvenida.js — A2. Mensaje + gato, igual estructura que D1.
// ============================================================

import { renderGato } from '../gato.js';
import { conSesion } from './comun.js';

export const render = conSesion((_params, centro) => `
  <section class="vista vista-bienvenida vista-admin">
    <div class="bienvenida__contenido">
      <div class="bienvenida__texto">
        <h1>¡Hola, equipo de ${centro.nombre}!</h1>
        <p>
          Lo que actualices aquí aparece de inmediato en el mapa de los
          donantes. Así la ayuda llega a donde de verdad hace falta.
        </p>
        <button class="boton" data-navegar="#/admin/menu">Continuar</button>
      </div>
      <div class="bienvenida__gato">
        ${renderGato('Mantengamos al día lo que le falta a tu centro.', { tamano: 'grande' })}
      </div>
    </div>
  </section>
`);
