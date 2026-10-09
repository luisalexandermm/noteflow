// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/eventosControlador.js
//   PUT    /api/eventos/:id  → crear o actualizar
//   DELETE /api/eventos/:id  → eliminar
// Las "sesiones de estudio" suman horas en "Mi progreso".
// ═══════════════════════════════════════════════════════════

const { consulta } = require("../db");
const validar = require("../servicios/validar");

async function guardar(req, res, next) {
  try {
    const id = validar.uuid(req.params.id);
    const fecha = validar.fecha(req.body.fecha, "fecha");
    if (!fecha) throw validar.errorDatos('El campo "fecha" es obligatorio');

    const resultado = await consulta(
      `insert into eventos (id, usuario_id, materia_id, titulo, tipo, fecha, hora, duracion_min)
       values ($1, $2, (select id from materias where id = $3 and usuario_id = $2), $4, $5, $6, $7, $8)
       on conflict (id) do update
         set materia_id = excluded.materia_id, titulo = excluded.titulo, tipo = excluded.tipo,
             fecha = excluded.fecha, hora = excluded.hora, duracion_min = excluded.duracion_min
         where eventos.usuario_id = $2
       returning id`,
      [
        id,
        req.usuario.id,
        validar.uuidOpcional(req.body.materiaId, "materiaId"),
        validar.texto(req.body.titulo, "titulo", { minimo: 1, maximo: 120 }),
        validar.opcion(req.body.tipo, "tipo", ["evento", "sesion_estudio", "examen"]),
        fecha,
        validar.hora(req.body.hora),
        validar.entero(req.body.duracion ?? 60, "duracion", 5, 720)
      ]
    );

    if (!resultado.length) return res.status(404).json({ error: "Evento no encontrado" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const id = validar.uuid(req.params.id);
    await consulta("delete from eventos where id = $1 and usuario_id = $2", [id, req.usuario.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { guardar, eliminar };
