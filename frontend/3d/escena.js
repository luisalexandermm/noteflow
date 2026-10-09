// ═══════════════════════════════════════════════════════════
// NoteFlow · 3d/escena.js
// Escena Three.js del inicio: un cubo de cristal con hojas y
// cubitos flotando alrededor. Reacciona al mouse (parallax).
//
// Reglas de rendimiento:
//   · solo se carga en pantallas ≥ 768 px (lo decide inicio.js)
//   · dispositivo lento → reducirAnimaciones3D()
//   · se pausa si no se ve (otra pestaña o fuera de pantalla)
//   · si algo falla, queda la imagen SVG de respaldo
// ═══════════════════════════════════════════════════════════

import * as THREE from "../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../vendor/three/RoundedBoxGeometry.js";
import { RoomEnvironment } from "../vendor/three/RoomEnvironment.js";

// ── ¿Puede y debe animarse? ─────────────────────────────────
function soportaWebGL() {
  try {
    const lienzo = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (lienzo.getContext("webgl2") || lienzo.getContext("webgl")));
  } catch (error) {
    return false;
  }
}

function dispositivoLento() {
  const nucleos = navigator.hardwareConcurrency || 4;
  const memoria = navigator.deviceMemory || 4; // GB (solo algunos navegadores lo dan)
  return nucleos <= 2 || memoria <= 2;
}

function pideMenosMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("sin-animaciones");
}

// ── Materiales ──────────────────────────────────────────────
function crearMateriales() {
  return {
    cristal: new THREE.MeshPhysicalMaterial({
      color: 0xb8b5ff,
      metalness: 0.1,
      roughness: 0.08,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [180, 520],
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 1.6
    }),
    nucleo: new THREE.MeshBasicMaterial({ color: 0x8c88ff, transparent: true, opacity: 0.35 }),
    perla: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      iridescence: 0.5,
      envMapIntensity: 1.1
    }),
    hoja: new THREE.MeshPhysicalMaterial({ color: 0xfbfbff, roughness: 0.45, clearcoat: 0.6, envMapIntensity: 1 }),
    violeta: new THREE.MeshPhysicalMaterial({ color: 0x6d68f2, roughness: 0.3, clearcoat: 1, envMapIntensity: 1.2 })
  };
}

// ── Objetos de la escena ────────────────────────────────────
// Cada objeto guarda su posición base para flotar a su alrededor.
function crearObjetos(grupo, m) {
  const objetos = [];

  function agregar(malla, x, y, z, profundidad, velocidad, fase) {
    malla.position.set(x, y, z);
    malla.userData = { base: new THREE.Vector3(x, y, z), profundidad, velocidad, fase, giro: malla.rotation.clone() };
    grupo.add(malla);
    objetos.push(malla);
  }

  // Cubo de cristal principal (con un núcleo de color adentro)
  const cubo = new THREE.Mesh(new RoundedBoxGeometry(1.55, 1.55, 1.55, 5, 0.24), m.cristal);
  cubo.rotation.set(0.55, 0.75, 0);
  const nucleo = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.8, 0.8, 3, 0.16), m.nucleo);
  cubo.add(nucleo);
  agregar(cubo, 0.15, 0.05, 0, 0.5, 0.6, 0);

  // Hojas (como páginas de cuaderno)
  const geometriaHoja = new RoundedBoxGeometry(0.95, 1.2, 0.035, 2, 0.05);
  const hoja1 = new THREE.Mesh(geometriaHoja, m.hoja);
  hoja1.rotation.set(-0.25, 0.55, 0.28);
  agregar(hoja1, -1.75, 0.35, -0.6, 0.9, 0.5, 1.2);

  const hoja2 = new THREE.Mesh(geometriaHoja, m.hoja);
  hoja2.rotation.set(0.2, -0.5, -0.22);
  agregar(hoja2, 1.9, -0.35, -0.9, 0.8, 0.45, 2.4);

  // Cubitos perlados
  const cubito1 = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.42, 0.42, 3, 0.08), m.perla);
  cubito1.rotation.set(0.6, 0.4, 0.2);
  agregar(cubito1, 1.35, 1.05, 0.6, 1.3, 0.9, 0.6);

  const cubito2 = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.3, 0.3, 3, 0.06), m.cristal);
  cubito2.rotation.set(0.3, 0.9, 0.4);
  agregar(cubito2, -1.05, -0.95, 0.8, 1.5, 1.1, 3.1);

  // "Libro" violeta pequeño
  const libro = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.14, 0.52, 2, 0.04), m.violeta);
  libro.rotation.set(0.35, -0.6, 0.12);
  agregar(libro, -1.25, 1.05, 0.2, 1.1, 0.7, 4.2);

  return objetos;
}

