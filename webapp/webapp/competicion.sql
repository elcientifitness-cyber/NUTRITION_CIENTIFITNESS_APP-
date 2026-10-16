-- CientiFitness · Competición: protocolo en la app del asesorado + pesajes y síntomas
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
-- Requiere haber ejecutado antes portal.sql.

alter table public.cf_links add column if not exists comp jsonb;

create table if not exists public.cf_cutlogs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  client_key text not null,
  t timestamptz not null default now(),
  kind text not null,
  kg numeric,
  sym jsonb,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists cf_cutlogs_k on public.cf_cutlogs (coach_id, client_key, t);

alter table public.cf_cutlogs enable row level security;
drop policy if exists "coach" on public.cf_cutlogs;
drop policy if exists "asesorado" on public.cf_cutlogs;
create policy "coach" on public.cf_cutlogs for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy "asesorado" on public.cf_cutlogs for all using (public.cf_is_client(coach_id, client_key)) with check (public.cf_is_client(coach_id, client_key));

notify pgrst, 'reload schema';
