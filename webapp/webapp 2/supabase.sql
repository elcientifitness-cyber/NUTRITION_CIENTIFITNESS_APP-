-- CientiFitness Manager · tabla de datos
-- Pega todo esto en Supabase → SQL Editor → New query → Run

create table if not exists public.cf_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cf_state enable row level security;

drop policy if exists "leer lo propio" on public.cf_state;
drop policy if exists "crear lo propio" on public.cf_state;
drop policy if exists "editar lo propio" on public.cf_state;

create policy "leer lo propio"   on public.cf_state for select using (auth.uid() = user_id);
create policy "crear lo propio"  on public.cf_state for insert with check (auth.uid() = user_id);
create policy "editar lo propio" on public.cf_state for update using (auth.uid() = user_id);
