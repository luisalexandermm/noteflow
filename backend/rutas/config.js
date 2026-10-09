// ═══════════════════════════════════════════════════════════
// NoteFlow · rutas/config.js
// GET /api/config → le dice al navegador en qué modo trabajar:
//   · "nube":  hay DATABASE_URL (Neon) → cuentas reales
//   · "local": sin base de datos → datos solo en el navegador
// ═══════════════════════════════════════════════════════════

const express = require("express");
const { baseDeDatosConfigurada } = require("../db");

const router = express.Router();

router.get("/", function (req, res) {
  res.set("Cache-Control", "no-store");
  res.json({ modo: baseDeDatosConfigurada() ? "nube" : "local" });
});

module.exports = router;
