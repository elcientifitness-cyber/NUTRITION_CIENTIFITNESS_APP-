-- Cientia · detector de fallos. Ejecutar una vez en Supabase → SQL Editor → Run.
create table if not exists public.cf_bugs (
  code text primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  email text,
  role text,
  app text,
  kind text,
  msg text,
  screen text,
  data jsonb,
  status text not null default 'open'
);
create index if not exists cf_bugs_created on public.cf_bugs (created_at desc);
alter table public.cf_bugs enable row level security;
revoke all on public.cf_bugs from anon, authenticated;
drop policy if exists "ceo" on public.cf_bugs;
create policy "ceo" on public.cf_bugs for all using (public.cf_is_owner()) with check (public.cf_is_owner());

create or replace function public.cf_bug_report(p jsonb) returns text
language plpgsql security definer set search_path = public, auth as $$
declare c text := upper(left(coalesce(p->>'code', ''), 12)); n int; d jsonb := p->'data';
begin
  if c !~ '^CF-[A-Z0-9]{4,8}$' then return null; end if;
  if d is not null and octet_length(d::text) > 40000 then d := jsonb_build_object('cut', true, 'note', left(d->>'note', 3000)); end if;
  select count(*) into n from public.cf_bugs where created_at > now() - interval '1 hour' and user_id is not distinct from auth.uid();
  if n >= (case when auth.uid() is null then 60 else 30 end) then return null; end if;
  insert into public.cf_bugs (code, user_id, email, role, app, kind, msg, screen, data)
  values (c, auth.uid(), lower(nullif(auth.jwt()->>'email', '')),
    case when public.cf_is_owner() then 'ceo' when public.cf_is_coach() then 'coach' when auth.uid() is not null then 'client' else 'anon' end,
    left(p->>'app', 20), left(p->>'kind', 20), left(p->>'msg', 1500), left(p->>'screen', 200), d)
  on conflict (code) do nothing;
  if not found then return '!dup'; end if;
  delete from public.cf_bugs where created_at < now() - interval '180 days';
  return c;
end $$;

create or replace function public.cf_bugs_list() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.cf_is_owner() then coalesce((
    select jsonb_agg(to_jsonb(b) || jsonb_build_object('name', k.name) order by b.created_at desc)
    from (select * from public.cf_bugs order by created_at desc limit 400) b
    left join public.cf_coaches k on lower(k.email) = b.email
  ), '[]'::jsonb) else null end
$$;

create or replace function public.cf_bug_set(c text, st text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.cf_is_owner() then return false; end if;
  if st = 'del' then delete from public.cf_bugs where code = c;
  elsif st in ('open', 'fixed') then update public.cf_bugs set status = st where code = c;
  end if;
  return true;
end $$;

grant execute on function public.cf_bug_report(jsonb) to anon, authenticated;
grant execute on function public.cf_bugs_list() to authenticated;
grant execute on function public.cf_bug_set(text, text) to authenticated;
