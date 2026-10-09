-- ⚠ OBSOLETO: ya no lo ejecutes. Usa equipo.sql (permite invitar entrenadores).
-- CientiFitness · Solo el entrenador puede usar el panel de gestión.
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.

create or replace function public.cf_is_coach() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists(select 1 from auth.users u where u.id = auth.uid() and lower(u.email) in ('elcientifitness@gmail.com'))
    or lower(coalesce(auth.jwt()->>'email','')) in ('elcientifitness@gmail.com');
$$;
grant execute on function public.cf_is_coach() to authenticated, anon;

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

notify pgrst, 'reload schema';
