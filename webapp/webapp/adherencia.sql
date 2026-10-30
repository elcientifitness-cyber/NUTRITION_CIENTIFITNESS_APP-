-- Cientia · adherencia por comida (resumen de los registros de los asesorados).
-- Ejecutar una vez en Supabase → SQL Editor → New query → Run. Se puede repetir.
-- Devuelve, por cliente, día y comida, cuántos alimentos marcó y sus kcal (solo del nutricionista que lo pide).
create or replace function public.cf_adh(n int default 15)
returns table(client_key text, day date, meal text, items int, kcal numeric, cump text)
language sql stable security definer set search_path = public as $$
  select d.client_key, d.day, f->>'meal' as meal, count(f)::int as items,
    coalesce(sum(case when (f->>'k') ~ '^-?[0-9]+(\.[0-9]+)?$' then (f->>'k')::numeric else 0 end), 0) as kcal,
    d.survey->>'cump' as cump
  from public.cf_daylogs d
  left join lateral jsonb_array_elements(case when jsonb_typeof(d.foods) = 'array' then d.foods else '[]'::jsonb end) f on true
  where d.coach_id = auth.uid() and d.day >= current_date - least(greatest(coalesce(n, 15), 1), 31)
  group by d.client_key, d.day, f->>'meal', d.survey->>'cump'
$$;
grant execute on function public.cf_adh(int) to authenticated;
