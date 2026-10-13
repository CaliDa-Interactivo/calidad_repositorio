// ============================================================
// admin/donacion.js — A5. Registrar donación.
//   1. Estantería con las 5 categorías. Al tocar una, su recuadro
//      se acerca EN LA MISMA PANTALLA para elegir la subcategoría
//      exacta que trajo la persona (cada producto es una subcategoría).
//   2. Formulario: fecha (hoy, editable), cédula y correo.
// La donación queda "pendiente" hasta el próximo despacho.
// =============================================================

import { registrarDonacion, getCentroAdminActual, getPrerregistrosVigentes } from '../store.js';
import { obtenerSubcategoria, obtenerCategoriaPorSubcategoria } from '../data.js';
import { activarZoomEstanteria, renderCapaZoom, renderCabeceraZoom } from '../zoom-estanteria.js';
import { ilustracion, productoPrincipal } from '../ilustraciones.js';
import {
  conSesion,
  renderEncabezado,
  renderEstanteriaAdmin,
  renderBuscador,
  activarBuscador,
  hoyISO,
  isoADDMMAAAA,
  marcarError,
  mostrarConfirmacion,
} from './comun.js';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Lo que se ve de cerca: cada producto es una subcategoría.
function renderProductosDonacion(categoria) {
  const productos = categoria.subcategorias
    .map(
      (sub) => `
        <button class="producto-zoom" type="button" data-navegar="#/admin/donacion/${categoria.id}/${sub.id}">
          <span class="producto-zoom__figura">${ilustracion(productoPrincipal(sub.id), { tamano: 120 })}</span>
          <span class="producto-zoom__nombre">${sub.nombre}</span>
        </button>`
    )
    .join('');
  return `
    ${renderCabeceraZoom(categoria.nombre, '¿Qué trajo exactamente? Toca el producto.')}
    <div class="mueble mueble--cerca">
      <div class="mueble__cuerpo">
        <div class="hueco-zoom">
          <span class="hueco__etiqueta">${categoria.nombre}</span>
          <div class="hueco-zoom__productos">${productos}</div>
        </div>
      </div>
    </div>`;
}

// A5.1 — Estantería (con el zoom abierto si la dirección trae una categoría)
export const renderEstanteria = conSesion(({ categoriaId = null } = {}, centro) => ({
  html: `
    <section class="vista vista-admin vista-estanteria">
      ${renderEncabezado({ atras: '#/admin/menu', titulo: 'Registrar donación', centro })}
      <div class="admin-barra">
        <p class="admin-instruccion">¿Qué trajo la persona?</p>
        ${renderBuscador('buscador-donacion')}
      </div>
      <div class="mueble">
        <div class="mueble__cuerpo estanteria__repisas">
          ${renderEstanteriaAdmin()}
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
      rutaAbierta: (cat) => `#/admin/donacion/${cat}`,
      rutaCerrada: '#/admin/donacion',
      contenido: renderProductosDonacion,
    });
  },
}));

