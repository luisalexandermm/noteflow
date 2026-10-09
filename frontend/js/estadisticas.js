// ═══════════════════════════════════════════════════════════
// NoteFlow · estadisticas.js
// "Mi progreso": 4 cifras, gráfico de horas de estudio (SVG
// hecho a mano, sin librerías) y progreso por materia.
// ═══════════════════════════════════════════════════════════

import { obtenerTareas, obtenerNotas, obtenerMaterias, minutosDeEstudio, resumenMateria } from "./datos.js";
import { crearTarjetaDato } from "./componentes.js";
import { animarEntrada, animarBarras, animarNumeros, puedeAnimar } from "./animaciones.js";
import { hoyISO, sumarDias, aFecha, escaparHTML, claseMateria, plural } from "./utilidades.js";

// ── Horas de los últimos 7 días ─────────────────────────────
// Salen de las "sesiones de estudio" que agregas en el Calendario
function horasPorDia() {
  const sesiones = minutosDeEstudio();
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const fecha = sumarDias(hoyISO(), -i);
    const minutos = sesiones.filter((s) => s.fecha === fecha).reduce((total, s) => total + (s.duracion || 0), 0);
    dias.push({ fecha, minutos });
  }
  return dias;
}

// 95 → "1 h 35 min"
function formatoTiempo(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (!horas) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

function nombreDia(fecha) {
  const texto = aFecha(fecha).toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1, 3);
}

// ── Las 4 cifras ────────────────────────────────────────────
function mostrarCifras(dias) {
  const tareas = obtenerTareas();
  const completadas = tareas.filter((t) => t.estado === "completada").length;
  const horas = dias.reduce((total, d) => total + d.minutos, 0) / 60;

  document.getElementById("datos-progreso").innerHTML = `
    ${crearTarjetaDato({ numero: completadas, etiqueta: "Tareas completadas", nombreIcono: "check", color: "materia-verde" })}
    ${crearTarjetaDato({ numero: tareas.length - completadas, etiqueta: "Tareas pendientes", nombreIcono: "tareas", color: "materia-violeta" })}
    ${crearTarjetaDato({ numero: obtenerNotas().length, etiqueta: "Notas creadas", nombreIcono: "notas", color: "materia-azul" })}
    ${crearTarjetaDato({ numero: horas.toLocaleString("es-CO", { maximumFractionDigits: 1 }) + " h", etiqueta: "Estudio esta semana", nombreIcono: "reloj", color: "materia-ambar" })}`;
}

