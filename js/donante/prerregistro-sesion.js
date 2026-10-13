// ============================================================
// prerregistro-sesion.js — recuerda, en esta pestaña, qué
// pre-registro hizo el donante para cada centro + subcategoría,
// para que la ficha muestre "Cómo llegar" al volver.
// ============================================================

import { getPrerregistro } from '../store.js';

const clave = (centroId, subcategoriaId) => `calida_pre:${centroId}:${subcategoriaId}`;

export function recordarPrerregistro(prerregistro) {
  try {
    sessionStorage.setItem(clave(prerregistro.centroId, prerregistro.subcategoriaId), prerregistro.id);
  } catch {
    /* sin almacenamiento */
  }
}

// Devuelve el pre-registro vigente de esta pestaña, o null.
export function prerregistroVigente(centroId, subcategoriaId) {
  let id = null;
  try {
    id = sessionStorage.getItem(clave(centroId, subcategoriaId));
  } catch {
    return null;
  }
  const pre = id ? getPrerregistro(id) : null;
  if (!pre || new Date(pre.vence).getTime() <= Date.now()) return null;
  return pre;
}

export function horaVencimiento(pre) {
  const v = new Date(pre.vence);
  const hora = v.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  const fecha = v.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${fecha}, ${hora}`;
}
