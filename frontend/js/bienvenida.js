// ═══════════════════════════════════════════════════════════
// NoteFlow · bienvenida.js
// Página pública (index.html):
//   · botón "Iniciar" → modal para entrar con el correo
//   · con base de datos (Neon): correo → código → app
//   · en modo local: correo → app
//   · escena 3D del hero y animaciones de entrada
// Si ya hay sesión, "Iniciar" pasa a ser "Ir a mi espacio".
// ═══════════════════════════════════════════════════════════

import { usuario, modo, correoValido, enviarCodigo, verificarCodigo, entrarLocal } from "./sesion.js";
import { pintarIconos } from "./iconos.js";
import "./pwa.js";

const RUTA_APP = "paginas/inicio.html";
const ESPERA_REENVIO = 60; // segundos antes de poder pedir otro código
const VIGENCIA_CODIGO = 10 * 60 * 1000;
const CLAVE_ACCESO_PENDIENTE = "noteflow-acceso-pendiente";

const pasoCorreo = document.getElementById("paso-correo");
const pasoCodigo = document.getElementById("paso-codigo");
let correoActual = "";
let ultimoEnvio = 0;

function puedeAnimar() {
  return Boolean(window.gsap) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ── Modales (versión mínima: esta página no carga app.js) ───
let antesDelModal = null;

// La política de privacidad puede abrirse ENCIMA del modal de acceso
function abrirModal(id, { enfocar = true } = {}) {
  const modal = document.getElementById(id);
  antesDelModal = document.activeElement;
  modal.classList.add("abierto");
  document.body.style.overflow = "hidden";
  const campo = modal.querySelector("form:not([hidden]) input:not([type=checkbox])");
  if (campo && enfocar) setTimeout(() => campo.focus(), 80);
}

function cerrarModal(modal) {
  if (!modal) return;
  modal.classList.remove("abierto");
  if (!document.querySelector(".modal.abierto")) document.body.style.overflow = "";
  if (antesDelModal) antesDelModal.focus();
}

document.addEventListener("click", function (evento) {
  const abrir = evento.target.closest("[data-abrir-modal]");
  if (abrir) return abrirModal(abrir.dataset.abrirModal);
  const cerrar = evento.target.closest("[data-cerrar-modal]");
  if (cerrar) cerrarModal(cerrar.closest(".modal"));
});
document.addEventListener("keydown", (evento) => evento.key === "Escape" && cerrarModal(document.querySelector(".modal.abierto")));

// ── Errores en los campos ───────────────────────────────────
function mostrarError(campo, mensaje) {
  const contenedor = campo.closest(".campo");
  contenedor.classList.toggle("con-error", Boolean(mensaje));
  contenedor.querySelector(".mensaje-error").textContent = mensaje;
}

function ocupado(boton, estaOcupado, texto) {
  boton.setAttribute("aria-busy", estaOcupado);
  boton.textContent = texto;
}

// ── Botones "Iniciar" ───────────────────────────────────────
function prepararBotonesIniciar() {
  if (usuario) {
    // Ya tiene sesión: entrar directo
    document.querySelectorAll("[data-texto-iniciar]").forEach((t) => (t.textContent = "Ir a mi espacio"));
    document.querySelectorAll(".encabezado-web [data-iniciar]").forEach((b) => (b.textContent = "Mi espacio"));
  }

  document.addEventListener("click", function (evento) {
    if (!evento.target.closest("[data-iniciar]")) return;
    if (usuario) return (window.location.href = RUTA_APP);
    mostrarPaso(correoActual ? "codigo" : "correo");
    abrirModal("modal-acceso");
  });

  document.getElementById("aviso-modo").hidden = modo !== "local";
}

function mostrarPaso(paso, { enfocar = true, animar = true } = {}) {
  pasoCorreo.hidden = paso !== "correo";
  pasoCodigo.hidden = paso !== "codigo";
  const visible = paso === "correo" ? pasoCorreo : pasoCodigo;
  if (animar && puedeAnimar()) window.gsap.from(visible, { opacity: 0, x: paso === "codigo" ? 16 : -16, duration: 0.35, ease: "power2.out" });
  if (enfocar) setTimeout(() => visible.querySelector("input:not([type=checkbox])").focus(), 60);
}

function guardarAccesoPendiente() {
  try {
    localStorage.setItem(CLAVE_ACCESO_PENDIENTE, JSON.stringify({
      correo: correoActual,
      enviadoEn: ultimoEnvio,
      venceEn: ultimoEnvio + VIGENCIA_CODIGO
    }));
  } catch (error) {
    console.warn("NoteFlow: no se pudo conservar el inicio de sesión", error);
  }
}

function borrarAccesoPendiente() {
  try {
    localStorage.removeItem(CLAVE_ACCESO_PENDIENTE);
  } catch (error) {
    console.warn("NoteFlow: no se pudo limpiar el inicio de sesión pendiente", error);
  }
}

function restaurarAccesoPendiente() {
  if (modo !== "nube") return;
  if (usuario) {
    borrarAccesoPendiente();
    return;
  }

  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_ACCESO_PENDIENTE) || "null");
    if (!guardado || !correoValido(guardado.correo) || !Number.isFinite(guardado.venceEn) || guardado.venceEn <= Date.now()) {
      borrarAccesoPendiente();
      return;
    }

    correoActual = guardado.correo;
    ultimoEnvio = Number.isFinite(guardado.enviadoEn) ? guardado.enviadoEn : Date.now();
    document.getElementById("correo-enviado").textContent = correoActual;
    mostrarPaso("codigo", { enfocar: false, animar: false });
    abrirModal("modal-acceso", { enfocar: false });
    iniciarCuentaRegresiva(ultimoEnvio);
  } catch (error) {
    console.warn("NoteFlow: no se pudo restaurar el inicio de sesión pendiente", error);
    borrarAccesoPendiente();
  }
}

