-- M1 · onboarding RPC, column privileges, church preview, avatar storage.
begin;

create or replace function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  if p_user is null then
    perform set_config('request.jwt.claims', '', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end if;
end $$;

create or replace function pg_temp.ok(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAILED: %', p_msg; end if;
  raise notice 'ok - %', p_msg;
end $$;

grant execute on function pg_temp.act_as(uuid) to anon, authenticated;
grant execute on function pg_temp.ok(boolean, text) to anon, authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'joven@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'otro@test.local');

insert into public.churches (name, slug, join_code, city)
values ('Iglesia Prueba', 'iglesia-prueba', 'PRUEBA1', 'Monterrey');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');

-- Column privileges ------------------------------------------------------------
update public.profiles set display_name = 'Dani', growth_areas = '{bible}' where id = auth.uid();
select pg_temp.ok((select display_name from public.profiles) = 'Dani', 'user edits own display name and preferences');

do $$ begin
  update public.profiles set onboarding_completed_at = now() where id = auth.uid();
  raise exception 'FAILED: onboarding_completed_at writable';
exception when insufficient_privilege then raise notice 'ok - onboarding_completed_at is server-only';
end $$;

do $$ begin
  update public.profiles set current_stage_id = (select id from public.journey_stages where key = 'guia') where id = auth.uid();
  raise exception 'FAILED: current_stage_id writable';
exception when insufficient_privilege then raise notice 'ok - journey position cannot be self-assigned';
end $$;

-- complete_onboarding validation ----------------------------------------------
do $$ begin
  perform * from public.complete_onboarding('Daniel', (current_date - interval '10 years')::date, 'growing', '{bible}', '{closer_to_god}');
  raise exception 'FAILED: under-age accepted';
exception when invalid_parameter_value then raise notice 'ok - minimum age enforced';
end $$;

do $$ begin
  perform * from public.complete_onboarding('  ', date '2008-05-01', 'growing', '{bible}', '{closer_to_god}');
  raise exception 'FAILED: empty name accepted';
exception when invalid_parameter_value then raise notice 'ok - display name required';
end $$;

do $$ begin
  perform * from public.complete_onboarding('Daniel', date '2008-05-01', 'growing', '{}', '{closer_to_god}');
  raise exception 'FAILED: empty growth areas accepted';
exception when invalid_parameter_value then raise notice 'ok - at least one growth area required';
end $$;

do $$ begin
  perform * from public.complete_onboarding('Daniel', current_date + 1, 'growing', '{bible}', '{closer_to_god}');
  raise exception 'FAILED: future birth date accepted';
exception when invalid_parameter_value then raise notice 'ok - future birth date rejected';
end $$;

select pg_temp.ok(
  (select stage_key from public.complete_onboarding(' Daniel Ríos ', date '2008-05-01', 'growing',
     '{bible,consistency,bible}', '{closer_to_god}')) = 'crece',
  '"Quiero crecer" starts the journey in CRECE');

select pg_temp.ok((select display_name from public.profiles) = 'Daniel Ríos', 'display name trimmed and saved');
select pg_temp.ok((select onboarding_completed_at is not null from public.profiles), 'onboarding marked complete');
select pg_temp.ok((select cardinality(growth_areas) from public.profiles) = 2, 'duplicate growth areas removed');

select pg_temp.ok(
  (select stage_key from public.complete_onboarding('Daniel', date '2008-05-01', 'knowing_god', '{prayer}', '{learn_to_pray}')) = 'crece',
  're-running onboarding never moves the journey backwards');

-- Other users' profiles stay invisible -----------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select pg_temp.ok((select count(*) from public.profiles) = 1, 'onboarding data is private to its owner');
select pg_temp.ok((select stage_key from public.complete_onboarding('Ana', date '2005-01-01', 'serving', '{service}', '{serve}')) = 'sirve',
  '"Ya sirvo en mi iglesia" starts in SIRVE');

-- Church preview ---------------------------------------------------------------
select pg_temp.ok((select church_name from public.preview_church_by_code('prueba1')) = 'Iglesia Prueba', 'preview by code returns the church name');
select pg_temp.ok((select count(*) from public.preview_church_by_code('NOPE00')) = 0, 'unknown code previews nothing');
select pg_temp.ok((select count(*) from public.preview_church_by_code('bad code!')) = 0, 'malformed code previews nothing');
select pg_temp.ok((select count(*) from public.churches) = 0, 'preview does not grant read access to the church');

select pg_temp.act_as(null);
do $$ begin
  perform * from public.preview_church_by_code('PRUEBA1');
  raise exception 'FAILED: anon previewed a church';
exception when insufficient_privilege then raise notice 'ok - anon cannot preview churches';
end $$;
do $$ begin
  perform * from public.complete_onboarding('X', date '2000-01-01', 'growing', '{bible}', '{serve}');
  raise exception 'FAILED: anon completed onboarding';
exception when insufficient_privilege then raise notice 'ok - anon cannot complete onboarding';
end $$;

-- Avatar storage -----------------------------------------------------------------
select pg_temp.ok((select not public and file_size_limit = 2097152 from storage.buckets where id = 'avatars'),
  'avatars bucket is private with a 2 MB limit');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-0000000000a1/avatar.webp');
select pg_temp.ok((select count(*) from storage.objects) = 1, 'user uploads into own avatar folder');

do $$ begin
  insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-0000000000a2/avatar.webp');
  raise exception 'FAILED: wrote into another user folder';
exception when insufficient_privilege then raise notice 'ok - cannot upload into another user''s folder';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select pg_temp.ok((select count(*) from storage.objects) = 0, 'avatars of other users are not readable');

reset role;
rollback;
