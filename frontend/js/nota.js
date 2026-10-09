// ═══════════════════════════════════════════════════════════
// NoteFlow · nota.js
// Vista y editor de UNA nota.
//   nota.html?id=2     → abre la nota 2
//   nota.html?nueva=1  → nota nueva (se crea al escribir algo)
// Se guarda sola mientras escribes (autoguardado).
// ═══════════════════════════════════════════════════════════

import { obtenerNota, obtenerMaterias, guardarNota, eliminarNota, cambiarFavorita, subirImagen, obtenerUsuario } from "./datos.js";
import { opcionesMaterias, crearEstadoVacio } from "./componentes.js";
import { mostrarAviso, confirmar } from "./app.js";
import { animarEntrada } from "./animaciones.js";
import { icono } from "./iconos.js";
import { limpiarHTML, textoPlano, esperar, leerParametro, fechaMedia, escaparHTML } from "./utilidades.js";

const TAMANO_MAXIMO_IMAGEN = 15 * 1024 * 1024; // 15 MB (después se comprime a menos de 1 MB)
const TIPOS_IMAGEN = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const campos = {
  titulo: document.getElementById("titulo-nota"),
  materia: document.getElementById("materia-nota"),
  etiquetas: document.getElementById("etiquetas-nota"),
  contenido: document.getElementById("contenido-nota"),
  fecha: document.getElementById("fecha-nota"),
  estado: document.getElementById("estado-guardado"),
  favorita: document.getElementById("boton-favorita")
};

let nota = null;        // la nota abierta (null = nueva sin guardar)
let hayCambios = false; // ¿hay algo escrito que aún no se guarda?

// ── Cargar la nota en el editor ─────────────────────────────
function cargarNota() {
  const id = leerParametro("id");

  if (id) {
    nota = obtenerNota(id);
    if (!nota) return mostrarNoEncontrada();
  }

  const materiaInicial = nota ? nota.materiaId : leerParametro("materia");
  campos.materia.innerHTML = opcionesMaterias(obtenerMaterias(), materiaInicial || "");

  if (nota) {
    campos.titulo.value = nota.titulo;
    campos.etiquetas.value = nota.etiquetas.join(", ");
    campos.contenido.innerHTML = limpiarHTML(nota.contenido);
    campos.fecha.textContent = `Editada ${fechaMedia(nota.actualizadoEn)}`;
    marcarFavorita(nota.favorita);
    document.title = `${nota.titulo || "Nota"} · NoteFlow`;
  } else {
    campos.fecha.textContent = "Nota nueva";
    setTimeout(() => campos.titulo.focus(), 100);
  }
}

function mostrarNoEncontrada() {
  document.querySelector(".editor-nota").innerHTML = crearEstadoVacio({
    nombreIcono: "notas",
    titulo: "Esta nota no existe",
    texto: "Puede que la hayas eliminado.",
    boton: '<a class="boton boton-primario" href="notas.html">Volver a mis notas</a>'
  });
}

