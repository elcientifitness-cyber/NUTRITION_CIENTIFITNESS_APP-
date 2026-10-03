-- CientiFitness · Biblioteca común + personal y planes Estándar / Premium
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
-- Necesita haber ejecutado antes equipo.sql.

-- 1) Plan de cada entrenador. Los que ya existen quedan en Premium; los nuevos empiezan en Estándar.
alter table public.cf_coaches add column if not exists plan text not null default 'premium';
alter table public.cf_coaches alter column plan set default 'standard';
do $$ begin
  alter table public.cf_coaches add constraint cf_coaches_plan_check check (plan in ('standard','premium'));
exception when duplicate_object then null; end $$;

create or replace function public.cf_my_plan() returns text
language sql stable security definer set search_path = public as $$
  select case when c.role = 'owner' then 'premium' else coalesce(c.plan, 'standard') end
  from public.cf_coaches c
  where lower(c.email) = lower(coalesce(auth.jwt()->>'email','')) and c.active
  limit 1;
$$;
grant execute on function public.cf_my_plan() to authenticated;

-- 2) Biblioteca común (la del CEO) según el plan: Estándar = solo alimentos · Premium = todo
create or replace function public.cf_library() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when public.cf_is_coach() then (
    select case when public.cf_my_plan() = 'premium'
      then jsonb_build_object('plan','premium','foods', s.data->'foods', 'tpls', s.data->'tpls', 'eqGroups', s.data->'eqGroups', 'presets', s.data->'presets')
      else jsonb_build_object('plan','standard','foods', s.data->'foods') end
    from public.cf_state s
    join auth.users u on u.id = s.user_id
    join public.cf_coaches c on lower(c.email) = lower(u.email) and c.role = 'owner'
    limit 1) end;
$$;
grant execute on function public.cf_library() to authenticated;

-- 3) El CEO ve la biblioteca personal de cada entrenador
create or replace function public.cf_all_libraries() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when public.cf_is_owner() then coalesce((
    select jsonb_agg(jsonb_build_object('uid', s.user_id, 'email', c.email, 'name', c.name, 'plan', c.plan,
      'foods', s.data->'foods', 'tpls', s.data->'tpls', 'eqGroups', s.data->'eqGroups', 'presets', s.data->'presets') order by c.created_at)
    from public.cf_state s
    join auth.users u on u.id = s.user_id
    join public.cf_coaches c on lower(c.email) = lower(u.email) and c.role <> 'owner'
  ), '[]'::jsonb) end;
$$;
grant execute on function public.cf_all_libraries() to authenticated;

-- 4) Propuestas de los entrenadores para la biblioteca común (las aprueba el CEO)
create table if not exists public.cf_proposals (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  coach_name text,
  kind text not null check (kind in ('foods','tpls','presets','eqGroups')),
  item_id text not null,
  item jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (coach_id, kind, item_id)
);
alter table public.cf_proposals enable row level security;
grant select, insert, update, delete on public.cf_proposals to authenticated;

drop policy if exists "coach lee" on public.cf_proposals;
drop policy if exists "coach propone" on public.cf_proposals;
drop policy if exists "coach cambia" on public.cf_proposals;
drop policy if exists "coach retira" on public.cf_proposals;
drop policy if exists "ceo" on public.cf_proposals;
create policy "coach lee" on public.cf_proposals for select using (coach_id = auth.uid() and public.cf_is_coach());
create policy "coach propone" on public.cf_proposals for insert with check (coach_id = auth.uid() and public.cf_is_coach() and status = 'pending');
create policy "coach cambia" on public.cf_proposals for update using (coach_id = auth.uid() and public.cf_is_coach()) with check (coach_id = auth.uid() and status = 'pending');
create policy "coach retira" on public.cf_proposals for delete using (coach_id = auth.uid() and public.cf_is_coach());
create policy "ceo" on public.cf_proposals for all using (public.cf_is_owner()) with check (public.cf_is_owner());

notify pgrst, 'reload schema';

-- Comprobación: debe aparecer cada entrenador con su plan
select email, role, plan, active from public.cf_coaches order by created_at;
