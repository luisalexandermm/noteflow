// ═══════════════════════════════════════════════════════════
// NoteFlow · servicios/validar.js
// Revisiones pequeñas para TODO lo que llega del navegador.
// Regla: nunca confiar en el navegador, aunque el frontend ya valide.
// Si algo no cumple, se lanza un error con status 400.
// ═══════════════════════════════════════════════════════════

function errorDatos(mensaje) {
  const error = new Error(mensaje);
  error.status = 400;
  return error;
}

const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(valor, campo = "id") {
  if (typeof valor !== "string" || !PATRON_UUID.test(valor)) throw errorDatos(`El campo "${campo}" no es válido`);
  return valor.toLowerCase();
}

// Igual que uuid() pero acepta vacío → null
function uuidOpcional(valor, campo) {
  if (valor === null || valor === undefined || valor === "") return null;
  return uuid(valor, campo);
}

function texto(valor, campo, { minimo = 0, maximo = 200 } = {}) {
  const limpio = typeof valor === "string" ? valor.trim() : "";
  if (limpio.length < minimo) throw errorDatos(`El campo "${campo}" es muy corto`);
  if (limpio.length > maximo) throw errorDatos(`El campo "${campo}" es muy largo`);
  return limpio;
}

function opcion(valor, campo, permitidas) {
  if (!permitidas.includes(valor)) throw errorDatos(`El campo "${campo}" debe ser: ${permitidas.join(", ")}`);
  return valor;
}

function fecha(valor, campo) {
  if (valor === null || valor === undefined || valor === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(valor))) throw errorDatos(`El campo "${campo}" no es una fecha válida`);
  return valor;
}

function hora(valor) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(valor || "")) throw errorDatos('El campo "hora" no es válido');
  return valor;
}

function entero(valor, campo, minimo, maximo) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) throw errorDatos(`El campo "${campo}" no es válido`);
  return numero;
}

function correo(valor) {
  const limpio = texto(valor, "correo", { minimo: 5, maximo: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) throw errorDatos("Escribe un correo válido");
  return limpio;
}

// Etiquetas: ["bd", "mer"] — minúsculas, sin espacios, máximo 10
function etiquetas(lista) {
  if (!Array.isArray(lista)) return [];
  const limpias = lista
    .filter((e) => typeof e === "string" && /^[a-z0-9áéíóúñü_-]{1,30}$/.test(e))
    .slice(0, 10);
  return [...new Set(limpias)];
}

module.exports = { errorDatos, uuid, uuidOpcional, texto, opcion, fecha, hora, entero, correo, etiquetas };
