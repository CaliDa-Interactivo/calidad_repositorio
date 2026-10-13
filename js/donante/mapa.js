// ============================================================
// mapa.js — D4 · Mapa de Cali (Fase 3).
// Arma la interfaz alrededor del mapa 3D (indicador, gato,
// botones de zona, lista de resultados) y conecta los eventos.
// El mapa en sí vive en mapa3d.js y se carga de forma diferida:
// si three.js no carga (sin internet o sin WebGL), la lista de
// centros sigue funcionando como respaldo.
// ============================================================

import { obtenerCategoriaPorSubcategoria, obtenerSubcategoria, ZONAS, estadoDeNivel } from '../data.js';
import { obtenerUbicacion, ubicacionGuardada, distanciaKm, formatoKm } from '../ubicacion.js';
import { getCentros, getCentrosPorSubcategoria } from '../store.js';
import { renderGato } from '../gato.js';

// Recuerda la zona elegida por subcategoría, para que al volver
// de la ficha (D5) el mapa siga enfocado donde estaba.
const zonaRecordada = new Map();

const ORDEN_ZONAS = ['Norte', 'Occidente', 'Centro', 'Oriente', 'Sur'].filter((z) =>
  ZONAS.includes(z)
);

function plural(n, singular, pluralTexto) {
  return n === 1 ? singular : pluralTexto;
}

function mensajeGato({ nombreSub, zona, cantidad, total }) {
  if (total === 0) return 'Parece que por ahora no necesitan esto. Probemos otra cosa.';
  if (!zona) return `¡Por aquí! Estos centros necesitan ${nombreSub}.`;
  if (cantidad === 0) {
    return `En la zona ${zona} no necesitan ${nombreSub} por ahora. Prueba otra zona.`;
  }
  return `En la zona ${zona} ${plural(cantidad, 'hay 1 centro que necesita', `hay ${cantidad} centros que necesitan`)} ${nombreSub}.`;
}

