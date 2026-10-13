# CaliDa

Plataforma de coordinación de donaciones para la Cruz Roja en Cali. Conecta lo que el
donante tiene con lo que cada centro de acopio necesita en tiempo real, para que la
ayuda no se acumule en unos centros mientras otros se quedan sin insumos críticos.

Proyecto de Diseño Interactivo.

## Cómo abrirlo

El proyecto usa módulos de JavaScript, así que **no funciona abriendo `index.html` con
doble clic**: necesita un servidor local.

- **VS Code:** instalar la extensión *Live Server*, clic derecho en `index.html` → *Open with Live Server*.
- **Terminal:** en esta carpeta, `python3 -m http.server 8000` y abrir `http://localhost:8000`.

Necesita internet para cargar three.js (mapa 3D), las tipografías y los íconos. Sin
internet, el mapa se reemplaza automáticamente por la lista de centros.

## Publicar con GitHub Pages

El proyecto es un sitio estático, así que GitHub Pages lo puede publicar gratis:

1. En el repositorio: **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda.
3. En uno o dos minutos queda en `https://<usuario>.github.io/<repositorio>/`.

Como GitHub Pages usa https, la ubicación del usuario (geolocalización) funciona ahí.
El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Acceso de administrador (prueba)

En la pantalla de inicio: **Siguiente → Iniciar sesión** (tarjeta "Administrador").

- Correo: `jairo.varela@calida.co`
- Contraseña: `calida2026`
- Centro asignado: Plazoleta Jairo Varela (zona Sur)

No hay registro público: las cuentas las crea la Cruz Roja y cada una está ligada a un
centro. La validación está aislada en `js/auth.js` (`login(correo, contraseña)`), que guarda
solo la huella PBKDF2 de la contraseña, nunca el texto plano. Ahí mismo está comentado
cómo conectar la autenticación real cuando haya backend.

## Recorridos

**Inicio:** pantalla 1 (bienvenida) → "Siguiente" → pantalla 2 (elige tu perfil) → pantalla 3 (login del administrador).

**Donante (sin registro):** estantería (cada producto es una subcategoría) → zoom al recuadro de la categoría en la misma pantalla →
producto (subcategoría) → mapa de Cali que reacciona a lo elegido (con "Usar mi ubicación") →
ficha del centro con su repisa (cantidad de 0 a 5) → pre-registro (cédula + fecha de hoy, ubicación
opcional) → aviso de 24 horas → pantalla final con "Cómo llegar" (Google Maps) y "Regresar al mapa".

**Administrador:** login → bienvenida → menú principal →
- *Gestionar insumos:* estantería → categoría → cantidad de 0 a 5 por subcategoría (− / +) → Guardar.
  0 = urgente, 1–2 = se necesita, 3–4 = alcanza por ahora, 5 = abastecido. El mapa del donante
  muestra los centros con 2 o menos.
- *Registrar donación:* estantería → fecha, cédula y correo → Registrar. Si la cédula tiene un
  pre-registro vigente (24 h) de esa categoría, se valida y la donación hereda la ubicación del donante.
- *Registrar despacho:* fecha, municipio de destino (los 42 del Valle del Cauca) y placa → Enviar. Arma el lote (número = semana del año) y
  genera automáticamente el correo de cada donante.

Todas las confirmaciones muestran al gato y vuelven solas al menú principal.

## Guion sugerido para la demostración

1. Como administrador, en *Gestionar insumos → Alimento*, poner **Agua** en *Urgente* y guardar.
2. Cerrar sesión y, como donante, ir a **Alimento → Agua**: la Plazoleta Jairo Varela aparece
   en el mapa como urgente (casita roja con anillo que late).
3. Tocar una zona en el mapa o en los botones de zona: la cámara viaja a ella y el gato
   cuenta cuántos centros la necesitan.
4. Como administrador, registrar 2 o 3 donaciones con correos distintos (una persona dos
   veces) y luego el despacho.
