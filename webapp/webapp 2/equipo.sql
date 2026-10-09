-- CientiFitness · Equipo de entrenadores + citas en la app del asesorado
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
-- Sustituye a entrenador.sql y arreglo-entrenador.sql: no vuelvas a ejecutar esos dos.

-- 1) Lista de entrenadores (tú eres el CEO)
create table if not exists public.cf_coaches (
  email text primary key,
  name text,
  phone text,
  role text not null default 'coach' check (role in ('owner','coach')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.cf_coaches (email, name, role, active)
values ('elcientifitness@gmail.com', 'CientiFitness', 'owner', true)
on conflict (email) do update set role = 'owner', active = true;

alter table public.cf_coaches enable row level security;

create or replace function public.cf_is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.cf_coaches c
    where lower(c.email) = lower(coalesce(auth.jwt()->>'email','')) and c.role = 'owner' and c.active);
$$;

-- Cualquier entrenador activo puede usar el panel (cada uno solo ve sus datos)
create or replace function public.cf_is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.cf_coaches c
    where lower(c.email) = lower(coalesce(auth.jwt()->>'email','')) and c.active);
$$;
grant execute on function public.cf_is_owner() to authenticated, anon;
grant execute on function public.cf_is_coach() to authenticated, anon;

drop policy if exists "yo" on public.cf_coaches;
drop policy if exists "ceo" on public.cf_coaches;
create policy "yo" on public.cf_coaches for select using (lower(email) = lower(coalesce(auth.jwt()->>'email','')));
create policy "ceo" on public.cf_coaches for all using (public.cf_is_owner()) with check (public.cf_is_owner());

-- 2) Permisos del panel para todos los entrenadores activos
drop policy if exists "leer lo propio" on public.cf_state;
drop policy if exists "crear lo propio" on public.cf_state;
drop policy if exists "editar lo propio" on public.cf_state;
create policy "leer lo propio"   on public.cf_state for select using (auth.uid() = user_id and public.cf_is_coach());
create policy "crear lo propio"  on public.cf_state for insert with check (auth.uid() = user_id and public.cf_is_coach());
create policy "editar lo propio" on public.cf_state for update using (auth.uid() = user_id and public.cf_is_coach());

do $$ declare t text; begin
  foreach t in array array['cf_links','cf_messages','cf_daylogs','cf_photos'] loop
    execute format('drop policy if exists "coach" on public.%I', t);
    execute format('create policy "coach" on public.%I for all using (coach_id = auth.uid() and public.cf_is_coach()) with check (coach_id = auth.uid() and public.cf_is_coach())', t);
  end loop;
end $$;

drop policy if exists "cf fotos coach" on storage.objects;
create policy "cf fotos coach" on storage.objects for all
  using (bucket_id = 'cf-fotos' and (storage.foldername(name))[1] = auth.uid()::text and public.cf_is_coach())
  with check (bucket_id = 'cf-fotos' and (storage.foldername(name))[1] = auth.uid()::text and public.cf_is_coach());

-- 3) Biblioteca del CEO (alimentos, recetas, presets, equivalencias) para los entrenadores
create or replace function public.cf_library() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when public.cf_is_coach() then (
    select jsonb_build_object('foods', s.data->'foods', 'tpls', s.data->'tpls', 'eqGroups', s.data->'eqGroups', 'presets', s.data->'presets')
    from public.cf_state s
    join auth.users u on u.id = s.user_id
    join public.cf_coaches c on lower(c.email) = lower(u.email) and c.role = 'owner'
    limit 1) end;
$$;
grant execute on function public.cf_library() to authenticated;

-- 4) Próximas citas y contacto del entrenador, visibles en la app del asesorado
alter table public.cf_links add column if not exists agenda jsonb;

notify pgrst, 'reload schema';

-- Comprobación: debe aparecer tu email como owner
select email, role, active from public.cf_coaches order by created_at;
