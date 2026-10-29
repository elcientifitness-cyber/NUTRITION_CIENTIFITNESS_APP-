-- Cientia · Seguridad (oct-2026)
-- Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run. Se puede ejecutar más de una vez.
-- Requiere haber ejecutado antes portal.sql, cuestionarios.sql y equipo.sql.

-- 1) Fotos: el bucket es SIEMPRE privado (sin enlace firmado no se ve nada) y máximo 50 MB por archivo
update storage.buckets set public = false, file_size_limit = 52428800 where id = 'cf-fotos';

-- Comprueba de forma segura que una ruta «coach/cliente/...» es del asesorado que ha entrado
create or replace function public.cf_path_client(p text) returns boolean
language plpgsql security definer stable set search_path = public as $$
declare a text[] := storage.foldername(p);
begin
  if a is null or array_length(a, 1) < 2 or a[1] !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  return public.cf_is_client(a[1]::uuid, a[2]);
end $$;
grant execute on function public.cf_path_client(text) to authenticated;

-- El asesorado ve y sube fotos solo en su carpeta; solo puede borrar o cambiar las que ha subido él
drop policy if exists "cf fotos asesorado" on storage.objects;
drop policy if exists "cf fotos asesorado ver" on storage.objects;
drop policy if exists "cf fotos asesorado sube" on storage.objects;
drop policy if exists "cf fotos asesorado cambia" on storage.objects;
drop policy if exists "cf fotos asesorado borra" on storage.objects;
create policy "cf fotos asesorado ver" on storage.objects for select
  using (bucket_id = 'cf-fotos' and public.cf_path_client(name));
create policy "cf fotos asesorado sube" on storage.objects for insert
  with check (bucket_id = 'cf-fotos' and public.cf_path_client(name));
create policy "cf fotos asesorado cambia" on storage.objects for update
  using (bucket_id = 'cf-fotos' and public.cf_path_client(name) and owner_id = auth.uid()::text)
  with check (bucket_id = 'cf-fotos' and public.cf_path_client(name));
create policy "cf fotos asesorado borra" on storage.objects for delete
  using (bucket_id = 'cf-fotos' and public.cf_path_client(name) and owner_id = auth.uid()::text);

-- 2) Fichas de fotos: el asesorado no puede borrar las que subió su nutricionista
drop policy if exists "asesorado" on public.cf_photos;
drop policy if exists "asesorado ver" on public.cf_photos;
drop policy if exists "asesorado sube" on public.cf_photos;
drop policy if exists "asesorado borra" on public.cf_photos;
create policy "asesorado ver" on public.cf_photos for select using (public.cf_is_client(coach_id, client_key));
create policy "asesorado sube" on public.cf_photos for insert with check (public.cf_is_client(coach_id, client_key) and uploaded_by = 'client');
create policy "asesorado borra" on public.cf_photos for delete using (public.cf_is_client(coach_id, client_key) and uploaded_by = 'client');

-- 3) Chat: el asesorado lee, escribe los suyos y marca como leídos los del nutricionista. No puede borrar ni cambiar textos.
drop policy if exists "asesorado" on public.cf_messages;
drop policy if exists "asesorado marca leido" on public.cf_messages;
drop policy if exists "asesorado ver" on public.cf_messages;
drop policy if exists "asesorado escribe" on public.cf_messages;
create policy "asesorado ver" on public.cf_messages for select using (public.cf_is_client(coach_id, client_key));
create policy "asesorado escribe" on public.cf_messages for insert
  with check (public.cf_is_client(coach_id, client_key) and sender = 'client' and length(body) <= 5000);
create policy "asesorado marca leido" on public.cf_messages for update
  using (public.cf_is_client(coach_id, client_key) and sender = 'coach')
  with check (public.cf_is_client(coach_id, client_key) and sender = 'coach');

create or replace function public.cf_msg_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is distinct from old.coach_id and coalesce(auth.jwt()->>'role', '') <> 'service_role' then
    if new.body is distinct from old.body or new.sender is distinct from old.sender
       or new.coach_id is distinct from old.coach_id or new.client_key is distinct from old.client_key
       or new.created_at is distinct from old.created_at then
      raise exception 'Solo se puede marcar el mensaje como leído';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists cf_msg_guard on public.cf_messages;
create trigger cf_msg_guard before update on public.cf_messages for each row execute function public.cf_msg_guard();

-- 4) Cuestionarios por enlace: código obligatorio y respuestas de tamaño razonable
create or replace function public.cf_form_get(t text) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object('title', f.title, 'form', f.form, 'status', f.status, 'answered_at', f.answered_at)
  from public.cf_forms f where length(coalesce(t, '')) >= 20 and f.token = t;
$$;
create or replace function public.cf_form_submit(t text, a jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(t, '')) < 20 or a is null or jsonb_typeof(a) <> 'object' or length(a::text) > 200000 then return false; end if;
  update public.cf_forms set answers = a, status = 'done', answered_at = now()
  where token = t and status = 'sent';
  return found;
end $$;
grant execute on function public.cf_form_get(text) to anon, authenticated;
grant execute on function public.cf_form_submit(text, jsonb) to anon, authenticated;

-- 5) Sin sesión no se puede tocar ninguna tabla (solo las dos funciones del cuestionario)
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- 6) Seguridad por filas activada en todas las tablas de la app
do $$ declare r record; begin
  for r in select tablename from pg_tables where schemaname = 'public' and tablename like 'cf\_%' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

notify pgrst, 'reload schema';

-- Comprobación: debe salir «false» en la columna public
select id, public, file_size_limit from storage.buckets where id = 'cf-fotos';
