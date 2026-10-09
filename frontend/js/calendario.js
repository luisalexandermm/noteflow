// ═══════════════════════════════════════════════════════════
// NoteFlow · calendario.js
// Escritorio: mes completo. Celular: tira de la semana.
// Al tocar un día se ven sus tareas y eventos.
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import { obtenerTareas, obtenerEventos, obtenerMaterias, obtenerMateria, guardarEvento, eliminarEvento } from "./datos.js";
import { crearFilaTarea, opcionesMaterias, crearEstadoVacio, activarListaTareas } from "./componentes.js";
import { abrirModal, cerrarModal, mostrarAviso, confirmar, mostrarErrorCampo } from "./app.js";
import { animarEntrada, aparecer } from "./animaciones.js";
import { hoyISO, fechaISO, aFecha, sumarDias, fechaLarga, escaparHTML, claseMateria, leerParametro, plural } from "./utilidades.js";

const estado = {
  seleccionada: hoyISO(), // día elegido "AAAA-MM-DD"
  pestana: "tareas"
};

const esCelular = window.matchMedia("(max-width: 767px)");

const TIPOS = {
  sesion_estudio: { nombre: "Sesión de estudio", icono: "libro" },
  examen: { nombre: "Examen", icono: "examen" },
  evento: { nombre: "Evento", icono: "calendario" }
};

// ── Qué hay en un día ───────────────────────────────────────
function tareasDelDia(fecha) {
  return obtenerTareas().filter((t) => t.fecha === fecha);
}
function eventosDelDia(fecha) {
  return obtenerEventos().filter((e) => e.fecha === fecha).sort((a, b) => a.hora.localeCompare(b.hora));
}

// Lunes de la semana de una fecha
function lunesDe(fechaTexto) {
  const diaSemana = (aFecha(fechaTexto).getDay() + 6) % 7; // lunes = 0
  return sumarDias(fechaTexto, -diaSemana);
}

// ── Mes completo (escritorio y tablet) ──────────────────────
function mostrarMes() {
  const elegido = aFecha(estado.seleccionada);
  const primerDia = new Date(elegido.getFullYear(), elegido.getMonth(), 1);
  const diasDelMes = new Date(elegido.getFullYear(), elegido.getMonth() + 1, 0).getDate();
  const inicio = lunesDe(fechaISO(primerDia));
  const semanas = Math.ceil((((primerDia.getDay() + 6) % 7) + diasDelMes) / 7);

  let html = "";
  for (let i = 0; i < semanas * 7; i++) {
    const fecha = sumarDias(inicio, i);
    const otroMes = aFecha(fecha).getMonth() !== elegido.getMonth();

    // Marcas: primero eventos, luego tareas pendientes (máximo 2 visibles)
    const items = [
      ...eventosDelDia(fecha).map((e) => ({ texto: e.titulo, materia: obtenerMateria(e.materiaId) })),
      ...tareasDelDia(fecha).filter((t) => t.estado !== "completada").map((t) => ({ texto: t.titulo, materia: obtenerMateria(t.materiaId) }))
    ];
    const marcas = items.slice(0, 2).map((it) => `<span class="marca-dia ${claseMateria(it.materia)}">${escaparHTML(it.texto)}</span>`).join("");
    const mas = items.length > 2 ? `<span class="mas">+${items.length - 2} más</span>` : "";

    const clases = ["dia", otroMes ? "otro-mes" : "", fecha === hoyISO() ? "hoy" : "", fecha === estado.seleccionada ? "seleccionado" : ""].join(" ");
    html += `
      <button class="${clases}" type="button" data-fecha="${fecha}" aria-label="${fechaLarga(fecha)}, ${plural(items.length, "actividad", "actividades")}" aria-pressed="${fecha === estado.seleccionada}">
        <span class="numero">${aFecha(fecha).getDate()}</span>
        <span class="marcas">${marcas}${mas}</span>
      </button>`;
  }
  document.getElementById("rejilla-dias").innerHTML = html;
}

// ── Tira de la semana (celular) ─────────────────────────────
function mostrarSemana() {
  const lunes = lunesDe(estado.seleccionada);
  const nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  document.getElementById("tira-semana").innerHTML = nombres.map(function (nombre, i) {
    const fecha = sumarDias(lunes, i);
    const conActividad = tareasDelDia(fecha).some((t) => t.estado !== "completada") || eventosDelDia(fecha).length > 0;
    const clases = ["dia-semana", fecha === estado.seleccionada ? "seleccionado" : "", fecha === hoyISO() ? "hoy" : "", conActividad ? "con-actividad" : ""].join(" ");
    return `
      <button class="${clases}" type="button" data-fecha="${fecha}" aria-label="${fechaLarga(fecha)}" aria-pressed="${fecha === estado.seleccionada}">
        ${nombre}<strong>${aFecha(fecha).getDate()}</strong><span class="punto"></span>
      </button>`;
  }).join("");
}

function mostrarTituloMes() {
  const texto = aFecha(estado.seleccionada).toLocaleDateString("es-CO", { month: "long", year: "numeric" }).replace(" de ", " ");
  document.getElementById("titulo-mes").textContent = texto;
}

// ── Panel del día ───────────────────────────────────────────
function crearFilaEvento(evento) {
  const materia = obtenerMateria(evento.materiaId);
  const tipo = TIPOS[evento.tipo] || TIPOS.evento;
  return `
    <li class="fila-tarea fila-evento ${claseMateria(materia)}" data-evento="${evento.id}">
      <span class="hora">${evento.hora}</span>
      <span class="icono-evento">${icono(tipo.icono)}</span>
      <div class="datos">
        <div class="titulo">${escaparHTML(evento.titulo)}</div>
        <div class="meta"><span>${tipo.nombre} · ${evento.duracion || 60} min</span><span>·</span><span>${materia ? escaparHTML(materia.nombre) : "Sin materia"}</span></div>
      </div>
      <button class="boton-icono chico boton-borrar" type="button" data-borrar-evento="${evento.id}" aria-label="Eliminar evento">${icono("basura")}</button>
    </li>`;
}

