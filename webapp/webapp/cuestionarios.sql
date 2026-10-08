-- CientiFitness · Cuestionarios (inicial, revisión semanal…)
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
-- Requiere haber ejecutado antes portal.sql (usa la función cf_is_client).

create table if not exists public.cf_forms (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_key text not null,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  title text not null,
  form jsonb not null,
  answers jsonb,
  status text not null default 'sent' check (status in ('sent','done')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists cf_forms_coach on public.cf_forms (coach_id, client_key, created_at);

alter table public.cf_forms enable row level security;
drop policy if exists "coach" on public.cf_forms;
drop policy if exists "asesorado" on public.cf_forms;
create policy "coach" on public.cf_forms for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy "asesorado" on public.cf_forms for select using (public.cf_is_client(coach_id, client_key));

-- Lectura y envío por enlace (sin iniciar sesión): solo con el código secreto del enlace
create or replace function public.cf_form_get(t text) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object('title', f.title, 'form', f.form, 'status', f.status, 'answered_at', f.answered_at)
  from public.cf_forms f where f.token = t;
$$;

create or replace function public.cf_form_submit(t text, a jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.cf_forms set answers = a, status = 'done', answered_at = now()
  where token = t and status = 'sent';
  return found;
end $$;

grant execute on function public.cf_form_get(text) to anon, authenticated;
grant execute on function public.cf_form_submit(text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
