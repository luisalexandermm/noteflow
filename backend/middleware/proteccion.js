// ═══════════════════════════════════════════════════════════
// NoteFlow · middleware/proteccion.js
// Dos protecciones para la API:
//
// 1. mismoOrigen (contra CSRF): un sitio malicioso no puede hacer
//    que tu navegador cree o borre cosas en NoteFlow usando tu cookie.
//    Toda petición que CAMBIA datos debe venir de nuestra propia página
//    y enviar JSON o una imagen (un formulario de otro sitio no puede).
//
// 2. limitarPeticiones: evita que alguien pida miles de códigos
//    o pruebe códigos al azar.
// ═══════════════════════════════════════════════════════════

const METODOS_QUE_CAMBIAN = ["POST", "PUT", "PATCH", "DELETE"];

function mismoOrigen(req, res, next) {
  if (!METODOS_QUE_CAMBIAN.includes(req.method)) return next();

  const origen = req.headers.origin;
  const esperado = `${req.protocol}://${req.headers.host}`;
  if (origen && origen !== esperado) {
    return res.status(403).json({ error: "Petición no permitida" });
  }

  const tipo = (req.headers["content-type"] || "").split(";")[0].trim();
  const tieneCuerpo = req.method !== "DELETE";
  if (tieneCuerpo && tipo !== "application/json" && !tipo.startsWith("image/")) {
    return res.status(415).json({ error: "Tipo de contenido no permitido" });
  }
  next();
}

// Límite simple en memoria: máximo N peticiones por IP cada X minutos
function limitarPeticiones({ maximo, minutos }) {
  const registro = new Map(); // ip → { cuenta, reinicio }

  return function (req, res, next) {
    const ahora = Date.now();
    const ip = req.ip;
    const actual = registro.get(ip);

    if (!actual || actual.reinicio < ahora) {
      registro.set(ip, { cuenta: 1, reinicio: ahora + minutos * 60000 });
      return next();
    }
    actual.cuenta++;
    if (actual.cuenta > maximo) {
      return res.status(429).json({ error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." });
    }
    next();
  };
}

module.exports = { mismoOrigen, limitarPeticiones };
