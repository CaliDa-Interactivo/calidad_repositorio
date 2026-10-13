// ============================================================
// auth.js — autenticación del administrador (pantalla 3).
//
// Reglas:
//  - NO existe registro público. Las cuentas las crea la Cruz Roja
//    y cada una está ligada a un centro de acopio.
//  - Nunca se guardan contraseñas en texto plano: solo una huella
//    PBKDF2-SHA256 (100 000 iteraciones, sal por cuenta).
//
// ⚠️ PROTOTIPO SIN BACKEND. Esto valida en el navegador contra
// cuentas de prueba. Para conectar la autenticación real, reemplazar
// el cuerpo de login() por una llamada al servidor, por ejemplo:
//
//   const r = await fetch('/api/auth/login', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ correo, contrasena }),
//   });
//   if (!r.ok) return { ok: false };
//   const { centroId } = await r.json();   // el servidor dice a qué centro pertenece
//   iniciarSesion(centroId);
//   return { ok: true, centroId };
//
// y quitar CUENTAS_PRUEBA. El resto de la app no cambia.
// ============================================================

import { iniciarSesion } from './store.js';

// Cuenta de prueba (ver README): correo jairo.varela@calida.co
// La contraseña NO está en el código; solo su huella.
const CUENTAS_PRUEBA = [
  {
    correo: 'jairo.varela@calida.co',
    centroId: 'centro-jairo-varela',
    sal: 'z/mleJpBUHikTaR+lNyb0A==',
    huella: '/YSKzZuRB1bYfF8QQiRUJZ5U0cMX1LWTCFNLcFRE+jA=',
  },
];

const ITERACIONES = 100000;

function base64ABytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesABase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function huellaDe(contrasena, salB64) {
  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64ABytes(salB64), iterations: ITERACIONES },
    clave,
    256
  );
  return bytesABase64(bits);
}

// Compara sin cortar en el primer carácter distinto.
function iguales(a, b) {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

/**
 * Valida correo y contraseña. Si coinciden, inicia la sesión del
 * centro de acopio ligado a la cuenta.
 * @returns {Promise<{ok: boolean, centroId?: string}>}
 */
export async function login(correo, contrasena) {
  const cuenta = CUENTAS_PRUEBA.find((c) => c.correo === correo.trim().toLowerCase());
  // Se calcula la huella aunque el correo no exista, para no revelar
  // por el tiempo de respuesta qué correos tienen cuenta.
  const huella = await huellaDe(contrasena, cuenta?.sal ?? CUENTAS_PRUEBA[0].sal);
  if (!cuenta || !iguales(huella, cuenta.huella)) return { ok: false };

  iniciarSesion(cuenta.centroId);
  return { ok: true, centroId: cuenta.centroId };
}
