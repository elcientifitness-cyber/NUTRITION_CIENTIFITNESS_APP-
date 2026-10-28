-- Cientia · Suplementos: la biblioteca común (la del CEO) incluye también los suplementos.
-- Ejecutar en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.

create or replace function public.cf_library() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when public.cf_is_coach() then (
    select case when public.cf_my_plan() = 'premium'
      then jsonb_build_object('plan','premium','foods', s.data->'foods', 'tpls', s.data->'tpls', 'eqGroups', s.data->'eqGroups', 'presets', s.data->'presets', 'forms', s.data->'forms', 'nlist', s.data->'nlist', 'supps', s.data->'supps')
      else jsonb_build_object('plan','standard','foods', s.data->'foods', 'forms', s.data->'forms', 'nlist', s.data->'nlist', 'supps', s.data->'supps') end
    from public.cf_state s
    join auth.users u on u.id = s.user_id
    join public.cf_coaches c on lower(c.email) = lower(u.email) and c.role = 'owner'
    limit 1) end;
$$;
grant execute on function public.cf_library() to authenticated;

notify pgrst, 'reload schema';