// ── Paso 1: correo ──────────────────────────────────────────
pasoCorreo.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const correo = pasoCorreo.correo.value.trim().toLowerCase();
  const acepto = pasoCorreo.acepto.checked;

  mostrarError(pasoCorreo.correo, correoValido(correo) ? "" : "Escribe un correo válido, por ejemplo: nombre@gmail.com");
  document.getElementById("error-acepto").textContent = acepto ? "" : "Para continuar, acepta la política de privacidad.";
  if (!correoValido(correo) || !acepto) return;

  // Modo local: entrar de una vez
  if (modo === "local") {
    entrarLocal(correo);
    window.location.href = RUTA_APP;
    return;
  }

  // Modo nube: el servidor envía el código al correo
  const boton = document.getElementById("boton-continuar");
  ocupado(boton, true, "Enviando código…");
  correoActual = correo;
  ultimoEnvio = Date.now();
  guardarAccesoPendiente();
  try {
    await enviarCodigo(correo);
    document.getElementById("correo-enviado").textContent = correo;
    pasoCodigo.codigo.value = "";
    mostrarPaso("codigo");
    iniciarCuentaRegresiva(ultimoEnvio);
  } catch (error) {
    borrarAccesoPendiente();
    correoActual = "";
    ultimoEnvio = 0;
    mostrarError(pasoCorreo.correo, error.message);
  } finally {
    ocupado(boton, false, "Continuar");
  }
});

// ── Paso 2: código ──────────────────────────────────────────
pasoCodigo.codigo.addEventListener("input", function () {
  // Solo números
  pasoCodigo.codigo.value = pasoCodigo.codigo.value.replace(/\D/g, "").slice(0, 6);
});

pasoCodigo.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const codigo = pasoCodigo.codigo.value.trim();
  if (!/^\d{6}$/.test(codigo)) {
    mostrarError(pasoCodigo.codigo, "El código tiene 6 números. Cópialo del correo.");
    return;
  }

  const boton = document.getElementById("boton-verificar");
  ocupado(boton, true, "Verificando…");
  try {
    await verificarCodigo(correoActual, codigo);
    borrarAccesoPendiente();
    window.location.href = RUTA_APP;
  } catch (error) {
    mostrarError(pasoCodigo.codigo, error.message);
    ocupado(boton, false, "Entrar");
  }
});

document.getElementById("otro-correo").addEventListener("click", () => {
  borrarAccesoPendiente();
  correoActual = "";
  ultimoEnvio = 0;
  pasoCorreo.reset();
  mostrarPaso("correo");
});

// Reenviar código (con espera para no saturar el correo)
let temporizador = null;
function iniciarCuentaRegresiva(enviadoEn = Date.now()) {
  const boton = document.getElementById("reenviar");
  clearInterval(temporizador);
  temporizador = setInterval(function () {
    const segundos = Math.ceil((enviadoEn + ESPERA_REENVIO * 1000 - Date.now()) / 1000);
    boton.textContent = segundos > 0 ? `Reenviar en ${segundos} s` : "Reenviar código";
    boton.disabled = segundos > 0;
    if (segundos <= 0) {
      clearInterval(temporizador);
    }
  }, 1000);
  const segundos = Math.ceil((enviadoEn + ESPERA_REENVIO * 1000 - Date.now()) / 1000);
  boton.textContent = segundos > 0 ? `Reenviar en ${segundos} s` : "Reenviar código";
  boton.disabled = segundos > 0;
  if (segundos <= 0) clearInterval(temporizador);
}

document.getElementById("reenviar").addEventListener("click", async function () {
  ultimoEnvio = Date.now();
  guardarAccesoPendiente();
  iniciarCuentaRegresiva(ultimoEnvio);
  try {
    await enviarCodigo(correoActual);
    mostrarError(pasoCodigo.codigo, "");
  } catch (error) {
    mostrarError(pasoCodigo.codigo, error.message);
  }
});

// ── Encabezado con fondo al bajar ───────────────────────────
const encabezado = document.getElementById("encabezado");
window.addEventListener("scroll", () => encabezado.classList.toggle("con-fondo", window.scrollY > 10), { passive: true });

// ── Animaciones ─────────────────────────────────────────────
function animarPagina() {
  if (!puedeAnimar()) return;
  window.gsap.from("[data-entrada]", { opacity: 0, y: 18, duration: 0.7, stagger: 0.08, ease: "power3.out", clearProps: "opacity,transform" });

  // Las tarjetas de información aparecen al llegar a ellas
  const observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      window.gsap.from(entrada.target, { opacity: 0, y: 24, duration: 0.6, ease: "power3.out", clearProps: "opacity,transform" });
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll("[data-revelar]").forEach((el) => observador.observe(el));
}

// Escena 3D (solo en pantallas grandes y cuando el navegador esté libre)
function cargarEscena3D() {
  if (!window.matchMedia("(min-width: 768px)").matches) return;
  const cargar = () => import("../3d/escena.js").then((m) => m.crearEscena(document.getElementById("escena-3d"))).catch(() => {});
  if ("requestIdleCallback" in window) requestIdleCallback(cargar, { timeout: 1500 });
  else setTimeout(cargar, 400);
}

document.getElementById("anio").textContent = new Date().getFullYear();
pintarIconos();
prepararBotonesIniciar();
restaurarAccesoPendiente();
animarPagina();
cargarEscena3D();
