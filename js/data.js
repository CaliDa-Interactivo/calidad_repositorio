// ============================================================
// data.js — datos semilla de CaliDa.
// Este módulo NO toca localStorage: solo exporta constantes.
// store.js es el único responsable de leer/escribir datos.
// ============================================================

// Categorías y subcategorías de insumos (definidas con el equipo).
// Los productos 3D de cada una están en ilustraciones.js.
export const CATEGORIAS = [
  {
    id: 'alimento',
    nombre: 'Alimento',
    subcategorias: [
      { id: 'alimento-agua', nombre: 'Agua' },
      { id: 'alimento-no-perecederos', nombre: 'No perecederos' },
      { id: 'alimento-bebe', nombre: 'Comida de bebé' },
    ],
  },
  {
    id: 'aseo',
    nombre: 'Aseo',
    subcategorias: [
      { id: 'aseo-corporal', nombre: 'Higiene corporal' },
      { id: 'aseo-bucal', nombre: 'Higiene bucal' },
      { id: 'aseo-limpieza-hogar', nombre: 'Limpieza del hogar' },
    ],
  },
  {
    id: 'ropa',
    nombre: 'Ropa',
    subcategorias: [
      { id: 'ropa-hombre', nombre: 'Ropa de hombre' },
      { id: 'ropa-mujer', nombre: 'Ropa de mujer' },
      { id: 'ropa-ninos', nombre: 'Ropa de niños' },
    ],
  },
  {
    id: 'medicamentos',
    nombre: 'Medicamentos',
    subcategorias: [
      { id: 'medicamentos-analgesicos', nombre: 'Analgésicos y fiebre' },
      { id: 'medicamentos-antibioticos', nombre: 'Antibióticos' },
      { id: 'medicamentos-cronicos', nombre: 'Crónicos (control)' },
    ],
  },
  {
    id: 'construccion',
    nombre: 'Construcción',
    subcategorias: [
      { id: 'construccion-herramientas', nombre: 'Herramientas' },
      { id: 'construccion-materiales', nombre: 'Material de construcción' },
      { id: 'construccion-proteccion', nombre: 'Protección personal' },
    ],
  },
];

// Lista plana de ids de subcategoría, usada para inicializar
// el estado de insumos de cada centro con un valor por defecto.
export const SUBCATEGORIA_IDS = CATEGORIAS.flatMap((categoria) =>
  categoria.subcategorias.map((sub) => sub.id)
);

export function obtenerCategoria(categoriaId) {
  return CATEGORIAS.find((categoria) => categoria.id === categoriaId) ?? null;
}

export function obtenerSubcategoria(subcategoriaId) {
  for (const categoria of CATEGORIAS) {
    const sub = categoria.subcategorias.find((s) => s.id === subcategoriaId);
    if (sub) return sub;
  }
  return null;
}

// Categoría "dueña" de una subcategoría, usada para armar el
// botón "Atrás" (D4 → D3) y el indicador "Categoría › Subcategoría".
export function obtenerCategoriaPorSubcategoria(subcategoriaId) {
  return (
    CATEGORIAS.find((categoria) =>
      categoria.subcategorias.some((sub) => sub.id === subcategoriaId)
    ) ?? null
  );
}

export const ZONAS = ['Norte', 'Sur', 'Oriente', 'Occidente', 'Centro'];

// Construye el mapa de insumos de un centro: todas las
// subcategorías en "abastecido" salvo las que se indiquen
// explícitamente en `excepciones`.
// --- Cantidad de cada insumo: de 0 a 5 ----------------------------
// 0 = urgente (vacío) · 1–2 = desabastecido · 3–4 = medio · 5 = abastecido.
// En la estantería se ve como 0 a 5 productos sobre la repisa.
export const NIVEL_MAX = 5;

export function estadoDeNivel(nivel) {
  if (nivel <= 0) return 'urgente';
  if (nivel <= 2) return 'desabastecido';
  if (nivel <= 4) return 'medio';
  return 'abastecido';
}

export const ETIQUETA_ESTADO = {
  urgente: 'Urgente',
  desabastecido: 'Se necesita',
  medio: 'Alcanza por ahora',
  abastecido: 'Abastecido',
};

// El mapa del donante muestra los centros con 2 o menos.
export const NIVEL_MAXIMO_QUE_NECESITA = 2;

// Las excepciones de la semilla usan palabras; se traducen a cantidades.
const NIVEL_SEMILLA = { urgente: 0, desabastecido: 1, abastecido: 5 };

