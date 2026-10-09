// ═══════════════════════════════════════════════════════════
// NoteFlow · componentes.js
// Funciones que devuelven el HTML de piezas que se repiten
// en varias páginas: tarjeta de nota, fila de tarea, tarjeta
// de materia y tarjeta de dato. Así se ven igual en todas partes.
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import { obtenerMateria, resumenMateria, obtenerTareas, guardarTarea, eliminarTarea } from "./datos.js";
import { animarCheck, desaparecer } from "./animaciones.js";
import { mostrarAviso, confirmar } from "./app.js";
import { escaparHTML, textoPlano, fechaMedia, fechaRelativa, diasDesdeHoy, claseMateria, plural } from "./utilidades.js";
import { rutaBase } from "./navegacion.js";

// ── Tarjeta de dato: [ícono] 4 · Materias activas ───────────
export function crearTarjetaDato({ numero, etiqueta, nombreIcono, color }) {
  return `
    <div class="tarjeta tarjeta-dato" data-animar>
      <span class="icono-color ${color}">${icono(nombreIcono)}</span>
      <div>
        <div class="numero" ${Number.isInteger(numero) ? `data-contar="${numero}"` : ""}>${numero}</div>
        <div class="etiqueta-dato">${etiqueta}</div>
      </div>
    </div>`;
}

// ── Tarjeta de nota ─────────────────────────────────────────
export function crearTarjetaNota(nota, { conExtracto = true, conFavorita = false } = {}) {
  const materia = obtenerMateria(nota.materiaId);
  const clase = claseMateria(materia);
  const extracto = textoPlano(nota.contenido).slice(0, 160);

  const etiquetas = nota.etiquetas
    .map((e) => `<span class="etiqueta">#${escaparHTML(e)}</span>`)
    .join("");

  const favorita = conFavorita
    ? `<button class="boton-icono chico boton-favorita ${nota.favorita ? "activa" : ""}" type="button"
         data-accion="favorita" data-id="${nota.id}" aria-pressed="${nota.favorita}"
         aria-label="${nota.favorita ? "Quitar de favoritas" : "Marcar como favorita"}">${icono("estrella")}</button>`
    : "";

  return `
    <article class="tarjeta tarjeta-nota tarjeta-interactiva ${clase}" data-animar data-id="${nota.id}">
      <div class="cabeza">
        <span class="icono-color chico">${icono(materia ? materia.icono : "notas")}</span>
        ${favorita}
      </div>
      <h3><a class="enlace-tarjeta" href="${rutaBase()}paginas/nota.html?id=${nota.id}">${escaparHTML(nota.titulo || "Sin título")}</a></h3>
      <p class="meta">${fechaMedia(nota.actualizadoEn)} · ${materia ? escaparHTML(materia.nombre) : "Sin materia"}</p>
      ${conExtracto && extracto ? `<p class="extracto">${escaparHTML(extracto)}</p>` : ""}
      ${etiquetas ? `<div class="etiquetas">${etiquetas}</div>` : ""}
    </article>`;
}

// ── Fila de tarea ───────────────────────────────────────────
// detallada = true muestra prioridad, estado y botón de borrar (página Tareas)
export function crearFilaTarea(tarea, { detallada = false } = {}) {
  const materia = obtenerMateria(tarea.materiaId);
  const completada = tarea.estado === "completada";
  const vencida = !completada && tarea.fecha && diasDesdeHoy(tarea.fecha) < 0;

  const cuando = vencida
    ? `<span class="vencida">Vencida · ${fechaRelativa(tarea.fecha)}</span>`
    : `<span>${fechaRelativa(tarea.fecha)}</span>`;

  const nombreEstado = { pendiente: "Pendiente", en_progreso: "En progreso", completada: "Completada" }[tarea.estado];

  const extras = detallada
    ? `<div class="acciones">
         <button class="estado estado-${tarea.estado}" type="button" data-accion="estado" title="Cambiar estado">${nombreEstado}</button>
         <button class="boton-icono chico boton-borrar" type="button" data-accion="borrar" aria-label="Eliminar tarea">${icono("basura")}</button>
       </div>`
    : "";

  return `
    <li class="fila-tarea ${completada ? "completada" : ""}" data-id="${tarea.id}">
      <button class="anillo anillo-${tarea.prioridad} ${completada ? "marcado" : ""}" type="button" data-accion="completar"
        aria-label="${completada ? "Marcar como pendiente" : "Completar"}: ${escaparHTML(tarea.titulo)}">${icono("check")}</button>
      <div class="datos">
        <div class="titulo">${escaparHTML(tarea.titulo)}</div>
        <div class="meta">
          ${cuando}
          <span>·</span>
          <span>${materia ? escaparHTML(materia.nombre) : "Sin materia"}</span>
          ${detallada ? `<span class="prioridad prioridad-${tarea.prioridad}">${tarea.prioridad[0].toUpperCase() + tarea.prioridad.slice(1)}</span>` : ""}
        </div>
      </div>
      ${extras}
    </li>`;
}

