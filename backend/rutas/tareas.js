// NoteFlow · rutas/tareas.js
const express = require("express");
const tareas = require("../controladores/tareasControlador");

const router = express.Router();

router.put("/:id", tareas.guardar);       // PUT    /api/tareas/:id  (crear o actualizar)
router.delete("/:id", tareas.eliminar);   // DELETE /api/tareas/:id

module.exports = router;
