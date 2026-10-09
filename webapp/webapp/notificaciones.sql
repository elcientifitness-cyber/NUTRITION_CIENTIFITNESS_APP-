-- CientiFitness · Notificaciones push
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
-- Requiere haber ejecutado antes portal.sql (usa cf_links y cf_is_client).

create table if not exists public.cf_push_subs (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  coach_id uuid not null,
  client_key text not null,
  p256dh text not null,
  auth text not null,
  tz text not null default 'Europe/Madrid',
  prefs jsonb not null default '{}'::jsonb,
  sent jsonb not null default '{}'::jsonb,
  ua text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cf_push_subs_client on public.cf_push_subs (coach_id, client_key);

alter table public.cf_push_subs enable row level security;
drop policy if exists "propio" on public.cf_push_subs;
drop policy if exists "coach" on public.cf_push_subs;
create policy "propio" on public.cf_push_subs for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.cf_is_client(coach_id, client_key));
create policy "coach" on public.cf_push_subs for select using (coach_id = auth.uid());

-- Configuración de avisos de un entrenador (plantilla, ajustes por cliente y revisiones próximas).
-- Solo la usa el servidor (api/push.js).
create or replace function public.cf_push_cfg(c uuid) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'tpl', s.data->'notif',
    'ovr', coalesce((select jsonb_object_agg(x->>'id', x->'notif') from jsonb_array_elements(coalesce(s.data->'clients', '[]'::jsonb)) x where x ? 'notif' and jsonb_typeof(x->'notif') = 'object'), '{}'::jsonb),
    'ev', coalesce((select jsonb_agg(jsonb_build_object('c', e->>'clientId', 'd', e->>'date', 't', e->>'start', 'all', coalesce((e->>'allDay')::boolean, false), 'ty', e->>'type'))
      from jsonb_array_elements(coalesce(s.data->'events', '[]'::jsonb)) e
      where e->>'type' in ('revision', 'medicion') and coalesce(e->>'clientId', '') <> ''
        and coalesce(e->>'status', '') not ilike 'cancel%'
        and (e->>'date') between to_char(now() - interval '1 day', 'YYYY-MM-DD') and to_char(now() + interval '2 day', 'YYYY-MM-DD')), '[]'::jsonb))
  from public.cf_state s where s.user_id = c;
$$;
revoke all on function public.cf_push_cfg(uuid) from public, anon, authenticated;
grant execute on function public.cf_push_cfg(uuid) to service_role;

notify pgrst, 'reload schema';