function crearInsumos(excepciones = {}) {
  const insumos = {};
  SUBCATEGORIA_IDS.forEach((id, i) => {
    const valor = excepciones[id];
    // Sin excepción: 3, 4 o 5 (variedad para la demo, siempre igual).
    insumos[id] = valor === undefined ? [5, 4, 5, 3][i % 4] : (NIVEL_SEMILLA[valor] ?? valor);
  });
  return insumos;
}

// Centros de acopio semilla: 4 reales (ubicaciones conocidas de
// Cali, confirmadas con el usuario) + 6 de ejemplo para cubrir
// el mínimo de 2 centros por zona. Los de ejemplo están marcados
// explícitamente y deben reemplazarse por datos reales cuando
// se tengan.
export const CENTROS_SEMILLA = [
  {
    id: 'centro-jairo-varela',
    nombre: 'Plazoleta Jairo Varela',
    zona: 'Sur',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 5:00 p.m.',
    telefono: '300 123 4567',
    lat: 3.4280,
    lng: -76.5380,
    insumos: crearInsumos({
      'alimento-agua': 'urgente',
      'alimento-no-perecederos': 'desabastecido',
      'aseo-limpieza-hogar': 'desabastecido',
      'medicamentos-analgesicos': 'urgente',
    }),
  },
  {
    id: 'centro-petronio',
    nombre: 'Ciudadela Petronio Álvarez',
    zona: 'Oriente',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '7:00 a.m. – 6:00 p.m.',
    telefono: '300 234 5678',
    lat: 3.4420,
    lng: -76.4900,
    insumos: crearInsumos({
      'alimento-bebe': 'urgente',
      'medicamentos-cronicos': 'urgente',
      'ropa-ninos': 'desabastecido',
      'construccion-proteccion': 'desabastecido',
    }),
  },
  {
    id: 'centro-unicentro',
    nombre: 'Unicentro Cali',
    zona: 'Sur',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '9:00 a.m. – 7:00 p.m.',
    telefono: '300 345 6789',
    lat: 3.3980,
    lng: -76.5460,
    insumos: crearInsumos({
      'ropa-hombre': 'desabastecido',
      'aseo-bucal': 'desabastecido',
      'construccion-herramientas': 'urgente',
    }),
  },
  {
    id: 'centro-licorera',
    nombre: 'Industria Licorera del Valle (La Licorera)',
    zona: 'Occidente',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 4:00 p.m.',
    telefono: '300 456 7890',
    lat: 3.4550,
    lng: -76.5550,
    insumos: crearInsumos({
      'alimento-agua': 'desabastecido',
      'medicamentos-antibioticos': 'urgente',
      'construccion-materiales': 'desabastecido',
    }),
  },
  // --- Centros de ejemplo (placeholder), reemplazar con datos reales ---
  {
    id: 'centro-norte-1',
    nombre: 'Centro de Acopio Norte 1 (ejemplo)',
    zona: 'Norte',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 5:00 p.m.',
    telefono: '300 000 0001',
    lat: 3.4850,
    lng: -76.5220,
    insumos: crearInsumos({
      'alimento-agua': 'urgente',
      'aseo-corporal': 'desabastecido',
    }),
  },
  {
    id: 'centro-norte-2',
    nombre: 'Centro de Acopio Norte 2 (ejemplo)',
    zona: 'Norte',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 5:00 p.m.',
    telefono: '300 000 0002',
    lat: 3.4790,
    lng: -76.5150,
    insumos: crearInsumos({
      'ropa-ninos': 'urgente',
      'medicamentos-analgesicos': 'desabastecido',
    }),
  },
  {
    id: 'centro-centro-1',
    nombre: 'Centro de Acopio Centro 1 (ejemplo)',
    zona: 'Centro',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 5:00 p.m.',
    telefono: '300 000 0003',
    lat: 3.4516,
    lng: -76.5320,
    insumos: crearInsumos({
      'alimento-no-perecederos': 'urgente',
      'construccion-proteccion': 'urgente',
    }),
  },
  {
    id: 'centro-centro-2',
    nombre: 'Centro de Acopio Centro 2 (ejemplo)',
    zona: 'Centro',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 5:00 p.m.',
    telefono: '300 000 0004',
    lat: 3.4470,
    lng: -76.5280,
    insumos: crearInsumos({
      'aseo-limpieza-hogar': 'desabastecido',
    }),
  },
  {
    id: 'centro-oriente-2',
    nombre: 'Centro de Acopio Oriente 2 (ejemplo)',
    zona: 'Oriente',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 5:00 p.m.',
    telefono: '300 000 0005',
    lat: 3.4380,
    lng: -76.4950,
    insumos: crearInsumos({
      'alimento-agua': 'desabastecido',
      'ropa-mujer': 'urgente',
    }),
  },
  {
    id: 'centro-occidente-2',
    nombre: 'Centro de Acopio Occidente 2 (ejemplo)',
    zona: 'Occidente',
    foto: 'assets/icons/centro-placeholder.svg',
    horario: '8:00 a.m. – 5:00 p.m.',
    telefono: '300 000 0006',
    lat: 3.4600,
    lng: -76.5600,
    insumos: crearInsumos({
      'medicamentos-cronicos': 'desabastecido',
      'construccion-herramientas': 'desabastecido',
    }),
  },
];

