// ═══════════════════════════════════════════════════════════
// NoteFlow · inicio.js
// El tablero de inicio:
//   · Columna principal: bienvenida (3D), resumen en mosaicos,
//     primeros pasos, materias con progreso y notas recientes
//   · Columna lateral "Tu día": recordatorio con cuenta regresiva,
//     agenda de la semana, modo enfoque y racha de estudio
// En el celular todo queda en una columna (ver responsive.css).
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import {
  obtenerPerfil, guardarPerfil, esperarGuardado, obtenerMaterias, obtenerMateria, obtenerNotas,
  obtenerTareas, obtenerTareasPendientes, obtenerEventos, guardarTarea, minutosDeEstudio, obtenerPreferencias, obtenerUsuario
} from "./datos.js";
import { crearTarjetaNota, crearTarjetaProgreso, crearEstadoVacio } from "./componentes.js";
import { abrirModal, mostrarErrorCampo, mostrarAviso } from "./app.js";
import { animarEntrada, animarBarras, animarNumeros, animarCheck } from "./animaciones.js";
import { iniciarEnfoque } from "./enfoque.js";
import { hoyISO, sumarDias, aFecha, fechaLarga, fechaRelativa, diasDesdeHoy, escaparHTML, claseMateria, saludoSegunHora, plural } from "./utilidades.js";

const TIPOS_EVENTO = {
  sesion_estudio: { nombre: "Sesión de estudio", icono: "libro" },
  examen: { nombre: "Examen", icono: "examen" },
  evento: { nombre: "Evento", icono: "calendario" }
};

let diaAgenda = hoyISO(); // día elegido en la agenda

// ═══ BIENVENIDA ═════════════════════════════════════════════
function mostrarBienvenida() {
  const saludo = saludoSegunHora();
  const primerNombre = obtenerPerfil().nombre.trim().split(" ")[0];

  document.getElementById("fecha-larga").textContent = fechaLarga(hoyISO());
  document.getElementById("saludo").textContent = primerNombre ? `${saludo.texto}, ${primerNombre} ${saludo.emoji}` : `${saludo.texto} ${saludo.emoji}`;
  document.getElementById("resumen-dia").innerHTML = resumenDelDia();
}

// "Tienes 2 tareas para hoy y un examen el jueves."
function resumenDelDia() {
  const hoy = hoyISO();
  const pendientes = obtenerTareasPendientes();
  const paraHoy = pendientes.filter((t) => t.fecha === hoy).length;
  const vencidas = pendientes.filter((t) => t.fecha && t.fecha < hoy).length;
  const examen = obtenerEventos()
    .filter((e) => e.tipo === "examen" && e.fecha >= hoy && diasDesdeHoy(e.fecha) <= 7)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  if (!obtenerTareas().length && !obtenerNotas().length) {
    return "Tu espacio está listo. Crea tu primera materia y empieza a organizar tu semestre.";
  }

  let texto = paraHoy
    ? `Tienes <strong>${plural(paraHoy, "tarea", "tareas")} para hoy</strong>`
    : "No tienes entregas para hoy";
  if (examen) texto += ` y un <strong>examen ${fechaRelativa(examen.fecha).toLowerCase() === "hoy" ? "hoy" : "el " + fechaRelativa(examen.fecha).toLowerCase()}</strong>`;
  texto += ".";
  if (vencidas) texto += ` Ojo: ${plural(vencidas, "tarea vencida", "tareas vencidas")}.`;
  else texto += paraHoy ? " ¡Tú puedes!" : " Buen momento para adelantar o repasar.";
  return texto;
}

// ═══ RESUMEN EN MOSAICOS ════════════════════════════════════
// Onditas decorativas (una distinta por mosaico)
const ONDAS = [
  "M2 18 C 8 4, 12 4, 17 16 S 26 28, 31 14 S 40 2, 45 14 S 54 26, 59 12 S 68 6, 74 14",
  "M2 14 C 7 26, 12 26, 17 14 S 27 2, 32 16 S 42 28, 47 14 S 57 4, 62 16 S 70 22, 74 12",
  "M2 20 C 9 8, 14 6, 19 18 S 29 26, 35 12 S 45 4, 50 16 S 60 24, 66 12 S 71 8, 74 10",
  "M2 12 C 8 24, 13 24, 18 12 S 28 2, 33 14 S 43 26, 48 12 S 58 2, 63 14 S 70 20, 74 16"
];

