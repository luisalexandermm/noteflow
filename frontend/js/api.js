// ═══════════════════════════════════════════════════════════
// NoteFlow · api.js
// Una sola función para hablar con NUESTRO backend (Express).
//
//   const datos = await pedir("/api/datos");
//   await pedir("/api/notas/123", { metodo: "PUT", cuerpo: { titulo: "Hola" } });
//
// · La cookie de sesión viaja sola (el navegador la envía).
// · Si el servidor responde con error, se lanza un Error con su mensaje.
// · Si la sesión venció (401), se vuelve a la página de bienvenida.
// ═══════════════════════════════════════════════════════════

function rutaBase() {
  return window.location.pathname.includes("/paginas/") ? "../" : "";
}

export async function pedir(ruta, { metodo = "GET", cuerpo, tipo } = {}) {
  const opciones = { method: metodo, credentials: "same-origin", headers: {} };

  if (cuerpo instanceof Blob) {
    opciones.body = cuerpo;                           // imagen: va tal cual
    opciones.headers["Content-Type"] = tipo || cuerpo.type;
  } else if (cuerpo !== undefined) {
    opciones.body = JSON.stringify(cuerpo);           // datos: van como JSON
    opciones.headers["Content-Type"] = "application/json";
  }

  let respuesta;
  try {
    respuesta = await fetch(ruta, opciones);
  } catch (error) {
    throw new Error("No hay conexión con el servidor. Revisa tu internet.");
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (respuesta.status === 401 && !ruta.startsWith("/api/auth")) {
    window.location.replace(`${rutaBase()}index.html`);
    return new Promise(() => {}); // la página no sigue
  }

  if (!respuesta.ok) {
    const error = new Error(datos.error || "Ocurrió un error. Inténtalo de nuevo.");
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}
