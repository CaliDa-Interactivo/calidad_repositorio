// ============================================================
// mapa3d.js — mapa ilustrado de Cali en three.js (D4).
// Solo dibuja y anima: no lee el store ni conoce el router.
// La vista donante/mapa.js le pasa los centros y recibe los
// eventos (clic en un centro, cambio de zona) por callbacks.
//
// Interacción principal (causa → efecto):
//   1. Todos los centros aparecen en gris sobre el mapa.
//   2. El mapa "reacciona" a la subcategoría elegida: los centros
//      que la necesitan se colorean y crecen; los demás se hunden.
//   3. Tocar una zona (o su botón) enfoca la cámara en ella y
//      atenúa las otras. Tocarla de nuevo vuelve a toda Cali.
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Paleta del mapa (derivada de la paleta CaliDa) -----------------

const COLORES = {
  // Mismos colores del mapa oficial de zonas de Cali.
  zonas: {
    Norte: '#FBAFA7',
    Occidente: '#C2DAF6',
    Centro: '#C0A7F8',
    Oriente: '#95CEAD',
    Sur: '#FCD8B4',
  },
  zonaAtenuada: '#ECE6DC',
  base: '#F3E9D8',
  rio: '#8CCBE0',
  montana: ['#8DBFA9', '#74A894', '#A3CDB9'],
  arbol: '#5E9E86',
  tronco: '#A7835C',
  pared: '#FFF8EE',
  puerta: '#7A5A3C',
  // Estados de la paleta oficial: "se necesita" verde bosque, urgente carmín.
  techoNeutro: '#D9D0C1',
  techoDesabastecido: '#3E7A6C',
  techoUrgente: '#CC0100',
};

// --- Geografía de Cali -----------------------------------------------
// Contornos de las 5 zonas trazados sobre el mapa oficial de zonas de
// Cali (imagen de referencia del equipo, 4024 × 5212 px). El "Centro
// histórico y comercial" y el "Centro geográfico" se unieron en una
// sola zona: Centro. Coordenadas en píxeles de esa imagen.

const POLIGONOS_PX = {
  Norte: [
    2967,230, 2893,232, 2858,323, 2826,327, 2813,417, 2523,543, 2544,550, 2544,591, 2506,598, 2498,624, 2457,624, 2155,522,
    2108,479, 2107,461, 2033,437, 2000,442, 2002,638, 1977,643, 1963,675, 1923,675, 1921,631, 1867,615, 1845,565, 1819,581,
    1815,686, 1890,773, 1940,805, 1940,846, 1924,857, 1973,885, 1974,942, 1945,1010, 1897,1038, 1916,1120, 1880,1150, 1872,1206,
    1790,1351, 1762,1450, 1740,1455, 1695,1577, 1693,1627, 1672,1652, 1740,1658, 1826,1600, 1893,1579, 1936,1521, 2160,1415, 2202,1416,
    2243,1562, 2277,1585, 2323,1536, 3374,1204, 3357,1175, 3359,1070, 3293,987, 3279,901, 3222,840, 3159,624, 3159,572, 3183,569,
    3171,516, 3122,448, 2970,367,
  ],
  Occidente: [
    379,1243, 362,1276, 443,1352, 444,1385, 486,1405, 533,1472, 515,1571, 524,1591, 589,1587, 635,1625, 669,1689, 802,1690,
    825,1705, 894,1694, 927,1712, 1041,1691, 1056,1724, 1082,1709, 1243,1694, 1244,1747, 1209,1755, 1205,1776, 1235,1780, 1241,1802,
    1261,1806, 1298,1878, 1375,1940, 1423,1959, 1421,2008, 1373,2009, 1358,2032, 1297,2059, 1321,2063, 1321,2103, 1292,2173, 1296,2238,
    1249,2241, 1208,2329, 1179,2332, 1176,2346, 1111,2335, 1054,2364, 1041,2387, 1018,2388, 1009,2409, 987,2410, 999,2497, 980,2518,
    996,2569, 1055,2591, 1058,2659, 1008,2668, 1023,2712, 1016,2772, 1037,2795, 1071,2798, 1099,2730, 1204,2711, 1220,2741, 1218,2804,
    1255,2818, 1222,3107, 1173,3104, 1126,3122, 1130,3228, 1098,3242, 1098,3274, 1076,3282, 1104,3334, 1127,3347, 1127,3447, 1152,3468,
    1152,3509, 1130,3530, 1134,3554, 1159,3570, 1159,3611, 1130,3620, 1123,3748, 1155,3782, 1186,3783, 1187,3820, 1218,3839, 1318,3835,
    1404,3865, 1455,3767, 1584,3733, 1559,3715, 1559,3675, 1628,3629, 1577,3409, 1523,3063, 1473,2476, 1542,2281, 1602,2165, 1778,1929,
    1783,1776, 1746,1659, 1678,1657, 1677,1636, 1655,1623, 1666,1575, 1654,1529, 1587,1532, 1550,1500, 1495,1492, 1419,1408, 1362,1395,
    1357,1412, 1315,1412, 1312,1381, 1268,1381, 1229,1332, 1145,1330, 1128,1394, 1055,1486, 1011,1496, 1010,1514, 967,1514, 958,1499,
    953,1514, 835,1512, 827,1463, 769,1464, 747,1417, 685,1429, 669,1415, 595,1466, 555,1466, 545,1422, 498,1395, 472,1343,
    442,1326,
  ],
  Centro: [
    3151,1277, 2322,1538, 2291,1579, 2251,1579, 2193,1399, 1937,1522, 1895,1578, 1805,1612, 1746,1656, 1783,1767, 1780,1928, 1619,2138,
    1545,2276, 1474,2472, 1478,2619, 1479,2595, 1520,2595, 1655,2696, 2086,2836, 2153,2843, 2154,2865, 2160,2834, 2766,2255, 3183,1455,
    3187,1389,
  ],
  Oriente: [
    3402,1198, 3153,1277, 3189,1391, 3184,1457, 2767,2256, 2151,2844, 2162,2894, 2238,2995, 2362,3110, 2455,3232, 2480,3292, 2525,3279,
    2617,3194, 2771,2925, 2913,2820, 2979,2740, 3172,2635, 3190,2596, 3235,2597, 3269,2630, 3281,2770, 3363,2832, 3348,2906, 3405,3001,
    3448,2961, 3574,2966, 3597,2987, 3575,2884, 3630,2803, 3602,2725, 3603,2680, 3645,2584, 3707,2536, 3718,2419, 3758,2281, 3717,2085,
    3698,2054, 3552,1929, 3440,1940, 3374,1858, 3388,1750, 3381,1586, 3341,1374, 3424,1262,
  ],
  Sur: [
    1475,2582, 1522,2928, 1525,3064, 1623,3637, 1589,3644, 1558,3676, 1556,3745, 1481,3742, 1456,3765, 1621,3972, 1622,4015, 1578,4055,
    1575,4125, 1513,4163, 1514,4216, 1461,4291, 1387,4500, 1428,4598, 1429,4670, 1399,4730, 1422,4768, 1882,4735, 1879,4867, 1828,5018,
    1926,5011, 1969,5041, 2149,5069, 2148,5142, 2406,5122, 2404,4953, 2723,4953, 2731,4166, 2716,3991, 2589,3604, 2589,3543, 2627,3502,
    2508,3377, 2453,3231, 2344,3089, 2229,2985, 2162,2896, 2149,2844, 2086,2838, 1653,2697, 1546,2608,
  ],
};

