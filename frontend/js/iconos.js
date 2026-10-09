// ═══════════════════════════════════════════════════════════
// NoteFlow · iconos.js
// Todos los íconos de la app en un solo lugar (SVG de línea).
//
// En el HTML:        <span data-icono="notas"></span>
//                    (pintarIconos() lo cambia por el SVG)
// En JavaScript:     elemento.innerHTML = icono("buscar");
// ═══════════════════════════════════════════════════════════

export const ICONOS = {
  // Navegación
  inicio: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  notas: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  materias: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  tareas: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  calendario: '<rect x="3" y="4.5" width="18" height="16.5" rx="3.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  estadisticas: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/>',
  ia: '<path d="M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z"/><path d="M18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  configuracion: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',

  // Acciones
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  campana: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  basura: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  estrella: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  enviar: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15.5 7"/>',
  descargar: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  reiniciar: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',

  // Flechas
  derecha: '<path d="m9 6 6 6-6 6"/>',
  izquierda: '<path d="m15 6-6 6 6 6"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
  atras: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',

  // Editor
  titulo: '<path d="M6 4v16M18 4v16M6 12h12"/>',
  negrita: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  cursiva: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
  lista: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  lista_numerada: '<path d="M10 6h10M10 12h10M10 18h10M4 4h1.5v4M4 8h3M4 14.5a1.5 1.5 0 0 1 3 0c0 1.5-3 2-3 3.5h3"/>',
  enlace: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  imagen: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  etiqueta: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',

  // Materias
  algoritmo: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6h7M6 8.5V14a4 4 0 0 0 4 4h5.5"/>',
  capas: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  base_datos: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  sigma: '<path d="M18 5H6l6 7-6 7h12"/>',
  atomo: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  codigo: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  libro: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  examen: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V2.5h6V4M9 11h6M9 15h4"/>',
  idioma: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',

  // Varios
  bandeja: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
  movil: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18h2"/>',
  cuadricula: '<rect x="3.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2.2"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  play: '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>',
  pausa: '<rect x="6.5" y="5" width="3.5" height="14" rx="1.2"/><rect x="14" y="5" width="3.5" height="14" rx="1.2"/>',
  alarma: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M5 3.5 2.5 6M19 3.5 21.5 6"/>',
  instalar: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M12 7v7M9 11.5l3 3 3-3"/>',
  bombilla: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'
};

// Íconos que el usuario puede elegir para una materia
export const ICONOS_MATERIA = ["algoritmo", "capas", "base_datos", "sigma", "atomo", "codigo", "libro", "idioma"];

// Devuelve el SVG completo de un ícono como texto
export function icono(nombre, claseExtra = "") {
  const dibujo = ICONOS[nombre] || ICONOS.notas;
  return `<svg class="icono ${claseExtra}" viewBox="0 0 24 24" aria-hidden="true">${dibujo}</svg>`;
}

// Cambia todos los <span data-icono="..."> por su SVG
export function pintarIconos(raiz = document) {
  raiz.querySelectorAll("[data-icono]").forEach(function (elemento) {
    elemento.outerHTML = icono(elemento.dataset.icono, elemento.className);
  });
}

// Logo de NoteFlow: cubo isométrico violeta.
// Cada logo usa ids distintos para sus degradados (si dos logos
// comparten id y uno está oculto, el otro se vería sin color).
let numeroLogo = 0;
export function logoNoteFlow() {
  numeroLogo++;
  const n = numeroLogo;
  return `
    <svg class="marca-logo" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="nf-arriba-${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9bbff"/><stop offset="1" stop-color="#7d78f7"/></linearGradient>
        <linearGradient id="nf-izq-${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a63f1"/><stop offset="1" stop-color="#4338ca"/></linearGradient>
        <linearGradient id="nf-der-${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f7cfb"/><stop offset="1" stop-color="#5b45e0"/></linearGradient>
      </defs>
      <g stroke-linejoin="round" stroke-width="1.6">
        <path d="M16 3.5 27.5 9.8 16 16.1 4.5 9.8z" fill="url(#nf-arriba-${n})" stroke="url(#nf-arriba-${n})"/>
        <path d="M4.5 9.8 16 16.1v12.4L4.5 22.2z" fill="url(#nf-izq-${n})" stroke="url(#nf-izq-${n})"/>
        <path d="M27.5 9.8 16 16.1v12.4l11.5-6.3z" fill="url(#nf-der-${n})" stroke="url(#nf-der-${n})"/>
      </g>
      <path d="M16 16.1v12.4M4.5 9.8 16 16.1l11.5-6.3" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>
    </svg>`;
}
