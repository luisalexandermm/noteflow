// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/imagenesControlador.js
//   POST /api/imagenes      → subir una imagen (el cuerpo ES la imagen)
//   GET  /api/imagenes/:id  → verla (solo su dueño)
//
// Las imágenes se guardan en la propia base de datos (columna bytea).
// El navegador las comprime antes de subirlas (máx. 1600 px, WebP),
// así una foto ocupa ~100-300 KB.
//
// Seguridad:
//   · máximo 1 MB por imagen y 50 MB por usuario
//   · se revisan los primeros bytes del archivo ("firma") para
//     confirmar que de verdad es PNG, JPG, WEBP o GIF
//   · solo el dueño puede verlas (necesita su sesión)
// ═══════════════════════════════════════════════════════════

const { consulta } = require("../db");
const validar = require("../servicios/validar");

const LIMITE_POR_USUARIO = 50 * 1024 * 1024; // 50 MB

// ¿Qué tipo de imagen es según sus primeros bytes?
function tipoReal(datos) {
  if (datos.length < 12) return null;
  if (datos[0] === 0x89 && datos.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff) return "image/jpeg";
  if (datos.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (datos.toString("ascii", 0, 4) === "RIFF" && datos.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

async function subir(req, res, next) {
  try {
    const datos = req.body; // Buffer (lo prepara express.raw en la ruta)
    if (!Buffer.isBuffer(datos) || !datos.length) {
      return res.status(400).json({ error: "No llegó ninguna imagen" });
    }

    const tipo = tipoReal(datos);
    if (!tipo) return res.status(400).json({ error: "Solo se permiten imágenes PNG, JPG, WEBP o GIF" });

    const usado = await consulta("select coalesce(sum(tamano), 0) as total from imagenes where usuario_id = $1", [req.usuario.id]);
    if (Number(usado[0].total) + datos.length > LIMITE_POR_USUARIO) {
      return res.status(413).json({ error: "Llegaste al límite de 50 MB de imágenes" });
    }

    const fila = (await consulta(
      "insert into imagenes (usuario_id, tipo, datos, tamano) values ($1, $2, $3, $4) returning id",
      [req.usuario.id, tipo, datos, datos.length]
    ))[0];

    res.status(201).json({ url: `/api/imagenes/${fila.id}` });
  } catch (error) {
    next(error);
  }
}

async function ver(req, res, next) {
  try {
    const id = validar.uuid(req.params.id);
    const fila = (await consulta(
      "select tipo, datos from imagenes where id = $1 and usuario_id = $2",
      [id, req.usuario.id]
    ))[0];

    if (!fila) return res.status(404).json({ error: "Imagen no encontrada" });

    res.set("Content-Type", fila.tipo);
    res.set("Cache-Control", "private, max-age=31536000, immutable"); // la imagen nunca cambia
    res.send(fila.datos);
  } catch (error) {
    next(error);
  }
}

module.exports = { subir, ver };
