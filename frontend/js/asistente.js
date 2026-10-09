// ═══════════════════════════════════════════════════════════
// NoteFlow · asistente.js
// Chat con NoteFlow AI.
//
// 1. Envía el mensaje al backend: POST /api/ia/chat
// 2. Si el backend todavía no tiene IA (Fase 7 → responde 501),
//    usa el MODO DEMOSTRACIÓN: respuestas armadas con reglas
//    simples a partir de tus materias, tareas y notas reales.
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import { obtenerChat, agregarMensajeChat, borrarChat, obtenerTareasPendientes, obtenerMaterias, obtenerMateria, obtenerNotas, resumenMateria, obtenerPerfil } from "./datos.js";
import { escaparHTML, normalizar, textoPlano, fechaRelativa } from "./utilidades.js";
import { puedeAnimar } from "./animaciones.js";

const SUGERENCIAS = [
  "¿Qué debería estudiar hoy?",
  "Resume mi última nota",
  "Hazme preguntas sobre mi última nota",
  "Crea un plan para mi examen",
  "¿Qué tareas tengo pendientes?"
];

const zonaMensajes = document.getElementById("chat-mensajes");
const cajaTexto = document.getElementById("mensaje-chat");

// ── Dibujar mensajes ────────────────────────────────────────
function crearBurbuja(mensaje) {
  if (mensaje.rol === "usuario") {
    return `<div class="mensaje mensaje-usuario"><div class="burbuja">${escaparHTML(mensaje.texto).replaceAll("\n", "<br>")}</div></div>`;
  }
  // "ia-demo" = HTML armado aquí mismo con datos ya escapados
  const contenido = mensaje.rol === "ia-demo" ? mensaje.texto : `<p>${escaparHTML(mensaje.texto).replaceAll("\n", "<br>")}</p>`;
  return `<div class="mensaje mensaje-ia"><span class="avatar-ia">${icono("ia")}</span><div class="burbuja">${contenido}</div></div>`;
}

function mostrarBienvenida() {
  const nombre = escaparHTML(obtenerPerfil().nombre.split(" ")[0]);
  zonaMensajes.innerHTML = `
    <div class="chat-bienvenida">
      <span class="avatar-ia">${icono("ia")}</span>
      <h2>Hola, ${nombre}. ¿En qué te ayudo?</h2>
      <p>Conozco tus materias, tareas y notas. Pregúntame lo que quieras o elige una idea:</p>
      <div class="sugerencias">
        ${SUGERENCIAS.map((s) => `<button class="chip" type="button" data-sugerencia="${escaparHTML(s)}">${escaparHTML(s)}</button>`).join("")}
      </div>
    </div>`;
}

function mostrarChat() {
  const mensajes = obtenerChat();
  if (!mensajes.length) return mostrarBienvenida();
  zonaMensajes.innerHTML = mensajes.map(crearBurbuja).join("");
  zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
}

function agregarBurbuja(mensaje) {
  if (zonaMensajes.querySelector(".chat-bienvenida")) zonaMensajes.innerHTML = "";
  zonaMensajes.insertAdjacentHTML("beforeend", crearBurbuja(mensaje));
  const nueva = zonaMensajes.lastElementChild;
  if (puedeAnimar()) window.gsap.from(nueva, { opacity: 0, y: 8, duration: 0.35, ease: "power2.out" });
  zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
  return nueva;
}

// ── Modo demostración ───────────────────────────────────────
const lista = (items) => `<ul>${items.map((i) => `<li>${icono("check")}<span>${i}</span></li>`).join("")}</ul>`;
const pie = (texto) => `<p class="nota-modo">Modo demostración · ${escaparHTML(texto)}</p>`;

function planDeHoy() {
  const pendientes = obtenerTareasPendientes().slice(0, 3);
  const materias = obtenerMaterias()
    .map((m) => ({ ...m, progreso: resumenMateria(m.id).progreso }))
    .sort((a, b) => a.progreso - b.progreso);

  if (!pendientes.length && !materias.length) return "<p>No tienes tareas ni materias todavía. ¡Crea algunas y armamos tu plan!</p>";

  const bloques = pendientes.map(function (tarea, i) {
    const materia = obtenerMateria(tarea.materiaId);
    const minutos = tarea.prioridad === "alta" ? 45 : 30;
    return `<strong>${i + 1}. ${escaparHTML(materia ? materia.nombre : "General")} (${minutos} min)</strong><br>${escaparHTML(tarea.titulo)} · ${fechaRelativa(tarea.fecha)}`;
  });

  const floja = materias[0];
  if (floja) bloques.push(`<strong>${bloques.length + 1}. Repaso de ${escaparHTML(floja.nombre)} (20 min)</strong><br>Es la materia con menos avance (${floja.progreso}%).`);

  return `
    <p>Basándome en tus materias y tareas pendientes, te recomiendo:</p>
    ${lista(bloques)}
    <p>${icono("bombilla", "icono-consejo")} Consejo: toma 5 minutos de descanso entre bloques y deja el celular en modo avión.</p>
    <p>¡Tú puedes! 💪</p>`;
}

