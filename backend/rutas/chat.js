// NoteFlow · rutas/chat.js
const express = require("express");
const chat = require("../controladores/chatControlador");

const router = express.Router();

router.post("/mensajes", chat.guardarMensaje);  // POST   /api/chat/mensajes
router.delete("/", chat.borrarConversacion);    // DELETE /api/chat

module.exports = router;