// A5.2 — Formulario
export const renderFormulario = conSesion(({ subcategoriaId }, centro) => {
  const subcategoria = obtenerSubcategoria(subcategoriaId);
  const categoria = subcategoria ? obtenerCategoriaPorSubcategoria(subcategoriaId) : null;
  if (!categoria) {
    location.replace('#/admin/donacion');
    return '<section class="vista"></section>';
  }
  const hoy = hoyISO();

  return {
    html: `
      <section class="vista vista-admin">
        ${renderEncabezado({ atras: `#/admin/donacion/${categoria.id}`, titulo: 'Registrar donación', centro })}
        <form class="tarjeta formulario" novalidate>
          <p class="formulario__categoria">
            ${ilustracion(productoPrincipal(subcategoria.id), { tamano: 48 })}
            <span>${subcategoria.nombre}<span class="formulario__categoria-de">${categoria.nombre}</span></span>
          </p>

          <div class="campo">
            <label for="don-fecha">Fecha</label>
            <input id="don-fecha" name="fecha" type="date" value="${hoy}" max="${hoy}" required
                   aria-describedby="don-fecha-error" />
            <p class="campo__error" id="don-fecha-error" hidden></p>
          </div>

          <div class="campo">
            <label for="don-cc">Cédula (CC)</label>
            <input id="don-cc" name="cedula" inputmode="numeric" autocomplete="off"
                   placeholder="Solo números" maxlength="10" required
                   aria-describedby="don-cc-error" />
            <p class="campo__error" id="don-cc-error" hidden></p>
            <p class="prerregistro-encontrado" aria-live="polite" hidden></p>
          </div>

          <div class="campo">
            <label for="don-correo">Correo</label>
            <input id="don-correo" name="correo" type="email" inputmode="email" autocomplete="off"
                   placeholder="nombre@correo.com" required aria-describedby="don-correo-error" />
            <p class="campo__error" id="don-correo-error" hidden></p>
            <p class="campo__ayuda">Aquí le llegará el aviso cuando su donación salga en el lote.</p>
          </div>

          <button class="boton boton--grande" type="submit">Registrar</button>
        </form>
      </section>
    `,
    init(contenedor) {
      const form = contenedor.querySelector('form');
      const { fecha, cedula, correo } = form;

      // Pre-registro del donante (vigente, de esta categoría y este centro).
      const avisoPre = contenedor.querySelector('.prerregistro-encontrado');
      let prerregistro = null;

      function buscarPrerregistro() {
        prerregistro = null;
        avisoPre.hidden = true;
        if (cedula.value.length < 6) return;
        const vigentes = getPrerregistrosVigentes(getCentroAdminActual().id, cedula.value);
        prerregistro =
          vigentes.find((p) => p.subcategoriaId === subcategoria.id) ??
          vigentes.find((p) => p.categoriaId === categoria.id) ??
          null;
        if (prerregistro) {
          const sub = obtenerSubcategoria(prerregistro.subcategoriaId);
          const horas = Math.max(1, Math.round((new Date(prerregistro.vence) - Date.now()) / 3600000));
          avisoPre.textContent = `✓ Tiene pre-registro de ${sub.nombre} (vence en ${horas} h). Se validará al registrar.`;
          avisoPre.hidden = false;
        } else if (vigentes.length) {
          const otra = obtenerSubcategoria(vigentes[0].subcategoriaId);
          avisoPre.textContent = `Tiene un pre-registro de ${otra.nombre}, que es de otra categoría.`;
          avisoPre.hidden = false;
        }
      }

      // La cédula solo acepta números mientras se escribe.
      cedula.addEventListener('input', () => {
        cedula.value = cedula.value.replace(/\D/g, '');
        marcarError(cedula, '');
        buscarPrerregistro();
      });
      correo.addEventListener('input', () => marcarError(correo, ''));
      fecha.addEventListener('input', () => marcarError(fecha, ''));

      function validar() {
        const errores = {
          fecha: !fecha.value
            ? 'Elige la fecha de la donación.'
            : fecha.value > hoyISO()
              ? 'La fecha no puede ser futura.'
              : '',
          cedula: !cedula.value
            ? 'Escribe la cédula.'
            : cedula.value.length < 6
              ? 'La cédula debe tener entre 6 y 10 números.'
              : '',
          correo: !correo.value.trim()
            ? 'Escribe el correo.'
            : !REGEX_CORREO.test(correo.value.trim())
              ? 'Revisa el correo, parece incompleto.'
              : '',
        };
        marcarError(fecha, errores.fecha);
        marcarError(cedula, errores.cedula);
        marcarError(correo, errores.correo);
        const primero = [fecha, cedula, correo].find((c) => errores[c.name]);
        primero?.focus();
        return !primero;
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validar()) return;
        registrarDonacion({
          centroId: getCentroAdminActual().id,
          categoriaId: categoria.id,
          subcategoriaId: subcategoria.id,
          fecha: isoADDMMAAAA(fecha.value),
          cedula: cedula.value,
          correo: correo.value.trim().toLowerCase(),
          prerregistroId: prerregistro?.id ?? null,
        });
        mostrarConfirmacion(
          'Donación registrada',
          `${subcategoria.nombre} · ${isoADDMMAAAA(fecha.value)}.${prerregistro ? ' Pre-registro validado.' : ''} Saldrá en el próximo despacho.`
        );
      });
    },
  };
});
