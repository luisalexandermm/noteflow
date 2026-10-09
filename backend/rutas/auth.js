// ═══════════════════════════════════════════════════════════
// NoteFlow · rutas/auth.js — registro e inicio con el correo
// ═══════════════════════════════════════════════════════════

const express = require("express");
const auth = require("../controladores/authControlador");
const { limitarPeticiones } = require("../middleware/proteccion");

const router = express.Router();

// Límites por IP para frenar abusos
router.post("/enviar-codigo", limitarPeticiones({ maximo: 6, minutos: 15 }), auth.enviarCodigo);
router.post("/verificar", limitarPeticiones({ maximo: 20, minutos: 15 }), auth.verificarCodigo);
router.get("/sesion", auth.sesionActual);
router.post("/salir", auth.salir);

module.exports = router;
