// ============================================================
// admin/login.js — Pantalla 3 · Login del administrador.
// La validación vive aislada en auth.js (login(correo, contraseña)).
// ============================================================

import { isLoggedIn } from '../store.js';
import { login } from '../auth.js';
import { renderEncabezado } from '../encabezado.js';
import { renderMascota, decir } from '../mascota.js';

const MENSAJES = {
  reposo: '¡Hola, equipo! Entra con tu correo.',
  escribiendo: 'Tómate tu tiempo, te espero.',
  error: 'Algo no coincide. ¡Intentemos otra vez!',
  exito: '¡Listo! Vamos a tu centro.',
};

const OJO_ABIERTO = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const OJO_CERRADO = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M4 4l16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

export function render() {
  if (isLoggedIn()) {
    location.replace('#/admin/menu');
    return '<section class="vista"></section>';
  }

  return {
    html: `
      <section class="vista pantalla-entrada">
        ${renderEncabezado()}
        <a class="enlace-volver" href="#/entrar">← Volver</a>

        <div class="login-admin">
          <div class="tarjeta-entrada">
            <span class="etiqueta-entrada etiqueta-entrada--admin">Administrador</span>
            <h1>Entra a tu centro</h1>
            <p>Usa el correo y la contraseña que te asignó la Cruz Roja.</p>

            <form novalidate>
              <div class="campo-entrada">
                <label for="login-correo">Correo</label>
                <input id="login-correo" name="correo" type="email" autocomplete="username"
                       inputmode="email" required />
              </div>

              <div class="campo-entrada">
                <label for="login-contrasena">Contraseña</label>
                <div class="campo-entrada__con-ojo">
                  <input id="login-contrasena" name="contrasena" type="password"
                         autocomplete="current-password" required />
                  <button type="button" class="boton-ojo" data-ojo aria-label="Mostrar contraseña"
                          aria-controls="login-contrasena">${OJO_ABIERTO}</button>
                </div>
              </div>

              <p class="alerta-entrada" role="alert" hidden></p>

              <button class="boton-principal boton-ancho" type="submit">Ingresar</button>
            </form>

            <button type="button" class="enlace-azul" data-olvido aria-expanded="false" aria-controls="login-ayuda">
              ¿Olvidaste tu contraseña?
            </button>
            <p class="login-admin__ayuda" id="login-ayuda" hidden>
              Las cuentas las crea la Cruz Roja. Escríbele a tu coordinador para restablecer tu contraseña.
            </p>
          </div>

          ${renderMascota({ pose: 'quieto', mensaje: MENSAJES.reposo })}
        </div>
      </section>
    `,
    init(contenedor) {
      const form = contenedor.querySelector('form');
      const { correo, contrasena } = form;
      const alerta = contenedor.querySelector('.alerta-entrada');
      const botonIngresar = form.querySelector('[type="submit"]');
      const ojo = contenedor.querySelector('[data-ojo]');
      const olvido = contenedor.querySelector('[data-olvido]');
      const ayuda = contenedor.querySelector('#login-ayuda');
      let enviando = false;

      // Mostrar / ocultar contraseña.
      ojo.addEventListener('click', () => {
        const visible = contrasena.type === 'text';
        contrasena.type = visible ? 'password' : 'text';
        ojo.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        ojo.innerHTML = visible ? OJO_ABIERTO : OJO_CERRADO;
      });

      // ¿Olvidaste tu contraseña? (no hay recuperación pública)
      olvido.addEventListener('click', () => {
        const abierto = olvido.getAttribute('aria-expanded') === 'true';
        olvido.setAttribute('aria-expanded', String(!abierto));
        ayuda.hidden = abierto;
      });

      // Mientras escribe: el gato espera y se limpia el error.
      [correo, contrasena].forEach((campo) =>
        campo.addEventListener('input', () => {
          if (enviando) return;
          alerta.hidden = true;
          correo.removeAttribute('aria-invalid');
          contrasena.removeAttribute('aria-invalid');
          decir(contenedor, correo.value || contrasena.value ? MENSAJES.escribiendo : MENSAJES.reposo);
        })
      );

      function mostrarError() {
        alerta.textContent = 'Revisa tu correo y tu contraseña e inténtalo de nuevo.';
        alerta.hidden = false;
        correo.setAttribute('aria-invalid', 'true');
        contrasena.setAttribute('aria-invalid', 'true');
        decir(contenedor, MENSAJES.error);
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (enviando) return;
        if (!correo.value.trim() || !contrasena.value) {
          mostrarError();
          (correo.value.trim() ? contrasena : correo).focus();
          return;
        }

        enviando = true;
        botonIngresar.setAttribute('aria-busy', 'true');
        let resultado = { ok: false };
        try {
          resultado = await login(correo.value, contrasena.value);
        } catch (error) {
          console.error('No se pudo validar el ingreso:', error);
        }
        botonIngresar.removeAttribute('aria-busy');

        if (resultado.ok) {
          decir(contenedor, MENSAJES.exito);
          contrasena.value = '';
          setTimeout(() => (location.hash = '#/admin/bienvenida'), 900);
          return;
        }
        enviando = false;
        mostrarError();
        contrasena.select();
      });
    },
  };
}
