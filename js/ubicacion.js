// ============================================================
// ubicacion.js — ubicación del usuario (Geolocation API).
//
// Se pide SOLO cuando la persona toca un botón ("Usar mi ubicación"
// en el mapa o "Compartir mi ubicación" en el pre-registro): el
// navegador muestra su propio permiso. Si la niega o el navegador no
// la permite, todo sigue funcionando sin ella.
//
// La última ubicación se recuerda solo durante la sesión de la pestaña
// (sessionStorage), no se guarda de forma permanente.
// ============================================================

const CLAVE = 'calida_ubicacion';

export function ubicacionGuardada() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}

/**
 * Pide la ubicación al navegador.
 * @returns {Promise<{lat:number,lng:number,precision:number}>}
 *   Rechaza con un Error cuyo mensaje se puede mostrar a la persona.
 */
export function obtenerUbicacion() {
  return new Promise((resolver, rechazar) => {
    if (!('geolocation' in navigator)) {
      rechazar(new Error('Tu navegador no permite compartir la ubicación.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const ubicacion = {
          lat: Number(posicion.coords.latitude.toFixed(5)),
          lng: Number(posicion.coords.longitude.toFixed(5)),
          precision: Math.round(posicion.coords.accuracy),
        };
        try {
          sessionStorage.setItem(CLAVE, JSON.stringify(ubicacion));
        } catch {
          /* sin almacenamiento: no pasa nada */
        }
        resolver(ubicacion);
      },
      (error) => {
        const mensajes = {
          1: 'No diste permiso para usar tu ubicación. Puedes activarlo en la configuración del navegador.',
          2: 'No pudimos saber dónde estás. Revisa que el GPS esté encendido.',
          3: 'Tardamos demasiado buscando tu ubicación. Inténtalo de nuevo.',
        };
        rechazar(new Error(mensajes[error.code] ?? 'No pudimos acceder a tu ubicación.'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

// Distancia en línea recta (km) entre dos puntos {lat, lng}.
export function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatoKm(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
