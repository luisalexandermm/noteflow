// ═══════════════════════════════════════════════════════════
// NoteFlow · datos.js
// TODOS los datos de la app pasan por aquí.
//
// Cómo funciona:
//   1. Al abrir una página se cargan TODOS los datos del usuario
//      en memoria (la variable "datos").
//   2. Las páginas leen de memoria → todo se ve al instante.
//   3. Cada cambio se hace primero en memoria y luego se guarda:
//        · modo "nube":  en el backend → base de datos Neon (en orden, con una cola)
//        · modo "local": en el navegador (localStorage)
//
// Cada usuario empieza VACÍO: sin materias, notas ni tareas.
// ═══════════════════════════════════════════════════════════

import { usuario, modo, exigirSesion } from "./sesion.js";
import { pedir } from "./api.js";
import { ahoraLocal, hoyISO, sumarDias, nuevoId } from "./utilidades.js";

// Si no hay sesión, esta línea manda a la bienvenida y la página no sigue
if (!usuario) await exigirSesion();

const CLAVE_LOCAL = `noteflow-datos-${usuario.id}`;

function datosVacios() {
  return {
    perfil: { nombre: "", carrera: "" },
    preferencias: { animaciones: true, escena3d: true },
    materias: [],
    notas: [],
    tareas: [],
    eventos: [],
    chat: []
  };
}

let datos = datosVacios();

// ═══ CARGAR ═════════════════════════════════════════════════
async function cargarDeLaNube() {
  const recibido = await pedir("/api/datos");
  // Las fechas llegan en hora UTC; las pasamos a hora local
  recibido.notas.forEach(function (nota) {
    nota.creadoEn = ahoraLocal(new Date(nota.creadoEn));
    nota.actualizadoEn = ahoraLocal(new Date(nota.actualizadoEn));
  });
  datos = { ...datosVacios(), ...recibido };
}

function cargarDelNavegador() {
  try {
    const guardado = localStorage.getItem(CLAVE_LOCAL);
    if (guardado) datos = { ...datosVacios(), ...JSON.parse(guardado) };
  } catch (error) {
    console.warn("NoteFlow: no se pudieron leer los datos guardados", error);
  }
}

if (modo === "nube") {
  try {
    await cargarDeLaNube();
  } catch (error) {
    console.error("NoteFlow: error al cargar los datos", error);
    window.addEventListener("DOMContentLoaded", () => avisarError("No se pudieron cargar tus datos. Revisa tu conexión y recarga la página."));
  }
} else {
  cargarDelNavegador();
}

// ═══ GUARDAR ════════════════════════════════════════════════
// Modo local: todo el objeto va al navegador.
function guardarEnNavegador() {
  if (modo !== "local") return true;
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(datos));
    return true;
  } catch (error) {
    console.warn("NoteFlow: no se pudo guardar en el navegador", error);
    avisarError("No se pudo guardar: el navegador no tiene espacio.");
    return false;
  }
}

// Modo nube: una COLA para que los cambios lleguen al servidor en orden
// (por ejemplo: primero crear la materia, después la nota que la usa).
let cola = Promise.resolve();
let pendientes = 0;

function enNube(ruta, metodo, cuerpo) {
  if (modo !== "nube") return;
  pendientes++;
  cola = cola
    .then(() => pedir(ruta, { metodo, cuerpo }))
    .catch(function (error) {
      console.error("NoteFlow: error al guardar", error);
      avisarError(error.message || "No se pudo guardar el último cambio. Revisa tu conexión.");
    })
    .finally(() => pendientes--);
}

// Espera a que TODOS los cambios lleguen al servidor (úsala antes de recargar la página)
export function esperarGuardado() {
  return cola;
}

// Si hay cambios viajando al servidor, el navegador pregunta antes de salir
window.addEventListener("beforeunload", function (evento) {
  if (pendientes > 0) {
    evento.preventDefault();
    evento.returnValue = "";
  }
});

// app.js escucha este evento y muestra el aviso rojo
function avisarError(mensaje) {
  window.dispatchEvent(new CustomEvent("noteflow:error", { detail: mensaje }));
}

// ═══ USUARIO ════════════════════════════════════════════════
export function obtenerUsuario() {
  return { ...usuario, modo };
}

export function obtenerPerfil() {
  return datos.perfil;
}

export function guardarPerfil(perfil) {
  datos.perfil = { ...datos.perfil, ...perfil };
  guardarEnNavegador();
  enNube("/api/perfil", "PUT", { nombre: datos.perfil.nombre, carrera: datos.perfil.carrera });
}

