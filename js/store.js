// ============================================================
// store.js — única fuente de verdad de CaliDa.
// Es el único módulo que lee/escribe localStorage. Todo lo que
// cambia el administrador pasa por aquí, así que se refleja de
// inmediato en lo que ve el donante (mismo origen, mismo storage).
// ============================================================

import { CENTROS_SEMILLA, NIVEL_MAX, NIVEL_MAXIMO_QUE_NECESITA } from './data.js';

// v3: insumos como cantidad de 0 a 5, pre-registros y destino de lotes.
// Cambiar la clave reinicia los datos de prueba guardados en el navegador.
const CLAVE_ALMACENAMIENTO = 'calida_store_v3';

// Crea el estado inicial a partir de la semilla de data.js.
function crearStoreSemilla() {
  return {
    version: 1,
    centros: CENTROS_SEMILLA,
    donaciones: [],
    prerregistros: [],
    despachos: [],
    correosEnviados: [],
    sesionAdmin: { activa: false, centroId: null },
  };
}

function leerStore() {
  const crudo = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

function guardarStore(store) {
  localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(store));
}

// Crea el store en localStorage si no existe todavía.
// Debe llamarse una vez al arrancar la aplicación (main.js).
export function inicializarStore() {
  if (!leerStore()) {
    guardarStore(crearStoreSemilla());
  }
}

// --- Centros ------------------------------------------------

export function getCentros() {
  return leerStore().centros;
}

export function getCentro(id) {
  return leerStore().centros.find((centro) => centro.id === id) ?? null;
}

// Centros que necesitan la subcategoría (cantidad de 0 a 2):
// lo que muestra el mapa del donante (D4).
export function getCentrosPorSubcategoria(subcategoriaId) {
  return leerStore().centros.filter(
    (centro) => centro.insumos[subcategoriaId] <= NIVEL_MAXIMO_QUE_NECESITA
  );
}

// Cantidad (0 a 5) que el administrador guarda para un insumo.
export function actualizarNivelInsumo(centroId, subcategoriaId, nivel) {
  const store = leerStore();
  const centro = store.centros.find((c) => c.id === centroId);
  if (!centro) return;
  centro.insumos[subcategoriaId] = Math.max(0, Math.min(NIVEL_MAX, Math.round(nivel)));
  guardarStore(store);
}

// --- Pre-registros del donante ------------------------------------
// El donante deja su cédula antes de ir; el pre-registro vale 24 horas
// y se vuelve donación cuando el administrador la registra en el centro.

export const HORAS_VIGENCIA_PRERREGISTRO = 24;

export function crearPrerregistro({ cedula, centroId, subcategoriaId, categoriaId, fecha, ubicacion }) {
  const store = leerStore();
  const ahora = new Date();
  const prerregistro = {
    id: generarId('pre', store.prerregistros),
    cedula,
    centroId,
    subcategoriaId,
    categoriaId,
    fecha,
    ubicacion: ubicacion ?? null, // { lat, lng } si el donante la compartió
    creado: ahora.toISOString(),
    vence: new Date(ahora.getTime() + HORAS_VIGENCIA_PRERREGISTRO * 3600 * 1000).toISOString(),
    estado: 'pendiente',
  };
  store.prerregistros.push(prerregistro);
  guardarStore(store);
  return prerregistro;
}

export function getPrerregistro(id) {
  return leerStore().prerregistros.find((p) => p.id === id) ?? null;
}

// Pre-registros vigentes (no vencidos, no validados) de una cédula en un centro.
export function getPrerregistrosVigentes(centroId, cedula) {
  const ahora = Date.now();
  return leerStore().prerregistros.filter(
    (p) =>
      p.centroId === centroId &&
      p.cedula === cedula &&
      p.estado === 'pendiente' &&
      new Date(p.vence).getTime() > ahora
  );
}

// --- Donaciones -----------------------------------------------

function generarId(prefijo, lista) {
  const siguiente = lista.length + 1;
  return `${prefijo}-${String(siguiente).padStart(4, '0')}`;
}