export function render({ subcategoriaId }) {
  const subcategoria = obtenerSubcategoria(subcategoriaId);
  const categoria = obtenerCategoriaPorSubcategoria(subcategoriaId);

  if (!subcategoria || !categoria) {
    return `
      <section class="vista">
        <a class="boton-atras" href="#/donante/estanteria">← Volver</a>
        <h1>Subcategoría no encontrada</h1>
      </section>
    `;
  }

  const nombreSub = subcategoria.nombre.toLowerCase();
  // Más urgentes primero (cantidad 0, luego 1, luego 2).
  const necesitan = getCentrosPorSubcategoria(subcategoriaId).sort(
    (a, b) => a.insumos[subcategoriaId] - b.insumos[subcategoriaId]
  );
  const total = necesitan.length;
  const volverAtras = `#/donante/subcategorias/${categoria.id}`;

  const conteoPorZona = Object.fromEntries(
    ORDEN_ZONAS.map((z) => [z, necesitan.filter((c) => c.zona === z).length])
  );

  const botonesZona = [
    `<button type="button" class="chip-zona" data-zona="" aria-pressed="true">
       Toda Cali <span class="chip-zona__conteo">${total}</span>
     </button>`,
    ...ORDEN_ZONAS.map(
      (z) => `
        <button type="button" class="chip-zona" data-zona="${z}" aria-pressed="false">
          ${z} <span class="chip-zona__conteo">${conteoPorZona[z]}</span>
        </button>`
    ),
  ].join('');

  const itemsLista = necesitan
    .map((centro) => {
      const urgente = estadoDeNivel(centro.insumos[subcategoriaId]) === 'urgente';
      return `
        <li data-zona-item="${centro.zona}">
          <button
            type="button"
            class="centro-tarjeta ${urgente ? 'centro-tarjeta--urgente' : 'centro-tarjeta--desabastecido'}"
            data-navegar="#/donante/ficha/${centro.id}/${subcategoriaId}"
            data-centro-id="${centro.id}"
          >
            ${urgente ? '<span class="centro-tarjeta__badge">Urgente</span>' : ''}
            <span class="centro-tarjeta__nombre">${centro.nombre}</span>
            <span class="centro-tarjeta__zona">Zona ${centro.zona}<span class="centro-tarjeta__distancia" data-distancia></span></span>
          </button>
        </li>`;
    })
    .join('');

  return {
    html: `
      <section class="vista vista-mapa3d">
        <h1 class="visually-hidden">Centros que necesitan ${nombreSub}</h1>
        <header class="mapa3d__encabezado">
          <a class="boton-atras" href="${volverAtras}">← Volver</a>
          <p class="mapa__indicador">${categoria.nombre} › ${subcategoria.nombre}</p>
          <a class="boton boton--secundario boton-estanteria" href="#/donante/estanteria">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M4 9h16M4 15h16M12 3v6" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            Ir a la estantería
          </a>
        </header>

        <div class="mapa3d" data-estado="cargando">
          <div
            class="mapa3d__lienzo"
            role="img"
            aria-label="Mapa de Cali con ${total} ${plural(total, 'centro que necesita', 'centros que necesitan')} ${nombreSub}"
          ></div>
          <div class="mapa3d__etiquetas" aria-hidden="true"></div>
          <div class="mapa3d__tooltip" hidden aria-hidden="true"></div>

          <p class="mapa3d__cargando">Dibujando Cali…</p>

          ${
            total
              ? `<ul class="mapa3d__leyenda" aria-label="Leyenda">
                   <li><span class="punto punto--urgente"></span>Urgente</li>
                   <li><span class="punto punto--desabastecido"></span>Lo necesita</li>
                 </ul>`
              : ''
          }

          <div class="mapa3d__controles" aria-label="Controles del mapa">
            <button type="button" class="mapa3d__control" data-accion="acercar" aria-label="Acercar">+</button>
            <button type="button" class="mapa3d__control" data-accion="alejar" aria-label="Alejar">−</button>
            <button type="button" class="mapa3d__control" data-accion="restablecer" aria-label="Ver toda Cali">⟲</button>
          </div>

          <div class="mapa3d__gato" aria-live="polite">
            ${renderGato(`Buscando centros que necesitan ${nombreSub}…`)}
          </div>
        </div>

        ${
          total
            ? `
              <div class="mapa3d__ubicacion">
                <button type="button" class="boton boton--secundario" data-mi-ubicacion>📍 Usar mi ubicación</button>
                <p class="mapa3d__ubicacion-estado" aria-live="polite"></p>
              </div>
              <nav class="mapa3d__zonas" aria-label="Filtrar por zona">${botonesZona}</nav>
              <h2 class="mapa3d__titulo-lista">
                ${plural(total, 'Centro que lo necesita', 'Centros que lo necesitan')}
              </h2>
              <ul class="mapa__lista mapa3d__lista">${itemsLista}</ul>
              <p class="mapa3d__sin-resultados" hidden>No hay centros en esta zona que lo necesiten.</p>
            `
            : `
              <div class="mapa3d__vacio">
                <button class="boton" data-navegar="#/donante/estanteria">Volver a la estantería</button>
              </div>
            `
        }
      </section>
    `,

    init(contenedor) {
      const mapaEl = contenedor.querySelector('.mapa3d');
      const textoGato = contenedor.querySelector('.mapa3d__gato .gato-guia__globo p');
      const chips = [...contenedor.querySelectorAll('.chip-zona')];
      const items = [...contenedor.querySelectorAll('[data-zona-item]')];
      const sinResultados = contenedor.querySelector('.mapa3d__sin-resultados');
      const tarjetas = [...contenedor.querySelectorAll('[data-centro-id]')];
      const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let mapa = null;
      let destruido = false;
      let filtroListo = movimientoReducido;
      let zonaActual = zonaRecordada.get(subcategoriaId) ?? null;

      // Refleja la zona elegida en botones, lista y mensaje del gato.
      function actualizarInterfaz(zona) {
        zonaActual = zona;
        if (zona) zonaRecordada.set(subcategoriaId, zona);
        else zonaRecordada.delete(subcategoriaId);

        chips.forEach((chip) =>
          chip.setAttribute('aria-pressed', String((chip.dataset.zona || null) === zona))
        );
        let visibles = 0;
        items.forEach((item) => {
          const mostrar = !zona || item.dataset.zonaItem === zona;
          item.hidden = !mostrar;
          if (mostrar) visibles++;
        });
        if (sinResultados) sinResultados.hidden = visibles > 0;

        if (filtroListo) {
          textoGato.textContent = mensajeGato({
            nombreSub,
            zona,
            cantidad: zona ? conteoPorZona[zona] : total,
            total,
          });
        }
      }

      function resaltarTarjeta(id) {
        tarjetas.forEach((t) =>
          t.classList.toggle('centro-tarjeta--resaltada', t.dataset.centroId === id)
        );
      }

      // Botones de zona: equivalentes accesibles a tocar el mapa.
      chips.forEach((chip) =>
        chip.addEventListener('click', () => {
          const zona = chip.dataset.zona || null;
          if (mapa) mapa.seleccionarZona(zona === zonaActual ? null : zona);
          else actualizarInterfaz(zona);
        })
      );

      // La lista y el mapa están enlazados: pasar por una tarjeta
      // levanta su casita en el mapa.
      tarjetas.forEach((t) => {
        const id = t.dataset.centroId;
        t.addEventListener('pointerenter', () => mapa?.resaltarCentro(id));
        t.addEventListener('focus', () => mapa?.resaltarCentro(id));
        t.addEventListener('pointerleave', () => mapa?.resaltarCentro(null));
        t.addEventListener('blur', () => mapa?.resaltarCentro(null));
      });

      contenedor.querySelector('.mapa3d__controles').addEventListener('click', (e) => {
        const accion = e.target.closest('[data-accion]')?.dataset.accion;
        if (!mapa || !accion) return;
        if (accion === 'acercar') mapa.acercar(0.8);
        if (accion === 'alejar') mapa.acercar(1.25);
        if (accion === 'restablecer') mapa.restablecerVista();
      });

      actualizarInterfaz(zonaActual);

      // --- Mi ubicación: distancia a cada centro y lista ordenada por cercanía.
      let miUbicacion = null;
      const botonUbicacion = contenedor.querySelector('[data-mi-ubicacion]');
      const estadoUbicacion = contenedor.querySelector('.mapa3d__ubicacion-estado');
      const lista = contenedor.querySelector('.mapa3d__lista');

      function aplicarUbicacion(ubicacion) {
        miUbicacion = ubicacion;
        const conDistancia = necesitan
          .map((c) => ({ c, km: distanciaKm(ubicacion, c) }))
          .sort((a, b) => a.km - b.km);
        conDistancia.forEach(({ c, km }) => {
          const tarjeta = contenedor.querySelector(`[data-centro-id="${c.id}"]`);
          tarjeta.querySelector('[data-distancia]').textContent = ` · a ${formatoKm(km)} de ti`;
          lista.appendChild(tarjeta.closest('li')); // reordena por cercanía
        });
        const cercano = conDistancia[0];
        estadoUbicacion.textContent = cercano
          ? `El más cercano es ${cercano.c.nombre}, a ${formatoKm(cercano.km)}.`
          : '';
        botonUbicacion.textContent = '📍 Actualizar mi ubicación';
        mapa?.marcarUsuario?.(ubicacion);
      }

      botonUbicacion?.addEventListener('click', async () => {
        estadoUbicacion.textContent = 'Buscando tu ubicación…';
        botonUbicacion.disabled = true;
        try {
          aplicarUbicacion(await obtenerUbicacion());
        } catch (e) {
          estadoUbicacion.textContent = e.message;
        } finally {
          botonUbicacion.disabled = false;
        }
      });

      // Si ya la compartió en esta sesión, se usa sin volver a preguntar.
      const guardada = ubicacionGuardada();
      if (guardada && botonUbicacion) aplicarUbicacion(guardada);

      // Carga diferida del mapa 3D.
      import('../mapa3d.js')
        .then(({ montarMapa3D }) => {
          if (destruido) return;
          const necesidades = Object.fromEntries(
            necesitan.map((c) => [c.id, estadoDeNivel(c.insumos[subcategoriaId])])
          );
          mapa = montarMapa3D({
            lienzo: contenedor.querySelector('.mapa3d__lienzo'),
            capaEtiquetas: contenedor.querySelector('.mapa3d__etiquetas'),
            tooltip: contenedor.querySelector('.mapa3d__tooltip'),
            centros: getCentros(),
            necesidades,
            zonaInicial: zonaActual,
            movimientoReducido,
            alClicCentro: (id) => {
              location.hash = `#/donante/ficha/${id}/${subcategoriaId}`;
            },
            alCambiarZona: actualizarInterfaz,
            alResaltarCentro: resaltarTarjeta,
            alTerminarFiltro: () => {
              filtroListo = true;
              mapaEl.dataset.estado = 'listo';
              actualizarInterfaz(zonaActual);
            },
          });
          mapaEl.dataset.estado = 'animando';
          if (miUbicacion) mapa.marcarUsuario?.(miUbicacion);
        })
        .catch((error) => {
          console.error('No se pudo cargar el mapa 3D:', error);
          if (destruido) return;
          mapaEl.dataset.estado = 'sin-mapa';
          filtroListo = true;
          actualizarInterfaz(zonaActual);
        });

      // El router llama esta función al salir de la pantalla.
      return () => {
        destruido = true;
        mapa?.destruir();
      };
    },
  };
}
