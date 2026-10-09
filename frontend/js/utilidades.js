// ═══════════════════════════════════════════════════════════
// NoteFlow · utilidades.js
// Funciones pequeñas que usan varias páginas: fechas,
// seguridad del texto y parámetros de la URL.
// ═══════════════════════════════════════════════════════════

// ── Seguridad ───────────────────────────────────────────────
// Convierte < > & " ' en texto seguro antes de meterlo en innerHTML.
// Úsala SIEMPRE que pongas en pantalla algo escrito por el usuario.
export function escaparHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ── Fechas ──────────────────────────────────────────────────
// Trabajamos con fechas como texto "AAAA-MM-DD" (igual que PostgreSQL).

export function fechaISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Fecha y hora LOCAL: "2026-09-27T19:45:10" (toISOString daría la hora de Londres)
export function ahoraLocal(fecha = new Date()) {
  const hora = [fecha.getHours(), fecha.getMinutes(), fecha.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
  return `${fechaISO(fecha)}T${hora}`;
}

export function hoyISO() {
  return fechaISO(new Date());
}

// "2026-09-27" → objeto Date a medianoche (hora local)
export function aFecha(textoISO) {
  const [anio, mes, dia] = textoISO.slice(0, 10).split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function sumarDias(textoISO, dias) {
  const fecha = aFecha(textoISO);
  fecha.setDate(fecha.getDate() + dias);
  return fechaISO(fecha);
}

// Días entre hoy y una fecha (negativo = ya pasó)
export function diasDesdeHoy(textoISO) {
  const milisegundos = aFecha(textoISO) - aFecha(hoyISO());
  return Math.round(milisegundos / 86400000);
}

// "2026-09-27" → "27 sep"
export function fechaCorta(textoISO) {
  return aFecha(textoISO).toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", "");
}

// "2026-09-27" → "27 sep 2026"
export function fechaMedia(textoISO) {
  return aFecha(textoISO).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }).replaceAll(".", "").replaceAll(" de ", " ");
}

// "2026-09-27" → "Domingo, 27 de septiembre"
export function fechaLarga(textoISO) {
  const texto = aFecha(textoISO).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  return mayuscula(texto);
}

// Hoy / Mañana / Ayer / Vencida hace 3 días / 2 oct
export function fechaRelativa(textoISO) {
  if (!textoISO) return "Sin fecha";
  const dias = diasDesdeHoy(textoISO);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias === -1) return "Ayer";
  if (dias > 1 && dias < 7) return mayuscula(aFecha(textoISO).toLocaleDateString("es-CO", { weekday: "long" }));
  return fechaCorta(textoISO);
}

// Saludo según la hora del día
export function saludoSegunHora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return { texto: "Buenos días", emoji: "☀️", icono: "sol" };
  if (hora >= 12 && hora < 19) return { texto: "Buenas tardes", emoji: "🌤️", icono: "sol" };
  return { texto: "Buenas noches", emoji: "🌙", icono: "luna" };
}

export function mayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ── Otras ───────────────────────────────────────────────────

// Lee ?id=3 de la dirección de la página
export function leerParametro(nombre) {
  return new URLSearchParams(window.location.search).get(nombre);
}

// Espera a que el usuario deje de escribir antes de ejecutar (autoguardado)
export function esperar(funcion, milisegundos = 500) {
  let temporizador = null;
  return function (...argumentos) {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...argumentos), milisegundos);
  };
}

// Texto plano a partir del HTML de una nota (para extractos y búsquedas)
export function textoPlano(html) {
  // DOMParser crea un documento "inerte": no carga imágenes ni ejecuta nada
  // Un espacio después de cada bloque para que "¿Qué es?" y "Un…" no queden pegados
  const conEspacios = String(html || "").replace(/<\/(p|h1|h2|h3|li|pre|div|blockquote)>/gi, "$& ");
  const documento = new DOMParser().parseFromString(conEspacios, "text/html");
  return (documento.body.textContent || "").replace(/\s+/g, " ").trim();
}

// Quita tildes y pasa a minúsculas: "Árbol" → "arbol" (para buscar)
export function normalizar(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Clase de color de una materia: "materia-verde"
export function claseMateria(materia) {
  return materia ? `materia-${materia.color}` : "materia-gris";
}

// "1 nota" / "3 notas"
export function plural(cantidad, singular, pluralTexto) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

// ── Limpiar el HTML de una nota ─────────────────────────────
// El editor guarda HTML. Antes de guardarlo o mostrarlo quitamos
// todo lo peligroso (scripts, eventos onclick, enlaces javascript:).
// Solo quedan las etiquetas que el editor sabe crear.
const ETIQUETAS_PERMITIDAS = ["P", "BR", "H1", "H2", "H3", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "PRE", "CODE", "BLOCKQUOTE", "A", "IMG", "DIV", "SPAN"];
const ETIQUETAS_PELIGROSAS = ["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE", "FORM", "INPUT", "BUTTON", "LINK", "META"];

export function limpiarHTML(html) {
  const documento = new DOMParser().parseFromString(String(html || ""), "text/html");
  limpiarNodo(documento.body);
  return documento.body.innerHTML;
}

function limpiarNodo(nodo) {
  [...nodo.children].forEach(function (hijo) {
    const etiqueta = hijo.tagName.toUpperCase();

    // Peligrosa: se borra con todo su contenido
    if (ETIQUETAS_PELIGROSAS.includes(etiqueta)) {
      hijo.remove();
      return;
    }

    // Desconocida: se queda solo su texto/hijos
    if (!ETIQUETAS_PERMITIDAS.includes(etiqueta)) {
      limpiarNodo(hijo);
      hijo.replaceWith(...hijo.childNodes);
      return;
    }

    // Quitar todos los atributos menos href (enlaces) y src/alt (imágenes)
    [...hijo.attributes].forEach(function (atributo) {
      const permitido =
        (etiqueta === "A" && atributo.name === "href") ||
        (etiqueta === "IMG" && (atributo.name === "src" || atributo.name === "alt"));
      if (!permitido) hijo.removeAttribute(atributo.name);
    });

    // Enlaces: solo http, https o correo, y siempre en otra pestaña
    if (etiqueta === "A") {
      const destino = hijo.getAttribute("href") || "";
      if (/^(https?:|mailto:)/i.test(destino)) {
        hijo.setAttribute("target", "_blank");
        hijo.setAttribute("rel", "noopener noreferrer");
      } else {
        hijo.removeAttribute("href");
      }
    }

    // Imágenes: solo las subidas a NoteFlow (/api/imagenes/…), las guardadas
    // en el navegador (data:image) o las del proyecto (img/)
    if (etiqueta === "IMG") {
      const origen = hijo.getAttribute("src") || "";
      if (!/^(\/api\/imagenes\/[0-9a-f-]{36}$|data:image\/(png|jpe?g|gif|webp);base64,|(\.\.\/)?img\/)/i.test(origen)) {
        hijo.remove();
        return;
      }
    }

    limpiarNodo(hijo);
  });
}

// Identificador único para lo que crea el usuario (nota, tarea…)
export function nuevoId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  // Respaldo para navegadores viejos
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
