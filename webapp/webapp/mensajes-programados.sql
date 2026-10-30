-- Cientia · mensajes programados (los envía el aviso automático cada 5 min, api/push.js).
-- Ejecutar una vez en Supabase → SQL Editor → New query → Run. Se puede repetir.
create table if not exists public.cf_sched (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  keys text[] not null,
  names jsonb,
  body text not null check (char_length(body) <= 4000),
  at timestamptz not null,
  repeat text check (repeat is null or repeat in ('week')),
  term text,
  status text not null default 'pending' check (status in ('pending','sending','sent','cancel')),
  sent int not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cf_sched_due on public.cf_sched (status, at);
alter table public.cf_sched enable row level security;
revoke all on public.cf_sched from anon;
drop policy if exists "propios" on public.cf_sched;
create policy "propios" on public.cf_sched for all
  using (coach_id = auth.uid() and public.cf_is_coach())
  with check (coach_id = auth.uid() and public.cf_is_coach() and cardinality(keys) between 1 and 500);
