// ═══════════════════════════════════════════════════════════
// NoteFlow · service-worker.js
// Es lo que convierte a NoteFlow en una app instalable (PWA).
// Vive "entre" la app y el internet y decide de dónde sale cada archivo:
//
//   · Páginas, CSS y JS → primero internet (siempre lo más nuevo);
//                         si no hay conexión, la copia guardada.
//   · Fuentes, íconos, librerías → primero la copia guardada (rápido).
//   · /api/... → NUNCA se guarda: son tus datos privados y siempre
//                van directo al servidor.
//
// Cuando cambies archivos del frontend, sube la VERSION para que
// los celulares descarguen la copia nueva.
// ═══════════════════════════════════════════════════════════

const VERSION = "noteflow-v2";

// Lo mínimo para que la app abra sin internet
const ARCHIVOS_BASE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/css/bienvenida.css",
  "/css/componentes.css",
  "/css/estilos.css",
  "/css/paginas.css",
  "/css/responsive.css",
  "/fuentes/caveat-latin-500-normal.woff2",
  "/fuentes/geist-mono-latin-400-normal.woff2",
  "/fuentes/geist-mono-latin-500-normal.woff2",
  "/fuentes/geist-sans-latin-400-normal.woff2",
  "/fuentes/geist-sans-latin-500-normal.woff2",
  "/fuentes/geist-sans-latin-600-normal.woff2",
  "/img/cubo.svg",
  "/img/diagrama-er.svg",
  "/img/iconos/apple-touch-icon.png",
  "/img/iconos/favicon-32.png",
  "/img/iconos/icono-192.png",
  "/img/iconos/icono-512.png",
  "/img/iconos/icono-maskable-512.png",
  "/img/logo.svg",
  "/js/animaciones.js",
  "/js/api.js",
  "/js/app.js",
  "/js/asistente.js",
  "/js/aviso-archivo.js",
  "/js/bienvenida.js",
  "/js/buscador.js",
  "/js/calendario.js",
  "/js/componentes.js",
  "/js/configuracion.js",
  "/js/datos.js",
  "/js/enfoque.js",
  "/js/estadisticas.js",
  "/js/iconos.js",
  "/js/inicio.js",
  "/js/materias.js",
  "/js/navegacion.js",
  "/js/nota.js",
  "/js/offline.js",
  "/js/pwa.js",
  "/js/notas.js",
  "/js/sesion.js",
  "/js/tareas.js",
  "/js/utilidades.js",
  "/paginas/asistente.html",
  "/paginas/calendario.html",
  "/paginas/configuracion.html",
  "/paginas/estadisticas.html",
  "/paginas/inicio.html",
  "/paginas/materias.html",
  "/paginas/nota.html",
  "/paginas/notas.html",
  "/paginas/tareas.html",
  "/vendor/gsap/gsap.min.js"
];

// ── Instalar: guardar los archivos base ─────────────────────
self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(ARCHIVOS_BASE))
      .then(() => self.skipWaiting())
  );
});

// ── Activar: borrar las versiones viejas ────────────────────
self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// ── Cada petición ───────────────────────────────────────────
self.addEventListener("fetch", function (evento) {
  const peticion = evento.request;
  const url = new URL(peticion.url);

  // Solo GET de nuestro propio servidor, y nunca la API
  if (peticion.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const esCodigo = peticion.mode === "navigate" || /\.(html|css|js|webmanifest)$/.test(url.pathname);
  evento.respondWith(esCodigo ? primeroInternet(peticion) : primeroGuardado(peticion));
});

// Internet primero; si falla, la copia guardada; si no hay, la página "sin conexión"
async function primeroInternet(peticion) {
  const cache = await caches.open(VERSION);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch (error) {
    const guardada = await cache.match(peticion, { ignoreSearch: true });
    if (guardada) return guardada;
    if (peticion.mode === "navigate") return cache.match("/offline.html");
    return Response.error();
  }
}

// Copia guardada primero; si no existe, se descarga y se guarda
async function primeroGuardado(peticion) {
  const cache = await caches.open(VERSION);
  const guardada = await cache.match(peticion);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok) cache.put(peticion, respuesta.clone());
  return respuesta;
}
