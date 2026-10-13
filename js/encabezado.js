// ============================================================
// encabezado.js — encabezado con los logos. Siempre en el mismo
// lugar: Cruz Roja Colombiana a la IZQUIERDA, CaliDa a la DERECHA.
// Ambos logos van sin fondo (solo tipografía y cruz, PNG transparente).
// ============================================================

export const LOGO_CALIDA = 'assets/logo-calida.png';
export const LOGO_CRUZ_ROJA = 'assets/logo-cruz-roja.png';

export function renderEncabezado() {
  return `
    <header class="encabezado-logos">
      <img class="logo logo--cruz-roja" src="${LOGO_CRUZ_ROJA}" alt="Cruz Roja" width="401" height="104" />
      <img class="logo logo--calida" src="${LOGO_CALIDA}" alt="CaliDa" width="640" height="167" />
    </header>
  `;
}
