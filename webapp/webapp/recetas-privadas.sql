-- Cientia · Recetas privadas por nutricionista (oct-2026)
-- Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run. Se puede ejecutar más de una vez.
-- Las recetas de la biblioteca con el campo «only» (lista de emails) solo se envían a esos nutricionistas (y nunca si el grupo está en pausa, «off»).

create or replace function public.cf_vis_tpls(t jsonb) returns jsonb
language sql stable security definer set search_path = public, auth as $$
  -- A cada nutricionista le llega la receta marcada como «priv» y sin la lista de emails; los grupos en pausa no se envían
  select coalesce(jsonb_agg(case when x ? 'only' then (x - 'only' - 'off') || '{"priv":true}'::jsonb else x end), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(t) = 'array' then t else '[]'::jsonb end) x
  where not (x ? 'only')
     or (coalesce(x->>'off', '') <> 'true'
         and jsonb_typeof(x->'only') = 'array' and (x->'only') ? lower(coalesce(auth.jwt()->>'email', '')));
$$;
revoke all on function public.cf_vis_tpls(jsonb) from public, anon;
grant execute on function public.cf_vis_tpls(jsonb) to authenticated;

create or replace function public.cf_library() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when public.cf_is_coach() then (
    select case when public.cf_my_plan() = 'premium'
      then jsonb_build_object('plan','premium','foods', s.data->'foods', 'tpls', public.cf_vis_tpls(s.data->'tpls'), 'eqGroups', s.data->'eqGroups', 'presets', s.data->'presets', 'forms', s.data->'forms', 'nlist', s.data->'nlist', 'supps', s.data->'supps')
      else jsonb_build_object('plan','standard','foods', s.data->'foods', 'forms', s.data->'forms', 'nlist', s.data->'nlist', 'supps', s.data->'supps') end
    from public.cf_state s
    join auth.users u on u.id = s.user_id
    join public.cf_coaches c on lower(c.email) = lower(u.email) and c.role = 'owner'
    limit 1) end;
$$;
grant execute on function public.cf_library() to authenticated;

notify pgrst, 'reload schema';
