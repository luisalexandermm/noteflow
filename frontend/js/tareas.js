// ═══════════════════════════════════════════════════════════
// NoteFlow · tareas.js
// Página "Mis tareas": crear, completar, cambiar estado,
// eliminar y filtrar. Las tareas se agrupan por fecha.
// ═══════════════════════════════════════════════════════════

import { obtenerTareas, obtenerMaterias, guardarTarea } from "./datos.js";
import { crearFilaTarea, opcionesMaterias, crearEstadoVacio, activarListaTareas } from "./componentes.js";
import { abrirModal, cerrarModal, mostrarAviso, mostrarErrorCampo } from "./app.js";
import { animarEntrada, aparecer } from "./animaciones.js";
import { diasDesdeHoy, hoyISO, leerParametro } from "./utilidades.js";

const filtros = { estado: "todas", materia: "" };

const PESTANAS = [
  { valor: "todas", nombre: "Todas" },
  { valor: "pendiente", nombre: "Pendientes" },
  { valor: "en_progreso", nombre: "En progreso" },
  { valor: "completada", nombre: "Completadas" }
];

// ── ¿En qué grupo va una tarea? ─────────────────────────────
function grupoDeTarea(tarea) {
  if (tarea.estado === "completada") return "Completadas";
  if (!tarea.fecha) return "Sin fecha";
  const dias = diasDesdeHoy(tarea.fecha);
  if (dias < 0) return "Vencidas";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias <= 7) return "Esta semana";
  return "Más adelante";
}
const ORDEN_GRUPOS = ["Vencidas", "Hoy", "Mañana", "Esta semana", "Más adelante", "Sin fecha", "Completadas"];

// ── Pestañas con su cantidad ────────────────────────────────
function mostrarPestanas() {
  const tareas = tareasDeLaMateria();
  document.getElementById("pestanas-tareas").innerHTML = PESTANAS.map(function (p) {
    const cantidad = p.valor === "todas" ? tareas.length : tareas.filter((t) => t.estado === p.valor).length;
    const activa = filtros.estado === p.valor;
    return `<button class="pestana ${activa ? "activa" : ""}" type="button" role="tab" aria-selected="${activa}" data-estado="${p.valor}">${p.nombre}<span class="cuenta">${cantidad}</span></button>`;
  }).join("");
}

function tareasDeLaMateria() {
  return obtenerTareas().filter((t) => !filtros.materia || t.materiaId === filtros.materia);
}

// ── Lista agrupada ──────────────────────────────────────────
function mostrarTareas() {
  const tareas = tareasDeLaMateria()
    .filter((t) => filtros.estado === "todas" || t.estado === filtros.estado)
    .sort((a, b) => (a.fecha || "9999").localeCompare(b.fecha || "9999"));

  const contenedor = document.getElementById("contenedor-tareas");

  if (!tareas.length) {
    contenedor.innerHTML = `<div class="tarjeta">${crearEstadoVacio({
      nombreIcono: "tareas",
      titulo: "No hay tareas aquí",
      texto: "Crea una tarea o cambia el filtro.",
      boton: '<button class="boton boton-primario" type="button" data-abrir-modal="modal-tarea">Nueva tarea</button>'
    })}</div>`;
    return;
  }

  // Agrupar: { "Hoy": [...], "Mañana": [...] }
  const grupos = {};
  tareas.forEach(function (tarea) {
    const grupo = grupoDeTarea(tarea);
    if (!grupos[grupo]) grupos[grupo] = [];
    grupos[grupo].push(tarea);
  });

  // Las completadas: las más recientes primero
  if (grupos.Completadas) grupos.Completadas.reverse();

  contenedor.innerHTML = ORDEN_GRUPOS.filter((g) => grupos[g]).map((g) => `
    <section class="grupo-tareas" data-animar>
      <h2>${g}<span class="cuenta">${grupos[g].length}</span></h2>
      <div class="tarjeta"><ul class="lista-tareas">${grupos[g].map((t) => crearFilaTarea(t, { detallada: true })).join("")}</ul></div>
    </section>`).join("");
}

function mostrarResumen() {
  const pendientes = obtenerTareas().filter((t) => t.estado !== "completada");
  const paraHoy = pendientes.filter((t) => t.fecha === hoyISO()).length;
  document.getElementById("resumen-tareas").textContent =
    `${pendientes.length} pendientes · ${paraHoy} para hoy`;
}

function mostrarTodo() {
  mostrarResumen();
  mostrarPestanas();
  mostrarTareas();
}

// ── Crear tarea ─────────────────────────────────────────────
function crearDesdeFormulario(evento) {
  evento.preventDefault();
  const f = evento.target;
  const titulo = f.titulo.value.trim();

  const errorTitulo = titulo.length < 3 ? "Escribe un título de al menos 3 letras." : "";
  const errorFecha = f.fecha.value && diasDesdeHoy(f.fecha.value) < -365 ? "Revisa la fecha: es de hace más de un año." : "";
  mostrarErrorCampo(f.titulo, errorTitulo);
  mostrarErrorCampo(f.fecha, errorFecha);
  if (errorTitulo || errorFecha) return;

  const tarea = guardarTarea({
    titulo,
    materiaId: f.materia.value || null,
    fecha: f.fecha.value || null,
    prioridad: f.prioridad.value,
    estado: f.estado.value,
    descripcion: f.descripcion.value.trim()
  });

  cerrarModal(f.closest(".modal"));
  f.reset();
  f.fecha.value = hoyISO();
  mostrarTodo();
  aparecer(document.querySelector(`.fila-tarea[data-id="${tarea.id}"]`));
  mostrarAviso("Tarea creada");
}

// ── Eventos ─────────────────────────────────────────────────
document.getElementById("pestanas-tareas").addEventListener("click", function (evento) {
  const pestana = evento.target.closest("[data-estado]");
  if (!pestana) return;
  filtros.estado = pestana.dataset.estado;
  mostrarPestanas();
  mostrarTareas();
  animarEntrada(document.getElementById("contenedor-tareas"));
});

const filtroMateria = document.getElementById("filtro-materia");
filtroMateria.innerHTML = opcionesMaterias(obtenerMaterias(), "", "Todas las materias");
filtroMateria.addEventListener("change", function () {
  filtros.materia = filtroMateria.value;
  mostrarPestanas();
  mostrarTareas();
});

const formulario = document.getElementById("formulario-tarea");
formulario.materia.innerHTML = opcionesMaterias(obtenerMaterias());
formulario.fecha.value = hoyISO();
formulario.addEventListener("submit", crearDesdeFormulario);

activarListaTareas(document.getElementById("contenedor-tareas"), mostrarTodo);

mostrarTodo();
animarEntrada();

if (leerParametro("nueva")) abrirModal("modal-tarea");
