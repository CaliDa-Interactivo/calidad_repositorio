// ============================================================
// email.js — correo automático al donante (Fase 5).
//
// El correo NO lo escribe ni lo envía el administrador: se genera
// solo cuando registra el despacho de la semana, con lo que el
// sistema ya guardó al registrar cada donación.
//
// Contenido: fecha en que la persona donó, número de lote (= semana
// del año del despacho), cuántas personas más donaron en ese lote,
// y el gato.
//
// Como no hay servidor, el envío está SIMULADO: enviarCorreo()
// guarda cada correo en una bandeja de prueba (#/correos-enviados).
// Para enviarlos de verdad, solo hay que cambiar enviarCorreo()
// (ver instrucciones de EmailJS al final); nada más del proyecto
// depende de cómo se envía.
// ============================================================

import { guardarCorreoEnviado, getCentro } from './store.js';
import { MUNICIPIOS_VALLE, obtenerMunicipio } from './data.js';
import { distanciaKm, formatoKm } from './ubicacion.js';
import { IMAGEN_GATO } from './gato.js';
import { LOGO_CALIDA } from './encabezado.js';

// Imagen del gato en el correo. En un correo real debe ser una URL
// pública (los clientes de correo no leen archivos locales): cuando
// tengan la ilustración final, súbanla a un hosting y pongan aquí
// su dirección, por ejemplo 'https://su-sitio.com/assets/gato.png'.
// Misma ilustración del gato de la página (ver gato.js).
const URL_GATO_CORREO = IMAGEN_GATO;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// '06/10/2026' → '6 de octubre de 2026'
export function fechaLarga(ddmmaaaa) {
  const [dia, mes, anio] = ddmmaaaa.split('/').map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

// Une varias fechas en orden. Si son del mismo mes: "6 y 8 de octubre
// de 2026"; si no: "30 de septiembre de 2026 y 2 de octubre de 2026".
function unirFechas(fechas) {
  const aOrdenable = (f) => f.split('/').reverse().join('');
  const unicas = [...new Set(fechas)].sort((a, b) => aOrdenable(a).localeCompare(aOrdenable(b)));
  const unir = (lista) => (lista.length === 1 ? lista[0] : `${lista.slice(0, -1).join(', ')} y ${lista.at(-1)}`);

  const mismoMes = unicas.every((f) => f.slice(3) === unicas[0].slice(3));
  if (unicas.length > 1 && mismoMes) {
    const dias = unicas.map((f) => String(Number(f.slice(0, 2))));
    return `${unir(dias)}${fechaLarga(unicas[0]).replace(/^\d+/, '')}`;
  }
  return unir(unicas.map(fechaLarga));
}

// --- Mapa del trayecto (Valle del Cauca) --------------------------------
// SVG dibujado aquí mismo: el contorno sale de los municipios del Valle,
// con el punto de partida (ubicación del donante o, si no la compartió,
// su centro de acopio) y el municipio de destino del lote.
//
// ⚠️ Varios clientes de correo (Gmail, Outlook) no muestran SVG. Para el
// envío real, cambiar este SVG por una imagen de mapa estático (p. ej.
// Google Static Maps o Mapbox Static con "path" entre origen y destino),
// generada en el servidor con la clave del servicio. El enlace "Ver el
// trayecto en Google Maps" sí funciona en cualquier correo.

const CAJA = { latN: 4.98, latS: 3.18, lngO: -77.15, lngE: -75.62 };
const MAPA_ANCHO = 320;
const MAPA_ALTO = Math.round(
  MAPA_ANCHO * ((CAJA.latN - CAJA.latS) / ((CAJA.lngE - CAJA.lngO) * Math.cos((4 * Math.PI) / 180)))
);

function aMapa({ lat, lng }) {
  return {
    x: ((lng - CAJA.lngO) / (CAJA.lngE - CAJA.lngO)) * MAPA_ANCHO,
    y: ((CAJA.latN - lat) / (CAJA.latN - CAJA.latS)) * MAPA_ALTO,
  };
}

// Envolvente convexa (contorno simplificado del Valle).
function envolvente(puntos) {
  const p = [...puntos].sort((a, b) => a.x - b.x || a.y - b.y);
  const cruz = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const abajo = [];
  for (const q of p) {
    while (abajo.length >= 2 && cruz(abajo.at(-2), abajo.at(-1), q) <= 0) abajo.pop();
    abajo.push(q);
  }
  const arriba = [];
  for (const q of [...p].reverse()) {
    while (arriba.length >= 2 && cruz(arriba.at(-2), arriba.at(-1), q) <= 0) arriba.pop();
    arriba.push(q);
  }
  return [...abajo.slice(0, -1), ...arriba.slice(0, -1)];
}

const CONTORNO_VALLE = (() => {
  const pts = MUNICIPIOS_VALLE.map(aMapa);
  const c = { x: pts.reduce((s, q) => s + q.x, 0) / pts.length, y: pts.reduce((s, q) => s + q.y, 0) / pts.length };
  // Se agranda un poco desde el centro para que los puntos no queden en el borde.
  return envolvente(pts).map((q) => ({ x: c.x + (q.x - c.x) * 1.12, y: c.y + (q.y - c.y) * 1.08 }));
})();

export function mapaTrayectoSVG({ origen, etiquetaOrigen, destino }) {
  const o = aMapa(origen);
  const d = aMapa(destino);
  const contorno = CONTORNO_VALLE.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ') + 'Z';
  const puntos = MUNICIPIOS_VALLE.map((m) => {
    const q = aMapa(m);
    return `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="2.2" fill="#8C8279"/>`;
  }).join('');
  // Curva suave entre origen y destino (se arquea hacia un lado).
  const mx = (o.x + d.x) / 2 - (d.y - o.y) * 0.25;
  const my = (o.y + d.y) / 2 + (d.x - o.x) * 0.25;
  const textoAncla = d.x > MAPA_ANCHO * 0.65 ? 'end' : 'start';
  const dxTexto = textoAncla === 'end' ? -10 : 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 ${MAPA_ANCHO + 20} ${MAPA_ALTO + 20}" width="100%" style="display:block;max-width:300px;margin:0 auto;" role="img" aria-label="Mapa del trayecto desde ${etiquetaOrigen} hasta ${destino.nombre}">
    <rect x="-10" y="-10" width="${MAPA_ANCHO + 20}" height="${MAPA_ALTO + 20}" rx="16" fill="#D9ECF4"/>
    <text x="4" y="${MAPA_ALTO * 0.62}" font-family="Arial,sans-serif" font-size="10" fill="#426D8C" transform="rotate(-90 4 ${MAPA_ALTO * 0.62})" text-anchor="middle">Océano Pacífico</text>
    <path d="${contorno}" fill="#CFE3DC" stroke="#86B5A9" stroke-width="10" stroke-linejoin="round"/>
    <path d="${contorno}" fill="#CFE3DC"/>
    <text x="${MAPA_ANCHO * 0.62}" y="${MAPA_ALTO * 0.97}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#3E7A6C" text-anchor="middle">VALLE DEL CAUCA</text>
    ${puntos}
    <path d="M${o.x.toFixed(1)} ${o.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${d.x.toFixed(1)} ${d.y.toFixed(1)}" fill="none" stroke="#CC0100" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="7 6"/>
    <circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="8" fill="#426D8C" stroke="#fff" stroke-width="3"/>
    <path d="M${d.x.toFixed(1)} ${(d.y - 2).toFixed(1)} c-7 -9 -10 -13 -10 -18 a10 10 0 0 1 20 0 c0 5 -3 9 -10 18z" fill="#CC0100" stroke="#fff" stroke-width="2"/>
    <circle cx="${d.x.toFixed(1)}" cy="${(d.y - 21).toFixed(1)}" r="3.5" fill="#fff"/>
    <text x="${(d.x + dxTexto).toFixed(1)}" y="${(d.y - 26).toFixed(1)}" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#011E41" text-anchor="${textoAncla}" stroke="#fff" stroke-width="3" paint-order="stroke">${destino.nombre}</text>
    <text x="${(o.x + (o.x > MAPA_ANCHO * 0.6 ? -12 : 12)).toFixed(1)}" y="${(o.y + 18).toFixed(1)}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#426D8C" text-anchor="${o.x > MAPA_ANCHO * 0.6 ? 'end' : 'start'}" stroke="#fff" stroke-width="3" paint-order="stroke">${etiquetaOrigen}</text>
  </svg>`;
}

// --- Plantilla HTML del correo ---------------------------------------
// Tablas y estilos en línea: es lo único que respetan todos los
// clientes de correo (Gmail, Outlook, celular).

export function plantillaCorreo({ fechas, numeroLote, otrasPersonas, destino, origen, etiquetaOrigen }) {
  const variasDonaciones = new Set(fechas).size > 1;
  const textoDonacion = variasDonaciones
    ? `Tus donaciones del <strong>${unirFechas(fechas)}</strong> han sido entregadas.`
    : `Tu donación del <strong>${unirFechas(fechas)}</strong> ha sido entregada.`;

  const textoLote =
    otrasPersonas > 0
      ? `Tu ayuda salió en el <strong>Lote #${numeroLote}</strong> rumbo a <strong>${destino.nombre}</strong>, junto con la de otras <strong>${otrasPersonas} ${otrasPersonas === 1 ? 'persona' : 'personas'}</strong>.`
      : `Tu ayuda salió en el <strong>Lote #${numeroLote}</strong> rumbo a <strong>${destino.nombre}</strong>.`;

  const km = formatoKm(distanciaKm(origen, destino));
  const urlRuta = `https://www.google.com/maps/dir/?api=1&origin=${origen.lat},${origen.lng}&destination=${destino.lat},${destino.lng}`;
  const bloqueMapa = `
        <tr>
          <td align="center" style="padding:22px 28px 0;">
            <p style="margin:0 0 10px;font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:800;color:#011E41;">El trayecto de tu ayuda</p>
            ${mapaTrayectoSVG({ origen, etiquetaOrigen, destino })}
            <p style="margin:10px 0 0;font-size:13px;color:#514B46;">De <strong>${etiquetaOrigen}</strong> a <strong>${destino.nombre}</strong> · ≈ ${km} en línea recta</p>
            <p style="margin:8px 0 0;"><a href="${urlRuta}" style="color:#426D8C;font-weight:700;font-size:14px;">Ver el trayecto en Google Maps</a></p>
          </td>
        </tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF8ED;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8ED;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:520px;background:#FFFFFF;border-radius:24px;overflow:hidden;
                    font-family:Montserrat,Arial,Helvetica,sans-serif;color:#514B46;
                    box-shadow:0 6px 16px rgba(58,42,20,0.12);">
        <tr>
          <td align="center" style="background:#FFFFFF;padding:20px 24px 14px;border-bottom:4px solid #F67751;">
            <img src="${LOGO_CALIDA}" alt="CaliDa" width="150" height="39" style="display:block;width:150px;height:auto;border:0;">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 28px 8px;">
            <img src="${URL_GATO_CORREO}" alt="Gato de CaliDa" width="96" height="121"
                 style="display:block;width:96px;height:121px;border:0;">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 28px 0;">
            <h1 style="margin:0;font-family:Montserrat,Arial,sans-serif;font-size:28px;font-weight:800;color:#011E41;">¡Gracias!</h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 32px 0;font-size:17px;line-height:1.5;">
            ${textoDonacion}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 28px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0"
                   style="background:#FDD794;border-radius:16px;">
              <tr><td align="center" style="padding:12px 22px;">
                <span style="display:block;font-size:12px;font-weight:700;letter-spacing:1px;color:#011E41;">NÚMERO DE LOTE</span>
                <span style="display:block;font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#011E41;">#${numeroLote}</span>
                <span style="display:block;margin-top:4px;font-size:13px;font-weight:700;color:#011E41;">Destino: ${destino.nombre}</span>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:18px 32px 0;font-size:16px;line-height:1.5;color:#514B46;">
            ${textoLote}
          </td>
        </tr>
        ${bloqueMapa}
        <tr>
          <td align="center" style="padding:24px 32px 28px;font-size:15px;line-height:1.5;">
            Gracias por ayudar donde más hacía falta.
          </td>
        </tr>
        <tr>
          <td align="center" style="background:#011E41;padding:14px 24px;color:#FFFFFF;font-size:14px;font-weight:700;">
            CaliDa · Cruz Roja
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// --- Envío (simulado) ---------------------------------------------------

export function enviarCorreo({ destinatario, asunto, html, loteId, numeroLote }) {
  // Versión de prueba: se guarda en la bandeja #/correos-enviados.
  return guardarCorreoEnviado({ destinatario, asunto, html, loteId, numeroLote });

  /* Envío real con EmailJS (https://www.emailjs.com), sin servidor:
     1. Crear cuenta, un "Email Service" y un "Email Template" cuyo
        cuerpo sea solo {{{html}}} (tres llaves: no escapa el HTML) y
        cuyo asunto sea {{asunto}} y destinatario {{destinatario}}.
     2. Cargar en index.html:
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js"></script>
        <script>emailjs.init({ publicKey: 'SU_PUBLIC_KEY' });</script>
     3. Reemplazar el return de arriba por:
        return window.emailjs
          .send('SU_SERVICE_ID', 'SU_TEMPLATE_ID', { destinatario, asunto, html })
          .then(() => guardarCorreoEnviado({ destinatario, asunto, html, loteId, numeroLote }));
  */
}

// --- Correos de un despacho -----------------------------------------------
// Un correo por persona (cédula + correo). Si alguien donó dos veces en
// la misma semana, recibe un solo correo con ambas fechas.

export function generarCorreosDespacho({ despacho, donaciones }) {
  const centro = getCentro(despacho.centroId);
  const destino = obtenerMunicipio(despacho.destino) ?? obtenerMunicipio('Santiago de Cali');

  const porPersona = new Map();
  for (const donacion of donaciones) {
    const clave = `${donacion.cedula}|${donacion.correo}`;
    if (!porPersona.has(clave)) porPersona.set(clave, { correo: donacion.correo, fechas: [], ubicacion: null });
    const persona = porPersona.get(clave);
    persona.fechas.push(donacion.fecha);
    // Ubicación que compartió en su pre-registro (si lo hizo).
    if (!persona.ubicacion && donacion.ubicacion) persona.ubicacion = donacion.ubicacion;
  }

  const totalPersonas = porPersona.size;
  return [...porPersona.values()].map(({ correo, fechas, ubicacion }) => {
    // Punto de partida: la ubicación del donante o, si no la compartió, su centro de acopio.
    const origen = ubicacion ?? { lat: centro.lat, lng: centro.lng };
    const etiquetaOrigen = ubicacion ? 'Tu ubicación' : centro.nombre;
    return enviarCorreo({
      destinatario: correo,
      asunto:
        new Set(fechas).size > 1
          ? `¡Gracias! Tus donaciones ya fueron entregadas · Lote #${despacho.numeroLote}`
          : `¡Gracias! Tu donación ya fue entregada · Lote #${despacho.numeroLote}`,
      html: plantillaCorreo({
        fechas,
        numeroLote: despacho.numeroLote,
        otrasPersonas: totalPersonas - 1,
        destino,
        origen,
        etiquetaOrigen,
      }),
      loteId: despacho.id,
      numeroLote: despacho.numeroLote,
    });
  });
}
