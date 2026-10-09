-- ⚠ OBSOLETO: ya no lo ejecutes. Usa equipo.sql (permite invitar entrenadores).
-- CientiFitness · Arreglo del permiso del entrenador
-- Pega todo esto en Supabase → SQL Editor → New query → Run.

create or replace function public.cf_is_coach() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists(
    select 1 from auth.users u
    where u.id = auth.uid()
      and lower(u.email) in ('elcientifitness@gmail.com')
  ) or lower(coalesce(auth.jwt()->>'email','')) in ('elcientifitness@gmail.com');
$$;

grant execute on function public.cf_is_coach() to authenticated, anon;

notify pgrst, 'reload schema';

-- Comprobación: debe aparecer tu email con es_entrenador = true
select email, lower(email) in ('elcientifitness@gmail.com') as es_entrenador from auth.users order by created_at;