// ── Gráfico de barras en SVG ────────────────────────────────
function dibujarGrafico(dias) {
  const ancho = 560, alto = 220;
  const margen = { arriba: 22, abajo: 28, izquierda: 30, derecha: 6 };
  const areaAlto = alto - margen.arriba - margen.abajo;
  const areaAncho = ancho - margen.izquierda - margen.derecha;

  // Escala en horas redondeada hacia arriba (mínimo 2 h)
  const maximoMinutos = Math.max(...dias.map((d) => d.minutos), 60);
  const maximoHoras = Math.max(2, Math.ceil(maximoMinutos / 60));
  const y = (minutos) => margen.arriba + areaAlto - (minutos / (maximoHoras * 60)) * areaAlto;

  const espacio = areaAncho / dias.length;
  const anchoBarra = Math.min(34, espacio * 0.5);
  const base = margen.arriba + areaAlto;

  // Líneas guía (cada hora)
  let guias = "";
  for (let h = 0; h <= maximoHoras; h++) {
    guias += `<line class="linea-guia" x1="${margen.izquierda}" x2="${ancho - margen.derecha}" y1="${y(h * 60)}" y2="${y(h * 60)}"/>`;
    guias += `<text class="texto-eje" x="${margen.izquierda - 8}" y="${y(h * 60) + 4}" text-anchor="end">${h}h</text>`;
  }

  // Solo rotulamos el día con más estudio y hoy (no un número en cada barra)
  const mejorDia = dias.reduce((mejor, d) => (d.minutos > mejor.minutos ? d : mejor), dias[0]);

  const barras = dias.map(function (dia, i) {
    const x = margen.izquierda + espacio * i + (espacio - anchoBarra) / 2;
    const arriba = y(dia.minutos);
    const altoBarra = base - arriba;
    const r = Math.min(4, altoBarra); // esquinas redondeadas solo arriba
    const forma = altoBarra > 0
      ? `M${x},${base} V${arriba + r} Q${x},${arriba} ${x + r},${arriba} H${x + anchoBarra - r} Q${x + anchoBarra},${arriba} ${x + anchoBarra},${arriba + r} V${base} Z`
      : "";
    const esHoy = dia.fecha === hoyISO();
    const rotulo = (dia === mejorDia || esHoy) && dia.minutos
      ? `<text class="valor" x="${x + anchoBarra / 2}" y="${arriba - 6}" text-anchor="middle">${formatoTiempo(dia.minutos)}</text>`
      : "";
    const descripcion = `${nombreDia(dia.fecha)} ${aFecha(dia.fecha).getDate()}: ${dia.minutos ? formatoTiempo(dia.minutos) : "sin estudio"}`;

    return `
      <g class="grupo-barra" tabindex="0" role="img" aria-label="${descripcion}" data-texto="${descripcion}" data-x="${(x + anchoBarra / 2) / ancho}" data-y="${arriba / alto}">
        <rect class="zona-hover" x="${margen.izquierda + espacio * i}" y="${margen.arriba}" width="${espacio}" height="${areaAlto}"/>
        ${forma ? `<path class="barra ${esHoy ? "barra-hoy" : ""}" d="${forma}"/>` : ""}
        ${rotulo}
        <text class="texto-eje" x="${x + anchoBarra / 2}" y="${alto - 8}" text-anchor="middle">${esHoy ? "Hoy" : nombreDia(dia.fecha)}</text>
      </g>`;
  }).join("");

  const contenedor = document.getElementById("grafico-horas");
  contenedor.innerHTML = `
    <svg viewBox="0 0 ${ancho} ${alto}" aria-label="Horas de estudio de los últimos 7 días">${guias}${barras}</svg>
    <div class="tooltip-grafico" hidden></div>`;

  activarTooltip(contenedor);

  if (puedeAnimar()) {
    window.gsap.from(contenedor.querySelectorAll(".barra"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, stagger: 0.06, ease: "power3.out" });
  }

  // Tabla accesible con los mismos datos
  document.getElementById("tabla-horas").innerHTML =
    "<tr><th>Día</th><th>Tiempo</th></tr>" +
    dias.map((d) => `<tr><td>${nombreDia(d.fecha)} ${aFecha(d.fecha).getDate()}</td><td>${formatoTiempo(d.minutos)}</td></tr>`).join("");

  const total = dias.reduce((t, d) => t + d.minutos, 0);
  document.getElementById("subtitulo-horas").textContent = total
    ? `Últimos 7 días · ${formatoTiempo(total)} en total`
    : "Aún no hay sesiones. Agrégalas en el Calendario como “Sesión de estudio”.";
}

// Cuadro con el valor exacto al pasar el mouse o con el teclado
function activarTooltip(contenedor) {
  const tooltip = contenedor.querySelector(".tooltip-grafico");

  function mostrar(grupo) {
    tooltip.textContent = grupo.dataset.texto;
    tooltip.style.left = `${grupo.dataset.x * 100}%`;
    tooltip.style.top = `${grupo.dataset.y * 100}%`;
    tooltip.hidden = false;
  }

  contenedor.querySelectorAll(".grupo-barra").forEach(function (grupo) {
    grupo.addEventListener("mouseenter", () => mostrar(grupo));
    grupo.addEventListener("focus", () => mostrar(grupo));
    grupo.addEventListener("mouseleave", () => (tooltip.hidden = true));
    grupo.addEventListener("blur", () => (tooltip.hidden = true));
  });
}

// ── Progreso por materia ────────────────────────────────────
function mostrarProgresoMaterias() {
  const materias = obtenerMaterias();
  document.getElementById("progreso-materias").innerHTML = materias.map(function (materia) {
    const r = resumenMateria(materia.id);
    const completadas = r.tareasTotales - r.tareasPendientes;
    return `
      <div class="fila-progreso ${claseMateria(materia)}">
        <div class="arriba"><span class="punto"></span><strong>${escaparHTML(materia.nombre)}</strong><span>${r.progreso}%</span></div>
        <div class="barra-progreso" style="--progreso: ${r.progreso}%"><span></span></div>
        <small>${completadas} de ${plural(r.tareasTotales, "tarea completada", "tareas completadas")}</small>
      </div>`;
  }).join("") || '<p class="texto-tenue">Aún no tienes materias.</p>';
}

const dias = horasPorDia();
mostrarCifras(dias);
dibujarGrafico(dias);
mostrarProgresoMaterias();
animarEntrada();
animarBarras();
animarNumeros();
