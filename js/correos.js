// ============================================================
// correos.js — bandeja de prueba (#/correos-enviados).
// Muestra los correos que el sistema "envió" al registrar cada
// despacho, tal como los vería el donante. Sirve para la
// demostración mientras el envío real no está conectado.
// ============================================================

import { getCorreosEnviados, vaciarCorreosEnviados } from './store.js';
import { fechaLarga } from './email.js';

function horaEnvio(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return { corta: `${hh}:${mi}`, larga: fechaLarga(`${dd}/${mm}/${d.getFullYear()}`) + `, ${hh}:${mi}` };
}

export function render() {
  const correos = [...getCorreosEnviados()].reverse(); // más recientes primero

  const items = correos
    .map((c, i) => {
      const hora = horaEnvio(c.fecha);
      return `
        <li>
          <button type="button" class="bandeja__item" data-indice="${i}" aria-pressed="${i === 0}">
            <span class="bandeja__remitente">CaliDa · Cruz Roja</span>
            <span class="bandeja__hora">${hora.corta}</span>
            <span class="bandeja__asunto">${c.asunto}</span>
            <span class="bandeja__para">Para: ${c.destinatario}</span>
          </button>
        </li>`;
    })
    .join('');

  return {
    html: `
      <section class="vista vista-bandeja">
        <header class="admin-encabezado">
          <a class="boton-atras" href="#/admin/menu">← Volver</a>
          <div class="admin-encabezado__texto">
            <h1>Bandeja de correos</h1>
            <p class="bandeja__nota">Vista de prueba: así le llega el correo automático a cada donante.</p>
          </div>
        </header>

        ${
          correos.length
            ? `
              <div class="bandeja">
                <ul class="bandeja__lista" aria-label="Correos enviados">${items}</ul>
                <div class="bandeja__lector">
                  <div class="bandeja__cabecera">
                    <p class="bandeja__cabecera-asunto"></p>
                    <p class="bandeja__cabecera-meta"></p>
                  </div>
                  <iframe class="bandeja__marco" title="Vista del correo" sandbox="allow-same-origin"></iframe>
                </div>
              </div>
              <button type="button" class="boton-texto bandeja__vaciar" data-vaciar>Vaciar bandeja</button>
            `
            : `
              <div class="tarjeta bandeja__vacia">
                <p class="bandeja__vacia-icono" aria-hidden="true">📭</p>
                <p><strong>Todavía no hay correos.</strong></p>
                <p>Se generan solos cuando el administrador registra un despacho con donaciones pendientes.</p>
              </div>
            `
        }
      </section>
    `,
    init(contenedor) {
      if (!correos.length) return;
      const botones = [...contenedor.querySelectorAll('.bandeja__item')];
      const marco = contenedor.querySelector('.bandeja__marco');
      const asunto = contenedor.querySelector('.bandeja__cabecera-asunto');
      const meta = contenedor.querySelector('.bandeja__cabecera-meta');

      function abrir(indice) {
        const c = correos[indice];
        botones.forEach((b, i) => b.setAttribute('aria-pressed', String(i === indice)));
        asunto.textContent = c.asunto;
        meta.textContent = `De: CaliDa · Cruz Roja — Para: ${c.destinatario} — ${horaEnvio(c.fecha).larga}`;
        marco.srcdoc = c.html;
      }

      botones.forEach((b) => b.addEventListener('click', () => abrir(Number(b.dataset.indice))));

      // El marco crece con el correo para no tener doble barra de desplazamiento.
      marco.addEventListener('load', () => {
        try {
          marco.style.height = `${marco.contentDocument.documentElement.scrollHeight}px`;
        } catch {
          marco.style.height = '720px';
        }
      });

      contenedor.querySelector('[data-vaciar]').addEventListener('click', () => {
        if (window.confirm('¿Vaciar la bandeja de prueba? Los datos de donaciones y despachos no se borran.')) {
          vaciarCorreosEnviados();
          location.reload();
        }
      });

      abrir(0);
    },
  };
}
