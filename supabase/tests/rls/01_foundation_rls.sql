-- RLS tests for the M0 foundation. Runs inside a transaction that is rolled back.
-- Each "act as" switches to the `authenticated` role with a JWT subject, exactly
-- like PostgREST does for a Supabase API request.
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

create or replace function pg_temp.as_superuser() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.ok(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAILED: %', p_msg;
  end if;
  raise notice 'ok - %', p_msg;
end $$;

grant execute on function pg_temp.act_as(uuid) to anon, authenticated;
grant execute on function pg_temp.as_superuser() to anon, authenticated;
grant execute on function pg_temp.ok(boolean, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fixtures (as superuser, like a migration/seed would)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'daniel@test.local', '{"display_name":"Daniel"}'),
  ('00000000-0000-0000-0000-00000000000b', 'other@test.local',  '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@test.local',  '{"full_name":"Andrés"}'),
  ('00000000-0000-0000-0000-00000000000d', 'platform@test.local','{}'),
  ('00000000-0000-0000-0000-00000000000e', 'mentor@test.local', '{"name":"Carlos"}');

insert into public.churches (id, name, slug, join_code) values
  ('10000000-0000-0000-0000-000000000001', 'Iglesia Uno', 'iglesia-uno', 'UNO2026'),
  ('10000000-0000-0000-0000-000000000002', 'Iglesia Dos', 'iglesia-dos', 'DOS2026');

insert into public.church_members (church_id, user_id) values
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000e');

insert into public.user_roles (user_id, role, church_id) values
  ('00000000-0000-0000-0000-00000000000c', 'CHURCH_ADMIN', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-00000000000d', 'PLATFORM_ADMIN', null);

insert into public.groups (id, church_id, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Jóvenes Uno'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Jóvenes Dos');

insert into public.group_members (group_id, user_id) values
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b');

-- ---------------------------------------------------------------------------
-- Profiles are created by trigger and are private to their owner
-- ---------------------------------------------------------------------------
select pg_temp.ok((select count(*) from public.profiles) = 5, 'handle_new_user creates one profile per auth user');
select pg_temp.ok((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Daniel',
  'display_name copied from sign-up metadata');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select count(*) from public.profiles) = 1, 'user only sees own profile');
update public.profiles set display_name = 'Dani' where id = '00000000-0000-0000-0000-00000000000b';
select pg_temp.as_superuser();
select pg_temp.ok((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') is null,
  'user cannot update someone else''s profile');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.ok((select count(*) from public.profiles) = 1, 'church admin cannot read members'' private profiles');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select pg_temp.ok((select count(*) from public.profiles) = 1, 'platform admin cannot read private profiles through the API');

-- ---------------------------------------------------------------------------
-- Anonymous access is denied everywhere
-- ---------------------------------------------------------------------------
select pg_temp.act_as(null);
do $$ begin
  perform count(*) from public.churches;
  raise exception 'FAILED: anon could read churches';
exception when insufficient_privilege then raise notice 'ok - anon cannot read churches';
end $$;
do $$ begin
  perform count(*) from public.journey_stages;
  raise exception 'FAILED: anon could read journey_stages';
exception when insufficient_privilege then raise notice 'ok - anon cannot read journey_stages';
end $$;
do $$ begin
  perform * from public.join_church_by_code('UNO2026');
  raise exception 'FAILED: anon could call join_church_by_code';
exception when insufficient_privilege then raise notice 'ok - anon cannot join a church';
end $$;

-- ---------------------------------------------------------------------------
-- Multi-tenant isolation
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select count(*) from public.churches) = 0, 'user without church sees no churches');
select pg_temp.ok((select count(*) from public.groups) = 0, 'user without church sees no groups');
select pg_temp.ok((select count(*) from public.journey_stages) = 6, 'journey stages readable by any signed-in user');

do $$ begin
  insert into public.churches (name, slug, join_code) values ('Falsa', 'falsa', 'FALSA2026');
  raise exception 'FAILED: user created a church';
exception when insufficient_privilege then raise notice 'ok - regular user cannot create churches';
end $$;

do $$ begin
  insert into public.church_members (church_id, user_id)
  values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a');
  raise exception 'FAILED: user inserted membership directly';
exception when insufficient_privilege then raise notice 'ok - membership cannot be self-inserted bypassing the code';
end $$;

do $$ begin
  perform * from public.join_church_by_code('NOEXISTE1');
  raise exception 'FAILED: unknown code accepted';
exception when no_data_found then raise notice 'ok - unknown church code rejected';
end $$;

do $$ begin
  perform * from public.join_church_by_code('x''; drop table x;--');
  raise exception 'FAILED: malformed code accepted';
exception when invalid_parameter_value then raise notice 'ok - malformed church code rejected';
end $$;

select pg_temp.ok((select church_name from public.join_church_by_code(' uno2026 ')) = 'Iglesia Uno',
  'join_church_by_code joins with a normalized code');
select pg_temp.ok((select count(*) from public.join_church_by_code('UNO2026')) = 1, 'joining twice is idempotent');
select pg_temp.ok((select count(*) from public.churches) = 1, 'after joining, user sees only their church');
select pg_temp.ok((select id from public.churches) = '10000000-0000-0000-0000-000000000001', 'the visible church is the joined one');
select pg_temp.ok((select count(*) from public.groups) = 1, 'user sees groups of their church only');
select pg_temp.ok((select count(*) from public.church_members) = 1, 'regular member sees only own membership');
select pg_temp.ok((select count(*) from public.group_members) = 0, 'user cannot see rosters of groups they are not in');