export function obtenerPreferencias() {
  return datos.preferencias;
}

export function guardarPreferencias(preferencias) {
  datos.preferencias = { ...datos.preferencias, ...preferencias };
  guardarEnNavegador();
  enNube("/api/perfil", "PUT", { preferencias: datos.preferencias });
}

// ═══ MATERIAS ═══════════════════════════════════════════════
export function obtenerMaterias() {
  return datos.materias;
}

export function obtenerMateria(id) {
  return datos.materias.find((m) => m.id === id) || null;
}

export function crearMateria({ nombre, color, icono }) {
  const materia = { id: nuevoId(), nombre, color, icono };
  datos.materias.push(materia);
  guardarEnNavegador();
  enNube("/api/materias", "POST", materia);
  return materia;
}

export function eliminarMateria(id) {
  datos.materias = datos.materias.filter((m) => m.id !== id);
  // Sus notas, tareas y eventos quedan "sin materia" (como ON DELETE SET NULL)
  [datos.notas, datos.tareas, datos.eventos].forEach((lista) => lista.forEach((x) => { if (x.materiaId === id) x.materiaId = null; }));
  guardarEnNavegador();
  enNube(`/api/materias/${id}`, "DELETE");
}

// Cuántas notas y tareas tiene una materia, y su progreso
export function resumenMateria(id) {
  const tareas = datos.tareas.filter((t) => t.materiaId === id);
  const completadas = tareas.filter((t) => t.estado === "completada").length;
  return {
    notas: datos.notas.filter((n) => n.materiaId === id).length,
    tareasTotales: tareas.length,
    tareasPendientes: tareas.length - completadas,
    progreso: tareas.length ? Math.round((completadas / tareas.length) * 100) : 0
  };
}

// ═══ NOTAS ══════════════════════════════════════════════════
export function obtenerNotas() {
  return [...datos.notas].sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn));
}

export function obtenerNota(id) {
  return datos.notas.find((n) => n.id === id) || null;
}

// Lo que se envía al servidor de una nota
function enviarNota(nota) {
  const { materiaId, titulo, contenido, favorita, etiquetas } = nota;
  enNube(`/api/notas/${nota.id}`, "PUT", { materiaId, titulo, contenido, favorita, etiquetas });
}

// Crea la nota si no tiene id; si tiene, la actualiza
export function guardarNota(nota) {
  const ahora = ahoraLocal();
  let guardada;

  if (!nota.id) {
    guardada = { favorita: false, etiquetas: [], contenido: "", materiaId: null, ...nota, id: nuevoId(), creadoEn: ahora, actualizadoEn: ahora };
    datos.notas.push(guardada);
  } else {
    const indice = datos.notas.findIndex((n) => n.id === nota.id);
    guardada = { ...datos.notas[indice], ...nota, actualizadoEn: ahora };
    datos.notas[indice] = guardada;
  }

  if (!guardarEnNavegador()) return null;
  enviarNota(guardada);
  return guardada;
}

export function eliminarNota(id) {
  datos.notas = datos.notas.filter((n) => n.id !== id);
  guardarEnNavegador();
  enNube(`/api/notas/${id}`, "DELETE");
}

export function cambiarFavorita(id) {
  const nota = obtenerNota(id);
  nota.favorita = !nota.favorita;
  guardarEnNavegador();
  enviarNota(nota);
  return nota.favorita;
}

// ── Imágenes de las notas ───────────────────────────────────
// Antes de guardarla se reduce (máx. 1600 px) y se convierte a WebP:
// una foto de 4 MB queda en ~200 KB.
async function comprimirImagen(archivo) {
  if (archivo.type === "image/gif") return archivo; // los GIF se dejan igual (perderían la animación)

  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, 1600 / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

  const convertir = (tipo, calidad) => new Promise((listo) => lienzo.toBlob(listo, tipo, calidad));
  let resultado = await convertir("image/webp", 0.82);
  if (!resultado || resultado.type !== "image/webp") resultado = await convertir("image/jpeg", 0.85); // navegadores sin WebP
  if (resultado.size > 1024 * 1024) resultado = await convertir("image/jpeg", 0.6);
  return resultado;
}