function mostrarPanelDia() {
  const tareas = tareasDelDia(estado.seleccionada);
  const eventos = eventosDelDia(estado.seleccionada);

  document.getElementById("titulo-dia").textContent = fechaLarga(estado.seleccionada);
  document.getElementById("subtitulo-dia").textContent = `${plural(tareas.length, "tarea", "tareas")} · ${plural(eventos.length, "evento", "eventos")}`;
  document.getElementById("cuenta-tareas").textContent = tareas.length;
  document.getElementById("cuenta-eventos").textContent = eventos.length;

  document.querySelectorAll("[data-pestana]").forEach(function (p) {
    const activa = p.dataset.pestana === estado.pestana;
    p.classList.toggle("activa", activa);
    p.setAttribute("aria-selected", activa);
  });

  const lista = estado.pestana === "tareas"
    ? tareas.map((t) => crearFilaTarea(t)).join("")
    : eventos.map(crearFilaEvento).join("");

  const vacio = estado.pestana === "tareas"
    ? { nombreIcono: "tareas", titulo: "Sin tareas este día", texto: "Las entregas con esta fecha aparecerán aquí." }
    : { nombreIcono: "calendario", titulo: "Sin eventos", texto: "Agrega un examen, una tutoría o una sesión de estudio.", boton: '<button class="boton boton-secundario" type="button" data-abrir-modal="modal-evento">Nuevo evento</button>' };

  document.getElementById("actividades-dia").innerHTML = lista || `<li>${crearEstadoVacio(vacio)}</li>`;
}

function mostrarTodo() {
  mostrarTituloMes();
  if (esCelular.matches) mostrarSemana();
  else mostrarMes();
  mostrarPanelDia();
}

// ── Crear evento ────────────────────────────────────────────
function crearDesdeFormulario(evento) {
  evento.preventDefault();
  const f = evento.target;
  const titulo = f.titulo.value.trim();

  const errorTitulo = titulo.length < 3 ? "Escribe un título de al menos 3 letras." : "";
  const errorFecha = !f.fecha.value ? "Elige la fecha." : "";
  mostrarErrorCampo(f.titulo, errorTitulo);
  mostrarErrorCampo(f.fecha, errorFecha);
  if (errorTitulo || errorFecha) return;

  const nuevo = guardarEvento({
    titulo,
    tipo: f.tipo.value,
    materiaId: f.materia.value || null,
    fecha: f.fecha.value,
    hora: f.hora.value || "08:00",
    duracion: Number(f.duracion.value)
  });

  cerrarModal(f.closest(".modal"));
  f.reset();
  estado.seleccionada = nuevo.fecha;
  estado.pestana = "eventos";
  mostrarTodo();
  aparecer(document.querySelector(`[data-evento="${nuevo.id}"]`));
  mostrarAviso("Evento creado");
}

// ── Eventos de la página ────────────────────────────────────
function elegirDia(evento) {
  const dia = evento.target.closest("[data-fecha]");
  if (!dia) return;
  estado.seleccionada = dia.dataset.fecha;
  mostrarTodo();
}
document.getElementById("rejilla-dias").addEventListener("click", elegirDia);
document.getElementById("tira-semana").addEventListener("click", elegirDia);

// Flechas: un mes en escritorio, una semana en celular
function mover(direccion) {
  if (esCelular.matches) {
    estado.seleccionada = sumarDias(estado.seleccionada, 7 * direccion);
  } else {
    const fecha = aFecha(estado.seleccionada);
    estado.seleccionada = fechaISO(new Date(fecha.getFullYear(), fecha.getMonth() + direccion, 1));
  }
  mostrarTodo();
}
document.getElementById("anterior").addEventListener("click", () => mover(-1));
document.getElementById("siguiente").addEventListener("click", () => mover(1));
document.getElementById("boton-hoy").addEventListener("click", function () {
  estado.seleccionada = hoyISO();
  mostrarTodo();
});

document.querySelectorAll("[data-pestana]").forEach(function (pestana) {
  pestana.addEventListener("click", function () {
    estado.pestana = pestana.dataset.pestana;
    mostrarPanelDia();
  });
});

const listaDia = document.getElementById("actividades-dia");
activarListaTareas(listaDia, mostrarTodo);
listaDia.addEventListener("click", function (evento) {
  const boton = evento.target.closest("[data-borrar-evento]");
  if (!boton) return;
  const id = boton.dataset.borrarEvento;
  const encontrado = obtenerEventos().find((e) => e.id === id);
  if (!confirmar(`¿Eliminar "${encontrado.titulo}"?`)) return;
  eliminarEvento(id);
  mostrarTodo();
  mostrarAviso("Evento eliminado");
});

const formulario = document.getElementById("formulario-evento");
formulario.materia.innerHTML = opcionesMaterias(obtenerMaterias());
formulario.addEventListener("submit", crearDesdeFormulario);
// Al abrir el modal, la fecha es el día seleccionado
document.addEventListener("click", function (evento) {
  if (evento.target.closest('[data-abrir-modal="modal-evento"]')) formulario.fecha.value = estado.seleccionada;
});

esCelular.addEventListener("change", mostrarTodo);

mostrarTodo();
animarEntrada();

if (leerParametro("nuevo")) {
  formulario.fecha.value = estado.seleccionada;
  abrirModal("modal-evento");
}
