// NoteFlow · rutas/notas.js
const express = require("express");
const notas = require("../controladores/notasControlador");

const router = express.Router();

router.put("/:id", notas.guardar);       // PUT    /api/notas/:id  (crear o actualizar)
router.delete("/:id", notas.eliminar);   // DELETE /api/notas/:id

module.exports = router;
