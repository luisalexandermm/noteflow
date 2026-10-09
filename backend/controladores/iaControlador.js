// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/iaControlador.js
// POST /api/ia/chat
//
// Flujo completo (Fase 7):
//   1. validar usuario          (ya lo hace exigirSesion en servidor.js)
//   2. obtener contexto         (materias, tareas y notas del usuario)
//   3. consultar la IA          (servicios/ia.js, con OPENAI_API_KEY del .env)
//   4. devolver la respuesta
//
// En la Fase 1 ya validamos el mensaje, para que la estructura quede lista.
// ═══════════════════════════════════════════════════════════

const LARGO_MAXIMO = 2000;

// Revisa lo que manda el frontend. Devuelve un texto de error o null si todo está bien.
function validarMensaje(cuerpo) {
  if (!cuerpo || typeof cuerpo.mensaje !== "string") {
    return "Falta el campo 'mensaje' (texto)";
  }

  const mensaje = cuerpo.mensaje.trim();

  if (mensaje.length === 0) return "El mensaje está vacío";
  if (mensaje.length > LARGO_MAXIMO) return `El mensaje supera los ${LARGO_MAXIMO} caracteres`;

  return null;
}

function chat(req, res) {
  const error = validarMensaje(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  // Fase 7: aquí se llama a la IA. La clave NUNCA sale del servidor.
  res.status(501).json({
    error: "El asistente IA estará disponible en la Fase 7",
    recibido: req.body.mensaje.trim().slice(0, 80)
  });
}

module.exports = { chat, validarMensaje };
