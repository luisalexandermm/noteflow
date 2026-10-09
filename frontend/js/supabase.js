// ═══════════════════════════════════════════════════════════
// NoteFlow · supabase.js
// Crea el cliente de Supabase SOLO si el backend tiene las claves.
//
// 1. Pide al backend GET /api/config → { supabaseUrl, supabaseAnonKey }
//    (son datos públicos: la "anon key" está hecha para el navegador;
//     lo que protege los datos es Row Level Security en la base de datos)
// 2. Si están, carga vendor/supabase/supabase.js y crea el cliente.
// 3. Si no están (o no hay backend), devuelve null → MODO LOCAL.
//
// Aquí NUNCA va la clave de la IA ni la "service_role key".
// ═══════════════════════════════════════════════════════════

import { permitirImagenesDe } from "./utilidades.js";

let promesaCliente = null;

function rutaBase() {
  return window.location.pathname.includes("/paginas/") ? "../" : "";
}

// Carga un script normal y espera a que termine
function cargarScript(ruta) {
  return new Promise(function (listo, fallo) {
    const script = document.createElement("script");
    script.src = ruta;
    script.onload = listo;
    script.onerror = () => fallo(new Error(`No se pudo cargar ${ruta}`));
    document.head.appendChild(script);
  });
}

async function crearCliente() {
  const respuesta = await fetch("/api/config");
  if (!respuesta.ok) return null;

  const config = await respuesta.json();
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;

  await cargarScript(`${rutaBase()}vendor/supabase/supabase.js`);

  // Las imágenes de las notas vienen del bucket público "notas"
  permitirImagenesDe(`${config.supabaseUrl}/storage/v1/object/public/notas/`);

  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}

// Siempre devuelve el mismo cliente (o null en modo local)
export function obtenerClienteSupabase() {
  if (!promesaCliente) {
    promesaCliente = crearCliente().catch(function (error) {
      console.warn("NoteFlow: sin Supabase, se usa el modo local.", error.message);
      return null;
    });
  }
  return promesaCliente;
}
