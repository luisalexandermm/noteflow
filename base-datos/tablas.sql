-- ═══════════════════════════════════════════════════════════
-- NoteFlow · base-datos/tablas.sql
-- Estructura de la base de datos (PostgreSQL en Neon).
--
-- Dos formas de crearla (elige UNA):
--   A) En tu terminal:   npm run crear-tablas
--   B) En Neon:          SQL Editor > pegar este archivo > Run
-- Se puede ejecutar varias veces sin problema.
--
-- Relaciones:
--   usuarios
--      ├── sesiones            (inicios de sesión activos)
--      ├── materias
--      │      ├── notas ── notas_etiquetas ── etiquetas
--      │      └── tareas
--      ├── eventos             (las sesiones de estudio suman horas)
--      ├── imagenes            (fotos de las notas)
--      └── conversaciones
--             └── mensajes
--   codigos_acceso             (códigos de 6 números enviados al correo)
--
-- Para entender el archivo:
--   · uuid = identificador único largo
--   · on delete cascade  = si se borra el padre, se borran sus hijos
--   · on delete set null = si se borra la materia, la nota queda "sin materia"
--   · check (...) = regla que la base de datos obliga a cumplir
--   · Cada usuario empieza VACÍO: no hay datos de ejemplo.
-- ═══════════════════════════════════════════════════════════


-- ── 1. USUARIOS ─────────────────────────────────────────────
create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  correo        text not null unique check (correo = lower(correo) and char_length(correo) between 5 and 254),
  nombre        text not null default '' check (char_length(nombre) <= 80),
  carrera       text not null default '' check (char_length(carrera) <= 80),
  preferencias  jsonb not null default '{"animaciones": true, "escena3d": true}',
  creado_en     timestamptz not null default now()
);


-- ── 2. SESIONES (quién tiene la sesión abierta) ─────────────
-- Se guarda la HUELLA (hash) del token, nunca el token real.
create table if not exists sesiones (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  token_hash  text not null unique,
  expira_en   timestamptz not null,
  creado_en   timestamptz not null default now()
);


-- ── 3. CÓDIGOS DE ACCESO (el código que llega al correo) ────
create table if not exists codigos_acceso (
  correo       text primary key,
  codigo_hash  text not null,
  expira_en    timestamptz not null,
  intentos     integer not null default 0,
  enviado_en   timestamptz not null default now()
);


-- ── 4. MATERIAS ─────────────────────────────────────────────
create table if not exists materias (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  nombre      text not null check (char_length(nombre) between 1 and 80),
  color       text not null default 'azul'
              check (color in ('verde', 'violeta', 'azul', 'ambar', 'turquesa', 'rosa')),
  icono       text not null default 'libro' check (char_length(icono) <= 30),
  creado_en   timestamptz not null default now()
);


-- ── 5. NOTAS ────────────────────────────────────────────────
create table if not exists notas (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references usuarios (id) on delete cascade,
  materia_id      uuid references materias (id) on delete set null,
  titulo          text not null default '' check (char_length(titulo) <= 150),
  contenido       text not null default '' check (char_length(contenido) <= 200000),
  favorita        boolean not null default false,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);


-- ── 6. TAREAS ───────────────────────────────────────────────
create table if not exists tareas (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references usuarios (id) on delete cascade,
  materia_id     uuid references materias (id) on delete set null,
  titulo         text not null check (char_length(titulo) between 1 and 120),
  descripcion    text not null default '' check (char_length(descripcion) <= 1000),
  fecha_entrega  date,
  prioridad      text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  estado         text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'completada')),
  creado_en      timestamptz not null default now()
);


-- ── 7. EVENTOS (calendario) ─────────────────────────────────
create table if not exists eventos (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references usuarios (id) on delete cascade,
  materia_id    uuid references materias (id) on delete set null,
  titulo        text not null check (char_length(titulo) between 1 and 120),
  tipo          text not null default 'evento' check (tipo in ('evento', 'sesion_estudio', 'examen')),
  fecha         date not null,
  hora          time not null default '08:00',
  duracion_min  integer not null default 60 check (duracion_min between 5 and 720),
  creado_en     timestamptz not null default now()
);


-- ── 8. ETIQUETAS y su tabla intermedia ──────────────────────
create table if not exists etiquetas (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  nombre      text not null check (nombre ~ '^[a-z0-9áéíóúñü_-]{1,30}$'),
  unique (usuario_id, nombre)
);

create table if not exists notas_etiquetas (
  nota_id      uuid not null references notas (id) on delete cascade,
  etiqueta_id  uuid not null references etiquetas (id) on delete cascade,
  primary key (nota_id, etiqueta_id)
);


-- ── 9. IMÁGENES de las notas ────────────────────────────────
-- bytea = el archivo guardado como bytes. Máximo 1 MB cada una.
create table if not exists imagenes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  tipo        text not null check (tipo in ('image/png', 'image/jpeg', 'image/webp', 'image/gif')),
  datos       bytea not null,
  tamano      integer not null check (tamano between 1 and 1048576),
  creado_en   timestamptz not null default now()
);


-- ── 10. CONVERSACIONES y MENSAJES (asistente IA) ────────────
create table if not exists conversaciones (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  titulo      text not null default 'Nueva conversación' check (char_length(titulo) <= 120),
  creado_en   timestamptz not null default now()
);

-- rol "demo" = respuesta del modo demostración (antes de la Fase 7)
create table if not exists mensajes (
  id               uuid primary key default gen_random_uuid(),
  conversacion_id  uuid not null references conversaciones (id) on delete cascade,
  rol              text not null check (rol in ('usuario', 'asistente', 'demo')),
  contenido        text not null check (char_length(contenido) between 1 and 20000),
  creado_en        timestamptz not null default now()
);


-- ── ÍNDICES: búsquedas más rápidas ──────────────────────────
create index if not exists idx_sesiones_usuario        on sesiones (usuario_id);
create index if not exists idx_materias_usuario        on materias (usuario_id);
create index if not exists idx_notas_usuario           on notas (usuario_id);
create index if not exists idx_notas_materia           on notas (materia_id);
create index if not exists idx_tareas_usuario_fecha    on tareas (usuario_id, fecha_entrega);
create index if not exists idx_tareas_materia          on tareas (materia_id);
create index if not exists idx_eventos_usuario_fecha   on eventos (usuario_id, fecha);
create index if not exists idx_eventos_materia         on eventos (materia_id);
create index if not exists idx_etiquetas_usuario       on etiquetas (usuario_id);
create index if not exists idx_notas_etiquetas_etq     on notas_etiquetas (etiqueta_id);
create index if not exists idx_imagenes_usuario        on imagenes (usuario_id);
create index if not exists idx_conversaciones_usuario  on conversaciones (usuario_id, creado_en);
create index if not exists idx_mensajes_conversacion   on mensajes (conversacion_id, creado_en);
