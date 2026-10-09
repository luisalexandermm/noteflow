// ═══════════════════════════════════════════════════════════
// NoteFlow · rutas/ia.js
// Direcciones de /api/ia.
// ═══════════════════════════════════════════════════════════

const express = require("express");
const { chat } = require("../controladores/iaControlador");

const router = express.Router();

router.post("/chat", chat); // POST /api/ia/chat  { mensaje, usuarioId }

module.exports = router;
