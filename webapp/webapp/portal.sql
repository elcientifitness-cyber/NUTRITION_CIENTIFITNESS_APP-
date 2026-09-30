-- CientiFitness · App de asesorados (chat, plan publicado, registro diario, fotos)
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.

-- 1) Enlace coach ↔ asesorado (por email) + plan publicado
create table if not exists public.cf_links (
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_key text not null,
  email text not null,
  name text,
  plan jsonb,
  plan_at timestamptz,
  primary key (coach_id, client_key)
);
create unique index if not exists cf_links_email on public.cf_links (lower(email));

create or replace function public.cf_is_client(c uuid, k text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.cf_links l where l.coach_id = c and l.client_key = k
    and lower(l.email) = lower(coalesce(auth.jwt()->>'email','')));
$$;

-- 2) Mensajes
create table if not exists public.cf_messages (
  id bigint generated always as identity primary key,
  coach_id uuid not null,
  client_key text not null,
  sender text not null check (sender in ('coach','client')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists cf_messages_thread on public.cf_messages (coach_id, client_key, created_at);

-- 3) Registro diario (comidas + cuestionario)
create table if not exists public.cf_daylogs (
  coach_id uuid not null,
  client_key text not null,
  day date not null,
  foods jsonb not null default '[]',
  survey jsonb,
  updated_at timestamptz not null default now(),
  primary key (coach_id, client_key, day)
);

-- 4) Fotos de progreso
create table if not exists public.cf_photos (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  client_key text not null,
  day date not null,
  path text not null,
  uploaded_by text not null default 'coach',
  created_at timestamptz not null default now()
);

alter table public.cf_links enable row level security;
alter table public.cf_messages enable row level security;
alter table public.cf_daylogs enable row level security;
alter table public.cf_photos enable row level security;

do $$ declare t text; begin
  foreach t in array array['cf_links','cf_messages','cf_daylogs','cf_photos'] loop
    execute format('drop policy if exists "coach" on public.%I', t);
    execute format('drop policy if exists "asesorado" on public.%I', t);
    execute format('create policy "coach" on public.%I for all using (coach_id = auth.uid()) with check (coach_id = auth.uid())', t);
  end loop;
end $$;

create policy "asesorado" on public.cf_links for select using (lower(email) = lower(coalesce(auth.jwt()->>'email','')));
create policy "asesorado" on public.cf_messages for all using (public.cf_is_client(coach_id, client_key)) with check (public.cf_is_client(coach_id, client_key) and sender = 'client');
drop policy if exists "asesorado marca leido" on public.cf_messages;
create policy "asesorado marca leido" on public.cf_messages for update using (public.cf_is_client(coach_id, client_key) and sender = 'coach');
create policy "asesorado" on public.cf_daylogs for all using (public.cf_is_client(coach_id, client_key)) with check (public.cf_is_client(coach_id, client_key));
create policy "asesorado" on public.cf_photos for all using (public.cf_is_client(coach_id, client_key)) with check (public.cf_is_client(coach_id, client_key) and uploaded_by = 'client');

-- Chat en tiempo real
do $$ begin
  alter publication supabase_realtime add table public.cf_messages;
exception when others then null; end $$;

notify pgrst, 'reload schema';

-- 5) Almacén privado de fotos (ruta: coach_id/client_key/archivo.jpg)
insert into storage.buckets (id, name, public) values ('cf-fotos','cf-fotos', false) on conflict (id) do nothing;
drop policy if exists "cf fotos coach" on storage.objects;
drop policy if exists "cf fotos asesorado" on storage.objects;
create policy "cf fotos coach" on storage.objects for all
  using (bucket_id = 'cf-fotos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cf-fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cf fotos asesorado" on storage.objects for all
  using (bucket_id = 'cf-fotos' and public.cf_is_client(((storage.foldername(name))[1])::uuid, (storage.foldername(name))[2]))
  with check (bucket_id = 'cf-fotos' and public.cf_is_client(((storage.foldername(name))[1])::uuid, (storage.foldername(name))[2]));
