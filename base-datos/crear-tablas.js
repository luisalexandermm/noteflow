// ═══════════════════════════════════════════════════════════
// NoteFlow · base-datos/crear-tablas.js
// Ejecuta tablas.sql en la base de datos de tu .env (DATABASE_URL).
//
// Uso:   npm run crear-tablas
// Se puede ejecutar varias veces: no borra nada que ya exista.
// ═══════════════════════════════════════════════════════════

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { pool, baseDeDatosConfigurada } = require("../backend/db");

async function crearTablas() {
  if (!baseDeDatosConfigurada()) {
    console.error("\n  Falta DATABASE_URL en el archivo .env (cópiala desde Neon > Connect).\n");
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, "tablas.sql"), "utf8");
  console.log("\n  Conectando a la base de datos…");

  try {
    await pool.query(sql);
    const tablas = await pool.query(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
    );
    console.log(`  ✔ Listo. Tablas en la base de datos (${tablas.rowCount}):`);
    console.log("    " + tablas.rows.map((t) => t.table_name).join(", ") + "\n");
  } catch (error) {
    console.error("\n  ✘ No se pudieron crear las tablas:", error.message, "\n");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

crearTablas();
