// ═══════════════════════════════════════════════════════════
// NoteFlow · enfoque.js
// "Modo enfoque" (técnica Pomodoro): un temporizador de 25, 45 o
// 60 minutos. Al terminar se guarda solo como "Sesión de estudio"
// en el calendario, y suma horas en "Mi progreso".
//
// El estado se guarda en este navegador, así el temporizador sigue
// corriendo aunque cambies de página o cierres la app un rato.
// ═══════════════════════════════════════════════════════════

import { icono } from "./iconos.js";
import { obtenerMaterias, obtenerMateria, guardarEvento, obtenerUsuario } from "./datos.js";
import { mostrarAviso } from "./app.js";
import { fechaISO } from "./utilidades.js";
import { opcionesMaterias } from "./componentes.js";

const DURACIONES = [25, 45, 60];   // minutos
const MINIMO_PARA_GUARDAR = 5;     // menos de 5 min no cuenta
const RADIO = 82;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const CLAVE = `noteflow-enfoque-${obtenerUsuario().id}`;

// estado = { duracion, inicio (ms) | null, restantePausado (ms) | null, materiaId, horaInicio }
let estado = leerEstado();
let temporizador = null;
let contenedor = null;
const tituloOriginal = document.title;

function leerEstado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (guardado && DURACIONES.includes(guardado.duracion)) return guardado;
  } catch (error) { /* sin datos guardados */ }
  return { duracion: 25, inicio: null, restantePausado: null, materiaId: "", horaInicio: null };
}

function guardarEstado() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (error) { /* modo privado */ }
}

// Milisegundos que faltan
function restante() {
  if (estado.inicio) return estado.duracion * 60000 - (Date.now() - estado.inicio);
  if (estado.restantePausado !== null) return estado.restantePausado;
  return estado.duracion * 60000;
}

function formato(ms) {
  const segundos = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
}

// ── Dibujo ──────────────────────────────────────────────────
// 60 marquitas alrededor, como un termostato
function marcas() {
  let lineas = "";
  for (let i = 0; i < 60; i++) {
    const angulo = (i / 60) * Math.PI * 2;
    const larga = i % 5 === 0;
    const r1 = 97, r2 = larga ? 90 : 93;
    lineas += `<line class="${larga ? "larga" : ""}" x1="${100 + r1 * Math.cos(angulo)}" y1="${100 + r1 * Math.sin(angulo)}" x2="${100 + r2 * Math.cos(angulo)}" y2="${100 + r2 * Math.sin(angulo)}"/>`;
  }
  return lineas;
}

function dibujar() {
  const corriendo = Boolean(estado.inicio);
  const pausado = !corriendo && estado.restantePausado !== null;

  contenedor.classList.toggle("corriendo", corriendo || pausado);
  contenedor.innerHTML = `
    <div class="cabecera-seccion">
      <h2 id="titulo-enfoque">Modo enfoque</h2>
      <span class="pastilla">Pomodoro</span>
    </div>
    <div class="anillo-enfoque">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="degradado-enfoque" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#7d8cff"/><stop offset="0.55" stop-color="#5b5ff0"/><stop offset="1" stop-color="#b16cf6"/>
          </linearGradient>
        </defs>
        <g class="marcas">${marcas()}</g>
        <circle class="pista" cx="100" cy="100" r="${RADIO}"/>
        <circle class="avance" id="avance-enfoque" cx="100" cy="100" r="${RADIO}" stroke-dasharray="${CIRCUNFERENCIA}" stroke-dashoffset="${CIRCUNFERENCIA}"/>
      </svg>
      <div class="centro">
        <span class="tiempo" id="tiempo-enfoque" role="timer">${formato(restante())}</span>
        <span class="estado-enfoque" id="estado-enfoque">${corriendo ? "Concentrado…" : pausado ? "En pausa" : "Listo para empezar"}</span>
      </div>
    </div>
    <div class="grupo-chips duraciones" role="group" aria-label="Duración">
      ${DURACIONES.map((d) => `<button class="chip ${d === estado.duracion ? "activo" : ""}" type="button" data-duracion="${d}">${d} min</button>`).join("")}
    </div>
    <select class="selector" id="materia-enfoque" aria-label="Materia que vas a estudiar">
      ${opcionesMaterias(obtenerMaterias(), estado.materiaId, "¿Qué vas a estudiar? (opcional)")}
    </select>
    <div class="controles-enfoque">
      <button class="boton-redondo" type="button" data-enfoque="reiniciar" aria-label="Reiniciar">${icono("reiniciar")}</button>
      <button class="boton-reproducir" type="button" data-enfoque="alternar" aria-label="${corriendo ? "Pausar" : "Empezar"}">${icono(corriendo ? "pausa" : "play")}</button>
      <button class="boton-redondo" type="button" data-enfoque="terminar" aria-label="Terminar y guardar">${icono("check")}</button>
    </div>
    <p class="nota-enfoque">Al terminar se guarda como sesión de estudio.</p>`;

  actualizarTiempo();
}

