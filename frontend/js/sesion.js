// ═══════════════════════════════════════════════════════════
// NoteFlow · sesion.js
// ¿Quién está usando la app? Registro e inicio con el correo.
//
// Dos modos (los decide el servidor en GET /api/config):
//   · "nube":  hay base de datos (Neon). Escribes tu correo, te llega
//              un código de 6 números y con eso entras. Si es la primera
//              vez, la cuenta se crea sola.
//   · "local": sin base de datos. Tu espacio vive solo en este
//              navegador (útil para desarrollar y probar).
//
// Al importar este archivo ya se sabe si hay alguien conectado:
//   import { usuario, modo } from "./sesion.js";
// ═══════════════════════════════════════════════════════════

import { pedir } from "./api.js";

const CLAVE_SESION_LOCAL = "noteflow-sesion-local";

export let modo = "local"; // "nube" o "local"
export let usuario = null; // { id, correo } o null si no hay sesión

function rutaBase() {
  return window.location.pathname.includes("/paginas/") ? "../" : "";
}

// Recordamos el último modo para saber qué hacer sin internet
function guardarModo(valor) {
  try { localStorage.setItem("noteflow-modo", valor); } catch (error) { /* sin almacenamiento */ }
}
function leerModo() {
  try { return localStorage.getItem("noteflow-modo"); } catch (error) { return null; }
}

// ── Revisar la sesión al abrir cualquier página ─────────────
async function revisarSesion() {
  try {
    const config = await pedir("/api/config");
    modo = config.modo === "nube" ? "nube" : "local";
    guardarModo(modo);
  } catch (error) {
    // Sin internet (error sin código) y la cuenta está en la nube:
    // mostramos la página "Sin conexión" en vez de un espacio vacío.
    if (error.status === undefined && leerModo() === "nube") {
      window.location.replace(`${rutaBase()}offline.html`);
      await new Promise(() => {}); // la página no sigue
    }
    modo = "local"; // sin backend (por ejemplo, Live Server)
  }

  if (modo === "nube") {
    const respuesta = await pedir("/api/auth/sesion").catch(() => ({ usuario: null }));
    usuario = respuesta.usuario;
    return;
  }

  try {
    const correo = localStorage.getItem(CLAVE_SESION_LOCAL);
    if (correo) usuario = { id: correo, correo };
  } catch (error) {
    console.warn("NoteFlow: el navegador no permite guardar datos", error);
  }
}

await revisarSesion();

// ── Validar el correo ───────────────────────────────────────
export function correoValido(correo) {
  return correo.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo);
}

// ── Paso 1: pedir el código (modo nube) ─────────────────────
export async function enviarCodigo(correo) {
  await pedir("/api/auth/enviar-codigo", { metodo: "POST", cuerpo: { correo } });
}

// ── Paso 2: verificar el código que llegó al correo ─────────
export async function verificarCodigo(correo, codigo) {
  const respuesta = await pedir("/api/auth/verificar", { metodo: "POST", cuerpo: { correo, codigo } });
  usuario = respuesta.usuario;
}

// ── Modo local: entrar solo con el correo ───────────────────
export function entrarLocal(correo) {
  localStorage.setItem(CLAVE_SESION_LOCAL, correo);
  usuario = { id: correo, correo };
}

// ── Cerrar sesión ───────────────────────────────────────────
export async function cerrarSesion() {
  if (modo === "nube") await pedir("/api/auth/salir", { metodo: "POST", cuerpo: {} }).catch(() => {});
  else localStorage.removeItem(CLAVE_SESION_LOCAL);
  usuario = null;
  window.location.href = `${rutaBase()}index.html`;
}

// ── Páginas privadas: sin sesión, de vuelta a la bienvenida ─
export function exigirSesion() {
  if (usuario) return;
  window.location.replace(`${rutaBase()}index.html`);
  return new Promise(() => {}); // la página no sigue cargando
}
