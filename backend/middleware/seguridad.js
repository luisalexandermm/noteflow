// ═══════════════════════════════════════════════════════════
// NoteFlow · middleware/seguridad.js
// Cabeceras HTTP que protegen al navegador del usuario.
// ═══════════════════════════════════════════════════════════

// Política de contenido: la página solo puede cargar cosas de
// nuestro propio servidor ('self'). Ni scripts externos ni en línea.
const POLITICA_CONTENIDO = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // permite style="..." en el HTML
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",     // el service worker de la PWA
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

function encabezadosSeguridad(req, res, next) {
  res.setHeader("Content-Security-Policy", POLITICA_CONTENIDO);
  res.setHeader("X-Content-Type-Options", "nosniff");       // no adivinar tipos de archivo
  res.setHeader("X-Frame-Options", "DENY");                  // nadie puede meter NoteFlow en un iframe
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (req.secure) res.setHeader("Strict-Transport-Security", "max-age=31536000"); // siempre https
  next();
}

module.exports = { encabezadosSeguridad };