// ── Etiquetas: "BD, #mer , bd" → ["bd", "mer"] ──────────────
function leerEtiquetas(texto) {
  const lista = texto
    .split(",")
    .map((e) => e.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-"))
    .filter((e) => /^[a-z0-9áéíóúñü_-]{1,30}$/.test(e));
  return [...new Set(lista)].slice(0, 10); // sin repetidas, máximo 10
}

// ── Guardar ─────────────────────────────────────────────────
function guardar() {
  hayCambios = false;
  const cambios = {
    titulo: campos.titulo.value.trim(),
    materiaId: campos.materia.value || null,
    etiquetas: leerEtiquetas(campos.etiquetas.value),
    contenido: limpiarHTML(campos.contenido.innerHTML)
  };

  // Una nota nueva totalmente vacía no se guarda
  if (!nota && !cambios.titulo && !textoPlano(cambios.contenido)) {
    campos.estado.textContent = "";
    return;
  }

  const guardada = guardarNota(nota ? { ...cambios, id: nota.id } : cambios);

  if (!guardada) {
    campos.estado.innerHTML = "";
    mostrarAviso("No se pudo guardar: el navegador no tiene espacio (¿imágenes muy grandes?)", "error");
    return;
  }

  // Si era nueva, la dirección pasa a ?id=… para no crearla dos veces
  if (!nota) history.replaceState(null, "", `nota.html?id=${guardada.id}`);
  nota = guardada;

  campos.estado.innerHTML = `${icono("check")}Guardado`;
  campos.fecha.textContent = `Editada ${fechaMedia(nota.actualizadoEn)}`;
}

const guardarDespues = esperar(guardar, 600);

function alEscribir() {
  hayCambios = true;
  campos.estado.textContent = "Guardando…";
  guardarDespues();
}

// ── Barra de formato ────────────────────────────────────────
// document.execCommand es la forma más sencilla de dar formato
// dentro de un contenteditable (suficiente para un editor simple).
function aplicarFormato(formato) {
  campos.contenido.focus();

  const bloques = { h1: "h1", h2: "h2", p: "p", pre: "pre" };
  if (bloques[formato]) document.execCommand("formatBlock", false, bloques[formato]);
  if (formato === "bold") document.execCommand("bold");
  if (formato === "italic") document.execCommand("italic");
  if (formato === "ul") document.execCommand("insertUnorderedList");
  if (formato === "ol") document.execCommand("insertOrderedList");

  if (formato === "enlace") {
    const direccion = window.prompt("Dirección del enlace (https://…)");
    if (!direccion) return;
    if (!/^https?:\/\/\S+$/i.test(direccion.trim())) {
      mostrarAviso("El enlace debe empezar por http:// o https://", "error");
      return;
    }
    document.execCommand("createLink", false, direccion.trim());
  }

  if (formato === "imagen") {
    document.getElementById("archivo-imagen").click();
    return;
  }

  alEscribir();
}

// ── Imágenes (validación de tipo y tamaño) ──────────────────
async function insertarImagen(archivo) {
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    mostrarAviso("Solo se permiten imágenes PNG, JPG, WEBP o GIF", "error");
    return;
  }
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    mostrarAviso("La imagen pesa más de 15 MB. Elige una más liviana", "error");
    return;
  }

  // Se comprime y se sube al servidor (en modo local se guarda dentro de la nota)
  campos.estado.textContent = "Subiendo imagen…";
  try {
    const direccion = await subirImagen(archivo);
    campos.contenido.focus();
    document.execCommand("insertImage", false, direccion);
    alEscribir();
  } catch (error) {
    campos.estado.textContent = "";
    mostrarAviso(error.message || "No se pudo subir la imagen. Inténtalo otra vez", "error");
  }
}

// ── Favorita y eliminar ─────────────────────────────────────
function marcarFavorita(activa) {
  campos.favorita.classList.toggle("activa", activa);
  campos.favorita.setAttribute("aria-pressed", activa);
  campos.favorita.setAttribute("aria-label", activa ? "Quitar de favoritas" : "Marcar como favorita");
}

// ── Preguntar a la IA sobre esta nota ───────────────────────
// Llama al backend (POST /api/ia/chat). Hasta la Fase 7 el backend
// responde 501, así que mostramos un resumen hecho con reglas simples.
function resumenSencillo() {
  const subtitulos = [...campos.contenido.querySelectorAll("h1, h2")].map((h) => h.textContent.trim()).filter(Boolean);
  const texto = textoPlano(campos.contenido.innerHTML);
  const primeraIdea = texto.split(/(?<=[.!?])\s/)[0] || "";
  let html = "";
  if (subtitulos.length) html += `<p><strong>Temas de la nota:</strong> ${subtitulos.map(escaparHTML).join(" · ")}</p>`;
  if (primeraIdea) html += `<p style="margin-top:6px"><strong>Idea principal:</strong> ${escaparHTML(primeraIdea)}</p>`;
  return html || "<p>La nota está vacía todavía.</p>";
}

