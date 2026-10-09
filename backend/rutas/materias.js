// NoteFlow · rutas/materias.js
const express = require("express");
const materias = require("../controladores/materiasControlador");

const router = express.Router();

router.post("/", materias.crear);          // POST   /api/materias
router.delete("/:id", materias.eliminar);  // DELETE /api/materias/:id

module.exports = router;
