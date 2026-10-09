// ═══════════════════════════════════════════════════════════
// NoteFlow · middleware/errores.js
// Respuestas ordenadas cuando algo sale mal.
// Regla: al usuario le damos un mensaje claro;
//        los detalles técnicos solo se ven en la consola.
// ═══════════════════════════════════════════════════════════

// Se ejecuta cuando ninguna ruta coincidió
function rutaNoEncontrada(req, res) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Ruta de la API no encontrada" });
  }
  res.status(404).type("text").send("Página no encontrada");
}

// Express reconoce este middleware por sus 4 parámetros (err, req, res, next)
// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, next) {
  // JSON mal escrito en el cuerpo de la petición
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es JSON válido" });
  }

  // Cuerpo demasiado grande
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "La petición es demasiado grande" });
  }

  // Datos inválidos (los lanza servicios/validar.js)
  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }

  // La base de datos no responde (Neon apagado, internet caído, DATABASE_URL mala)
  if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "28P01"].includes(err.code)) {
    console.error("Base de datos no disponible:", err.message);
    return res.status(503).json({ error: "La base de datos no responde. Inténtalo en un momento." });
  }

  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Ocurrió un error en el servidor. Intenta de nuevo." });
}

module.exports = { rutaNoEncontrada, manejarErrores };