5. Abrir **Bandeja de correos (prueba)** desde el menú y mostrar los correos generados.

## Estructura

```
index.html
css/      base.css (marca, botones, transiciones) · donante.css (estantería, mapa) · admin.css
js/
  main.js        router por hash, transiciones y foco entre pantallas
  store.js       única fuente de datos (localStorage)
  data.js        categorías, zonas y centros semilla
  mapa3d.js      mapa 3D de Cali (three.js) con las 5 zonas oficiales
  email.js       plantilla y envío del correo automático
  correos.js     bandeja de correos de prueba
  ilustraciones.js  productos 3D de la estantería (SVG)
  inicio.js      pantallas 1 (bienvenida) y 2 (elige tu perfil)
  donante/       estantería (con zoom), mapa, ficha, pre-registro, llegar
  encabezado.js  encabezado con los logos
  mascota.js     gato SVG + burbuja (componente sustituible)
  auth.js        login(correo, contraseña) aislado
  gato.js, iconos.js
  donante/       D1–D6
  admin/         A1–A6 (login, menú, insumos, donación, despacho, confirmación)
```

## Ubicación del usuario

Se pide solo cuando la persona toca "Usar mi ubicación" (mapa) o "Compartir mi ubicación"
(pre-registro), con el permiso del navegador. Necesita https o localhost. Si se niega, todo
funciona igual sin ella. Código en `js/ubicacion.js`.

## Pendientes conocidos

- **Productos de la estantería:** son ilustraciones 3D dibujadas en código (`js/ilustraciones.js`);
  para agregar o cambiar productos se edita ese archivo.
- **Gato:** en las pantallas 1–3 es un SVG temporal en `js/mascota.js` (componente aislado,
  listo para cambiarse por el modelo 3D en three.js). El resto de pantallas usa todavía la
  ilustración del equipo (`assets/gato.png`).
- **Logos:** `assets/logo-cruz-roja.png` y `assets/logo-calida.png` (encabezado en `js/encabezado.js`).
  El de la Cruz Roja va siempre sobre blanco con espacio libre del tamaño de la cruz.
- **Fondo:** variable `--fondo-pantalla` en `css/base.css` (lista para la textura).
- **Foto del centro:** sigue siendo un emoji provisional (`js/donante/ficha.js`).
- **Mapa del correo:** es un SVG; varios clientes de correo no lo muestran. Para el envío real,
  cambiarlo por una imagen de mapa estático (ver comentario en `js/email.js`). El enlace a Google
  Maps sí funciona en cualquier correo.
- **Correo real:** el envío está simulado. En `js/email.js` están los pasos para
  conectarlo a EmailJS sin servidor, y dónde poner la URL pública de la imagen del gato.
- **Centros:** varios son de ejemplo (marcados en `js/data.js`). Si las coordenadas de un
  centro no caen dentro de su zona en el mapa, su casita toma un puesto fijo de la zona;
  "Cómo llegar" usa siempre las coordenadas reales.
- **Datos:** se guardan en el navegador (localStorage). Para reiniciar la demo, borrar los
  datos del sitio en el navegador.

## Identidad visual

Paleta oficial de CaliDa (variables en `css/base.css`): rojo carmín `#CC0100` para avanzar,
azul Cruz Roja `#011E41` en títulos, azul petróleo `#426D8C` en enlaces y mapa, verde bosque /
beige arena / rosa alerta para los estados. Tipografía: Montserrat.

## Accesibilidad y responsive

- Contraste de texto según WCAG AA (todas las combinaciones de la paleta oficial cumplen).
- Al cambiar de pantalla, el foco va al título y el nombre de la pestaña se actualiza.
- Todo se puede usar con teclado; el mapa tiene equivalentes accesibles (botones de zona
  y lista de centros enlazada al mapa).
- Controles táctiles de al menos 44 px; probado desde 320 px de ancho hasta escritorio.
- Respeta *reducir movimiento* del sistema.