// ── Tarjeta de materia (dashboard) ──────────────────────────
export function crearTarjetaMateria(materia) {
  const resumen = resumenMateria(materia.id);
  return `
    <a class="tarjeta tarjeta-materia tarjeta-interactiva ${claseMateria(materia)}" href="${rutaBase()}paginas/notas.html?materia=${materia.id}" data-animar>
      <span class="icono-color grande">${icono(materia.icono)}</span>
      <div class="pie">
        <div>
          <h3>${escaparHTML(materia.nombre)}</h3>
          <p class="meta">${plural(resumen.notas, "nota", "notas")} · ${plural(resumen.tareasPendientes, "tarea", "tareas")}</p>
        </div>
        <span class="ir">${icono("flecha")}</span>
      </div>
    </a>`;
}

// ── Fila de materia (celular) ───────────────────────────────
export function crearFilaMateria(materia) {
  const resumen = resumenMateria(materia.id);
  return `
    <a class="fila-materia ${claseMateria(materia)}" href="${rutaBase()}paginas/notas.html?materia=${materia.id}" data-animar>
      <span class="icono-color">${icono(materia.icono)}</span>
      <span class="datos">
        <h3>${escaparHTML(materia.nombre)}</h3>
        <span class="meta">${plural(resumen.notas, "nota", "notas")} · ${plural(resumen.tareasPendientes, "tarea", "tareas")}</span>
      </span>
      ${icono("derecha")}
    </a>`;
}

// ── Opciones <option> con las materias ──────────────────────
export function opcionesMaterias(materias, seleccionada = "", textoVacio = "Sin materia") {
  const vacia = `<option value="">${textoVacio}</option>`;
  return vacia + materias
    .map((m) => `<option value="${m.id}" ${String(seleccionada) === String(m.id) ? "selected" : ""}>${escaparHTML(m.nombre)}</option>`)
    .join("");
}

// ── Estado vacío ────────────────────────────────────────────
export function crearEstadoVacio({ nombreIcono, titulo, texto, boton = "" }) {
  return `
    <div class="estado-vacio">
      <span class="icono-color grande">${icono(nombreIcono)}</span>
      <h3>${titulo}</h3>
      <p>${texto}</p>
      ${boton}
    </div>`;
}

// ── Clics dentro de una lista de tareas ─────────────────────
// Completar (anillo), cambiar estado (pastilla) y borrar.
// "alCambiar" se llama después para volver a dibujar la página.
const SIGUIENTE_ESTADO = { pendiente: "en_progreso", en_progreso: "completada", completada: "pendiente" };

export function activarListaTareas(contenedor, alCambiar) {
  contenedor.addEventListener("click", function (evento) {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;

    const fila = boton.closest(".fila-tarea");
    const id = fila.dataset.id;
    const tarea = obtenerTareas().find((t) => t.id === id);
    const accion = boton.dataset.accion;

    if (accion === "completar") {
      const completar = tarea.estado !== "completada";
      guardarTarea({ id, estado: completar ? "completada" : "pendiente" });
      boton.classList.toggle("marcado", completar);
      fila.classList.toggle("completada", completar);
      if (completar) {
        animarCheck(boton);
        mostrarAviso(`¡Bien! "${tarea.titulo}" completada`);
      }
      // Pequeña pausa para que se vea el ✓ antes de redibujar
      setTimeout(alCambiar, completar ? 650 : 0);
    }

    if (accion === "estado") {
      guardarTarea({ id, estado: SIGUIENTE_ESTADO[tarea.estado] });
      alCambiar();
    }

    if (accion === "borrar" && confirmar(`¿Eliminar la tarea "${tarea.titulo}"?`)) {
      desaparecer(fila, function () {
        eliminarTarea(id);
        mostrarAviso("Tarea eliminada");
        alCambiar();
      });
    }
  });
}

// ── Tarjeta de materia con progreso (inicio, color suave) ───
export function crearTarjetaProgreso(materia) {
  const r = resumenMateria(materia.id);
  return `
    <a class="materia-progreso ${claseMateria(materia)}" href="${rutaBase()}paginas/notas.html?materia=${materia.id}" data-animar>
      <div class="cabeza">
        <span class="circulo-icono">${icono(materia.icono)}</span>
        <span class="ir">${icono("flecha")}</span>
      </div>
      <div>
        <h3>${escaparHTML(materia.nombre)}</h3>
        <p class="meta">${plural(r.notas, "nota", "notas")} · ${plural(r.tareasPendientes, "tarea pendiente", "tareas pendientes")}</p>
      </div>
      <div class="barra-progreso" style="--progreso: ${r.progreso}%"><span></span></div>
      <div class="pie"><span>Progreso</span><span>${r.progreso}%</span></div>
    </a>`;
}
