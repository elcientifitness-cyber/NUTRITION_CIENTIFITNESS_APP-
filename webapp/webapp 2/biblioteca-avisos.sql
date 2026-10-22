-- CientiFitness · Biblioteca común de cuestionarios y avisos personalizados
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
-- Requiere haber ejecutado antes biblioteca.sql y notificaciones.sql.

-- 1) La biblioteca común (la del CEO) incluye ahora cuestionarios y avisos personalizados, para todos los planes.
create or replace function public.cf_library() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when public.cf_is_coach() then (
    select case when public.cf_my_plan() = 'premium'
      then jsonb_build_object('plan','premium','foods', s.data->'foods', 'tpls', s.data->'tpls', 'eqGroups', s.data->'eqGroups', 'presets', s.data->'presets', 'forms', s.data->'forms', 'nlist', s.data->'nlist')
      else jsonb_build_object('plan','standard','foods', s.data->'foods', 'forms', s.data->'forms', 'nlist', s.data->'nlist') end
    from public.cf_state s
    join auth.users u on u.id = s.user_id
    join public.cf_coaches c on lower(c.email) = lower(u.email) and c.role = 'owner'
    limit 1) end;
$$;
grant execute on function public.cf_library() to authenticated;

-- 2) Los entrenadores Premium pueden proponer cuestionarios y avisos
alter table public.cf_proposals drop constraint if exists cf_proposals_kind_check;
alter table public.cf_proposals add constraint cf_proposals_kind_check check (kind in ('foods','tpls','presets','eqGroups','forms','nlist'));

-- 3) Configuración de avisos para el servidor: plantilla, ajustes por cliente, citas próximas,
--    avisos personalizados propios y comunes, y si el entrenador es CEO o Premium.
create or replace function public.cf_push_cfg(c uuid) returns jsonb
language sql security definer stable set search_path = public, auth as $$
  select jsonb_build_object(
    'tpl', s.data->'notif',
    'ovr', coalesce((select jsonb_object_agg(x->>'id', x->'notif') from jsonb_array_elements(coalesce(s.data->'clients', '[]'::jsonb)) x where x ? 'notif' and jsonb_typeof(x->'notif') = 'object'), '{}'::jsonb),
    'ev', coalesce((select jsonb_agg(jsonb_build_object('c', e->>'clientId', 'd', e->>'date', 't', e->>'start', 'all', coalesce((e->>'allDay')::boolean, false), 'ty', e->>'type'))
      from jsonb_array_elements(coalesce(s.data->'events', '[]'::jsonb)) e
      where e->>'type' in ('revision', 'medicion') and coalesce(e->>'clientId', '') <> ''
        and coalesce(e->>'status', '') not ilike 'cancel%'
        and (e->>'date') between to_char(now() - interval '1 day', 'YYYY-MM-DD') and to_char(now() + interval '9 day', 'YYYY-MM-DD')), '[]'::jsonb),
    'own', s.data->'nlist',
    'fauto', s.data->'fauto',
    'fa', coalesce((select jsonb_object_agg(x->>'id', x->'fa') from jsonb_array_elements(coalesce(s.data->'clients', '[]'::jsonb)) x where x ? 'fa' and jsonb_typeof(x->'fa') = 'array'), '{}'::jsonb),
    'forms', s.data->'forms',
    'cforms', (select s3.data->'forms' from public.cf_state s3 join auth.users u3 on u3.id = s3.user_id join public.cf_coaches k3 on lower(k3.email) = lower(u3.email) and k3.role = 'owner' limit 1),
    'common', (select s2.data->'nlist' from public.cf_state s2 join auth.users u2 on u2.id = s2.user_id
               join public.cf_coaches k2 on lower(k2.email) = lower(u2.email) and k2.role = 'owner' limit 1),
    'owner', exists(select 1 from auth.users u join public.cf_coaches k on lower(k.email) = lower(u.email) where u.id = c and k.role = 'owner')
             or not exists(select 1 from public.cf_coaches k where k.role = 'owner'),
    'prem', exists(select 1 from auth.users u join public.cf_coaches k on lower(k.email) = lower(u.email) where u.id = c and (k.role = 'owner' or k.plan = 'premium')))
  from public.cf_state s where s.user_id = c;
$$;
revoke all on function public.cf_push_cfg(uuid) from public, anon, authenticated;
grant execute on function public.cf_push_cfg(uuid) to service_role;

notify pgrst, 'reload schema';
