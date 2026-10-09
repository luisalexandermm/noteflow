// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/notasControlador.js
//   PUT    /api/notas/:id  → crear o actualizar (con sus etiquetas)
//   DELETE /api/notas/:id  → eliminar
// ═══════════════════════════════════════════════════════════

const { consulta, transaccion } = require("../db");
const validar = require("../servicios/validar");

async function guardar(req, res, next) {
  try {
    const usuarioId = req.usuario.id;
    const id = validar.uuid(req.params.id);
    const materiaId = validar.uuidOpcional(req.body.materiaId, "materiaId");
    const titulo = validar.texto(req.body.titulo, "titulo", { maximo: 150 });
    const contenido = typeof req.body.contenido === "string" ? req.body.contenido.slice(0, 200000) : "";
    const favorita = req.body.favorita === true;
    const etiquetas = validar.etiquetas(req.body.etiquetas);

    const guardada = await transaccion(async function (cliente) {
      // 1. La nota. La materia solo se acepta si es del mismo usuario.
      //    "where notas.usuario_id = $2" impide sobrescribir la nota de otra persona.
      const resultado = await cliente.query(
        `insert into notas (id, usuario_id, materia_id, titulo, contenido, favorita)
         values ($1, $2, (select id from materias where id = $3 and usuario_id = $2), $4, $5, $6)
         on conflict (id) do update
           set materia_id = excluded.materia_id, titulo = excluded.titulo,
               contenido = excluded.contenido, favorita = excluded.favorita, actualizado_en = now()
           where notas.usuario_id = $2
         returning id`,
        [id, usuarioId, materiaId, titulo, contenido, favorita]
      );
      if (!resultado.rowCount) return false;

      // 2. Sus etiquetas: borrar los enlaces y volver a crearlos
      await cliente.query("delete from notas_etiquetas where nota_id = $1", [id]);
      if (etiquetas.length) {
        await cliente.query(
          `insert into etiquetas (usuario_id, nombre) select $1, unnest($2::text[])
           on conflict (usuario_id, nombre) do nothing`,
          [usuarioId, etiquetas]
        );
        await cliente.query(
          `insert into notas_etiquetas (nota_id, etiqueta_id)
           select $1, id from etiquetas where usuario_id = $2 and nombre = any($3::text[])`,
          [id, usuarioId, etiquetas]
        );
      }
      return true;
    });

    if (!guardada) return res.status(404).json({ error: "Nota no encontrada" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const id = validar.uuid(req.params.id);
    await consulta("delete from notas where id = $1 and usuario_id = $2", [id, req.usuario.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { guardar, eliminar };
