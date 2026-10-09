// NoteFlow · rutas/eventos.js
const express = require("express");
const eventos = require("../controladores/eventosControlador");

const router = express.Router();

router.put("/:id", eventos.guardar);       // PUT    /api/eventos/:id  (crear o actualizar)
router.delete("/:id", eventos.eliminar);   // DELETE /api/eventos/:id

module.exports = router;