function mostrarMosaicos() {
  const hoy = hoyISO();
  const paraHoy = obtenerTareasPendientes().filter((t) => t.fecha === hoy).length + obtenerEventos().filter((e) => e.fecha === hoy).length;
  const minutos = minutosDeEstudio().reduce((total, s) => total + (s.duracion || 0), 0);
  const horas = Math.round((minutos / 60) * 10) / 10;

  const mosaicos = [
    { color: "lavanda", numero: paraHoy, etiqueta: "Para hoy", enlace: "calendario.html" },
    { color: "durazno", numero: obtenerTareasPendientes().length, etiqueta: "Pendientes", enlace: "tareas.html" },
    { color: "cielo", numero: obtenerNotas().length, etiqueta: "Notas", enlace: "notas.html" },
    { color: "menta", numero: horas, etiqueta: "Estudio", enlace: "estadisticas.html", sufijo: "h" }
  ];

  document.getElementById("mosaicos").innerHTML = mosaicos.map((m, i) => `
    <a class="mosaico mosaico-${m.color}" href="${m.enlace}" data-animar>
      <svg class="onda" viewBox="0 0 76 30" aria-hidden="true"><path d="${ONDAS[i]}"/></svg>
      <span class="numero">${Number.isInteger(m.numero) ? `<span data-contar="${m.numero}">${m.numero}</span>` : String(m.numero).replace(".", ",")}${m.sufijo ? `<small>${m.sufijo}</small>` : ""}</span>
      <span class="etiqueta-mosaico">${m.etiqueta}${icono("flecha")}</span>
    </a>`).join("");
}

// ═══ PRIMEROS PASOS (cuenta nueva) ══════════════════════════
function mostrarPrimerosPasos() {
  const pasos = [
    { hecho: obtenerMaterias().length > 0, titulo: "Crea tu primera materia", detalle: "Todo se organiza por materia.", enlace: "materias.html?nueva=1", nombreIcono: "materias", color: "materia-verde" },
    { hecho: obtenerNotas().length > 0, titulo: "Escribe una nota", detalle: "Títulos, listas, código e imágenes.", enlace: "nota.html?nueva=1", nombreIcono: "notas", color: "materia-azul" },
    { hecho: obtenerTareas().length > 0, titulo: "Agrega una tarea", detalle: "Con fecha y prioridad.", enlace: "tareas.html?nueva=1", nombreIcono: "tareas", color: "materia-violeta" }
  ];
  const listos = pasos.filter((p) => p.hecho).length;
  const seccion = document.getElementById("primeros-pasos");

  seccion.hidden = listos === pasos.length; // cuando termina los 3, desaparece
  if (seccion.hidden) return;

  seccion.innerHTML = `
    <div class="cabeza-pasos">
      <div>
        <h2 class="titulo-seccion" id="titulo-pasos">Primeros pasos</h2>
        <p class="texto-secundario pequeno">Así empiezas a usar NoteFlow:</p>
      </div>
      <span class="mono pequeno texto-secundario">${listos} de ${pasos.length}</span>
    </div>
    <div class="barra-progreso"><span style="width:${(listos / pasos.length) * 100}%"></span></div>
    <div class="lista-pasos">
      ${pasos.map((p) => `
        <a class="paso-inicio ${p.hecho ? "hecho" : ""}" href="${p.enlace}">
          <span class="icono-color ${p.color}">${icono(p.hecho ? "check" : p.nombreIcono)}</span>
          <span><strong>${p.titulo}</strong><small>${p.detalle}</small></span>
          ${icono("flecha")}
        </a>`).join("")}
    </div>`;
}

// ═══ MATERIAS Y NOTAS ═══════════════════════════════════════
function mostrarMaterias() {
  const materias = obtenerMaterias().slice(0, 6);
  document.getElementById("rejilla-materias").innerHTML = materias.length
    ? materias.map(crearTarjetaProgreso).join("")
    : `<div class="tarjeta vacio-ancho">${crearEstadoVacio({ nombreIcono: "materias", titulo: "Aún no tienes materias", texto: "Crea tu primera materia para organizar notas y tareas.", boton: '<a class="boton boton-primario" href="materias.html?nueva=1">Crear materia</a>' })}</div>`;
}

