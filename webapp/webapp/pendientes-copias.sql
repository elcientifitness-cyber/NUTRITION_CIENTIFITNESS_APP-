-- Cientia Nutrition · Copias automáticas en la nube + bandeja «Pendientes»
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.

-- 1) Copias automáticas del panel (una como máximo cada 3 horas, se guardan las 40 últimas)
create table if not exists public.cf_state_hist (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  saved_at timestamptz not null default now(),
  made_at timestamptz not null default now(),
  n_clients int,
  note text
);
create index if not exists cf_state_hist_u on public.cf_state_hist (user_id, saved_at desc);
alter table public.cf_state_hist enable row level security;

drop policy if exists "ver mis copias" on public.cf_state_hist;
drop policy if exists "crear mis copias" on public.cf_state_hist;
create policy "ver mis copias" on public.cf_state_hist for select using (auth.uid() = user_id);
create policy "crear mis copias" on public.cf_state_hist for insert with check (auth.uid() = user_id and public.cf_is_coach());

create or replace function public.cf_state_snap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.data is distinct from new.data and not exists (
    select 1 from public.cf_state_hist h
    where h.user_id = old.user_id and h.note is null and h.made_at > now() - interval '3 hours'
  ) then
    insert into public.cf_state_hist (user_id, data, saved_at, n_clients)
    values (old.user_id, old.data, coalesce(old.updated_at, now()),
      (select count(*) from jsonb_array_elements(coalesce(old.data->'clients', '[]'::jsonb)) x where coalesce((x->>'self')::boolean, false) = false));
    delete from public.cf_state_hist
    where user_id = old.user_id and id not in (
      select id from public.cf_state_hist where user_id = old.user_id order by saved_at desc limit 40);
  end if;
  return new;
end $$;

drop trigger if exists cf_state_snap on public.cf_state;
create trigger cf_state_snap before update on public.cf_state
  for each row execute function public.cf_state_snap();

-- 2) Último día registrado por cada asesorado (bandeja «Pendientes»)
create or replace function public.cf_last_logs() returns table (client_key text, last_day date)
language sql stable set search_path = public as $$
  select d.client_key, max(d.day) from public.cf_daylogs d where d.coach_id = auth.uid() group by d.client_key;
$$;
grant execute on function public.cf_last_logs() to authenticated;
