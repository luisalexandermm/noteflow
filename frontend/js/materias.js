// ═══════════════════════════════════════════════════════════
// NoteFlow · materias.js
// Página "Materias": ver, crear y eliminar materias.
// Al abrir una materia se ven sus notas (notas.html?materia=id).
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import { obtenerMaterias, crearMateria, eliminarMateria, resumenMateria } from "./datos.js";
import { abrirModal, cerrarModal, mostrarAviso, confirmar, mostrarErrorCampo } from "./app.js";
import { animarEntrada, animarBarras, aparecer, elevarAlPasar } from "./animaciones.js";
import { escaparHTML, claseMateria, plural, normalizar } from "./utilidades.js";

function crearTarjeta(materia) {
  const r = resumenMateria(materia.id);
  return `
    <article class="tarjeta materia-grande tarjeta-interactiva ${claseMateria(materia)}" data-animar data-id="${materia.id}">
      <div class="cabeza">
        <span class="icono-color grande">${icono(materia.icono)}</span>
        <button class="boton-icono chico" type="button" data-accion="eliminar" aria-label="Eliminar ${escaparHTML(materia.nombre)}">${icono("basura")}</button>
      </div>
      <h3><a class="enlace-tarjeta" href="notas.html?materia=${materia.id}">${escaparHTML(materia.nombre)}</a></h3>
      <div class="cifras">
        <span><strong>${r.notas}</strong>${r.notas === 1 ? "nota" : "notas"}</span>
        <span><strong>${r.tareasPendientes}</strong>${r.tareasPendientes === 1 ? "tarea pendiente" : "tareas pendientes"}</span>
      </div>
      <div class="progreso-fila">
        <div class="barra-progreso" style="--progreso: ${r.progreso}%"><span></span></div>
        <span class="mono">${r.progreso}%</span>
      </div>
    </article>`;
}

function mostrarMaterias() {
  const materias = obtenerMaterias();
  document.getElementById("contenedor-materias").innerHTML =
    materias.map(crearTarjeta).join("") +
    `<button class="tarjeta-nueva" type="button" data-abrir-modal="modal-materia" data-animar>${icono("mas")}Nueva materia</button>`;
  elevarAlPasar(".materia-grande");
}

// ── Crear ───────────────────────────────────────────────────
function crearDesdeFormulario(evento) {
  evento.preventDefault();
  const formulario = evento.target;
  const nombre = formulario.nombre.value.trim();

  const repetida = obtenerMaterias().some((m) => normalizar(m.nombre) === normalizar(nombre));
  let error = "";
  if (nombre.length < 2) error = "Escribe un nombre de al menos 2 letras.";
  else if (repetida) error = "Ya tienes una materia con ese nombre.";
  mostrarErrorCampo(formulario.nombre, error);
  if (error) return;

  const materia = crearMateria({ nombre, color: formulario.color.value, icono: formulario.icono.value });

  cerrarModal(formulario.closest(".modal"));
  formulario.reset();
  mostrarMaterias();
  aparecer(document.querySelector(`[data-id="${materia.id}"]`));
  mostrarAviso(`Materia "${nombre}" creada`);
}

// ── Eliminar ────────────────────────────────────────────────
document.getElementById("contenedor-materias").addEventListener("click", function (evento) {
  const boton = evento.target.closest('[data-accion="eliminar"]');
  if (!boton) return;
  const id = boton.closest("[data-id]").dataset.id;
  const materia = obtenerMaterias().find((m) => m.id === id);
  const r = resumenMateria(id);

  const aviso = `¿Eliminar "${materia.nombre}"?\nSus ${plural(r.notas, "nota", "notas")} y ${plural(r.tareasTotales, "tarea", "tareas")} se conservan, pero quedan sin materia.`;
  if (!confirmar(aviso)) return;

  eliminarMateria(id);
  mostrarMaterias();
  mostrarAviso("Materia eliminada");
});

document.getElementById("formulario-materia").addEventListener("submit", crearDesdeFormulario);

mostrarMaterias();
animarEntrada();
animarBarras();

if (new URLSearchParams(location.search).get("nueva")) abrirModal("modal-materia");