function mostrarNotasRecientes() {
  const notas = obtenerNotas().slice(0, 3);
  document.getElementById("notas-recientes").innerHTML = notas.length
    ? notas.map((n) => crearTarjetaNota(n)).join("")
    : `<div class="tarjeta vacio-ancho">${crearEstadoVacio({ nombreIcono: "notas", titulo: "Aún no tienes notas", texto: "Tus notas más recientes aparecerán aquí.", boton: '<a class="boton boton-primario" href="nota.html?nueva=1">Escribir una nota</a>' })}</div>`;
}

// ═══ RECORDATORIO CON CUENTA REGRESIVA ══════════════════════
let relojRecordatorio = null;

// Lo más próximo: una entrega (hasta las 11:59 p. m. de su fecha) o un examen/evento
function proximoPendiente() {
  const ahora = new Date();
  const candidatos = [];

  obtenerTareasPendientes().filter((t) => t.fecha && t.fecha >= hoyISO()).forEach(function (t) {
    const limite = aFecha(t.fecha);
    limite.setHours(23, 59, 59);
    candidatos.push({ tipo: "Próxima entrega", fecha: t.fecha, titulo: t.titulo, materiaId: t.materiaId, momento: limite, enlace: "tareas.html" });
  });

  obtenerEventos().filter((e) => e.tipo !== "sesion_estudio").forEach(function (e) {
    const [h, m] = e.hora.split(":").map(Number);
    const momento = aFecha(e.fecha);
    momento.setHours(h, m, 0);
    if (momento > ahora) candidatos.push({ tipo: e.tipo === "examen" ? "Próximo examen" : "Próximo evento", fecha: e.fecha, hora: e.hora, titulo: e.titulo, materiaId: e.materiaId, momento, enlace: "calendario.html" });
  });

  return candidatos.filter((c) => c.momento > ahora).sort((a, b) => a.momento - b.momento)[0] || null;
}

function digitos(ms) {
  const segundos = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const dos = (n) => String(n).padStart(2, "0");
  // Más de un día: días · horas · minutos. Menos: horas · minutos · segundos
  const partes = dias > 0
    ? [[dias, dias === 1 ? "día" : "días"], [dos(horas), "horas"], [dos(minutos), "min"]]
    : [[dos(horas), "horas"], [dos(minutos), "min"], [dos(segundos % 60), "seg"]];
  return partes.map(([valor, nombre]) => `<span class="digito">${valor}<small>${nombre}</small></span>`).join('<span class="dos-puntos">:</span>');
}

function mostrarRecordatorio() {
  const caja = document.getElementById("recordatorio");
  clearInterval(relojRecordatorio);
  const proximo = proximoPendiente();

  if (!proximo) {
    caja.innerHTML = `
      <div class="fila">
        <span class="icono-recordatorio">${icono("alarma")}</span>
        <div><small>Recordatorio</small><strong>Sin entregas a la vista 🎉</strong><span class="detalle">Agrega tareas con fecha y aquí verás la cuenta regresiva.</span></div>
      </div>
      <a class="boton boton-vidrio" href="tareas.html?nueva=1">${icono("mas")}Agregar tarea</a>`;
    return;
  }

  const materia = obtenerMateria(proximo.materiaId);
  caja.innerHTML = `
    <a class="fila" href="${proximo.enlace}">
      <span class="icono-recordatorio">${icono("alarma")}</span>
      <div>
        <small>${proximo.tipo}</small>
        <strong>${escaparHTML(proximo.titulo)}</strong>
        <span class="detalle">${materia ? escaparHTML(materia.nombre) + " · " : ""}${fechaRelativa(proximo.fecha)}${proximo.hora ? " · " + proximo.hora : ""}</span>
      </div>
    </a>
    <div class="cuenta-regresiva" id="cuenta-regresiva" aria-label="Tiempo restante">${digitos(proximo.momento - new Date())}</div>`;

  relojRecordatorio = setInterval(function () {
    const restante = proximo.momento - new Date();
    if (restante <= 0) return mostrarRecordatorio();
    document.getElementById("cuenta-regresiva").innerHTML = digitos(restante);
  }, 1000);
}

// ═══ AGENDA: SEMANA + ACTIVIDADES DEL DÍA ═══════════════════
function lunesDe(fecha) {
  return sumarDias(fecha, -((aFecha(fecha).getDay() + 6) % 7));
}

