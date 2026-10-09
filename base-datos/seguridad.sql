-- ═══════════════════════════════════════════════════════════
-- NoteFlow · base-datos/seguridad.sql         (PASO 2 de 2)
-- Row Level Security (RLS): cada usuario SOLO puede ver y cambiar
-- lo suyo, aunque alguien intente pedir datos ajenos desde el navegador.
--
-- Ejecutar DESPUÉS de tablas.sql:
--   Supabase > SQL Editor > New query > pegar > Run
-- Se puede ejecutar varias veces sin problema.
--
-- auth.uid() = el id del usuario que hace la petición (lo pone Supabase
-- a partir de su sesión). Si no hay sesión, es null y no ve nada.
-- ═══════════════════════════════════════════════════════════


-- ── 1. Activar RLS en todas las tablas ──────────────────────
-- Con RLS activo y sin políticas, NADIE ve nada. Las políticas
-- de abajo abren solo lo que le pertenece a cada usuario.
alter table usuarios         enable row level security;
alter table materias         enable row level security;
alter table notas            enable row level security;
alter table tareas           enable row level security;
alter table eventos          enable row level security;
alter table etiquetas        enable row level security;
alter table notas_etiquetas  enable row level security;
alter table conversaciones   enable row level security;
alter table mensajes         enable row level security;


-- ── 2. Función de ayuda ─────────────────────────────────────
-- ¿La materia es mía? (o no hay materia). Evita que alguien enlace
-- su nota o tarea a una materia de otra persona.
create or replace function es_mi_materia(materia uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select materia is null
      or exists (select 1 from materias m where m.id = materia and m.usuario_id = (select auth.uid()));
$$;


-- ── 3. USUARIOS: solo mi propio perfil ──────────────────────
drop policy if exists "usuarios_ver_propio" on usuarios;
create policy "usuarios_ver_propio" on usuarios
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "usuarios_crear_propio" on usuarios;
create policy "usuarios_crear_propio" on usuarios
  for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists "usuarios_editar_propio" on usuarios;
create policy "usuarios_editar_propio" on usuarios
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));


-- ── 4. Tablas con usuario_id: todo lo mío, nada ajeno ───────
-- "for all" = ver, crear, editar y borrar.
-- using      → qué filas puedo ver/editar/borrar
-- with check → qué filas puedo crear o dejar después de editar

drop policy if exists "materias_propias" on materias;
create policy "materias_propias" on materias for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

drop policy if exists "notas_propias" on notas;
create policy "notas_propias" on notas for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and es_mi_materia(materia_id));

drop policy if exists "tareas_propias" on tareas;
create policy "tareas_propias" on tareas for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and es_mi_materia(materia_id));

drop policy if exists "eventos_propios" on eventos;
create policy "eventos_propios" on eventos for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and es_mi_materia(materia_id));

drop policy if exists "etiquetas_propias" on etiquetas;
create policy "etiquetas_propias" on etiquetas for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

drop policy if exists "conversaciones_propias" on conversaciones;
create policy "conversaciones_propias" on conversaciones for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));


-- ── 5. Tablas sin usuario_id: se revisa a través del "padre" ─

-- notas_etiquetas: la nota Y la etiqueta deben ser mías
drop policy if exists "notas_etiquetas_propias" on notas_etiquetas;
create policy "notas_etiquetas_propias" on notas_etiquetas for all to authenticated
  using (exists (select 1 from notas n where n.id = nota_id and n.usuario_id = (select auth.uid())))
  with check (
    exists (select 1 from notas n where n.id = nota_id and n.usuario_id = (select auth.uid()))
    and exists (select 1 from etiquetas e where e.id = etiqueta_id and e.usuario_id = (select auth.uid()))
  );

-- mensajes: la conversación debe ser mía
drop policy if exists "mensajes_propios" on mensajes;
create policy "mensajes_propios" on mensajes for all to authenticated
  using (exists (select 1 from conversaciones c where c.id = conversacion_id and c.usuario_id = (select auth.uid())))
  with check (exists (select 1 from conversaciones c where c.id = conversacion_id and c.usuario_id = (select auth.uid())));


-- ── 6. STORAGE: imágenes de las notas ───────────────────────
-- Bucket "notas": máximo 1 MB y solo imágenes.
-- Cada usuario sube a su carpeta:  notas/<id-del-usuario>/<archivo>
-- Es público para LEER (la imagen se ve con su enlace, que es un código
-- imposible de adivinar), pero solo el dueño puede SUBIR o BORRAR.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notas', 'notas', true, 1048576, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "notas_subir_en_mi_carpeta" on storage.objects;
create policy "notas_subir_en_mi_carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'notas' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "notas_borrar_de_mi_carpeta" on storage.objects;
create policy "notas_borrar_de_mi_carpeta" on storage.objects for delete to authenticated
  using (bucket_id = 'notas' and (storage.foldername(name))[1] = (select auth.uid())::text);
