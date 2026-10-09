// ═══════════════════════════════════════════════════════════
// NoteFlow · animaciones.js
// Microinteracciones con GSAP. Reglas:
//   · rápidas (0.2 – 0.5 s) y suaves
//   · si GSAP no cargó, o el usuario pidió menos movimiento,
//     todo funciona igual pero sin animación
// GSAP se carga como script normal: vendor/gsap/gsap.min.js
// ═══════════════════════════════════════════════════════════

import { obtenerPreferencias } from "./datos.js";

// ¿Podemos animar?
export function puedeAnimar() {
  const pideMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desactivadas = obtenerPreferencias().animaciones === false;
  return Boolean(window.gsap) && !pideMenosMovimiento && !desactivadas;
}

// Elementos con data-animar entran uno tras otro al cargar la página
export function animarEntrada(raiz = document) {
  if (!puedeAnimar()) return;
  const elementos = raiz.querySelectorAll("[data-animar]");
  if (!elementos.length) return;

  window.gsap.from(elementos, {
    opacity: 0,
    y: 14,
    duration: 0.5,
    stagger: { amount: Math.min(0.4, elementos.length * 0.04) }, // máximo 0.4 s en total
    ease: "power3.out",
    clearProps: "opacity,transform"
  });
}

// Las barras de progreso crecen desde 0
export function animarBarras(raiz = document) {
  if (!puedeAnimar()) return;
  raiz.querySelectorAll(".barra-progreso span").forEach(function (barra) {
    window.gsap.from(barra, { width: 0, duration: 0.9, delay: 0.15, ease: "power2.out" });
  });
}

// Los números cuentan desde 0 hasta su valor ("72%" también funciona)
export function animarNumeros(raiz = document) {
  if (!puedeAnimar()) return;
  raiz.querySelectorAll("[data-contar]").forEach(function (elemento) {
    const final = Number(elemento.dataset.contar);
    const sufijo = elemento.dataset.sufijo || "";
    const contador = { valor: 0 };
    window.gsap.to(contador, {
      valor: final,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => (elemento.textContent = Math.round(contador.valor) + sufijo)
    });
  });
}

// Tarjetas que se elevan un poco al pasar el mouse
export function elevarAlPasar(selector) {
  if (!puedeAnimar()) return;
  document.querySelectorAll(selector).forEach(function (tarjeta) {
    tarjeta.addEventListener("mouseenter", () => window.gsap.to(tarjeta, { y: -4, duration: 0.3, ease: "power2.out" }));
    tarjeta.addEventListener("mouseleave", () => window.gsap.to(tarjeta, { y: 0, duration: 0.35, ease: "power2.out" }));
  });
}

// ✓ al completar una tarea: pequeño rebote
export function animarCheck(elemento) {
  if (!puedeAnimar()) return;
  window.gsap.fromTo(elemento, { scale: 0.6 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
}

// Un elemento nuevo aparece suavemente (nota o tarea recién creada)
export function aparecer(elemento) {
  if (!puedeAnimar() || !elemento) return;
  window.gsap.from(elemento, { opacity: 0, y: 10, scale: 0.98, duration: 0.45, ease: "power3.out", clearProps: "all" });
}

// Un elemento se va antes de borrarlo
export function desaparecer(elemento, alTerminar) {
  if (!puedeAnimar()) return alTerminar();
  window.gsap.to(elemento, { opacity: 0, x: 12, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.3, ease: "power2.in", onComplete: alTerminar });
}

// Cambio de página: el contenido se desvanece antes de navegar
export function activarTransicionPaginas() {
  if (!puedeAnimar()) return;

  document.addEventListener("click", function (evento) {
    const enlace = evento.target.closest("a[href]");
    if (!enlace || evento.defaultPrevented) return;
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || enlace.target === "_blank") return;

    const destino = new URL(enlace.href, window.location.href);
    const esInterno = destino.origin === window.location.origin && destino.pathname.endsWith(".html");
    if (!esInterno || destino.href === window.location.href) return;

    evento.preventDefault();
    window.gsap.to(".contenido", {
      opacity: 0,
      y: -6,
      duration: 0.16,
      ease: "power1.in",
      onComplete: () => (window.location.href = destino.href)
    });
  });

  // Si el usuario vuelve con el botón "atrás", mostrar el contenido otra vez
  window.addEventListener("pageshow", function (evento) {
    if (evento.persisted) window.gsap.set(".contenido", { opacity: 1, y: 0 });
  });
}