export function registrarDonacion({ centroId, categoriaId, subcategoriaId = null, fecha, cedula, correo, prerregistroId = null }) {
  const store = leerStore();
  const prerregistro = store.prerregistros.find((p) => p.id === prerregistroId) ?? null;
  const donacion = {
    id: generarId('don', store.donaciones),
    centroId,
    categoriaId,
    subcategoriaId: subcategoriaId ?? prerregistro?.subcategoriaId ?? null,
    fecha,
    cedula,
    correo,
    prerregistroId: prerregistro?.id ?? null,
    // Ubicación que compartió el donante en su pre-registro (para el mapa del correo).
    ubicacion: prerregistro?.ubicacion ?? null,
    estado: 'pendiente',
    loteId: null,
  };
  if (prerregistro) prerregistro.estado = 'validado';
  store.donaciones.push(donacion);
  guardarStore(store);
  return donacion;
}

export function getDonacionesPendientes(centroId) {
  return leerStore().donaciones.filter(
    (donacion) => donacion.centroId === centroId && donacion.estado === 'pendiente'
  );
}

// --- Despachos ------------------------------------------------

// Número de semana ISO 8601 de una fecha DD/MM/AAAA. Se usa
// año + semana para que el número de lote no se repita entre
// años distintos.
function semanaISO(fechaDDMMAAAA) {
  const [dia, mes, anio] = fechaDDMMAAAA.split('/').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  // Lleva la fecha al jueves de su semana (regla ISO 8601).
  const diaSemanaISO = fecha.getUTCDay() || 7;
  fecha.setUTCDate(fecha.getUTCDate() + 4 - diaSemanaISO);
  const inicioAnio = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((fecha - inicioAnio) / 86400000 + 1) / 7);
  return { anio: fecha.getUTCFullYear(), semana };
}

// Registra el despacho de todas las donaciones pendientes de un
// centro, agrupándolas en un lote identificado por año + semana
// ISO de la fecha del despacho. Devuelve el despacho creado con
// las donaciones incluidas (para que admin/despacho.js genere los
// correos; store.js no depende de email.js).
export function registrarDespacho({ centroId, fecha, placa, destino }) {
  const store = leerStore();
  const { anio, semana } = semanaISO(fecha);
  const idLote = `${centroId}-${anio}-S${semana}`;

  const pendientes = store.donaciones.filter(
    (donacion) => donacion.centroId === centroId && donacion.estado === 'pendiente'
  );
  for (const donacion of pendientes) {
    donacion.estado = 'despachada';
    donacion.loteId = idLote;
  }

  const despacho = {
    id: idLote,
    numeroLote: semana,
    centroId,
    fecha,
    placa,
    destino, // municipio del Valle del Cauca
    donacionIds: pendientes.map((donacion) => donacion.id),
  };
  store.despachos.push(despacho);
  guardarStore(store);

  return { despacho, donaciones: pendientes };
}

export function getDespachos(centroId) {
  return leerStore().despachos.filter((despacho) => despacho.centroId === centroId);
}

// --- Sesión de administrador -----------------------------------

// La validación de correo y contraseña vive en auth.js. El store solo
// recuerda qué centro tiene la sesión abierta.
export function iniciarSesion(centroId) {
  const store = leerStore();
  store.sesionAdmin = { activa: true, centroId };
  guardarStore(store);
}

export function logout() {
  const store = leerStore();
  store.sesionAdmin = { activa: false, centroId: null };
  guardarStore(store);
}

export function isLoggedIn() {
  return leerStore().sesionAdmin.activa === true;
}

export function getCentroAdminActual() {
  const { centroId } = leerStore().sesionAdmin;
  return centroId ? getCentro(centroId) : null;
}

// --- Bandeja de correos de prueba (usada por email.js) -----------

export function guardarCorreoEnviado(correo) {
  const store = leerStore();
  const registro = {
    id: generarId('mail', store.correosEnviados),
    ...correo,
    fecha: new Date().toISOString(),
  };
  store.correosEnviados.push(registro);
  guardarStore(store);
  return registro;
}

export function getCorreosEnviados() {
  return leerStore().correosEnviados;
}

// Vacía la bandeja de prueba (solo para reiniciar la demostración).
export function vaciarCorreosEnviados() {
  const store = leerStore();
  store.correosEnviados = [];
  guardarStore(store);
}