function mostrarSemana() {
  const lunes = lunesDe(hoyISO());
  const nombres = ["L", "M", "X", "J", "V", "S", "D"];
  const conActividad = (fecha) => obtenerTareas().some((t) => t.fecha === fecha && t.estado !== "completada") || obtenerEventos().some((e) => e.fecha === fecha);

  document.getElementById("semana").innerHTML = nombres.map(function (nombre, i) {
    const fecha = sumarDias(lunes, i);
    const clases = ["dia-agenda", fecha === diaAgenda ? "seleccionado" : "", fecha === hoyISO() ? "hoy" : "", conActividad(fecha) ? "con-actividad" : ""].join(" ");
    return `<button class="${clases}" type="button" data-dia="${fecha}" aria-pressed="${fecha === diaAgenda}" aria-label="${fechaLarga(fecha)}">
      ${nombre}<strong>${aFecha(fecha).getDate()}</strong><span class="punto"></span></button>`;
  }).join("");
}

function mostrarAgenda() {
  const tareas = obtenerTareas().filter((t) => t.fecha === diaAgenda);
  const eventos = obtenerEventos().filter((e) => e.fecha === diaAgenda).sort((a, b) => a.hora.localeCompare(b.hora));

  const filasEventos = eventos.map(function (e) {
    const tipo = TIPOS_EVENTO[e.tipo] || TIPOS_EVENTO.evento;
    const materia = obtenerMateria(e.materiaId);
    return `
      <li class="item-agenda ${claseMateria(materia)}">
        <span class="icono-tipo">${icono(tipo.icono)}</span>
        <span class="datos"><span class="tipo">${tipo.nombre}</span><span class="titulo">${escaparHTML(e.titulo)}</span>
        <span class="cuando">${e.hora}${e.duracion ? ` · ${e.duracion} min` : ""}${materia ? ` · ${escaparHTML(materia.nombre)}` : ""}</span></span>
      </li>`;
  });

  const filasTareas = tareas.map(function (t) {
    const materia = obtenerMateria(t.materiaId);
    const hecha = t.estado === "completada";
    return `
      <li class="item-agenda">
        <button class="anillo anillo-${t.prioridad} ${hecha ? "marcado" : ""}" type="button" data-completar="${t.id}" aria-label="${hecha ? "Marcar como pendiente" : "Completar"}: ${escaparHTML(t.titulo)}">${icono("check")}</button>
        <span class="datos"><span class="tipo">Tarea · prioridad ${t.prioridad}</span><span class="titulo ${hecha ? "hecho" : ""}">${escaparHTML(t.titulo)}</span>
        <span class="cuando">${materia ? escaparHTML(materia.nombre) : "Sin materia"}</span></span>
      </li>`;
  });

  const todas = [...filasEventos, ...filasTareas];
  document.getElementById("lista-agenda").innerHTML = todas.length
    ? todas.slice(0, 6).join("")
    : `<li class="agenda-vacia">Nada para ${diaAgenda === hoyISO() ? "hoy" : "este día"}. <a class="ver-todas" href="calendario.html?nuevo=1">Agregar evento</a></li>`;
}

// ═══ RACHA DE ESTUDIO ═══════════════════════════════════════
// Un día "cuenta" si escribiste una nota o tuviste una sesión de estudio.
function diasActivos() {
  const dias = new Set();
  obtenerNotas().forEach((n) => { dias.add(n.creadoEn.slice(0, 10)); dias.add(n.actualizadoEn.slice(0, 10)); });
  obtenerEventos().filter((e) => e.tipo === "sesion_estudio" && e.fecha <= hoyISO()).forEach((e) => dias.add(e.fecha));
  return dias;
}

function mostrarRacha() {
  const activos = diasActivos();
  // Cuenta desde hoy (o desde ayer, si hoy aún no estudias) hacia atrás
  let dia = activos.has(hoyISO()) ? hoyISO() : sumarDias(hoyISO(), -1);
  let racha = 0;
  while (activos.has(dia)) {
    racha++;
    dia = sumarDias(dia, -1);
  }

  const lunes = lunesDe(hoyISO());
  const letras = ["L", "M", "X", "J", "V", "S", "D"];
  const mensaje = racha === 0
    ? "Escribe una nota o estudia hoy para empezar tu racha."
    : activos.has(hoyISO()) ? "¡Hoy ya sumaste! Sigue así." : "Estudia hoy para no perder tu racha.";

  document.getElementById("racha").innerHTML = `
    <div class="cabeza-racha">
      <span class="llama" aria-hidden="true">🔥</span>
      <div><strong>${plural(racha, "día", "días")} de racha</strong><small>${mensaje}</small></div>
    </div>
    <div class="dias-racha" aria-label="Días activos de esta semana">
      ${letras.map((l, i) => {
        const fecha = sumarDias(lunes, i);
        return `<span class="dia-racha ${activos.has(fecha) ? "activo" : ""} ${fecha === hoyISO() ? "hoy" : ""}" title="${fechaLarga(fecha)}">${l}</span>`;
      }).join("")}
    </div>`;
}