// Punto donde va el nombre de cada zona (y adonde viaja la cámara).
const ETIQUETAS_PX = {Norte: [2673, 931], Centro: [2220, 2148], Oriente: [3222, 2220], Occidente: [1229, 2482], Sur: [2124, 4201]};

// Puestos de respaldo para las casitas: si las coordenadas de un centro
// no caen bien dentro de su zona en este mapa esquemático, se usa el
// siguiente puesto libre de su zona (bien adentro y separados entre sí).
const PUESTOS_PX = {
  Norte: [[2432, 1150], [2992, 1030], [2192, 790], [2952, 590], [1992, 1310], [2722, 830]],
  Occidente: [[1482, 1763], [1362, 3403], [1442, 2173], [1382, 3073], [1232, 1543]],
  Centro: [[2634, 1797], [2074, 2437], [2074, 1877], [2514, 2237], [2954, 1517], [1634, 2477]],
  Oriente: [[2911, 2478], [3431, 2438], [2511, 2878], [3191, 1918], [3501, 2098], [3261, 1588]],
  Sur: [[2387, 4622], [2387, 4022], [2227, 3622], [1987, 3262], [1947, 3942], [1867, 4382]],
};

// Píxeles de la imagen → plano del mapa 3D (x hacia el oriente, z hacia el sur).
const PX_CENTRO = { x: 2060, y: 2686 };
const PX_ESCALA = 15.5 / 4912; // la ciudad mide ~15.5 unidades de norte a sur

function pxAPlano([px, py]) {
  return { x: (px - PX_CENTRO.x) * PX_ESCALA, z: (py - PX_CENTRO.y) * PX_ESCALA };
}

function aPares(lista) {
  const pares = [];
  for (let i = 0; i < lista.length; i += 2) pares.push([lista[i], lista[i + 1]]);
  return pares;
}

const ZONAS_PLANO = Object.fromEntries(
  Object.entries(POLIGONOS_PX).map(([zona, lista]) => [zona, aPares(lista).map(pxAPlano)])
);

// Georreferencia aproximada de la imagen: lat/lng → píxel.
// Extremos del área urbana: norte 3.497, sur 3.335, oeste -76.577, este -76.462.
const GEO = { latN: 3.497, latS: 3.335, lngO: -76.577, lngE: -76.462, x0: 362, y0: 230, x1: 3758, y1: 5142 };

function proyectar([lng, lat]) {
  const px = GEO.x0 + ((lng - GEO.lngO) / (GEO.lngE - GEO.lngO)) * (GEO.x1 - GEO.x0);
  const py = GEO.y0 + ((GEO.latN - lat) / (GEO.latN - GEO.latS)) * (GEO.y1 - GEO.y0);
  return pxAPlano([px, py]);
}

// Río Cauca: bordea el oriente de la ciudad (fuera de las zonas).
const RIO_PX = [
  [3200, 120], [3290, 520], [3420, 900], [3540, 1200], [3580, 1500], [3740, 1800],
  [3920, 2000], [3980, 2300], [3950, 2650], [3870, 2950], [3760, 3250], [3840, 3650],
  [3900, 4100], [3850, 4600], [3900, 5200],
];

