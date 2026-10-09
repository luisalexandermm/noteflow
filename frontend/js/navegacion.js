// ═══════════════════════════════════════════════════════════
// NoteFlow · navegacion.js
// Dibuja la navegación que se repite en TODAS las páginas:
//   · Escritorio: menú lateral flotante + barra superior con buscador
//   · Tablet: el mismo menú, solo con íconos
//   · Celular: cabecera con tu saludo + barra inferior flotante
//     (Inicio · Notas · [+] · Tareas · Más) y la hoja "Más"
// Cada página solo dice quién es:  <body data-pagina="notas">
// ═══════════════════════════════════════════════════════════

import { icono, logoNoteFlow } from "./iconos.js";
import { obtenerPerfil, obtenerNotas, obtenerTareasPendientes, obtenerEventos, obtenerUsuario } from "./datos.js";
import { hoyISO, mayuscula, escaparHTML, saludoSegunHora } from "./utilidades.js";

// Secciones del menú, por grupos. Si agregas una página, agrégala aquí.
const PAGINAS = [
  { id: "inicio",        nombre: "Inicio",        icono: "inicio",        ruta: "paginas/inicio.html",        grupo: "Menú" },
  { id: "notas",         nombre: "Mis notas",     icono: "notas",         ruta: "paginas/notas.html",         grupo: "Menú" },
  { id: "materias",      nombre: "Materias",      icono: "materias",      ruta: "paginas/materias.html",      grupo: "Menú",          color: "materia-verde" },
  { id: "tareas",        nombre: "Tareas",        icono: "tareas",        ruta: "paginas/tareas.html",        grupo: "Menú" },
  { id: "calendario",    nombre: "Calendario",    icono: "calendario",    ruta: "paginas/calendario.html",    grupo: "Menú",          color: "materia-azul" },
  { id: "asistente",     nombre: "Asistente IA",  icono: "ia",            ruta: "paginas/asistente.html",     grupo: "Herramientas",  color: "materia-violeta" },
  { id: "estadisticas",  nombre: "Mi progreso",   icono: "estadisticas",  ruta: "paginas/estadisticas.html",  grupo: "Herramientas",  color: "materia-ambar" },
  { id: "configuracion", nombre: "Configuración", icono: "configuracion", ruta: "paginas/configuracion.html", grupo: "Cuenta",        color: "materia-gris" }
];

// Secciones que en el celular están en la barra inferior
const EN_BARRA_INFERIOR = ["inicio", "notas", "tareas"];

// ── Utilidades ──────────────────────────────────────────────

// Desde /paginas/ hay que subir un nivel para llegar a la raíz
export function rutaBase() {
  return window.location.pathname.includes("/paginas/") ? "../" : "";
}

