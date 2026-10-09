// ═══════════════════════════════════════════════════════════
// NoteFlow · app.js
// Código COMÚN a todas las páginas (se carga en cada HTML):
//   1. Navegación y buscador
//   2. Modales: abrir / cerrar
//   3. Avisos (toast) y confirmaciones
//   4. Preferencias (animaciones)
//
// Las páginas usan sus funciones así:
//   import { abrirModal, mostrarAviso } from "./app.js";
// ═══════════════════════════════════════════════════════════

import { iniciarNavegacion } from "./navegacion.js";
import { iniciarBuscador } from "./buscador.js";
import { pintarIconos, icono } from "./iconos.js";
import { obtenerPreferencias } from "./datos.js";
import { activarTransicionPaginas } from "./animaciones.js";
import { cerrarSesion } from "./sesion.js";
import "./pwa.js";

// ── 2. Modales ──────────────────────────────────────────────
let elementoAntesDelModal = null; // para devolver el foco al cerrar

export function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  // Si ya hay otro abierto, se cierra primero
  document.querySelectorAll(".modal.abierto").forEach((m) => m.classList.remove("abierto"));

  elementoAntesDelModal = document.activeElement;
  modal.classList.add("abierto");
  document.body.style.overflow = "hidden";

  const primerCampo = modal.querySelector("input:not([type=radio]), textarea, select");
  if (primerCampo) setTimeout(() => primerCampo.focus(), 80);
}

export function cerrarModal(modal) {
  if (!modal) return;
  modal.classList.remove("abierto");
  document.body.style.overflow = "";
  if (elementoAntesDelModal) elementoAntesDelModal.focus();
}

function activarModales() {
  document.addEventListener("click", function (evento) {
    const botonAbrir = evento.target.closest("[data-abrir-modal]");
    if (botonAbrir) {
      evento.preventDefault();
      abrirModal(botonAbrir.dataset.abrirModal);
      return;
    }
    const botonCerrar = evento.target.closest("[data-cerrar-modal]");
    if (botonCerrar) cerrarModal(botonCerrar.closest(".modal"));
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") cerrarModal(document.querySelector(".modal.abierto"));
  });

  // Cualquier botón con data-cerrar-sesion
  document.addEventListener("click", function (evento) {
    if (evento.target.closest("[data-cerrar-sesion]") && confirmar("¿Cerrar sesión en NoteFlow?")) cerrarSesion();
  });
}

// ── 3. Avisos ───────────────────────────────────────────────
let temporizadorAviso = null;

export function mostrarAviso(texto, tipo = "exito") {
  let aviso = document.getElementById("aviso");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "aviso";
    aviso.className = "aviso";
    aviso.setAttribute("role", "status");
    document.body.appendChild(aviso);
  }

  aviso.classList.toggle("error", tipo === "error");
  aviso.innerHTML = `${icono(tipo === "error" ? "cerrar" : "check")}<span></span>`;
  aviso.querySelector("span").textContent = texto; // textContent: nunca se ejecuta como HTML
  aviso.classList.add("visible");

  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("visible"), 2600);
}

// Pregunta antes de borrar algo
export function confirmar(mensaje) {
  return window.confirm(mensaje);
}

// Marca en rojo un campo con error (o lo limpia si mensaje = "")
export function mostrarErrorCampo(campo, mensaje) {
  const contenedor = campo.closest(".campo");
  contenedor.classList.toggle("con-error", mensaje !== "");
  const texto = contenedor.querySelector(".mensaje-error");
  if (texto) texto.textContent = mensaje;
}

// ── Inicio ──────────────────────────────────────────────────
function iniciarApp() {
  if (obtenerPreferencias().animaciones === false) {
    document.documentElement.classList.add("sin-animaciones");
  }

  // datos.js avisa cuando algo no se pudo guardar
  window.addEventListener("noteflow:error", (evento) => mostrarAviso(evento.detail, "error"));

  iniciarNavegacion();
  pintarIconos();
  activarModales();
  iniciarBuscador(abrirModal);
  activarTransicionPaginas();
}

iniciarApp();
