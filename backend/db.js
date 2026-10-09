// ═══════════════════════════════════════════════════════════
// NoteFlow · db.js
// Conexión a la base de datos PostgreSQL (Neon) con "pg".
//
// La dirección viene del .env:
//   DATABASE_URL=postgresql://usuario:clave@ep-xxx.neon.tech/neondb?sslmode=require
//
// Uso en los controladores:
//   const { consulta } = require("../db");
//   const filas = await consulta("select * from notas where usuario_id = $1", [id]);
//
// IMPORTANTE: nunca pegar valores dentro del texto SQL.
// Siempre $1, $2… → así es imposible la "inyección SQL".
// ═══════════════════════════════════════════════════════════

const { Pool, types } = require("pg");

// Las columnas "date" llegan como texto "2026-10-08" (no como Date),
// así no se corren de día por la zona horaria.
types.setTypeParser(1082, (valor) => valor);

function baseDeDatosConfigurada() {
  return /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL || "");
}

// Arma la configuración: Neon exige conexión cifrada (SSL);
// en tu computador (localhost) no hace falta.
function crearConfiguracion() {
  const direccion = new URL(process.env.DATABASE_URL);
  const esLocal = ["localhost", "127.0.0.1", ""].includes(direccion.hostname);
  direccion.searchParams.delete("sslmode");
  direccion.searchParams.delete("channel_binding");

  return {
    connectionString: direccion.toString(),
    ssl: esLocal ? false : { rejectUnauthorized: true },
    max: 5,                        // conexiones al mismo tiempo (suficiente para el plan gratis)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000 // Neon puede tardar ~1 s en "despertar"
  };
}

const pool = baseDeDatosConfigurada() ? new Pool(crearConfiguracion()) : null;

if (pool) {
  pool.on("error", (error) => console.error("Base de datos: conexión perdida", error.message));
}

// Ejecuta una consulta y devuelve las filas
async function consulta(sql, parametros = []) {
  const resultado = await pool.query(sql, parametros);
  return resultado.rows;
}

// Varias consultas que deben salir TODAS bien o NINGUNA (transacción)
async function transaccion(trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query("begin");
    const resultado = await trabajo(cliente);
    await cliente.query("commit");
    return resultado;
  } catch (error) {
    await cliente.query("rollback");
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = { pool, consulta, transaccion, baseDeDatosConfigurada };
