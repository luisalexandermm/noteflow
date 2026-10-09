// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/tareasControlador.js
//   PUT    /api/tareas/:id  → crear o actualizar
//   DELETE /api/tareas/:id  → eliminar
// ═══════════════════════════════════════════════════════════

const { consulta } = require("../db");
const validar = require("../servicios/validar");

async function guardar(req, res, next) {
  try {
    const id = validar.uuid(req.params.id);
    const datos = [
      id,
      req.usuario.id,
      validar.uuidOpcional(req.body.materiaId, "materiaId"),
      validar.texto(req.body.titulo, "titulo", { minimo: 1, maximo: 120 }),
      validar.texto(req.body.descripcion, "descripcion", { maximo: 1000 }),
      validar.fecha(req.body.fecha, "fecha"),
      validar.opcion(req.body.prioridad, "prioridad", ["baja", "media", "alta"]),
      validar.opcion(req.body.estado, "estado", ["pendiente", "en_progreso", "completada"])
    ];

    const resultado = await consulta(
      `insert into tareas (id, usuario_id, materia_id, titulo, descripcion, fecha_entrega, prioridad, estado)
       values ($1, $2, (select id from materias where id = $3 and usuario_id = $2), $4, $5, $6, $7, $8)
       on conflict (id) do update
         set materia_id = excluded.materia_id, titulo = excluded.titulo, descripcion = excluded.descripcion,
             fecha_entrega = excluded.fecha_entrega, prioridad = excluded.prioridad, estado = excluded.estado
         where tareas.usuario_id = $2
       returning id`,
      datos
    );

    if (!resultado.length) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const id = validar.uuid(req.params.id);
    await consulta("delete from tareas where id = $1 and usuario_id = $2", [id, req.usuario.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { guardar, eliminar };