function resumenUltimaNota() {
  const nota = obtenerNotas()[0];
  if (!nota) return "<p>Aún no tienes notas para resumir.</p>";
  const documento = new DOMParser().parseFromString(nota.contenido, "text/html");
  const temas = [...documento.querySelectorAll("h1, h2")].map((h) => escaparHTML(h.textContent.trim()));
  const primera = textoPlano(nota.contenido).split(/(?<=[.!?])\s/)[0];
  return `
    <p>Resumen de <strong>${escaparHTML(nota.titulo)}</strong>:</p>
    ${temas.length ? lista(temas) : ""}
    <p><strong>Idea principal:</strong> ${escaparHTML(primera)}</p>`;
}

function preguntasUltimaNota() {
  const nota = obtenerNotas()[0];
  if (!nota) return "<p>Crea una nota y te hago preguntas sobre ella.</p>";
  const documento = new DOMParser().parseFromString(nota.contenido, "text/html");
  const temas = [...documento.querySelectorAll("h1, h2, strong")].map((h) => h.textContent.replace(/[:.]$/, "").replace(/^\d+\.\s*/, "").trim()).filter((t) => t.length > 2).slice(0, 4);
  const preguntas = (temas.length ? temas : [nota.titulo]).map((t) => `¿Qué sabes de <em>${escaparHTML(t)}</em>? Explícalo con tus palabras.`);
  return `<p>Preguntas para repasar <strong>${escaparHTML(nota.titulo)}</strong>:</p>${lista(preguntas)}<p>Respóndelas sin mirar la nota y luego compara.</p>`;
}

function tareasPendientes() {
  const pendientes = obtenerTareasPendientes().slice(0, 6);
  if (!pendientes.length) return "<p>¡No tienes tareas pendientes! 🎉</p>";
  return `<p>Estas son tus próximas tareas:</p>${lista(pendientes.map((t) => `${escaparHTML(t.titulo)} · ${fechaRelativa(t.fecha)}`))}`;
}

function respuestaDemostracion(texto, motivo) {
  const t = normalizar(texto);
  let html;
  if (t.includes("resum")) html = resumenUltimaNota();
  else if (t.includes("pregunta")) html = preguntasUltimaNota();
  else if (t.includes("pendiente") || t.includes("tareas")) html = tareasPendientes();
  else if (t.includes("hoy") || t.includes("estudi") || t.includes("plan") || t.includes("examen")) html = planDeHoy();
  else html = `<p>Todavía no estoy conectado a la IA real, así que no puedo responder preguntas abiertas. En este modo puedo:</p>${lista(SUGERENCIAS.map(escaparHTML))}`;
  return html + pie(motivo);
}

// ── Enviar ──────────────────────────────────────────────────
async function enviar(texto) {
  const mensaje = texto.trim();
  if (!mensaje) return;

  agregarMensajeChat("usuario", mensaje);
  agregarBurbuja({ rol: "usuario", texto: mensaje });
  cajaTexto.value = "";
  ajustarAltura();

  const escribiendo = agregarBurbuja({ rol: "ia-demo", texto: '<div class="escribiendo"><span></span><span></span><span></span></div>' });

  let motivo = "";
  try {
    const respuesta = await fetch("/api/ia/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje })
    });
    const datos = await respuesta.json();
    if (respuesta.ok && datos.respuesta) {
      escribiendo.remove();
      agregarMensajeChat("ia", datos.respuesta);
      agregarBurbuja({ rol: "ia", texto: datos.respuesta });
      return;
    }
    motivo = datos.error || "sin respuesta del servidor";
  } catch (error) {
    motivo = "no hay conexión con el servidor";
  }

  // Pequeña espera para que se note el "escribiendo…"
  await new Promise((listo) => setTimeout(listo, 500));
  escribiendo.remove();
  const html = respuestaDemostracion(mensaje, motivo);
  agregarMensajeChat("ia-demo", html);
  agregarBurbuja({ rol: "ia-demo", texto: html });
}

// La caja de texto crece mientras escribes
function ajustarAltura() {
  cajaTexto.style.height = "auto";
  cajaTexto.style.height = `${Math.min(cajaTexto.scrollHeight, 140)}px`;
}

// ── Eventos ─────────────────────────────────────────────────
document.getElementById("formulario-chat").addEventListener("submit", function (evento) {
  evento.preventDefault();
  enviar(cajaTexto.value);
});

// Enter envía; Shift + Enter hace salto de línea
cajaTexto.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter" && !evento.shiftKey) {
    evento.preventDefault();
    enviar(cajaTexto.value);
  }
});
cajaTexto.addEventListener("input", ajustarAltura);

zonaMensajes.addEventListener("click", function (evento) {
  const sugerencia = evento.target.closest("[data-sugerencia]");
  if (sugerencia) enviar(sugerencia.dataset.sugerencia);
});

document.getElementById("nueva-conversacion").addEventListener("click", function () {
  borrarChat();
  mostrarChat();
  cajaTexto.focus();
});

mostrarChat();