// Solo cambia el número y el anillo (cada segundo)
function actualizarTiempo() {
  const ms = restante();
  const total = estado.duracion * 60000;
  const avance = Math.min(1, Math.max(0, 1 - ms / total));

  const tiempo = contenedor.querySelector("#tiempo-enfoque");
  if (tiempo) tiempo.textContent = formato(ms);
  const anillo = contenedor.querySelector("#avance-enfoque");
  if (anillo) anillo.style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - avance));

  document.title = estado.inicio ? `${formato(ms)} · Enfoque · NoteFlow` : tituloOriginal;

  if (estado.inicio && ms <= 0) completar(estado.duracion);
}

// ── Acciones ────────────────────────────────────────────────
function empezar() {
  const ms = restante();
  estado.inicio = Date.now() - (estado.duracion * 60000 - ms);
  estado.restantePausado = null;
  if (!estado.horaInicio) {
    const ahora = new Date();
    estado.horaInicio = { fecha: fechaISO(ahora), hora: `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}` };
  }
  guardarEstado();
  arrancarReloj();
  dibujar();
}

function pausar() {
  estado.restantePausado = restante();
  estado.inicio = null;
  guardarEstado();
  detenerReloj();
  dibujar();
}

function reiniciar() {
  estado = { ...estado, inicio: null, restantePausado: null, horaInicio: null };
  guardarEstado();
  detenerReloj();
  dibujar();
}

// Guarda la sesión de estudio en el calendario
function completar(minutos) {
  const materia = obtenerMateria(estado.materiaId);
  const inicio = estado.horaInicio || { fecha: fechaISO(), hora: "08:00" };

  guardarEvento({
    titulo: materia ? `Enfoque: ${materia.nombre}` : "Sesión de enfoque",
    tipo: "sesion_estudio",
    materiaId: materia ? materia.id : null,
    fecha: inicio.fecha,
    hora: inicio.hora,
    duracion: minutos
  });

  reiniciar();
  mostrarAviso(`¡Bien hecho! ${minutos} min de estudio guardados`);
  // Vibra solo si ya tocaste la pantalla (el navegador no deja antes)
  if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate([120, 60, 120]);
  window.dispatchEvent(new CustomEvent("noteflow:enfoque-completado"));
}

// Terminar antes de tiempo: se guarda lo estudiado (si son 5 min o más)
function terminar() {
  const empezo = Boolean(estado.inicio) || estado.restantePausado !== null;
  const estudiados = Math.floor((estado.duracion * 60000 - restante()) / 60000);
  if (estudiados >= MINIMO_PARA_GUARDAR) {
    completar(estudiados);
    return;
  }
  reiniciar();
  if (empezo) mostrarAviso(`Las sesiones de menos de ${MINIMO_PARA_GUARDAR} min no se guardan`, "error");
}

function arrancarReloj() {
  detenerReloj();
  temporizador = setInterval(actualizarTiempo, 1000);
}

function detenerReloj() {
  clearInterval(temporizador);
  temporizador = null;
  document.title = tituloOriginal;
}

// ── Inicio ──────────────────────────────────────────────────
export function iniciarEnfoque(elemento) {
  contenedor = elemento;

  contenedor.addEventListener("click", function (evento) {
    const duracion = evento.target.closest("[data-duracion]");
    if (duracion && !estado.inicio && estado.restantePausado === null) {
      estado.duracion = Number(duracion.dataset.duracion);
      guardarEstado();
      dibujar();
      return;
    }
    const accion = evento.target.closest("[data-enfoque]");
    if (!accion) return;
    if (accion.dataset.enfoque === "alternar") (estado.inicio ? pausar : empezar)();
    if (accion.dataset.enfoque === "reiniciar") reiniciar();
    if (accion.dataset.enfoque === "terminar") terminar();
  });

  contenedor.addEventListener("change", function (evento) {
    if (evento.target.id === "materia-enfoque") {
      estado.materiaId = evento.target.value;
      guardarEstado();
    }
  });

  dibujar();

  // Si ya venía corriendo (o terminó mientras no estabas)
  if (estado.inicio) {
    if (restante() <= 0) completar(estado.duracion);
    else arrancarReloj();
  }
}
