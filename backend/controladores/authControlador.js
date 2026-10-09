// ═══════════════════════════════════════════════════════════
// NoteFlow · controladores/authControlador.js
// Registro e inicio de sesión SOLO con el correo:
//
//   1. POST /api/auth/enviar-codigo  { correo }
//      → genera un código de 6 números y lo envía al correo
//   2. POST /api/auth/verificar      { correo, codigo }
//      → si es correcto: crea la cuenta (si es nueva) y la sesión
//   3. GET  /api/auth/sesion  → ¿quién está conectado?
//   4. POST /api/auth/salir   → cerrar sesión
//
// Seguridad:
//   · el código se guarda como huella (hash), nunca en texto
//   · vence en 10 minutos y permite máximo 5 intentos
//   · un código nuevo por correo cada 60 segundos
//   · la respuesta NO dice si el correo ya tenía cuenta
// ═══════════════════════════════════════════════════════════

const crypto = require("crypto");
const { consulta } = require("../db");
const validar = require("../servicios/validar");
const { enviarCodigoPorCorreo } = require("../servicios/correo");
const { crearSesion, cerrarSesion, usuarioDeLaSesion, huella } = require("../middleware/autenticacion");

const MINUTOS_VALIDEZ = 10;
const SEGUNDOS_ENTRE_ENVIOS = 60;
const INTENTOS_MAXIMOS = 5;

const huellaCodigo = (correo, codigo) => huella(`${correo}:${codigo}`);

async function enviarCodigo(req, res, next) {
  try {
    const correo = validar.correo(req.body.correo);

    // ¿Pidió uno hace menos de 60 segundos?
    const anterior = await consulta(
      "select extract(epoch from now() - enviado_en) as segundos from codigos_acceso where correo = $1",
      [correo]
    );
    if (anterior.length && Number(anterior[0].segundos) < SEGUNDOS_ENTRE_ENVIOS) {
      return res.status(429).json({ error: "Ya te enviamos un código. Espera un minuto para pedir otro." });
    }

    const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, "0");

    await consulta(
      `insert into codigos_acceso (correo, codigo_hash, expira_en, intentos, enviado_en)
       values ($1, $2, now() + make_interval(mins => $3), 0, now())
       on conflict (correo) do update
         set codigo_hash = excluded.codigo_hash, expira_en = excluded.expira_en,
             intentos = 0, enviado_en = now()`,
      [correo, huellaCodigo(correo, codigo), MINUTOS_VALIDEZ]
    );

    try {
      await enviarCodigoPorCorreo(correo, codigo);
    } catch (error) {
      await consulta("delete from codigos_acceso where correo = $1", [correo]);
      console.error("No se pudo enviar el correo:", error.message);
      return res.status(502).json({ error: "No pudimos enviar el correo. Inténtalo de nuevo en un momento." });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function verificarCodigo(req, res, next) {
  try {
    const correo = validar.correo(req.body.correo);
    const codigo = String(req.body.codigo || "");
    const invalido = { error: "El código no es válido o ya venció. Revisa el correo o pide uno nuevo." };
    if (!/^\d{6}$/.test(codigo)) return res.status(400).json(invalido);

    const filas = await consulta(
      "select codigo_hash, intentos, expira_en > now() as vigente from codigos_acceso where correo = $1",
      [correo]
    );
    const guardado = filas[0];
    if (!guardado || !guardado.vigente) return res.status(400).json(invalido);
    if (guardado.intentos >= INTENTOS_MAXIMOS) {
      return res.status(429).json({ error: "Demasiados intentos con este código. Pide uno nuevo." });
    }

    // Comparación en tiempo constante (no revela cuántos números acertó)
    const esperado = Buffer.from(guardado.codigo_hash, "hex");
    const recibido = Buffer.from(huellaCodigo(correo, codigo), "hex");
    if (!crypto.timingSafeEqual(esperado, recibido)) {
      await consulta("update codigos_acceso set intentos = intentos + 1 where correo = $1", [correo]);
      return res.status(400).json(invalido);
    }

    // Código correcto: se usa una sola vez
    await consulta("delete from codigos_acceso where correo = $1", [correo]);

    // Crear la cuenta si es nueva (o tomar la existente)
    const usuario = (await consulta(
      `insert into usuarios (correo) values ($1)
       on conflict (correo) do update set correo = excluded.correo
       returning id, correo`,
      [correo]
    ))[0];

    await consulta("delete from sesiones where expira_en < now()"); // limpieza de sesiones viejas
    await crearSesion(req, res, usuario.id);
    res.json({ usuario });
  } catch (error) {
    next(error);
  }
}

async function sesionActual(req, res, next) {
  try {
    res.json({ usuario: await usuarioDeLaSesion(req) });
  } catch (error) {
    next(error);
  }
}

async function salir(req, res, next) {
  try {
    await cerrarSesion(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { enviarCodigo, verificarCodigo, sesionActual, salir };
