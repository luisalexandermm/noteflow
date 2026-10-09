// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/chatControlador.js
//   POST   /api/chat/mensajes  → guardar un mensaje { rol, texto }
//   DELETE /api/chat           → "Nueva conversación" (borra la anterior)
//
// El navegador solo puede guardar mensajes "usuario" o "demo"
// (modo demostración). Las respuestas "asistente" de la IA real
// las guardará el propio backend en la Fase 7.
// ═══════════════════════════════════════════════════════════

const { consulta, transaccion } = require("../db");
const validar = require("../servicios/validar");

async function guardarMensaje(req, res, next) {
  try {
    const rol = validar.opcion(req.body.rol, "rol", ["usuario", "demo"]);
    const texto = validar.texto(req.body.texto, "texto", { minimo: 1, maximo: 20000 });

    await transaccion(async function (cliente) {
      // Conversación más reciente; si no hay, se crea
      let conversacion = (await cliente.query(
        "select id from conversaciones where usuario_id = $1 order by creado_en desc limit 1",
        [req.usuario.id]
      )).rows[0];

      if (!conversacion) {
        conversacion = (await cliente.query(
          "insert into conversaciones (usuario_id) values ($1) returning id",
          [req.usuario.id]
        )).rows[0];
      }

      await cliente.query(
        "insert into mensajes (conversacion_id, rol, contenido) values ($1, $2, $3)",
        [conversacion.id, rol, texto]
      );
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function borrarConversacion(req, res, next) {
  try {
    await consulta("delete from conversaciones where usuario_id = $1", [req.usuario.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { guardarMensaje, borrarConversacion };
