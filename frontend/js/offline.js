// NoteFlow · offline.js
// Página "Sin conexión": vuelve a la app apenas regrese el internet.
function volver() {
  window.location.href = "/paginas/inicio.html";
}
document.getElementById("reintentar").addEventListener("click", volver);
window.addEventListener("online", volver);
