// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/materiasControlador.js
//   POST   /api/materias      → crear  { id, nombre, color, icono }
//   DELETE /api/materias/:id  → eliminar (sus notas y tareas quedan "sin materia")
// El id lo genera el navegador (uuid) para que la materia aparezca al instante.
// ═══════════════════════════════════════════════════════════

const { consulta } = require("../db");
const validar = require("../servicios/validar");

const COLORES = ["verde", "violeta", "azul", "ambar", "turquesa", "rosa"];

async function crear(req, res, next) {
  try {
    const id = validar.uuid(req.body.id);
    const nombre = validar.texto(req.body.nombre, "nombre", { minimo: 1, maximo: 80 });
    const color = validar.opcion(req.body.color, "color", COLORES);
    const icono = validar.texto(req.body.icono, "icono", { minimo: 1, maximo: 30 });

    await consulta(
      `insert into materias (id, usuario_id, nombre, color, icono) values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [id, req.usuario.id, nombre, color, icono]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const id = validar.uuid(req.params.id);
    await consulta("delete from materias where id = $1 and usuario_id = $2", [id, req.usuario.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { crear, eliminar };