// --- Medidas de la escena -------------------------------------------

const ALTO_ZONA = 0.5;
const BISEL = 0.1;
const Y_SUPERFICIE = ALTO_ZONA + 2 * BISEL; // donde se apoyan las casitas

const CAMARA_GENERAL = {
  objetivo: new THREE.Vector3(0, 0, 0.6),
  desplazamiento: new THREE.Vector3(0, 15.5, 13),
};
const DESPLAZAMIENTO_ENFOQUE = new THREE.Vector3(0, 8.5, 7.2);
const LIMITE_PAN = { x: 6.5, z: 8.5 };

// --- Utilidades geométricas -------------------------------------------

function puntoEnPoligono(x, z, puntos) {
  let dentro = false;
  for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
    const a = puntos[i];
    const b = puntos[j];
    const cruza = a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

// Distancia de un punto al borde del polígono (para dejar margen).
function distanciaAlBorde(x, z, puntos) {
  let minimo = Infinity;
  for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
    const a = puntos[j];
    const b = puntos[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    minimo = Math.min(minimo, Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz)));
  }
  return minimo;
}

function dentroConMargen(x, z, puntos, margen) {
  return puntoEnPoligono(x, z, puntos) && distanciaAlBorde(x, z, puntos) > margen;
}

// Aleatorio con semilla: los árboles quedan siempre en el mismo sitio.
function crearAleatorio(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Factor de suavizado independiente de los FPS.
function suavizar(velocidad, dt) {
  return 1 - Math.exp(-velocidad * dt);
}

// ======================================================================
// API pública
// ======================================================================

/**
 * Monta el mapa 3D dentro de `lienzo`.
 * @param {object} opciones
 * @param {HTMLElement} opciones.lienzo        contenedor del <canvas>
 * @param {HTMLElement} opciones.capaEtiquetas capa HTML para nombres de zonas
 * @param {HTMLElement} opciones.tooltip       globo con el nombre del centro
 * @param {Array} opciones.centros             todos los centros (store)
 * @param {Object} opciones.necesidades        { centroId: 'urgente'|'desabastecido' }
 * @param {string|null} opciones.zonaInicial
 * @param {boolean} opciones.movimientoReducido
 * @param {Function} opciones.alClicCentro     (centroId) => void
 * @param {Function} opciones.alCambiarZona    (zona|null) => void
 * @param {Function} opciones.alTerminarFiltro () => void
 * @param {Function} opciones.alResaltarCentro (centroId|null) => void
 */
export function montarMapa3D(opciones) {
  const {
    lienzo,
    capaEtiquetas,
    tooltip,
    centros,
    necesidades,
    zonaInicial = null,
    movimientoReducido = false,
    alClicCentro = () => {},
    alCambiarZona = () => {},
    alTerminarFiltro = () => {},
    alResaltarCentro = () => {},
  } = opciones;

  const desechables = []; // geometrías y materiales a liberar en destruir()
  const registrar = (obj) => (desechables.push(obj), obj);

  // --- Renderizador, escena, cámara ------------------------------------

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  lienzo.appendChild(renderer.domElement);
  renderer.domElement.classList.add('mapa3d__canvas');

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  camara.position.copy(CAMARA_GENERAL.objetivo).add(CAMARA_GENERAL.desplazamiento);

  escena.add(new THREE.HemisphereLight('#FFF6E8', '#C9B79C', 1.6));
  const sol = new THREE.DirectionalLight('#FFFFFF', 2.2);
  sol.position.set(-8, 18, 10);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  sol.shadow.camera.updateProjectionMatrix();
  escena.add(sol);

  // --- Controles: pan con un dedo / clic izquierdo, zoom con rueda o pellizco
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.target.copy(CAMARA_GENERAL.objetivo);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.screenSpacePanning = false; // el pan se desliza sobre el suelo
  controles.minDistance = 6;
  controles.maxDistance = 40;
  controles.minPolarAngle = 0.45;
  controles.maxPolarAngle = 1.05;
  controles.minAzimuthAngle = -0.6;
  controles.maxAzimuthAngle = 0.6;
  controles.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controles.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controles.update();

  // Mantiene el mapa dentro de la pantalla mientras se arrastra.
  const limitarPan = () => {
    const t = controles.target;
    const corregido = new THREE.Vector3(
      THREE.MathUtils.clamp(t.x, -LIMITE_PAN.x, LIMITE_PAN.x),
      t.y,
      THREE.MathUtils.clamp(t.z, -LIMITE_PAN.z, LIMITE_PAN.z)
    );
    const delta = corregido.sub(t);
    if (delta.lengthSq() > 0) {
      t.add(delta);
      camara.position.add(delta);
    }
  };
  controles.addEventListener('change', limitarPan);

  // --- Base, río y montañas (decoración) ---------------------------------

  const formaBase = new THREE.Shape();
  {
    const [x0, x1, z0, z1, r] = [-7.8, 6.9, -9.0, 9.0, 1.6];
    formaBase.moveTo(x0 + r, z0);
    formaBase.lineTo(x1 - r, z0);
    formaBase.quadraticCurveTo(x1, z0, x1, z0 + r);
    formaBase.lineTo(x1, z1 - r);
    formaBase.quadraticCurveTo(x1, z1, x1 - r, z1);
    formaBase.lineTo(x0 + r, z1);
    formaBase.quadraticCurveTo(x0, z1, x0, z1 - r);
    formaBase.lineTo(x0, z0 + r);
    formaBase.quadraticCurveTo(x0, z0, x0 + r, z0);
  }
  const base = new THREE.Mesh(
    registrar(new THREE.ExtrudeGeometry(formaBase, { depth: 0.4, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.15, bevelSegments: 4 })),
    registrar(new THREE.MeshStandardMaterial({ color: COLORES.base, roughness: 0.95 }))
  );
  // La forma se dibuja en (x, z) y se acuesta sobre el suelo.
  base.rotation.x = Math.PI / 2;
  base.position.y = -0.17; // su cara superior queda justo bajo el suelo (y ≈ 0)
  base.receiveShadow = true;
  escena.add(base);

  // Río Cauca, bordeando el oriente de la ciudad.
  const curvaRio = new THREE.CatmullRomCurve3(
    RIO_PX.map(pxAPlano).map((p) => new THREE.Vector3(p.x, 0, THREE.MathUtils.clamp(p.z, -8.9, 8.9)))
  );
  const rio = new THREE.Mesh(
    registrar(new THREE.TubeGeometry(curvaRio, 120, 0.22, 8, false)),
    registrar(new THREE.MeshStandardMaterial({ color: COLORES.rio, roughness: 0.4 }))
  );
  rio.scale.y = 0.2;
  rio.position.y = 0.02;
  escena.add(rio);

  // Farallones: montañas al occidente.
  const aleatorio = crearAleatorio(20261009);
  const materialesMontana = COLORES.montana.map((c) =>
    registrar(new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }))
  );
  // Se reparten al occidente, sin pisar ninguna zona.
  const todasLasZonas = Object.values(ZONAS_PLANO);
  let montanas = 0;
  for (let intento = 0; intento < 400 && montanas < 14; intento++) {
    const x = -7.2 + aleatorio() * 5.2;
    const z = -8.2 + aleatorio() * 13;
    const alto = 1 + aleatorio() * 1.5;
    const radio = 0.7 + aleatorio() * 0.6;
    const libre = todasLasZonas.every(
      (pts) => !puntoEnPoligono(x, z, pts) && distanciaAlBorde(x, z, pts) > radio + 0.15
    );
    if (!libre) continue;
    const montana = new THREE.Mesh(
      registrar(new THREE.ConeGeometry(radio, alto, 6)),
      materialesMontana[montanas % materialesMontana.length]
    );
    montana.position.set(x, alto / 2, z);
    montana.rotation.y = aleatorio() * Math.PI;
    montana.castShadow = true;
    escena.add(montana);
    montanas++;
  }

  // --- Zonas -------------------------------------------------------------

  const zonas = new Map(); // nombre → { malla, material, puntos, centro, etiqueta, ... }

  for (const [nombre, puntos] of Object.entries(ZONAS_PLANO)) {
    const forma = new THREE.Shape(puntos.map((p) => new THREE.Vector2(p.x, p.z)));
    const geometria = registrar(
      new THREE.ExtrudeGeometry(forma, {
        depth: ALTO_ZONA,
        bevelEnabled: true,
        bevelThickness: BISEL,
        bevelSize: 0.05,
        bevelOffset: -0.08, // hunde el borde: deja una ranura entre zonas
        bevelSegments: 3,
      })
    );
    // Shape en (x, z) → acostada: la extrusión apunta hacia arriba (+y).
    geometria.rotateX(Math.PI / 2);
    geometria.translate(0, ALTO_ZONA + BISEL, 0); // queda entre y = 0 y y = Y_SUPERFICIE

    const colorBase = new THREE.Color(COLORES.zonas[nombre]);
    const material = registrar(new THREE.MeshStandardMaterial({ color: colorBase.clone(), roughness: 0.85 }));
    const malla = new THREE.Mesh(geometria, material);
    malla.position.y = 0;
    malla.castShadow = true;
    malla.receiveShadow = true;
    malla.userData.zona = nombre;
    escena.add(malla);

    const etiqueta = document.createElement('span');
    etiqueta.className = 'mapa3d__etiqueta-zona';
    etiqueta.textContent = nombre;
    capaEtiquetas.appendChild(etiqueta);

    zonas.set(nombre, {
      malla,
      material,
      colorBase,
      puntos,
      centro: pxAPlano(ETIQUETAS_PX[nombre]),
      etiqueta,
      yObjetivo: 0,
      colorObjetivo: colorBase.clone(),
      hover: false,
    });
  }

  // Árboles decorativos dentro de cada zona (lejos de las casitas).
  const usadosPorZona = {};
  const posicionesCentros = centros.map((c) => ubicarCentro(c, usadosPorZona));
  // Separa casitas demasiado cercanas para que no se encimen.
  for (let pasada = 0; pasada < 4; pasada++) {
    for (let i = 0; i < posicionesCentros.length; i++) {
      for (let j = i + 1; j < posicionesCentros.length; j++) {
        const a = posicionesCentros[i];
        const b = posicionesCentros[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d = Math.hypot(dx, dz) || 0.01;
        if (d < 0.85) {
          const empuje = (0.85 - d) / 2;
          a.x -= (dx / d) * empuje;
          a.z -= (dz / d) * empuje;
          b.x += (dx / d) * empuje;
          b.z += (dz / d) * empuje;
        }
      }
    }
  }
  const geoCopa = registrar(new THREE.ConeGeometry(0.22, 0.55, 7));
  const geoTronco = registrar(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 6));
  const matCopa = registrar(new THREE.MeshStandardMaterial({ color: COLORES.arbol, roughness: 0.9, flatShading: true }));
  const matTronco = registrar(new THREE.MeshStandardMaterial({ color: COLORES.tronco, roughness: 0.9 }));

  for (const [nombre, zona] of zonas) {
    const xs = zona.puntos.map((p) => p.x);
    const zs = zona.puntos.map((p) => p.z);
    let colocados = 0;
    for (let intento = 0; intento < 120 && colocados < 6; intento++) {
      const x = Math.min(...xs) + aleatorio() * (Math.max(...xs) - Math.min(...xs));
      const z = Math.min(...zs) + aleatorio() * (Math.max(...zs) - Math.min(...zs));
      if (!dentroConMargen(x, z, zona.puntos, 0.35)) continue;
      const cercaDeCasa = posicionesCentros.some((p) => Math.hypot(p.x - x, p.z - z) < 0.9);
      const cercaDeEtiqueta = Math.hypot(zona.centro.x - x, zona.centro.z - z) < 0.9;
      if (cercaDeCasa || cercaDeEtiqueta) continue;

      const arbol = new THREE.Group();
      const tronco = new THREE.Mesh(geoTronco, matTronco);
      tronco.position.y = 0.09;
      const copa = new THREE.Mesh(geoCopa, matCopa);
      copa.position.y = 0.42;
      copa.castShadow = true;
      arbol.add(tronco, copa);
      arbol.position.set(x, Y_SUPERFICIE, z);
      arbol.scale.setScalar(0.8 + aleatorio() * 0.5);
      zona.malla.add(arbol); // se mueve junto con su zona
      arbol.position.y = Y_SUPERFICIE - zona.malla.position.y;
      colocados++;
    }
  }

  // Ubica un centro sobre el mapa con sus coordenadas reales. Si en este
  // mapa esquemático no caen bien adentro de su zona, toma el siguiente
  // puesto libre de la zona (PUESTOS_PX).
  function ubicarCentro(centro, usados) {
    const zona = ZONAS_PLANO[centro.zona] ? centro.zona : 'Centro';
    const p = proyectar([centro.lng, centro.lat]);
    if (dentroConMargen(p.x, p.z, ZONAS_PLANO[zona], 0.4)) return p;
    const puestos = PUESTOS_PX[zona];
    const i = usados[zona] ?? 0;
    usados[zona] = i + 1;
    if (i < puestos.length) return pxAPlano(puestos[i]);
    // Más centros que puestos: alrededor del nombre de la zona.
    const base = pxAPlano(ETIQUETAS_PX[zona]);
    const angulo = i * 2.4;
    return { x: base.x + Math.cos(angulo) * 0.6, z: base.z + 0.5 + Math.sin(angulo) * 0.6 };
  }

  // --- Casitas (centros de acopio) -----------------------------------------

  const geoPared = registrar(new THREE.BoxGeometry(0.5, 0.4, 0.5));
  const geoTecho = registrar(new THREE.ConeGeometry(0.46, 0.36, 4));
  const geoPuerta = registrar(new THREE.BoxGeometry(0.14, 0.2, 0.02));
  const geoAnillo = registrar(new THREE.RingGeometry(0.42, 0.56, 40));
  const matPared = registrar(new THREE.MeshStandardMaterial({ color: COLORES.pared, roughness: 0.8 }));
  const matPuerta = registrar(new THREE.MeshStandardMaterial({ color: COLORES.puerta, roughness: 0.8 }));

  const casas = centros.map((centro, i) => {
    const estado = necesidades[centro.id] ?? null;
    const grupo = new THREE.Group();

    const pared = new THREE.Mesh(geoPared, matPared);
    pared.position.y = 0.2;
    pared.castShadow = true;

    const matTecho = registrar(new THREE.MeshStandardMaterial({ color: COLORES.techoNeutro, roughness: 0.7 }));
    const techo = new THREE.Mesh(geoTecho, matTecho);
    techo.position.y = 0.58;
    techo.rotation.y = Math.PI / 4;
    techo.castShadow = true;

    const puerta = new THREE.Mesh(geoPuerta, matPuerta);
    puerta.position.set(0, 0.1, 0.26);

    // Anillo que late bajo los centros urgentes.
    const matAnillo = registrar(
      new THREE.MeshBasicMaterial({ color: COLORES.techoUrgente, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    const anillo = new THREE.Mesh(geoAnillo, matAnillo);
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.y = 0.02;

    grupo.add(pared, techo, puerta, anillo);
    const p = posicionesCentros[i];
    grupo.position.set(p.x, Y_SUPERFICIE, p.z);
    grupo.scale.setScalar(movimientoReducido ? 1 : 0.001);
    grupo.userData.centroId = centro.id;
    escena.add(grupo);

    return {
      centro,
      estado,
      grupo,
      matTecho,
      matAnillo,
      anillo,
      escalaObjetivo: 1,
      elevacion: 0,
      elevacionObjetivo: 0,
      colorObjetivo: new THREE.Color(COLORES.techoNeutro),
      retrasoEntrada: movimientoReducido ? 0 : 0.05 * i,
    };
  });

  // --- Estado de la interacción ------------------------------------------

  let fase = 'entrada'; // entrada → filtrado
  let zonaSeleccionada = null;
  let centroResaltado = null;
  let zonaHover = null;
  let animacionCamara = null; // { objetivo, posicion }
  let tiempo = 0;

  const colorAtenuado = new THREE.Color(COLORES.zonaAtenuada);

  function aplicarObjetivos() {
    for (const [nombre, zona] of zonas) {
      const activa = !zonaSeleccionada || zonaSeleccionada === nombre;
      zona.colorObjetivo.copy(activa ? zona.colorBase : colorAtenuado);
      if (zona.hover && activa) zona.colorObjetivo.copy(zona.colorBase).offsetHSL(0, 0.05, 0.05);
      zona.yObjetivo = zonaSeleccionada === nombre ? 0.12 : zona.hover ? 0.06 : 0;
    }

    for (const casa of casas) {
      const necesita = fase === 'filtrado' && casa.estado;
      const enZonaActiva = !zonaSeleccionada || zonaSeleccionada === casa.centro.zona;

      if (fase === 'entrada') {
        casa.escalaObjetivo = 1;
        casa.colorObjetivo.set(COLORES.techoNeutro);
      } else if (!necesita) {
        casa.escalaObjetivo = 0; // se hunde: no necesita esta subcategoría
      } else {
        const base = casa.estado === 'urgente' ? 1.3 : 1.05;
        casa.escalaObjetivo = enZonaActiva ? base : base * 0.7;
        casa.colorObjetivo.set(casa.estado === 'urgente' ? COLORES.techoUrgente : COLORES.techoDesabastecido);
        if (!enZonaActiva) casa.colorObjetivo.lerp(colorAtenuado, 0.65);
      }
      casa.elevacionObjetivo = centroResaltado === casa.centro.id ? 0.35 : 0;
    }
  }

  function enfocarCamara(zona) {
    const objetivo = zona
      ? new THREE.Vector3(zonas.get(zona).centro.x, 0, zonas.get(zona).centro.z)
      : CAMARA_GENERAL.objetivo.clone();
    const posicion = objetivo.clone().add(zona ? desplazamientoEnfoque() : desplazamientoGeneral());
    if (movimientoReducido) {
      controles.target.copy(objetivo);
      camara.position.copy(posicion);
      controles.update();
    } else {
      animacionCamara = { objetivo, posicion };
    }
  }

  function seleccionarZona(zona) {
    const nueva = zona && zona === zonaSeleccionada ? null : zona;
    zonaSeleccionada = nueva;
    aplicarObjetivos();
    enfocarCamara(nueva);
    alCambiarZona(nueva);
  }

  function resaltarCentro(id) {
    if (centroResaltado === id) return;
    centroResaltado = id;
    aplicarObjetivos();
    alResaltarCentro(id);
  }

  function acercar(factor) {
    animacionCamara = null;
    const offset = camara.position.clone().sub(controles.target);
    const distancia = THREE.MathUtils.clamp(offset.length() * factor, controles.minDistance, controles.maxDistance);
    offset.setLength(distancia);
    camara.position.copy(controles.target).add(offset);
    controles.update();
  }

  // Si la persona toma el control, se cancela el viaje automático de cámara.
  controles.addEventListener('start', () => {
    animacionCamara = null;
  });

  // --- Puntero: hover y clic (distinguiendo clic de arrastre) -------------

  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let inicioToque = null;

  function objetoBajoPuntero(evento) {
    const rect = renderer.domElement.getBoundingClientRect();
    puntero.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
    puntero.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(puntero, camara);

    if (fase === 'filtrado') {
      const visibles = casas.filter((c) => c.estado).map((c) => c.grupo);
      const golpeCasa = raycaster.intersectObjects(visibles, true)[0];
      if (golpeCasa) {
        let obj = golpeCasa.object;
        while (obj && !obj.userData.centroId) obj = obj.parent;
        if (obj) return { tipo: 'centro', id: obj.userData.centroId };
      }
    }
    const mallasZona = [...zonas.values()].map((z) => z.malla);
    const golpeZona = raycaster.intersectObjects(mallasZona, true)[0];
    if (golpeZona) {
      let obj = golpeZona.object;
      while (obj && !obj.userData.zona) obj = obj.parent;
      if (obj) return { tipo: 'zona', id: obj.userData.zona };
    }
    return null;
  }

  function alMoverPuntero(evento) {
    if (evento.pointerType === 'touch') return; // en táctil no hay hover
    const golpe = objetoBajoPuntero(evento);
    const nuevaZonaHover = golpe?.tipo === 'zona' ? golpe.id : null;
    if (nuevaZonaHover !== zonaHover) {
      if (zonaHover) zonas.get(zonaHover).hover = false;
      if (nuevaZonaHover) zonas.get(nuevaZonaHover).hover = true;
      zonaHover = nuevaZonaHover;
    }
    resaltarCentro(golpe?.tipo === 'centro' ? golpe.id : null);
    aplicarObjetivos();
    renderer.domElement.style.cursor = golpe ? 'pointer' : 'grab';
  }

  function alSalirPuntero() {
    if (zonaHover) zonas.get(zonaHover).hover = false;
    zonaHover = null;
    resaltarCentro(null);
    aplicarObjetivos();
  }

  function alPresionar(evento) {
    inicioToque = { x: evento.clientX, y: evento.clientY, t: performance.now() };
  }

  function alSoltar(evento) {
    if (!inicioToque) return;
    const movimiento = Math.hypot(evento.clientX - inicioToque.x, evento.clientY - inicioToque.y);
    const duracion = performance.now() - inicioToque.t;
    inicioToque = null;
    if (movimiento > 8 || duracion > 600) return; // fue un arrastre, no un clic

    const golpe = objetoBajoPuntero(evento);
    if (golpe?.tipo === 'centro') {
      if (evento.pointerType === 'touch' && centroResaltado !== golpe.id) {
        // Primer toque en táctil: muestra el nombre; el segundo abre la ficha.
        resaltarCentro(golpe.id);
        return;
      }
      alClicCentro(golpe.id);
    } else if (golpe?.tipo === 'zona') {
      seleccionarZona(golpe.id);
    }
  }

  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', alMoverPuntero);
  canvas.addEventListener('pointerleave', alSalirPuntero);
  canvas.addEventListener('pointerdown', alPresionar);
  canvas.addEventListener('pointerup', alSoltar);

  // --- Tamaño responsive --------------------------------------------------

  function ajustarTamano() {
    const { clientWidth: ancho, clientHeight: alto } = lienzo;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  }

  // En pantallas angostas (celular vertical) la cámara se aleja
  // para que toda Cali quepa a lo ancho.
  function factorDistancia() {
    return THREE.MathUtils.clamp(1.25 / camara.aspect, 1, 1.85);
  }
  function desplazamientoGeneral() {
    return CAMARA_GENERAL.desplazamiento.clone().multiplyScalar(factorDistancia());
  }
  function desplazamientoEnfoque() {
    return DESPLAZAMIENTO_ENFOQUE.clone().multiplyScalar(Math.min(factorDistancia(), 1.4));
  }
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(lienzo);
  ajustarTamano();

  // --- Etiquetas HTML proyectadas sobre el 3D ------------------------------

  const vector = new THREE.Vector3();
  function proyectarAPantalla(x, y, z) {
    vector.set(x, y, z).project(camara);
    return {
      x: (vector.x * 0.5 + 0.5) * lienzo.clientWidth,
      y: (-vector.y * 0.5 + 0.5) * lienzo.clientHeight,
      visible: vector.z < 1,
    };
  }

  // --- "Tú estás aquí": pin con la ubicación del usuario ---------------
  let pinUsuario = null;
  const etiquetaUsuario = document.createElement('span');
  etiquetaUsuario.className = 'mapa3d__etiqueta-zona mapa3d__etiqueta-tu';
  etiquetaUsuario.textContent = 'Tú';
  etiquetaUsuario.hidden = true;
  capaEtiquetas.appendChild(etiquetaUsuario);

  function marcarUsuario({ lat, lng }) {
    const p = proyectar([lng, lat]);
    // Fuera del mapa (otra ciudad): no se dibuja.
    if (Math.abs(p.x) > 7 || Math.abs(p.z) > 8.6) {
      if (pinUsuario) pinUsuario.visible = false;
      etiquetaUsuario.hidden = true;
      return false;
    }
    if (!pinUsuario) {
      pinUsuario = new THREE.Group();
      const matPin = registrar(new THREE.MeshStandardMaterial({ color: '#426D8C', roughness: 0.5 }));
      const cabeza = new THREE.Mesh(registrar(new THREE.SphereGeometry(0.28, 24, 16)), matPin);
      cabeza.position.y = 1.05;
      const punta = new THREE.Mesh(registrar(new THREE.ConeGeometry(0.2, 0.7, 20)), matPin);
      punta.rotation.x = Math.PI;
      punta.position.y = 0.62;
      const centro = new THREE.Mesh(
        registrar(new THREE.SphereGeometry(0.11, 16, 12)),
        registrar(new THREE.MeshBasicMaterial({ color: '#FFFFFF' }))
      );
      centro.position.set(0, 1.08, 0.2);
      pinUsuario.add(cabeza, punta, centro);
      pinUsuario.traverse((o) => (o.castShadow = true));
      escena.add(pinUsuario);
    }
    pinUsuario.visible = true;
    pinUsuario.position.set(p.x, Y_SUPERFICIE, p.z);
    return true;
  }

  function actualizarEtiquetas() {
    if (pinUsuario?.visible) {
      const pu = proyectarAPantalla(pinUsuario.position.x, pinUsuario.position.y + 1.6, pinUsuario.position.z);
      etiquetaUsuario.hidden = !pu.visible;
      etiquetaUsuario.style.transform = `translate(-50%, -50%) translate(${pu.x}px, ${pu.y}px)`;
    }
    for (const [nombre, zona] of zonas) {
      const p = proyectarAPantalla(zona.centro.x, Y_SUPERFICIE + 0.3 + zona.malla.position.y, zona.centro.z);
      zona.etiqueta.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
      zona.etiqueta.classList.toggle('mapa3d__etiqueta-zona--activa', zonaSeleccionada === nombre);
      zona.etiqueta.classList.toggle(
        'mapa3d__etiqueta-zona--atenuada',
        Boolean(zonaSeleccionada) && zonaSeleccionada !== nombre
      );
      zona.etiqueta.hidden = !p.visible;
    }

    const casa = casas.find((c) => c.centro.id === centroResaltado);
    if (casa && casa.estado && fase === 'filtrado') {
      const g = casa.grupo;
      const p = proyectarAPantalla(g.position.x, g.position.y + 0.95 * g.scale.y, g.position.z);
      tooltip.hidden = false;
      tooltip.textContent = casa.centro.nombre;
      tooltip.style.transform = `translate(-50%, -100%) translate(${p.x}px, ${p.y}px)`;
    } else {
      tooltip.hidden = true;
    }
  }

  // --- Bucle de animación ----------------------------------------------------

  const reloj = new THREE.Clock();
  let idFrame = 0;
  let filtroAnunciado = false;

  function animar() {
    idFrame = requestAnimationFrame(animar);
    const dt = Math.min(reloj.getDelta(), 0.05);
    tiempo += dt;

    // Cambio de fase: el mapa "reacciona" a la subcategoría elegida.
    if (fase === 'entrada' && (movimientoReducido || tiempo > 1.1)) {
      fase = 'filtrado';
      aplicarObjetivos();
    }
    if (fase === 'filtrado' && !filtroAnunciado && (movimientoReducido || tiempo > 1.6)) {
      filtroAnunciado = true;
      alTerminarFiltro();
    }

    const k = movimientoReducido ? 1 : suavizar(9, dt);

    for (const zona of zonas.values()) {
      zona.malla.position.y += (zona.yObjetivo - zona.malla.position.y) * k;
      zona.material.color.lerp(zona.colorObjetivo, k);
    }

    for (const casa of casas) {
      if (tiempo < casa.retrasoEntrada) continue;
      const kCasa = movimientoReducido ? 1 : suavizar(casa.escalaObjetivo > casa.grupo.scale.x ? 10 : 7, dt);
      const escala = casa.grupo.scale.x + (casa.escalaObjetivo - casa.grupo.scale.x) * kCasa;
      casa.grupo.scale.setScalar(Math.max(escala, 0.001));
      casa.grupo.visible = escala > 0.01;
      casa.elevacion += (casa.elevacionObjetivo - casa.elevacion) * k;

      const zona = zonas.get(casa.centro.zona);
      const yZona = zona ? zona.malla.position.y : 0;
      casa.grupo.position.y = Y_SUPERFICIE + yZona + casa.elevacion;
      casa.matTecho.color.lerp(casa.colorObjetivo, k);

      // Anillo que late en los urgentes (fijo con movimiento reducido).
      const urgenteVisible = fase === 'filtrado' && casa.estado === 'urgente';
      if (urgenteVisible) {
        if (movimientoReducido) {
          casa.anillo.scale.setScalar(1.2);
          casa.matAnillo.opacity = 0.35;
        } else {
          const ciclo = ((tiempo + casa.retrasoEntrada) % 1.5) / 1.5;
          casa.anillo.scale.setScalar(1 + ciclo * 1.3);
          casa.matAnillo.opacity = 0.55 * (1 - ciclo);
        }
      } else {
        casa.matAnillo.opacity = 0;
      }
    }

    if (animacionCamara) {
      const kc = suavizar(4, dt);
      controles.target.lerp(animacionCamara.objetivo, kc);
      camara.position.lerp(animacionCamara.posicion, kc);
      if (camara.position.distanceTo(animacionCamara.posicion) < 0.02) animacionCamara = null;
    }

    controles.update();
    actualizarEtiquetas();
    renderer.render(escena, camara);
  }

  // Encuadre inicial (ya con el tamaño real del contenedor).
  camara.position.copy(controles.target).add(desplazamientoGeneral());
  if (zonaInicial && zonas.has(zonaInicial)) {
    zonaSeleccionada = zonaInicial;
    const z = zonas.get(zonaInicial).centro;
    controles.target.set(z.x, 0, z.z);
    camara.position.copy(controles.target).add(desplazamientoEnfoque());
  }
  controles.update();
  aplicarObjetivos();
  animar();

  // --- Limpieza (se llama al salir de la pantalla) ---------------------------

  function destruir() {
    cancelAnimationFrame(idFrame);
    observador.disconnect();
    canvas.removeEventListener('pointermove', alMoverPuntero);
    canvas.removeEventListener('pointerleave', alSalirPuntero);
    canvas.removeEventListener('pointerdown', alPresionar);
    canvas.removeEventListener('pointerup', alSoltar);
    controles.dispose();
    desechables.forEach((d) => d.dispose());
    renderer.dispose();
    canvas.remove();
    capaEtiquetas.replaceChildren();
  }

  return {
    seleccionarZona,
    marcarUsuario,
    resaltarCentro,
    acercar,
    restablecerVista: () => seleccionarZona(null),
    getZonaSeleccionada: () => zonaSeleccionada,
    destruir,
  };
}

// Exportado para pruebas: permite verificar que cada centro cae en su zona.
export const _interno = { ZONAS_PLANO, proyectar, puntoEnPoligono };
