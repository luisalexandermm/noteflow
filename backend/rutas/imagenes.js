// NoteFlow · rutas/imagenes.js
const express = require("express");
const imagenes = require("../controladores/imagenesControlador");

const router = express.Router();

// express.raw: el cuerpo de la petición es la imagen tal cual (máx. 1 MB)
router.post("/", express.raw({ type: "image/*", limit: "1mb" }), imagenes.subir);  // POST /api/imagenes
router.get("/:id", imagenes.ver);                                                  // GET  /api/imagenes/:id

module.exports = router;
