// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/datosControlador.js
//   GET    /api/datos   → TODO lo del usuario (al abrir una página)
//   DELETE /api/datos   → borrar todo lo que creó
//   PUT    /api/perfil  → nombre, carrera y preferencias
//
// Regla de oro: TODAS las consultas llevan "usuario_id = $1"
// con el id de la sesión (req.usuario.id), nunca uno del navegador.
// ═══════════════════════════════════════════════════════════

const { consulta, transaccion } = require("../db");
const validar = require("../servicios/validar");

async function obtenerTodo(req, res, next) {
  try {
    const id = req.usuario.id;

    const [perfil, materias, notas, tareas, eventos, chat] = await Promise.all([
      consulta("select nombre, carrera, preferencias from usuarios where id = $1", [id]),

      consulta("select id, nombre, color, icono from materias where usuario_id = $1 order by creado_en", [id]),

      // Cada nota con la lista de sus etiquetas
      consulta(
        `select n.id, n.materia_id as "materiaId", n.titulo, n.contenido, n.favorita,
                n.creado_en as "creadoEn", n.actualizado_en as "actualizadoEn",
                coalesce(array(
                  select e.nombre from notas_etiquetas ne join etiquetas e on e.id = ne.etiqueta_id
                  where ne.nota_id = n.id order by e.nombre
                ), '{}') as etiquetas
           from notas n where n.usuario_id = $1`,
        [id]
      ),

      consulta(
        `select id, materia_id as "materiaId", titulo, descripcion, fecha_entrega as fecha, prioridad, estado
           from tareas where usuario_id = $1`,
        [id]
      ),

      consulta(
        `select id, materia_id as "materiaId", titulo, tipo, fecha, to_char(hora, 'HH24:MI') as hora,
                duracion_min as duracion
           from eventos where usuario_id = $1`,
        [id]
      ),

      // Mensajes de la conversación más reciente
      consulta(
        `select case m.rol when 'asistente' then 'ia' when 'demo' then 'ia-demo' else 'usuario' end as rol,
                m.contenido as texto, m.creado_en as fecha
           from mensajes m
          where m.conversacion_id = (select c.id from conversaciones c where c.usuario_id = $1
                                      order by c.creado_en desc limit 1)
          order by m.creado_en`,
        [id]
      )
    ]);

    res.json({
      perfil: { nombre: perfil[0].nombre, carrera: perfil[0].carrera },
      preferencias: perfil[0].preferencias,
      materias,
      notas,
      tareas,
      eventos,
      chat
    });
  } catch (error) {
    next(error);
  }
}

async function guardarPerfil(req, res, next) {
  try {
    const cambios = req.body;
    const nombre = cambios.nombre === undefined ? null : validar.texto(cambios.nombre, "nombre", { maximo: 80 });
    const carrera = cambios.carrera === undefined ? null : validar.texto(cambios.carrera, "carrera", { maximo: 80 });

    let preferencias = null;
    if (cambios.preferencias) {
      preferencias = {
        animaciones: cambios.preferencias.animaciones !== false,
        escena3d: cambios.preferencias.escena3d !== false
      };
    }

    // coalesce: si un campo no vino (null), se deja como estaba
    await consulta(
      `update usuarios set nombre = coalesce($2, nombre), carrera = coalesce($3, carrera),
              preferencias = coalesce($4, preferencias)
        where id = $1`,
      [req.usuario.id, nombre, carrera, preferencias]
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function borrarTodo(req, res, next) {
  try {
    await transaccion(async function (cliente) {
      // Lista fija escrita aquí (nunca viene del navegador), por eso es seguro armar el SQL
      for (const tabla of ["conversaciones", "eventos", "tareas", "notas", "etiquetas", "materias", "imagenes"]) {
        await cliente.query(`delete from ${tabla} where usuario_id = $1`, [req.usuario.id]);
      }
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerTodo, guardarPerfil, borrarTodo };
