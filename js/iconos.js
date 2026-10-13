// ============================================================
// iconos.js — íconos "de primera aproximación" tomados de la web
// (Twemoji, vía jsDelivr) para tener algo ilustrado y a color
// mientras no exista el set de íconos definitivo del diseño.
// Reemplazar por los íconos/ilustraciones propias del proyecto
// cuando estén listas (assets/icons).
// ============================================================

const BASE_TWEMOJI = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/';

export function urlEmoji(codigoUnicode) {
  return `${BASE_TWEMOJI}${codigoUnicode}.svg`;
}

export const EMOJI_GATO = '1f431'; // cara de gato

export const EMOJI_CATEGORIA = {
  alimento: '1f34e', // manzana roja
  aseo: '1f9fc', // jabón
  ropa: '1f455', // camiseta
  medicamentos: '1f48a', // pastilla
  construccion: '1f9f1', // ladrillo
};

export const EMOJI_SUBCATEGORIA = {
  'alimento-agua': '1f4a7',
  'alimento-no-perecederos': '1f96b',
  'alimento-bebe': '1f37c',
  'aseo-bucal': '1f9b7',
  'aseo-corporal': '1f9fc',
  'aseo-limpieza-hogar': '1f9f9',
  'ropa-hombre': '1f454',
  'ropa-mujer': '1f457',
  'ropa-ninos': '1f9f8',
  'medicamentos-analgesicos': '1f48a',
  'medicamentos-antibioticos': '1f489',
  'medicamentos-cronicos': '1fa7a',
  'construccion-herramientas': '1f528',
  'construccion-materiales': '1f9f1',
  'construccion-proteccion': '1f9ba',
};

export const EMOJI_CENTRO = '1f3e0'; // casita, placeholder de foto del centro
