// ============================================================
// prerregistro.js — D5b · Pre-registro de la donación.
// Cédula + fecha (hoy). Opcional: compartir la ubicación (para
// el mapa del trayecto en el correo). Al guardar, aviso de que la
// donación debe hacerse válida en las próximas 24 horas; luego se abre
// la pantalla con "Cómo llegar" y "Regresar al mapa" (llegar.js).
// ============================================================

import { getCentro, crearPrerregistro, HORAS_VIGENCIA_PRERREGISTRO } from '../store.js';
import { obtenerSubcategoria, obtenerCategoriaPorSubcategoria } from '../data.js';
import { ilustracion, productoPrincipal } from '../ilustraciones.js';
import { renderGato } from '../gato.js';
import { obtenerUbicacion, ubicacionGuardada } from '../ubicacion.js';
import { recordarPrerregistro, horaVencimiento } from './prerregistro-sesion.js';

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function aDDMMAAAA(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function render({ centroId, subcategoriaId }) {
  const centro = getCentro(centroId);
  const subcategoria = obtenerSubcategoria(subcategoriaId);
  const categoria = obtenerCategoriaPorSubcategoria(subcategoriaId);
  const ficha = `#/donante/ficha/${centroId}/${subcategoriaId}`;

  if (!centro || !subcategoria) {
    return `<section class="vista"><a class="boton-atras" href="#/donante/estanteria">← Volver</a><h1>Centro no encontrado</h1></section>`;
  }

  const hoy = hoyISO();
  return {
    html: `
      <section class="vista vista-prerregistro">
        <a class="boton-atras" href="${ficha}">← Volver</a>
        <h1>Pre-registra tu donación</h1>

        <div class="tarjeta prerregistro">
          <div class="prerregistro__resumen">
            ${ilustracion(productoPrincipal(subcategoriaId), { tamano: 64 })}
            <div>
              <p class="prerregistro__que">${subcategoria.nombre}</p>
              <p class="prerregistro__donde">${centro.nombre} · Zona ${centro.zona}</p>
            </div>
          </div>

          <form class="formulario" novalidate>
            <div class="campo">
              <label for="pre-cc">Cédula</label>
              <input id="pre-cc" name="cedula" inputmode="numeric" autocomplete="off" maxlength="10"
                     placeholder="Solo números" required aria-describedby="pre-cc-error" />
              <p class="campo__error" id="pre-cc-error" hidden></p>
            </div>

            <div class="campo">
              <label for="pre-fecha">Fecha de tu donación</label>
              <input id="pre-fecha" name="fecha" type="date" value="${hoy}" min="${hoy}" max="${hoy}" readonly
                     aria-describedby="pre-fecha-ayuda" />
              <p class="campo__ayuda" id="pre-fecha-ayuda">Es hoy: el pre-registro vale ${HORAS_VIGENCIA_PRERREGISTRO} horas.</p>
            </div>

            <div class="campo prerregistro__ubicacion">
              <span class="prerregistro__ubicacion-titulo">Tu ubicación <span class="campo__opcional">(opcional)</span></span>
              <p class="campo__ayuda">Con ella te mostraremos en el correo el trayecto de tu donación hasta su destino.</p>
              <button type="button" class="boton boton--secundario" data-compartir-ubicacion>
                📍 Compartir mi ubicación
              </button>
              <p class="prerregistro__ubicacion-estado" aria-live="polite"></p>
            </div>

            <button class="boton boton--grande" type="submit">Hacer pre-registro</button>
          </form>
        </div>
      </section>
    `,
    init(contenedor) {
      const form = contenedor.querySelector('form');
      const cedula = form.cedula;
      const error = contenedor.querySelector('#pre-cc-error');
      const botonUbicacion = contenedor.querySelector('[data-compartir-ubicacion]');
      const estadoUbicacion = contenedor.querySelector('.prerregistro__ubicacion-estado');
      let ubicacion = ubicacionGuardada();

      const mostrarUbicacionLista = () => {
        estadoUbicacion.textContent = '✓ Ubicación compartida.';
        botonUbicacion.textContent = '📍 Actualizar mi ubicación';
      };
      if (ubicacion) mostrarUbicacionLista();

      botonUbicacion.addEventListener('click', async () => {
        estadoUbicacion.textContent = 'Buscando tu ubicación…';
        botonUbicacion.disabled = true;
        try {
          ubicacion = await obtenerUbicacion();
          mostrarUbicacionLista();
        } catch (e) {
          estadoUbicacion.textContent = e.message;
        } finally {
          botonUbicacion.disabled = false;
        }
      });

      cedula.addEventListener('input', () => {
        cedula.value = cedula.value.replace(/\D/g, '');
        error.hidden = true;
        cedula.removeAttribute('aria-invalid');
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (cedula.value.length < 6) {
          error.textContent = cedula.value ? 'La cédula debe tener entre 6 y 10 números.' : 'Escribe tu cédula.';
          error.hidden = false;
          cedula.setAttribute('aria-invalid', 'true');
          cedula.focus();
          return;
        }

        const pre = crearPrerregistro({
          cedula: cedula.value,
          centroId,
          subcategoriaId,
          categoriaId: categoria.id,
          fecha: aDDMMAAAA(form.fecha.value),
          ubicacion: ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : null,
        });
        recordarPrerregistro(pre);

        // Aviso: la donación debe hacerse válida en las próximas 24 horas.
        contenedor.querySelector('.vista-prerregistro').innerHTML = `
          <div class="tarjeta prerregistro-listo" role="status">
            <div class="prerregistro-listo__check" aria-hidden="true">✓</div>
            <h1 tabindex="-1">¡Pre-registro listo!</h1>
            <p class="prerregistro-listo__aviso">
              Tu donación debe hacerse válida en las próximas <strong>${HORAS_VIGENCIA_PRERREGISTRO} horas</strong>:
              llévala al centro antes del <strong>${horaVencimiento(pre)}</strong>
            </p>
            <p>En el centro te pedirán tu cédula para confirmarla.</p>
            ${renderGato('¡Gracias! Ahora te muestro cómo llegar.', { tamano: 'grande' })}
            <button class="boton boton--grande" type="button"
                    data-navegar="#/donante/llegar/${centroId}/${subcategoriaId}">Continuar</button>
          </div>
        `;
        contenedor.querySelector('h1').focus();
        window.scrollTo(0, 0);
      });
    },
  };
}
