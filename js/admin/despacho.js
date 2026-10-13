// ============================================================
// admin/despacho.js — A6. Registrar despacho.
// Al enviar, store.registrarDespacho agrupa las donaciones
// pendientes del centro en un lote (número = semana ISO de la
// fecha del despacho) y email.js genera automáticamente un correo
// para cada persona del lote.
// ============================================================

import { registrarDespacho, getCentroAdminActual } from '../store.js';
import { generarCorreosDespacho } from '../email.js';
import { MUNICIPIOS_VALLE } from '../data.js';
import {
  conSesion,
  renderEncabezado,
  hoyISO,
  isoADDMMAAAA,
  marcarError,
  mostrarConfirmacion,
} from './comun.js';

// Placa colombiana de camión: 3 letras + 3 números (ABC123).
const REGEX_PLACA = /^[A-Z]{3}\d{3}$/;

export const render = conSesion((_params, centro) => {
  const hoy = hoyISO();
  return {
    html: `
      <section class="vista vista-admin">
        ${renderEncabezado({ atras: '#/admin/menu', titulo: 'Registro salida de donaciones', centro })}
        <form class="tarjeta formulario" novalidate>
          <p class="formulario__categoria"><span aria-hidden="true">🚚</span> Despacho de la semana</p>

          <div class="campo">
            <label for="desp-fecha">Fecha</label>
            <input id="desp-fecha" name="fecha" type="date" value="${hoy}" required
                   aria-describedby="desp-fecha-error" />
            <p class="campo__error" id="desp-fecha-error" hidden></p>
          </div>

          <div class="campo">
            <label for="desp-destino">Municipio de destino</label>
            <select id="desp-destino" name="destino" class="campo__select" required aria-describedby="desp-destino-error">
              <option value="">Elige el municipio del Valle del Cauca</option>
              ${MUNICIPIOS_VALLE.map((m) => `<option value="${m.nombre}">${m.nombre}</option>`).join('')}
            </select>
            <p class="campo__error" id="desp-destino-error" hidden></p>
          </div>

          <div class="campo">
            <label for="desp-placa">Placa del camión</label>
            <input id="desp-placa" name="placa" class="campo__placa" autocomplete="off"
                   placeholder="ABC123" maxlength="7" required aria-describedby="desp-placa-error" />
            <p class="campo__error" id="desp-placa-error" hidden></p>
          </div>

          <button class="boton boton--grande" type="submit">Enviar</button>
        </form>
      </section>
    `,
    init(contenedor) {
      const form = contenedor.querySelector('form');
      const { fecha, placa, destino } = form;
      destino.addEventListener('change', () => marcarError(destino, ''));

      // Mayúsculas automáticas y sin espacios ni guiones.
      placa.addEventListener('input', () => {
        placa.value = placa.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        marcarError(placa, '');
      });
      fecha.addEventListener('input', () => marcarError(fecha, ''));

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const errorFecha = fecha.value ? '' : 'Elige la fecha del despacho.';
        const errorPlaca = !placa.value
          ? 'Escribe la placa del camión.'
          : !REGEX_PLACA.test(placa.value)
            ? 'La placa debe tener 3 letras y 3 números, por ejemplo ABC123.'
            : '';
        const errorDestino = destino.value ? '' : 'Elige el municipio al que va el lote.';
        marcarError(fecha, errorFecha);
        marcarError(destino, errorDestino);
        marcarError(placa, errorPlaca);
        const primero = [[errorFecha, fecha], [errorDestino, destino], [errorPlaca, placa]].find(([e]) => e);
        if (primero) {
          primero[1].focus();
          return;
        }

        const { despacho, donaciones } = registrarDespacho({
          centroId: getCentroAdminActual().id,
          fecha: isoADDMMAAAA(fecha.value),
          placa: placa.value,
          destino: destino.value,
        });
        // Correos automáticos: nadie los escribe ni los envía a mano.
        generarCorreosDespacho({ despacho, donaciones });
        mostrarConfirmacion(
          'Despacho registrado',
          `Lote #${despacho.numeroLote} · Camión ${despacho.placa} · Destino: ${despacho.destino}. Los donantes de esta semana recibirán su correo.`
        );
      });
    },
  };
});