// Las cuentas de administrador viven en auth.js (sin contraseñas en texto plano).

// --- Municipios del Valle del Cauca (destino de los lotes) ----------
// Coordenadas aproximadas de la cabecera municipal (lat, lng).
export const MUNICIPIOS_VALLE = [
  { nombre: 'Alcalá', lat: 4.675, lng: -75.782 },
  { nombre: 'Andalucía', lat: 4.17, lng: -76.168 },
  { nombre: 'Ansermanuevo', lat: 4.797, lng: -75.995 },
  { nombre: 'Argelia', lat: 4.727, lng: -76.12 },
  { nombre: 'Bolívar', lat: 4.338, lng: -76.185 },
  { nombre: 'Buenaventura', lat: 3.883, lng: -77.031 },
  { nombre: 'Bugalagrande', lat: 4.209, lng: -76.157 },
  { nombre: 'Caicedonia', lat: 4.333, lng: -75.828 },
  { nombre: 'Calima (El Darién)', lat: 3.931, lng: -76.484 },
  { nombre: 'Candelaria', lat: 3.408, lng: -76.348 },
  { nombre: 'Cartago', lat: 4.746, lng: -75.912 },
  { nombre: 'Dagua', lat: 3.657, lng: -76.689 },
  { nombre: 'El Águila', lat: 4.909, lng: -76.042 },
  { nombre: 'El Cairo', lat: 4.762, lng: -76.222 },
  { nombre: 'El Cerrito', lat: 3.685, lng: -76.313 },
  { nombre: 'El Dovio', lat: 4.508, lng: -76.236 },
  { nombre: 'Florida', lat: 3.323, lng: -76.235 },
  { nombre: 'Ginebra', lat: 3.725, lng: -76.267 },
  { nombre: 'Guacarí', lat: 3.763, lng: -76.333 },
  { nombre: 'Guadalajara de Buga', lat: 3.901, lng: -76.297 },
  { nombre: 'Jamundí', lat: 3.262, lng: -76.539 },
  { nombre: 'La Cumbre', lat: 3.649, lng: -76.57 },
  { nombre: 'La Unión', lat: 4.533, lng: -76.103 },
  { nombre: 'La Victoria', lat: 4.523, lng: -76.036 },
  { nombre: 'Obando', lat: 4.576, lng: -75.974 },
  { nombre: 'Palmira', lat: 3.539, lng: -76.303 },
  { nombre: 'Pradera', lat: 3.42, lng: -76.244 },
  { nombre: 'Restrepo', lat: 3.822, lng: -76.524 },
  { nombre: 'Riofrío', lat: 4.157, lng: -76.288 },
  { nombre: 'Roldanillo', lat: 4.413, lng: -76.155 },
  { nombre: 'San Pedro', lat: 3.995, lng: -76.229 },
  { nombre: 'Santiago de Cali', lat: 3.452, lng: -76.532 },
  { nombre: 'Sevilla', lat: 4.268, lng: -75.932 },
  { nombre: 'Toro', lat: 4.607, lng: -76.077 },
  { nombre: 'Trujillo', lat: 4.211, lng: -76.319 },
  { nombre: 'Tuluá', lat: 4.084, lng: -76.196 },
  { nombre: 'Ulloa', lat: 4.704, lng: -75.737 },
  { nombre: 'Versalles', lat: 4.575, lng: -76.198 },
  { nombre: 'Vijes', lat: 3.698, lng: -76.442 },
  { nombre: 'Yotoco', lat: 3.861, lng: -76.383 },
  { nombre: 'Yumbo', lat: 3.585, lng: -76.495 },
  { nombre: 'Zarzal', lat: 4.395, lng: -76.072 },
];

export function obtenerMunicipio(nombre) {
  return MUNICIPIOS_VALLE.find((m) => m.nombre === nombre) ?? null;
}
