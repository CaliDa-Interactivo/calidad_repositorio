// ============================================================
// gato.js — mascota guía de CaliDa (la ilustración del equipo).
// Siempre va con un globo de diálogo. Dos poses en assets/:
// gato.png (de pie) y gato-saluda.png (saludando).
// ============================================================

export const IMAGEN_GATO = 'assets/gato.png';
export const IMAGEN_GATO_SALUDA = 'assets/gato-saluda.png';

export function renderGato(mensaje, { tamano = 'normal', pose = 'normal' } = {}) {
  const src = pose === 'saluda' ? IMAGEN_GATO_SALUDA : IMAGEN_GATO;
  return `
    <div class="gato-guia gato-guia--${tamano}">
      <img
        class="gato-guia__imagen"
        src="${src}"
        alt="Gato guía de CaliDa"
        width="64"
        height="80"
      />
      <div class="gato-guia__globo">
        <p>${mensaje}</p>
      </div>
    </div>
  `;
}