export function iniciales(nombre) {
  if (!nombre.trim()) return escaparHTML((obtenerUsuario().correo || "?")[0].toUpperCase());
  return escaparHTML(nombre).split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function fechaDeHoy() {
  // "Vie, 9 de oct"
  const texto = new Date().toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
  return mayuscula(texto.replaceAll(".", ""));
}

// Nombre para mostrar: el del perfil o, si aún no lo escribe, el correo
function nombreVisible() {
  return obtenerPerfil().nombre || obtenerUsuario().correo;
}

// Cosas para hoy (tareas pendientes + eventos) → número de la campana
function pendientesDeHoy() {
  const hoy = hoyISO();
  return obtenerTareasPendientes().filter((t) => t.fecha === hoy).length + obtenerEventos().filter((e) => e.fecha === hoy).length;
}

function campana() {
  const cantidad = pendientesDeHoy();
  const insignia = cantidad ? `<span class="insignia">${cantidad > 9 ? "9+" : cantidad}</span>` : "";
  return `<a class="boton-redondo" href="${rutaBase()}paginas/calendario.html" aria-label="Para hoy: ${cantidad}" title="Para hoy: ${cantidad}">${icono("campana")}${insignia}</a>`;
}

// ── Escritorio: menú lateral ────────────────────────────────
function crearBarraLateral(paginaActual) {
  const perfil = obtenerPerfil();
  const contadores = { notas: obtenerNotas().length, tareas: obtenerTareasPendientes().length };

  const enlace = function (pagina) {
    const activo = pagina.id === paginaActual;
    const contador = contadores[pagina.id] ? `<span class="contador">${contadores[pagina.id]}</span>` : "";
    return `
      <a class="enlace-menu ${activo ? "activo" : ""}" href="${rutaBase()}${pagina.ruta}" data-nombre="${pagina.nombre}" ${activo ? 'aria-current="page"' : ""}>
        <span class="chip-icono">${icono(pagina.icono)}</span><span class="texto">${pagina.nombre}</span>${contador}
      </a>`;
  };

  const grupos = ["Menú", "Herramientas", "Cuenta"].map((grupo) => `
    <span class="menu-titulo">${grupo}</span>
    ${PAGINAS.filter((p) => p.grupo === grupo).map(enlace).join("")}`).join("");

  return `
    <a class="marca" href="${rutaBase()}paginas/inicio.html" aria-label="NoteFlow, ir al inicio">
      ${logoNoteFlow()}<span class="marca-texto">NoteFlow</span>
    </a>

    <nav class="menu" aria-label="Secciones">${grupos}</nav>

    <div class="espaciador"></div>

    <div class="tarjeta-instalar">
      <span class="icono-color materia-violeta">${icono("instalar")}</span>
      <div><strong>Instala NoteFlow</strong><p>Ábrela como una app, desde tu escritorio o celular.</p></div>
      <button class="boton boton-primario" type="button" data-instalar>Instalar app</button>
    </div>

    <a class="usuario-lateral" href="${rutaBase()}paginas/configuracion.html" aria-label="Perfil y configuración">
      <span class="avatar">${iniciales(perfil.nombre)}</span>
      <span class="datos"><span class="nombre">${escaparHTML(nombreVisible())}</span><span class="detalle">${escaparHTML(perfil.carrera || "Configura tu perfil")}</span></span>
      ${icono("derecha")}
    </a>`;
}

// ── Escritorio: barra superior ──────────────────────────────
function crearBarraSuperior() {
  const perfil = obtenerPerfil();
  return `
    <button class="buscador-superior" type="button" data-abrir-buscador aria-label="Buscar notas, tareas y materias">
      ${icono("buscar")}<span class="texto">Buscar notas, tareas, materias…</span><span class="tecla">Ctrl K</span>
    </button>
    <span class="espaciador"></span>
    <span class="fecha-hoy">${fechaDeHoy()}</span>
    ${campana()}
    <a class="avatar" href="${rutaBase()}paginas/configuracion.html" aria-label="Perfil">${iniciales(perfil.nombre)}</a>`;
}

// ── Celular: cabecera con saludo ────────────────────────────
function crearCabeceraMovil() {
  const perfil = obtenerPerfil();
  const saludo = saludoSegunHora();
  const primerNombre = perfil.nombre.trim().split(" ")[0] || "Bienvenido";
  return `
    <a class="perfil-movil" href="${rutaBase()}paginas/configuracion.html" aria-label="Tu perfil">
      <span class="avatar">${iniciales(perfil.nombre)}</span>
      <span><small>${saludo.texto} ${saludo.emoji}</small><strong>${escaparHTML(primerNombre)}</strong></span>
    </a>
    <button class="boton-redondo" type="button" data-abrir-buscador aria-label="Buscar">${icono("buscar")}</button>
    ${campana()}`;
}

// ── Celular: barra inferior flotante ────────────────────────
function crearEnlaceInferior(id, paginaActual, nombreCorto) {
  const pagina = PAGINAS.find((p) => p.id === id);
  const activo = id === paginaActual;
  return `
    <a class="enlace-inferior ${activo ? "activo" : ""}" href="${rutaBase()}${pagina.ruta}" ${activo ? 'aria-current="page"' : ""}>
      ${icono(pagina.icono)}${nombreCorto}
    </a>`;
}

function crearNavegacionInferior(paginaActual) {
  const enMas = !EN_BARRA_INFERIOR.includes(paginaActual);
  return `
    ${crearEnlaceInferior("inicio", paginaActual, "Inicio")}
    ${crearEnlaceInferior("notas", paginaActual, "Notas")}
    <button class="boton-central" type="button" data-abrir-modal="modal-crear" aria-label="Crear">${icono("mas")}</button>
    ${crearEnlaceInferior("tareas", paginaActual, "Tareas")}
    <button class="enlace-inferior ${enMas ? "activo" : ""}" type="button" data-abrir-modal="modal-mas">${icono("cuadricula")}Más</button>`;
}

// Hoja "Más": cuadrícula con el resto de secciones
function crearHojaMas(paginaActual) {
  const perfil = obtenerPerfil();
  const otras = PAGINAS.filter((p) => !EN_BARRA_INFERIOR.includes(p.id));

  const opciones = otras.map((p) => `
    <a class="opcion-mas ${p.id === paginaActual ? "activo" : ""}" href="${rutaBase()}${p.ruta}">
      <span class="icono-color grande ${p.color}">${icono(p.icono)}</span>${p.nombre}
    </a>`).join("");

  return `
    <div class="modal" id="modal-mas" role="dialog" aria-modal="true" aria-labelledby="titulo-mas">
      <div class="modal-fondo" data-cerrar-modal></div>
      <div class="modal-panel">
        <div class="tirador"></div>
        <div class="modal-cabecera">
          <h2 id="titulo-mas">Más</h2>
          <button class="boton-icono" type="button" data-cerrar-modal aria-label="Cerrar">${icono("cerrar")}</button>
        </div>
        <div class="modal-cuerpo">
          <div class="cuenta-mas">
            <span class="avatar">${iniciales(perfil.nombre)}</span>
            <div><strong>${escaparHTML(nombreVisible())}</strong><small>${escaparHTML(obtenerUsuario().correo)}</small></div>
            <button class="boton-icono" type="button" data-cerrar-sesion aria-label="Cerrar sesión">${icono("salir")}</button>
          </div>
          <nav class="menu-mas" aria-label="Más secciones">
            ${opciones}
            <button class="opcion-mas instalar" type="button" data-instalar>
              <span class="icono-color grande materia-rosa">${icono("instalar")}</span>Instalar app
            </button>
          </nav>
        </div>
      </div>
    </div>`;
}

// Menú "Crear" del botón + central
function crearMenuCrear() {
  const opcion = (ruta, color, nombreIcono, titulo, detalle) => `
    <a class="opcion-crear" href="${rutaBase()}${ruta}">
      <span class="icono-color grande ${color}">${icono(nombreIcono)}</span>
      <span><strong>${titulo}</strong><small>${detalle}</small></span>
    </a>`;

  return `
    <div class="modal" id="modal-crear" role="dialog" aria-modal="true" aria-labelledby="titulo-crear">
      <div class="modal-fondo" data-cerrar-modal></div>
      <div class="modal-panel">
        <div class="tirador"></div>
        <div class="modal-cabecera"><h2 id="titulo-crear">¿Qué quieres crear?</h2><button class="boton-icono" type="button" data-cerrar-modal aria-label="Cerrar">${icono("cerrar")}</button></div>
        <div class="modal-cuerpo opciones-crear">
          ${opcion("paginas/nota.html?nueva=1", "materia-azul", "notas", "Nueva nota", "Apuntes con títulos, listas, código e imágenes")}
          ${opcion("paginas/tareas.html?nueva=1", "materia-violeta", "tareas", "Nueva tarea", "Con materia, fecha y prioridad")}
          ${opcion("paginas/calendario.html?nuevo=1", "materia-verde", "calendario", "Nuevo evento", "Examen, tutoría o sesión de estudio")}
          ${opcion("paginas/materias.html?nueva=1", "materia-ambar", "materias", "Nueva materia", "Con su color e ícono")}
        </div>
      </div>
    </div>`;
}

// ── Función principal ───────────────────────────────────────
export function iniciarNavegacion() {
  const paginaActual = document.body.dataset.pagina || "inicio";

  const piezas = {
    "barra-lateral": crearBarraLateral(paginaActual),
    "barra-superior": crearBarraSuperior(),
    "cabecera-movil": crearCabeceraMovil(),
    "navegacion-inferior": crearNavegacionInferior(paginaActual)
  };

  Object.entries(piezas).forEach(function ([id, html]) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.innerHTML = html;
  });

  document.body.insertAdjacentHTML("beforeend", crearHojaMas(paginaActual) + crearMenuCrear());
}
