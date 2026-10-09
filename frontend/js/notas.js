// ═══════════════════════════════════════════════════════════
// NoteFlow · notas.js
// Página "Mis notas": buscar, filtrar por materia o favoritas,
// ordenar y marcar favoritas. Crear/editar se hace en nota.html.
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import { obtenerNotas, obtenerMaterias, cambiarFavorita } from "./datos.js";
import { crearTarjetaNota, crearEstadoVacio } from "./componentes.js";
import { animarEntrada } from "./animaciones.js";
import { escaparHTML, normalizar, textoPlano, leerParametro, claseMateria, plural } from "./utilidades.js";

// Lo que el usuario eligió para filtrar
const filtros = {
  materia: leerParametro("materia") || "todas", // "todas", "favoritas" o el id de una materia
  texto: "",
  orden: "recientes"
};

// ── Chips de filtro ─────────────────────────────────────────
function mostrarChips() {
  const chip = (valor, contenido) =>
    `<button class="chip ${String(filtros.materia) === String(valor) ? "activo" : ""}" type="button" data-filtro="${valor}">${contenido}</button>`;

  const chipsMaterias = obtenerMaterias()
    .map((m) => chip(m.id, `<span class="punto ${claseMateria(m)}"></span>${escaparHTML(m.nombre)}`))
    .join("");

  document.getElementById("filtros-materia").innerHTML =
    chip("todas", "Todas") + chip("favoritas", `${icono("estrella")}Favoritas`) + chipsMaterias;
}

// ── Aplicar filtros ─────────────────────────────────────────
function filtrarNotas() {
  const consulta = normalizar(filtros.texto.trim());

  let notas = obtenerNotas().filter(function (nota) {
    if (filtros.materia === "favoritas" && !nota.favorita) return false;
    if (filtros.materia !== "todas" && filtros.materia !== "favoritas" && nota.materiaId !== filtros.materia) return false;
    if (!consulta) return true;
    return normalizar(`${nota.titulo} ${textoPlano(nota.contenido)} ${nota.etiquetas.join(" ")}`).includes(consulta);
  });

  if (filtros.orden === "titulo") {
    notas = [...notas].sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  }
  return notas;
}

// ── Dibujar las notas ───────────────────────────────────────
function mostrarNotas() {
  const notas = filtrarNotas();
  const contenedor = document.getElementById("contenedor-notas");

  document.getElementById("contador-notas").textContent = plural(notas.length, "nota", "notas");

  if (!notas.length) {
    contenedor.innerHTML = crearEstadoVacio({
      nombreIcono: "notas",
      titulo: filtros.texto ? "No encontramos notas" : "No hay notas aquí",
      texto: filtros.texto ? "Prueba con otra palabra o quita los filtros." : "Crea una nota y aparecerá en esta lista.",
      boton: '<a class="boton boton-primario" href="nota.html?nueva=1">Nueva nota</a>'
    });
    contenedor.firstElementChild.style.gridColumn = "1 / -1";
    return;
  }

  contenedor.innerHTML = notas.map((n) => crearTarjetaNota(n, { conFavorita: true })).join("");
}

// ── Eventos ─────────────────────────────────────────────────
document.getElementById("filtros-materia").addEventListener("click", function (evento) {
  const chip = evento.target.closest("[data-filtro]");
  if (!chip) return;
  filtros.materia = chip.dataset.filtro;
  mostrarChips();
  mostrarNotas();
  animarEntrada(document.getElementById("contenedor-notas"));
});

document.getElementById("buscar-notas").addEventListener("input", function (evento) {
  filtros.texto = evento.target.value;
  mostrarNotas();
});

document.getElementById("orden-notas").addEventListener("change", function (evento) {
  filtros.orden = evento.target.value;
  mostrarNotas();
});

// Estrella de favorita (dentro de cada tarjeta)
document.getElementById("contenedor-notas").addEventListener("click", function (evento) {
  const boton = evento.target.closest('[data-accion="favorita"]');
  if (!boton) return;
  const activa = cambiarFavorita(boton.dataset.id);
  boton.classList.toggle("activa", activa);
  boton.setAttribute("aria-pressed", activa);
  boton.setAttribute("aria-label", activa ? "Quitar de favoritas" : "Marcar como favorita");
  if (filtros.materia === "favoritas") mostrarNotas();
});

mostrarChips();
mostrarNotas();
animarEntrada();
