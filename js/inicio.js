// ============================================================
// inicio.js — pantallas 1 y 2.
//   #/        Pantalla 1 · Bienvenida
//   #/entrar  Pantalla 2 · Elige tu perfil
// ============================================================

import { renderEncabezado } from './encabezado.js';
import { renderMascota, decir } from './mascota.js';
import { isLoggedIn } from './store.js';

// Recorrido del donante: estantería → subcategorías → mapa → ficha.
export const RUTA_DONANTE = '#/donante/estanteria';

// --- Pantalla 1 · Bienvenida --------------------------------------------
export function renderBienvenida() {
  return `
    <section class="vista pantalla-entrada">
      ${renderEncabezado()}

      <div class="bienvenida-inicio">
        <div>
          <h1>En una emergencia, ayudar también es saber dónde hace falta.</h1>
          <p class="bienvenida-inicio__apoyo">
            Descubre qué necesita cada centro de acopio de la Cruz Roja en Cali
            y lleva tu donación a donde de verdad sirve.
          </p>
        </div>
        ${renderMascota({ pose: 'saluda', mensaje: null })}
      </div>

      <div class="bienvenida-inicio__acciones">
        <a class="boton-principal" href="#/entrar">
          Siguiente
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </section>
  `;
}

// --- Pantalla 2 · Elige tu perfil -------------------------------------------
const MENSAJES_PERFIL = {
  reposo: '¿Cómo vas a ayudar hoy?',
  donador: '¡Vamos a ver qué necesita Cali!',
  admin: '¡Hola, equipo! Entra con tu usuario.',
};

export function renderEntrar() {
  // Si el administrador ya tiene la sesión abierta, entra directo a su menú.
  const destinoAdmin = isLoggedIn() ? '#/admin/menu' : '#/admin/login';

  return {
    html: `
      <section class="vista pantalla-entrada">
        ${renderEncabezado()}
        <a class="enlace-volver" href="#/">← Volver</a>

        <div class="perfiles">
          <div>
            <h1>¿Cómo quieres entrar a CaliDa?</h1>
            <div class="perfiles__tarjetas">
              <article class="tarjeta-entrada tarjeta-entrada--hover tarjeta-entrada--donador" data-perfil="donador">
                <span class="etiqueta-entrada etiqueta-entrada--donador">Donador</span>
                <h2>Quiero ayudar</h2>
                <p>Mira qué necesita cada centro de acopio, en qué zona está y cómo llegar. No necesitas registrarte.</p>
                <a class="boton-principal boton-ancho" href="${RUTA_DONANTE}">
                  Entrar como donador <span aria-hidden="true">→</span>
                </a>
              </article>

              <article class="tarjeta-entrada tarjeta-entrada--hover" data-perfil="admin">
                <span class="etiqueta-entrada etiqueta-entrada--admin">Administrador</span>
                <h2>Administro un centro</h2>
                <p>Actualiza lo que necesita tu centro y registra donaciones y despachos.</p>
                <a class="boton-contorno boton-ancho" href="${destinoAdmin}">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Iniciar sesión
                </a>
              </article>
            </div>
          </div>

          ${renderMascota({ pose: 'senala', mensaje: MENSAJES_PERFIL.reposo })}
        </div>
      </section>
    `,
    init(contenedor) {
      // La burbuja del gato reacciona al hover o al foco en cada tarjeta.
      contenedor.querySelectorAll('[data-perfil]').forEach((tarjeta) => {
        const perfil = tarjeta.dataset.perfil;
        // Si ya se cambió de pantalla, la tarjeta no está en la página:
        // no se toca la burbuja de la pantalla nueva.
        const entrar = () => tarjeta.isConnected && decir(contenedor, MENSAJES_PERFIL[perfil]);
        const salir = () => {
          if (!tarjeta.isConnected) return;
          if (!tarjeta.matches(':hover') && !tarjeta.contains(document.activeElement)) {
            decir(contenedor, MENSAJES_PERFIL.reposo);
          }
        };
        tarjeta.addEventListener('pointerenter', entrar);
        tarjeta.addEventListener('focusin', entrar);
        tarjeta.addEventListener('pointerleave', salir);
        tarjeta.addEventListener('focusout', () => setTimeout(salir, 0));
      });

    },
  };
}
