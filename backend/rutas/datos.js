// ═══════════════════════════════════════════════════════════
// NoteFlow · rutas/datos.js — todo lo del usuario y su perfil
// (exigirSesion se aplica en servidor.js a todas las rutas privadas)
// ═══════════════════════════════════════════════════════════

const express = require("express");
const datos = require("../controladores/datosControlador");

const router = express.Router();

router.get("/datos", datos.obtenerTodo);     // GET    /api/datos
router.delete("/datos", datos.borrarTodo);   // DELETE /api/datos
router.put("/perfil", datos.guardarPerfil);  // PUT    /api/perfil

module.exports = router;
