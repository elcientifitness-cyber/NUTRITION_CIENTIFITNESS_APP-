-- Cientia · Mi perfil (nombre, WhatsApp y cambio de email de los nutricionistas).
-- Ejecutar una vez en Supabase → SQL Editor → New query → Run. Se puede repetir.

-- 1) Guardar nombre y WhatsApp propios (cada nutricionista solo su fila)
create or replace function public.cf_me_update(n text, p text) returns boolean
language plpgsql security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if em = '' then return false; end if;
  update public.cf_coaches set name = left(trim(coalesce(n, '')), 80), phone = left(trim(coalesce(p, '')), 30)
  where lower(email) = em;
  return found;
end $$;
grant execute on function public.cf_me_update(text, text) to authenticated;

-- 2) Comprobar que un email nuevo está libre antes de pedir el cambio
create or replace function public.cf_email_free(e text) returns text
language plpgsql stable security definer set search_path = public, auth as $$
declare x text := lower(trim(coalesce(e, '')));
begin
  if auth.uid() is null then return 'auth'; end if;
  if x !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return 'bad'; end if;
  if exists(select 1 from auth.users where lower(email) = x and id <> auth.uid()) then return 'user'; end if;
  if exists(select 1 from public.cf_coaches where lower(email) = x) then return 'coach'; end if;
  if exists(select 1 from public.cf_links where lower(email) = x and coach_id <> auth.uid()) then return 'client'; end if;
  return 'ok';
end $$;
grant execute on function public.cf_email_free(text) to authenticated;

-- 3) Cuando se confirma el cambio de email, se lleva el acceso de nutricionista y sus datos al email nuevo
create or replace function public.cf_on_email_change() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare o text := lower(old.email); nw text := lower(new.email); oj text; nj text;
begin
  if o is null or nw is null or o = nw then return new; end if;
  begin
    update public.cf_coaches set email = nw where lower(email) = o;
    update public.cf_links set email = nw where lower(email) = o;
    oj := to_jsonb(o)::text; nj := to_jsonb(nw)::text;
    update public.cf_state set data = replace(data::text, oj, nj)::jsonb where strpos(data::text, oj) > 0;
  exception when others then
    raise warning 'cf_on_email_change: %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists cf_email_change on auth.users;
create trigger cf_email_change after update of email on auth.users
for each row execute function public.cf_on_email_change();