export async function subirImagen(archivo) {
  let imagen;
  try {
    imagen = await comprimirImagen(archivo);
  } catch (error) {
    imagen = archivo; // el navegador no pudo procesarla: se intenta con la original
  }
  if (imagen.size > 1024 * 1024) throw new Error("La imagen sigue pesando más de 1 MB");

  if (modo === "nube") {
    const respuesta = await pedir("/api/imagenes", { metodo: "POST", cuerpo: imagen });
    return respuesta.url; // "/api/imagenes/<id>"
  }

  // Modo local: la imagen se guarda dentro de la nota como texto (data URL)
  return new Promise(function (listo, fallo) {
    const lector = new FileReader();
    lector.onload = () => listo(lector.result);
    lector.onerror = () => fallo(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(imagen);
  });
}

// ═══ TAREAS ═════════════════════════════════════════════════
export function obtenerTareas() {
  return datos.tareas;
}

// Pendientes ordenadas por fecha (las sin fecha al final)
export function obtenerTareasPendientes() {
  return datos.tareas
    .filter((t) => t.estado !== "completada")
    .sort((a, b) => (a.fecha || "9999").localeCompare(b.fecha || "9999"));
}

export function guardarTarea(tarea) {
  let guardada;
  if (!tarea.id) {
    guardada = { estado: "pendiente", descripcion: "", materiaId: null, fecha: null, ...tarea, id: nuevoId() };
    datos.tareas.push(guardada);
  } else {
    const indice = datos.tareas.findIndex((t) => t.id === tarea.id);
    guardada = { ...datos.tareas[indice], ...tarea };
    datos.tareas[indice] = guardada;
  }
  guardarEnNavegador();
  const { id, ...resto } = guardada;
  enNube(`/api/tareas/${id}`, "PUT", resto);
  return guardada;
}

export function eliminarTarea(id) {
  datos.tareas = datos.tareas.filter((t) => t.id !== id);
  guardarEnNavegador();
  enNube(`/api/tareas/${id}`, "DELETE");
}

// ═══ EVENTOS (calendario) ═══════════════════════════════════
export function obtenerEventos() {
  return datos.eventos;
}

export function guardarEvento(evento) {
  const nuevo = { duracion: 60, ...evento, id: nuevoId() };
  datos.eventos.push(nuevo);
  guardarEnNavegador();
  const { id, ...resto } = nuevo;
  enNube(`/api/eventos/${id}`, "PUT", resto);
  return nuevo;
}

export function eliminarEvento(id) {
  datos.eventos = datos.eventos.filter((e) => e.id !== id);
  guardarEnNavegador();
  enNube(`/api/eventos/${id}`, "DELETE");
}

// ═══ ESTADÍSTICAS ═══════════════════════════════════════════
// Sesiones de estudio del calendario (de los últimos 7 días hasta hoy)
export function minutosDeEstudio(desde = sumarDias(hoyISO(), -6)) {
  return datos.eventos.filter((e) => e.tipo === "sesion_estudio" && e.fecha >= desde && e.fecha <= hoyISO());
}

export function progresoGeneral() {
  const total = datos.tareas.length;
  const completadas = datos.tareas.filter((t) => t.estado === "completada").length;
  return total ? Math.round((completadas / total) * 100) : 0;
}

// ═══ CHAT CON EL ASISTENTE ══════════════════════════════════
export function obtenerChat() {
  return datos.chat;
}

// rol: "usuario" o "ia-demo" (las respuestas "ia" reales las guardará el backend en la Fase 7)
export function agregarMensajeChat(rol, texto) {
  datos.chat.push({ rol, texto, fecha: new Date().toISOString() });
  datos.chat = datos.chat.slice(-60); // en memoria, solo los últimos 60
  guardarEnNavegador();
  if (rol === "usuario" || rol === "ia-demo") {
    enNube("/api/chat/mensajes", "POST", { rol: rol === "ia-demo" ? "demo" : "usuario", texto });
  }
}

export function borrarChat() {
  datos.chat = [];
  guardarEnNavegador();
  enNube("/api/chat", "DELETE");
}

// ═══ MANTENIMIENTO ══════════════════════════════════════════
// Borra todo lo que el usuario creó (su cuenta sigue existiendo)
export async function borrarTodosMisDatos() {
  if (modo === "nube") {
    await cola; // esperar cambios pendientes
    await pedir("/api/datos", { metodo: "DELETE" });
  }
  const perfil = datos.perfil;
  datos = { ...datosVacios(), perfil };
  guardarEnNavegador();
}

export function exportarDatos() {
  return JSON.stringify({ correo: usuario.correo, exportado: new Date().toISOString(), ...datos }, null, 2);
}