// ── Función principal ───────────────────────────────────────
export function crearEscena(contenedor) {
  if (!contenedor || !soportaWebGL()) return;

  const lento = dispositivoLento();
  const estatico = pideMenosMovimiento();

  // Renderizador con fondo transparente
  const renderizador = new THREE.WebGLRenderer({ antialias: !lento, alpha: true, powerPreference: "low-power" });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, lento ? 1 : 1.75));
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.05;
  contenedor.appendChild(renderizador.domElement);

  const escena = new THREE.Scene();

  // Reflejos suaves de "estudio fotográfico"
  const generador = new THREE.PMREMGenerator(renderizador);
  escena.environment = generador.fromScene(new RoomEnvironment(), 0.04).texture;
  generador.dispose();

  const luz = new THREE.DirectionalLight(0xffffff, 1.2);
  luz.position.set(3, 4, 5);
  escena.add(luz, new THREE.AmbientLight(0xe8e8ff, 0.6));

  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camara.position.set(0, 0.2, 8);

  const grupo = new THREE.Group();
  escena.add(grupo);
  const objetos = crearObjetos(grupo, crearMateriales());

  // ── Tamaño ──
  function ajustarTamano() {
    const ancho = contenedor.clientWidth + 40;
    const alto = contenedor.clientHeight + 40;
    renderizador.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  }
  ajustarTamano();
  new ResizeObserver(ajustarTamano).observe(contenedor);

  // ── Mouse (parallax) ──
  const mouse = { x: 0, y: 0 };
  const suave = { x: 0, y: 0 };
  if (!lento && !estatico) {
    window.addEventListener("pointermove", function (evento) {
      mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;  // -1 … 1
      mouse.y = (evento.clientY / window.innerHeight) * 2 - 1;
    });
  }

  // ── Animación ──
  const inicio = performance.now();
  let visible = true;
  let cuadro = 0;

  function reducirAnimaciones3D() {
    // En equipos lentos: dibujar 1 de cada 2 cuadros (≈ 30 fps)
    cuadro++;
    return lento && cuadro % 2 === 1;
  }

  function animar() {
    requestAnimationFrame(animar);
    if (!visible || reducirAnimaciones3D()) return;

    const t = (performance.now() - inicio) / 1000; // segundos desde que empezó

    // El movimiento del mouse se sigue con suavidad (lerp)
    suave.x += (mouse.x - suave.x) * 0.05;
    suave.y += (mouse.y - suave.y) * 0.05;
    grupo.rotation.y = suave.x * 0.25;
    grupo.rotation.x = suave.y * 0.15;

    objetos.forEach(function (objeto) {
      const d = objeto.userData;
      // Flotar arriba/abajo + desplazamiento por profundidad (parallax)
      objeto.position.y = d.base.y + Math.sin(t * d.velocidad + d.fase) * 0.08;
      objeto.position.x = d.base.x + suave.x * 0.18 * d.profundidad;
      objeto.position.z = d.base.z - suave.y * 0.12 * d.profundidad;
      objeto.rotation.x = d.giro.x + Math.sin(t * 0.3 + d.fase) * 0.08;
      objeto.rotation.y = d.giro.y + t * 0.12 * (d.profundidad > 1 ? 1 : 0.4);
    });

    renderizador.render(escena, camara);
  }

  // Pausar cuando no se ve
  document.addEventListener("visibilitychange", () => (visible = !document.hidden));
  new IntersectionObserver(([entrada]) => (visible = entrada.isIntersecting && !document.hidden)).observe(contenedor);

  // Entrada suave con GSAP (si está disponible)
  if (window.gsap && !estatico) {
    objetos.forEach((objeto, i) => window.gsap.from(objeto.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.9, delay: 0.1 + i * 0.07, ease: "back.out(1.6)" }));
  }

  if (estatico) {
    renderizador.render(escena, camara); // una sola imagen, sin movimiento
  } else {
    animar();
  }

  contenedor.classList.add("lista"); // oculta el SVG de respaldo
}
