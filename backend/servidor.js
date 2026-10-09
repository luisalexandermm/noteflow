// ═══════════════════════════════════════════════════════════
// NoteFlow · servidor.js
// Punto de entrada del backend:
//   1. Sirve el frontend (la carpeta /frontend)
//   2. API pública:  /api/config, /api/auth/...
//   3. API privada (necesita sesión): datos, materias, notas,
//      tareas, eventos, chat, imágenes e IA
//   4. Manejo de errores
//
// La base de datos es PostgreSQL en Neon (DATABASE_URL en el .env).
// Sin DATABASE_URL la app funciona en MODO LOCAL (datos en el navegador).
//
// Ejecutar:  npm start   →   http://localhost:3000
// ═══════════════════════════════════════════════════════════

require("dotenv").config(); // lee las variables del archivo .env

const path = require("path");
const express = require("express");

const { baseDeDatosConfigurada } = require("./db");
const { correoConfigurado } = require("./servicios/correo");
const { encabezadosSeguridad } = require("./middleware/seguridad");
const { mismoOrigen } = require("./middleware/proteccion");
const { exigirSesion } = require("./middleware/autenticacion");
const { rutaNoEncontrada, manejarErrores } = require("./middleware/errores");

const app = express();
const PUERTO = process.env.PORT || process.env.PUERTO || 3000;

// ── Configuración general ───────────────────────────────────
app.disable("x-powered-by");               // no anunciar que usamos Express
app.set("trust proxy", 1);                 // en Render/Vercel la app está detrás de un proxy (https)
app.use(encabezadosSeguridad);             // cabeceras de seguridad
app.use("/api", mismoOrigen);              // protección contra CSRF
app.use(express.json({ limit: "300kb" })); // leer JSON (las notas largas caben)

// ── 1. Frontend ─────────────────────────────────────────────
// El service worker nunca se guarda en caché del navegador, así las
// actualizaciones de la app llegan apenas las subes.
app.use(express.static(path.join(__dirname, "..", "frontend"), {
  setHeaders(res, ruta) {
    if (ruta.endsWith("service-worker.js") || ruta.endsWith(".webmanifest")) res.setHeader("Cache-Control", "no-cache");
  }
}));

// ── 2. API pública ──────────────────────────────────────────
app.get("/api/salud", function (req, res) {
  res.json({
    estado: "ok",
    app: "NoteFlow",
    baseDeDatos: baseDeDatosConfigurada() ? "Neon (PostgreSQL)" : "modo local",
    hora: new Date().toISOString()
  });
});

app.use("/api/config", require("./rutas/config"));

// ── 3. API con base de datos ────────────────────────────────
if (baseDeDatosConfigurada()) {
  app.use("/api/auth", require("./rutas/auth"));

  // Desde aquí, todo exige sesión iniciada
  app.use("/api", exigirSesion, require("./rutas/datos"));
  app.use("/api/materias", exigirSesion, require("./rutas/materias"));
  app.use("/api/notas", exigirSesion, require("./rutas/notas"));
  app.use("/api/tareas", exigirSesion, require("./rutas/tareas"));
  app.use("/api/eventos", exigirSesion, require("./rutas/eventos"));
  app.use("/api/chat", exigirSesion, require("./rutas/chat"));
  app.use("/api/imagenes", exigirSesion, require("./rutas/imagenes"));
  app.use("/api/ia", exigirSesion, require("./rutas/ia"));
} else {
  app.use("/api/ia", require("./rutas/ia"));
}

// ── 4. Errores (siempre al final) ───────────────────────────
app.use(rutaNoEncontrada);
app.use(manejarErrores);

// Para hostings "serverless" (como Vercel) se exporta la app;
// con "npm start" (este archivo directo) se arranca el servidor normal.
module.exports = app;

if (require.main === module) {
  app.listen(PUERTO, function () {
    console.log(`\n  NoteFlow listo en  http://localhost:${PUERTO}`);
    if (!baseDeDatosConfigurada()) {
      console.log("  Base de datos: sin DATABASE_URL → MODO LOCAL (datos en el navegador)\n");
      return;
    }
    console.log("  Base de datos: Neon (PostgreSQL)");
    console.log(correoConfigurado()
      ? "  Correo: SMTP configurado (los códigos llegan por correo)\n"
      : "  Correo: sin SMTP → los códigos se muestran AQUÍ en la consola (solo para desarrollo)\n");
  });
}