// ═══ BIENVENIDA: la primera vez pide el nombre ══════════════
function pedirNombreSiFalta() {
  if (obtenerPerfil().nombre) return;
  abrirModal("modal-bienvenida");

  document.getElementById("formulario-bienvenida").addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const f = evento.target;
    const nombre = f.nombre.value.trim();
    const error = nombre.length < 2 ? "Escribe tu nombre (mínimo 2 letras)." : "";
    mostrarErrorCampo(f.nombre, error);
    if (error) return;
    guardarPerfil({ nombre, carrera: f.carrera.value.trim() });
    await esperarGuardado(); // que llegue a la base de datos antes de recargar
    window.location.reload(); // para que el menú y el saludo usen el nombre
  });
}

// ═══ ESCENA 3D ══════════════════════════════════════════════
// Se carga al final y solo en pantallas grandes, para que
// NUNCA retrase las notas y tareas.
function cargarEscena3D() {
  const contenedor = document.getElementById("escena-3d");
  const pantallaGrande = window.matchMedia("(min-width: 768px)").matches;
  if (!pantallaGrande || obtenerPreferencias().escena3d === false) return;

  const cargar = () => import("../3d/escena.js").then((modulo) => modulo.crearEscena(contenedor)).catch((error) => {
    console.warn("NoteFlow: la escena 3D no se pudo cargar, se queda la imagen", error);
  });
  if ("requestIdleCallback" in window) requestIdleCallback(cargar, { timeout: 1500 });
  else setTimeout(cargar, 400);
}

// ═══ AVISO PARA INSTALAR (celular) ══════════════════════════
function prepararAvisoInstalar() {
  const aviso = document.getElementById("aviso-instalar");
  const clave = `noteflow-aviso-instalar-${obtenerUsuario().id}`;
  let descartado = false;
  try { descartado = localStorage.getItem(clave) === "no"; } catch (error) { /* sin almacenamiento */ }
  aviso.hidden = descartado;
  document.getElementById("cerrar-aviso-instalar").addEventListener("click", function () {
    aviso.hidden = true;
    try { localStorage.setItem(clave, "no"); } catch (error) { /* sin almacenamiento */ }
  });
}

// ═══ DIBUJAR TODO ═══════════════════════════════════════════
function mostrarTodo() {
  mostrarBienvenida();
  mostrarMosaicos();
  mostrarPrimerosPasos();
  mostrarMaterias();
  mostrarNotasRecientes();
  mostrarRecordatorio();
  mostrarSemana();
  mostrarAgenda();
  mostrarRacha();
}

mostrarTodo();
iniciarEnfoque(document.getElementById("enfoque"));
animarEntrada();
animarBarras();
animarNumeros();

// Elegir un día en la agenda
document.getElementById("semana").addEventListener("click", function (evento) {
  const dia = evento.target.closest("[data-dia]");
  if (!dia) return;
  diaAgenda = dia.dataset.dia;
  mostrarSemana();
  mostrarAgenda();
});

// Completar una tarea desde la agenda
document.getElementById("lista-agenda").addEventListener("click", function (evento) {
  const boton = evento.target.closest("[data-completar]");
  if (!boton) return;
  const tarea = obtenerTareas().find((t) => t.id === boton.dataset.completar);
  const completar = tarea.estado !== "completada";
  guardarTarea({ id: tarea.id, estado: completar ? "completada" : "pendiente" });
  boton.classList.toggle("marcado", completar);
  if (completar) {
    animarCheck(boton);
    mostrarAviso(`¡Bien! "${tarea.titulo}" completada`);
  }
  setTimeout(mostrarTodo, completar ? 650 : 0);
});

// Al terminar una sesión de enfoque se actualizan horas, agenda y racha
window.addEventListener("noteflow:enfoque-completado", mostrarTodo);

prepararAvisoInstalar();
cargarEscena3D();
pedirNombreSiFalta();
