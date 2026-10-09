// ═══════════════════════════════════════════════════════════
// NoteFlow · aviso-archivo.js
// Si abres un HTML con doble clic (file://), los módulos de
// JavaScript no cargan y la página queda sin menú.
// Este script (normal, no módulo) muestra cómo abrirla bien.
// ═══════════════════════════════════════════════════════════
if (location.protocol === "file:") {
  addEventListener("DOMContentLoaded", function () {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="aviso-archivo">NoteFlow necesita un servidor local. En la carpeta del proyecto ejecuta <code>npm start</code> y abre <code>http://localhost:3000</code>.</div>'
    );
  });
}