async function preguntarIA(evento) {
  evento.preventDefault();
  const entrada = document.getElementById("pregunta-ia");
  const pregunta = entrada.value.trim();
  if (!pregunta) return;

  const caja = document.getElementById("respuesta-ia");
  caja.hidden = false;
  caja.innerHTML = `<span class="avatar-ia">${icono("ia")}</span><div class="escribiendo"><span></span><span></span><span></span></div>`;

  let mensajeServidor = "";
  try {
    const respuesta = await fetch("/api/ia/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: pregunta, notaId: nota ? nota.id : null })
    });
    const datos = await respuesta.json();
    if (respuesta.ok && datos.respuesta) {
      caja.innerHTML = `<span class="avatar-ia">${icono("ia")}</span><div><p>${escaparHTML(datos.respuesta)}</p></div>`;
      entrada.value = "";
      return;
    }
    mensajeServidor = datos.error || "";
  } catch (error) {
    mensajeServidor = "No hay conexión con el servidor.";
  }

  caja.innerHTML = `
    <span class="avatar-ia">${icono("ia")}</span>
    <div>
      ${resumenSencillo()}
      <p class="pequeno texto-tenue" style="margin-top:8px">Modo demostración · ${escaparHTML(mensajeServidor)}</p>
    </div>`;
  entrada.value = "";
}

// ── Eventos ─────────────────────────────────────────────────
document.execCommand("defaultParagraphSeparator", false, "p");

[campos.titulo, campos.etiquetas, campos.contenido].forEach((campo) => campo.addEventListener("input", alEscribir));
campos.materia.addEventListener("change", alEscribir);

// Guardar al salir de la página, solo si quedó algo sin guardar
function guardarAlSalir() {
  if (hayCambios) guardar();
}
window.addEventListener("pagehide", guardarAlSalir);

// Si sales justo después de escribir, se guarda ya y el navegador
// pregunta un momento para que el cambio alcance a llegar a la nube
window.addEventListener("beforeunload", function (evento) {
  if (!hayCambios || obtenerUsuario().modo !== "nube") return;
  guardar();
  evento.preventDefault();
  evento.returnValue = "";
});

const herramientas = document.getElementById("herramientas");
// mousedown + preventDefault: el texto seleccionado no pierde la selección
herramientas.addEventListener("mousedown", (evento) => evento.preventDefault());
herramientas.addEventListener("click", function (evento) {
  const boton = evento.target.closest("[data-formato]");
  if (boton) aplicarFormato(boton.dataset.formato);
});

document.getElementById("archivo-imagen").addEventListener("change", function (evento) {
  const archivo = evento.target.files[0];
  if (archivo) insertarImagen(archivo);
  evento.target.value = "";
});

// Pegar siempre como texto simple (evita traer estilos o código raro)
campos.contenido.addEventListener("paste", function (evento) {
  evento.preventDefault();
  const texto = evento.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, texto);
});

campos.favorita.addEventListener("click", function () {
  if (!nota) guardar();
  if (!nota) return mostrarAviso("Escribe algo antes de marcarla como favorita", "error");
  marcarFavorita(cambiarFavorita(nota.id));
});

document.getElementById("boton-eliminar").addEventListener("click", function () {
  if (!nota) return (window.location.href = "notas.html");
  if (!confirmar(`¿Eliminar la nota "${nota.titulo || "Sin título"}"? No se puede deshacer.`)) return;
  window.removeEventListener("pagehide", guardarAlSalir);
  hayCambios = false;
  eliminarNota(nota.id);
  window.location.href = "notas.html";
});

document.getElementById("formulario-ia").addEventListener("submit", preguntarIA);

cargarNota();
animarEntrada();
