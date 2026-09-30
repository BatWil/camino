-- Guard: every table in the public schema must have RLS enabled (deny by default).
do $$
declare
  missing text;
begin
  select string_agg(c.relname, ', ') into missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;

  if missing is not null then
    raise exception 'FAILED: tables without RLS: %', missing;
  end if;
  raise notice 'ok - every public table has RLS enabled';
end $$;

-- Guard: SECURITY DEFINER functions must pin search_path.
do $$
declare
  unsafe text;
begin
  select string_agg(p.proname, ', ') into unsafe
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%');

  if unsafe is not null then
    raise exception 'FAILED: security definer functions without search_path: %', unsafe;
  end if;
  raise notice 'ok - security definer functions pin search_path';
end $$;
