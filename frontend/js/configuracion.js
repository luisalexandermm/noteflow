// ═══════════════════════════════════════════════════════════
// NoteFlow · configuracion.js
// Perfil, preferencias (animaciones y 3D) y manejo de datos.
// ═══════════════════════════════════════════════════════════

import { obtenerPerfil, guardarPerfil, esperarGuardado, obtenerPreferencias, guardarPreferencias, exportarDatos, borrarTodosMisDatos, obtenerUsuario } from "./datos.js";
import { mostrarAviso, confirmar, mostrarErrorCampo } from "./app.js";
import { animarEntrada } from "./animaciones.js";
import { iniciales } from "./navegacion.js";
import { hoyISO } from "./utilidades.js";

const formulario = document.getElementById("formulario-perfil");
const avatar = document.getElementById("avatar-perfil");

// ── Perfil ──────────────────────────────────────────────────
function cargarPerfil() {
  const perfil = obtenerPerfil();
  formulario.nombre.value = perfil.nombre;
  formulario.carrera.value = perfil.carrera;
  avatar.textContent = iniciales(perfil.nombre);
}

formulario.nombre.addEventListener("input", () => (avatar.textContent = iniciales(formulario.nombre.value || "?")));

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const nombre = formulario.nombre.value.trim();
  const error = nombre.length < 2 ? "Escribe tu nombre (mínimo 2 letras)." : "";
  mostrarErrorCampo(formulario.nombre, error);
  if (error) return;

  guardarPerfil({ nombre, carrera: formulario.carrera.value.trim() });
  await esperarGuardado();
  mostrarAviso("Perfil guardado");
  // Recargar para que el menú muestre el nombre nuevo
  setTimeout(() => window.location.reload(), 600);
});

// ── Preferencias ────────────────────────────────────────────
const prefAnimaciones = document.getElementById("pref-animaciones");
const prefEscena = document.getElementById("pref-escena");
const preferencias = obtenerPreferencias();
prefAnimaciones.checked = preferencias.animaciones !== false;
prefEscena.checked = preferencias.escena3d !== false;

prefAnimaciones.addEventListener("change", function () {
  guardarPreferencias({ animaciones: prefAnimaciones.checked });
  document.documentElement.classList.toggle("sin-animaciones", !prefAnimaciones.checked);
  mostrarAviso(prefAnimaciones.checked ? "Animaciones activadas" : "Animaciones desactivadas");
});

prefEscena.addEventListener("change", function () {
  guardarPreferencias({ escena3d: prefEscena.checked });
  mostrarAviso(prefEscena.checked ? "Escena 3D activada" : "Escena 3D desactivada");
});

// ── Datos ───────────────────────────────────────────────────
document.getElementById("boton-exportar").addEventListener("click", function () {
  const archivo = new Blob([exportarDatos()], { type: "application/json" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `noteflow-${hoyISO()}.json`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
  mostrarAviso("Copia descargada");
});

document.getElementById("boton-borrar-datos").addEventListener("click", async function () {
  if (!confirmar("¿Borrar TODAS tus materias, notas, tareas, eventos y chats?\nNo se puede deshacer. Te recomendamos descargar una copia antes.")) return;
  try {
    await borrarTodosMisDatos();
    mostrarAviso("Tus datos fueron borrados");
    setTimeout(() => window.location.reload(), 800);
  } catch (error) {
    mostrarAviso("No se pudieron borrar los datos. Inténtalo otra vez", "error");
  }
});

// ── Cuenta ──────────────────────────────────────────────────
const cuenta = obtenerUsuario();
document.getElementById("cuenta-correo").textContent = cuenta.correo;
document.getElementById("cuenta-modo").textContent = cuenta.modo === "nube"
  ? "Cuenta en la nube. Tus datos se guardan en el servidor y los ves en todos tus dispositivos."
  : "Modo local: tu espacio se guarda solo en este navegador.";

cargarPerfil();
animarEntrada();