update public.church_members set status = 'inactive' where user_id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.as_superuser();
select pg_temp.ok((select status from public.church_members where user_id = '00000000-0000-0000-0000-00000000000a') = 'active',
  'member cannot change own membership status');

-- ---------------------------------------------------------------------------
-- Roles: no self-escalation; church admins are scoped to their church
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
do $$ begin
  insert into public.user_roles (user_id, role, church_id)
  values ('00000000-0000-0000-0000-00000000000a', 'CHURCH_ADMIN', '10000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: user escalated to CHURCH_ADMIN';
exception when insufficient_privilege then raise notice 'ok - user cannot grant themselves a role';
end $$;
do $$ begin
  insert into public.user_roles (user_id, role, church_id)
  values ('00000000-0000-0000-0000-00000000000a', 'PLATFORM_ADMIN', null);
  raise exception 'FAILED: user escalated to PLATFORM_ADMIN';
exception when insufficient_privilege then raise notice 'ok - user cannot become platform admin';
end $$;
select pg_temp.ok((select count(*) from public.audit_log) = 0, 'regular user cannot read the audit log');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.ok((select count(*) from public.church_members) = 3, 'church admin sees memberships of own church');
select pg_temp.ok((select count(*) from public.churches) = 1, 'church admin sees only own church');

insert into public.user_roles (user_id, role, church_id)
values ('00000000-0000-0000-0000-00000000000e', 'MENTOR', '10000000-0000-0000-0000-000000000001');
select pg_temp.ok((select count(*) from public.user_roles where role = 'MENTOR') = 1, 'church admin grants MENTOR to a member');

insert into public.user_roles (user_id, role, church_id)
values ('00000000-0000-0000-0000-00000000000e', 'LEADER', '10000000-0000-0000-0000-000000000001');
select pg_temp.ok((select count(*) from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000e') = 2,
  'a user can hold several roles at once');

do $$ begin
  insert into public.user_roles (user_id, role, church_id)
  values ('00000000-0000-0000-0000-00000000000b', 'LEADER', '10000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: admin granted role to non-member';
exception when insufficient_privilege then raise notice 'ok - church admin cannot grant roles to non-members';
end $$;
do $$ begin
  insert into public.user_roles (user_id, role, church_id)
  values ('00000000-0000-0000-0000-00000000000b', 'LEADER', '10000000-0000-0000-0000-000000000002');
  raise exception 'FAILED: admin granted role in another church';
exception when insufficient_privilege then raise notice 'ok - church admin cannot act on another church';
end $$;
do $$ begin
  insert into public.user_roles (user_id, role, church_id)
  values ('00000000-0000-0000-0000-00000000000e', 'PLATFORM_ADMIN', null);
  raise exception 'FAILED: church admin granted PLATFORM_ADMIN';
exception when insufficient_privilege then raise notice 'ok - church admin cannot grant PLATFORM_ADMIN';
end $$;
do $$ begin
  update public.user_roles set role = 'PASTOR' where user_id = '00000000-0000-0000-0000-00000000000e' and role = 'MENTOR';
  if found then raise exception 'FAILED: role row updated'; end if;
  raise notice 'ok - role rows are not updatable';
exception when insufficient_privilege then raise notice 'ok - role rows are immutable';
end $$;

-- ---------------------------------------------------------------------------
-- Audit trail
-- ---------------------------------------------------------------------------
select pg_temp.as_superuser();
select pg_temp.ok((select count(*) from public.audit_log where action = 'role.granted'
                   and actor_id = '00000000-0000-0000-0000-00000000000c') = 2,
  'role grants are audited with the acting user');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select pg_temp.ok((select count(*) from public.audit_log) >= 2, 'platform admin reads the audit log');
select pg_temp.ok((select count(*) from public.churches
                   where id in ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002')) = 2,
  'platform admin can see churches of every tenant');

do $$ begin
  insert into public.audit_log (action) values ('forged');
  raise exception 'FAILED: audit log writable';
exception when insufficient_privilege then raise notice 'ok - audit log is not writable through the API';
end $$;

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.ok((select count(*) from public.group_members) = 1, 'group member sees their group roster');
select pg_temp.ok((select count(*) from public.groups) = 1, 'member of church 2 sees only church 2 groups');
do $$ begin
  insert into public.groups (church_id, name) values ('10000000-0000-0000-0000-000000000002', 'Nuevo');
  raise exception 'FAILED: member created a group';
exception when insufficient_privilege then raise notice 'ok - regular member cannot create groups';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-00000000000e'); -- LEADER of church 1
insert into public.groups (church_id, name) values ('10000000-0000-0000-0000-000000000001', 'Universitarios');
select pg_temp.ok((select count(*) from public.groups) = 2, 'leader creates groups in own church');
do $$ begin
  insert into public.groups (church_id, name) values ('10000000-0000-0000-0000-000000000002', 'Intruso');
  raise exception 'FAILED: leader created a group in another church';
exception when insufficient_privilege then raise notice 'ok - leader cannot create groups in another church';
end $$;

select pg_temp.as_superuser();
rollback;
