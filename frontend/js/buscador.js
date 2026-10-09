// ═══════════════════════════════════════════════════════════
// NoteFlow · buscador.js
// Buscador global: se abre con Ctrl + K o con la lupa.
// Busca en notas (título, contenido, etiquetas), tareas y materias.
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import { obtenerNotas, obtenerTareas, obtenerMaterias, obtenerMateria } from "./datos.js";
import { escaparHTML, normalizar, textoPlano, fechaRelativa, claseMateria } from "./utilidades.js";
import { rutaBase } from "./navegacion.js";

let seleccionado = 0;

function crearModalBuscar() {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal modal-buscar" id="modal-buscar" role="dialog" aria-modal="true" aria-label="Buscar">
      <div class="modal-fondo" data-cerrar-modal></div>
      <div class="modal-panel">
        <label class="buscar-entrada">
          ${icono("buscar")}
          <input id="entrada-buscar" type="search" placeholder="Buscar notas, tareas y materias…" autocomplete="off" aria-label="Buscar">
          <span class="tecla">Esc</span>
        </label>
        <div class="buscar-resultados" id="resultados-buscar" role="listbox"></div>
      </div>
    </div>`);
}

function crearResultado(ruta, claseColor, nombreIcono, titulo, detalle) {
  return `
    <a class="buscar-item" href="${rutaBase()}${ruta}" role="option">
      <span class="icono-color chico ${claseColor}">${icono(nombreIcono)}</span>
      <span><strong>${escaparHTML(titulo)}</strong><small>${escaparHTML(detalle)}</small></span>
    </a>`;
}

function buscar(texto) {
  const consulta = normalizar(texto.trim());
  const contenedor = document.getElementById("resultados-buscar");

  // Sin texto: mostrar las notas más recientes
  const notas = obtenerNotas().filter(function (nota) {
    if (!consulta) return true;
    const dondeBuscar = normalizar(`${nota.titulo} ${textoPlano(nota.contenido)} ${nota.etiquetas.join(" ")}`);
    return dondeBuscar.includes(consulta);
  }).slice(0, consulta ? 6 : 4);

  const tareas = consulta ? obtenerTareas().filter((t) => normalizar(t.titulo).includes(consulta)).slice(0, 5) : [];
  const materias = consulta ? obtenerMaterias().filter((m) => normalizar(m.nombre).includes(consulta)) : [];

  let html = "";

  if (notas.length) {
    html += `<div class="buscar-grupo">${consulta ? "Notas" : "Notas recientes"}</div>`;
    html += notas.map(function (nota) {
      const materia = obtenerMateria(nota.materiaId);
      return crearResultado(`paginas/nota.html?id=${nota.id}`, claseMateria(materia), "notas", nota.titulo, materia ? materia.nombre : "Sin materia");
    }).join("");
  }
  if (tareas.length) {
    html += '<div class="buscar-grupo">Tareas</div>';
    html += tareas.map((t) => crearResultado("paginas/tareas.html", claseMateria(obtenerMateria(t.materiaId)), "tareas", t.titulo, fechaRelativa(t.fecha))).join("");
  }
  if (materias.length) {
    html += '<div class="buscar-grupo">Materias</div>';
    html += materias.map((m) => crearResultado(`paginas/notas.html?materia=${m.id}`, claseMateria(m), m.icono, m.nombre, "Ver sus notas")).join("");
  }

  contenedor.innerHTML = html || `<p class="buscar-vacio">No hay resultados para “${escaparHTML(texto)}”.</p>`;
  seleccionado = 0;
  marcarSeleccionado();
}

function marcarSeleccionado() {
  const items = document.querySelectorAll("#resultados-buscar .buscar-item");
  items.forEach((item, i) => item.classList.toggle("seleccionado", i === seleccionado));
  if (items[seleccionado]) items[seleccionado].scrollIntoView({ block: "nearest" });
}

// Flechas ↑ ↓ para moverse y Enter para abrir
function moverConTeclado(evento) {
  const items = document.querySelectorAll("#resultados-buscar .buscar-item");
  if (!items.length) return;

  if (evento.key === "ArrowDown") {
    evento.preventDefault();
    seleccionado = (seleccionado + 1) % items.length;
    marcarSeleccionado();
  } else if (evento.key === "ArrowUp") {
    evento.preventDefault();
    seleccionado = (seleccionado - 1 + items.length) % items.length;
    marcarSeleccionado();
  } else if (evento.key === "Enter") {
    evento.preventDefault();
    items[seleccionado].click();
  }
}

export function iniciarBuscador(abrirModal) {
  crearModalBuscar();
  const entrada = document.getElementById("entrada-buscar");

  function abrir() {
    entrada.value = "";
    buscar("");
    abrirModal("modal-buscar");
  }

  entrada.addEventListener("input", () => buscar(entrada.value));
  entrada.addEventListener("keydown", moverConTeclado);

  document.addEventListener("click", function (evento) {
    if (evento.target.closest("[data-abrir-buscador]")) abrir();
  });

  document.addEventListener("keydown", function (evento) {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
      evento.preventDefault();
      abrir();
    }
  });
}
