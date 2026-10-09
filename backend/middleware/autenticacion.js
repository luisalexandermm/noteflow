// ═══════════════════════════════════════════════════════════
// NoteFlow · middleware/autenticacion.js
// Sesiones con cookie.
//
// Cómo funciona:
//   1. Al verificar el código se crea un "token" aleatorio largo.
//   2. El token va al navegador en una cookie HttpOnly
//      (JavaScript no la puede leer → no se la pueden robar con XSS).
//   3. En la base de datos guardamos solo su HUELLA (hash SHA-256):
//      si alguien viera la tabla, no podría usar las sesiones.
//   4. exigirSesion() revisa la cookie en cada petición privada
//      y pone el usuario en req.usuario.
// ═══════════════════════════════════════════════════════════

const crypto = require("crypto");
const { consulta } = require("../db");

const NOMBRE_COOKIE = "noteflow_sesion";
const DIAS_SESION = 30;

function huella(texto) {
  return crypto.createHash("sha256").update(texto).digest("hex");
}

// Lee una cookie de la cabecera "Cookie: a=1; b=2"
function leerCookie(req, nombre) {
  const cookies = (req.headers.cookie || "").split(";").map((c) => c.trim());
  const encontrada = cookies.find((c) => c.startsWith(`${nombre}=`));
  return encontrada ? decodeURIComponent(encontrada.slice(nombre.length + 1)) : null;
}

function opcionesCookie(req) {
  return {
    httpOnly: true,                         // JavaScript no la puede leer
    sameSite: "lax",                        // no viaja en peticiones desde otros sitios
    secure: req.secure,                     // solo por https cuando la app está publicada
    path: "/",
    maxAge: DIAS_SESION * 24 * 60 * 60 * 1000
  };
}

async function crearSesion(req, res, usuarioId) {
  const token = crypto.randomBytes(32).toString("hex");
  await consulta(
    `insert into sesiones (usuario_id, token_hash, expira_en)
     values ($1, $2, now() + make_interval(days => $3))`,
    [usuarioId, huella(token), DIAS_SESION]
  );
  res.cookie(NOMBRE_COOKIE, token, opcionesCookie(req));
}

async function cerrarSesion(req, res) {
  const token = leerCookie(req, NOMBRE_COOKIE);
  if (token) await consulta("delete from sesiones where token_hash = $1", [huella(token)]);
  res.clearCookie(NOMBRE_COOKIE, { ...opcionesCookie(req), maxAge: undefined });
}

// Devuelve { id, correo } o null
async function usuarioDeLaSesion(req) {
  const token = leerCookie(req, NOMBRE_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const filas = await consulta(
    `select u.id, u.correo
       from sesiones s join usuarios u on u.id = s.usuario_id
      where s.token_hash = $1 and s.expira_en > now()`,
    [huella(token)]
  );
  return filas[0] || null;
}

// Middleware para rutas privadas
async function exigirSesion(req, res, next) {
  try {
    const usuario = await usuarioDeLaSesion(req);
    if (!usuario) return res.status(401).json({ error: "Tu sesión terminó. Vuelve a entrar." });
    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { crearSesion, cerrarSesion, usuarioDeLaSesion, exigirSesion, huella };
