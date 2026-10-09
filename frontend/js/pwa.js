// ═══════════════════════════════════════════════════════════
// NoteFlow · pwa.js
// Todo lo de "app instalable":
//   1. Registra el service worker (service-worker.js)
//   2. Guarda la invitación de instalar que da el navegador
//      y muestra los botones "Instalar app" (clase .puede-instalar)
//   3. En iPhone/iPad (Safari no tiene botón automático)
//      explica cómo agregarla a la pantalla de inicio
// Se importa desde app.js (páginas internas) y bienvenida.js (portada).
// ═══════════════════════════════════════════════════════════

const raiz = document.documentElement;
let invitacion = null; // el evento "beforeinstallprompt" guardado

// ¿Ya se abrió como app instalada?
export const enModoApp =
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPad nuevo

if (enModoApp) raiz.classList.add("modo-app");

// ── 1. Service worker ───────────────────────────────────────
// Solo funciona en https o en localhost
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/service-worker.js").catch(function (error) {
      console.warn("NoteFlow: no se pudo registrar el service worker", error);
    });
  });
}

// ── 2. Invitación para instalar (Chrome, Edge, Android) ─────
window.addEventListener("beforeinstallprompt", function (evento) {
  evento.preventDefault(); // la mostramos nosotros con nuestro botón
  invitacion = evento;
  raiz.classList.add("puede-instalar");
});

window.addEventListener("appinstalled", function () {
  invitacion = null;
  raiz.classList.remove("puede-instalar");
});

// En iPhone no hay invitación: mostramos el botón y explicamos los pasos
if (esIOS && !enModoApp) raiz.classList.add("puede-instalar");

// ── 3. Clic en cualquier botón "Instalar" ───────────────────
document.addEventListener("click", async function (evento) {
  if (!evento.target.closest("[data-instalar]")) return;

  if (invitacion) {
    invitacion.prompt();
    const { outcome } = await invitacion.userChoice;
    if (outcome === "accepted") raiz.classList.remove("puede-instalar");
    invitacion = null;
    return;
  }
  mostrarPasosIOS();
});

function mostrarPasosIOS() {
  let modal = document.getElementById("modal-instalar");
  if (!modal) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal" id="modal-instalar" role="dialog" aria-modal="true" aria-labelledby="titulo-instalar">
        <div class="modal-fondo" data-cerrar-instalar></div>
        <div class="modal-panel">
          <div class="tirador"></div>
          <div class="modal-cabecera">
            <h2 id="titulo-instalar">Instala NoteFlow</h2>
            <button class="boton-icono" type="button" data-cerrar-instalar aria-label="Cerrar">✕</button>
          </div>
          <div class="modal-cuerpo">
            <ol class="pasos-instalar">
              <li><span class="numero-paso">1</span><span>Abre esta página en <strong>Safari</strong>.</span></li>
              <li><span class="numero-paso">2</span><span>Toca el botón <strong>Compartir</strong> (el cuadro con la flecha hacia arriba).</span></li>
              <li><span class="numero-paso">3</span><span>Elige <strong>“Agregar a pantalla de inicio”</strong> y luego <strong>Agregar</strong>.</span></li>
            </ol>
            <p class="pequeno texto-secundario">Si usas Chrome o Edge en el computador, busca el ícono de instalar en la barra de direcciones.</p>
          </div>
        </div>
      </div>`);
    modal = document.getElementById("modal-instalar");
    modal.addEventListener("click", function (e) {
      if (!e.target.closest("[data-cerrar-instalar]")) return;
      modal.classList.remove("abierto");
      document.body.style.overflow = "";
    });
  }
  // Cierra la hoja "Más" (u otra) para que no queden dos encima
  document.querySelectorAll(".modal.abierto").forEach((m) => m.classList.remove("abierto"));
  modal.classList.add("abierto");
}
