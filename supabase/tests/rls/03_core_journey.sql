-- M2 · journey modules, devotionals, plans, challenges, rhythm.
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

-- Fixtures (starter content is removed inside this transaction so counts are exact) --
delete from public.journey_modules;
delete from public.plan_days;
delete from public.plans;
delete from public.challenges;
delete from public.devotionals;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'joven@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'otra@test.local'),
  ('00000000-0000-0000-0000-0000000000b3', 'lider@test.local');

update public.profiles set current_stage_id = (select id from public.journey_stages where key = 'encuentra'),
  timezone = 'America/Guatemala';

insert into public.churches (id, name, slug, join_code) values
  ('30000000-0000-0000-0000-000000000001', 'Iglesia A', 'iglesia-a', 'AAAAAA'),
  ('30000000-0000-0000-0000-000000000002', 'Iglesia B', 'iglesia-b', 'BBBBBB');
insert into public.church_members (church_id, user_id) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b3');
insert into public.user_roles (user_id, role, church_id) values
  ('00000000-0000-0000-0000-0000000000b3', 'LEADER', '30000000-0000-0000-0000-000000000001');

insert into public.devotionals (id, title, scripture_ref, scripture_text, reflection, question, prayer, action, is_published) values
  ('40000000-0000-0000-0000-000000000001', 'Día uno', 'Salmo 1', 'Texto', 'Reflexión', '¿Pregunta?', 'Oración', 'Acción', true),
  ('40000000-0000-0000-0000-000000000002', 'Día dos', 'Salmo 2', 'Texto', 'Reflexión', '¿Pregunta?', 'Oración', 'Acción', true),
  ('40000000-0000-0000-0000-000000000003', 'Borrador', 'Salmo 3', 'Texto', 'Reflexión', '¿Pregunta?', 'Oración', 'Acción', false),
  ('40000000-0000-0000-0000-000000000004', 'Módulo suelto', 'Salmo 4', 'Texto', 'Reflexión', '¿Pregunta?', 'Oración', 'Acción', true);
insert into public.devotionals (id, source, church_id, title, scripture_ref, scripture_text, reflection, question, prayer, action, is_published) values
  ('40000000-0000-0000-0000-000000000005', 'CHURCH', '30000000-0000-0000-0000-000000000002', 'Solo Iglesia B', 'Salmo 5', 'Tx', 'Rx', '¿P?', 'Or', 'Ac', true);

insert into public.plans (id, title, summary, category, is_published) values
  ('50000000-0000-0000-0000-000000000001', 'Plan corto', 'Dos días', 'foundations', true);
insert into public.plan_days (plan_id, day_number, devotional_id) values
  ('50000000-0000-0000-0000-000000000001', 1, '40000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000001', 2, '40000000-0000-0000-0000-000000000002');

insert into public.journey_modules (stage_id, position, title, kind, plan_id, devotional_id) values
  ((select id from public.journey_stages where key = 'encuentra'), 1, 'Plan corto', 'plan', '50000000-0000-0000-0000-000000000001', null),
  ((select id from public.journey_stages where key = 'encuentra'), 2, 'Módulo suelto', 'devotional', null, '40000000-0000-0000-0000-000000000004');

insert into public.challenges (id, title, description, days_target, is_published) values
  ('60000000-0000-0000-0000-000000000001', 'Ora por un amigo', 'Cinco días', 5, true);

-- Content visibility -------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select pg_temp.ok((select count(*) from public.devotionals) = 3, 'only published platform devotionals are visible');
select pg_temp.ok((select count(*) from public.devotionals where id = '40000000-0000-0000-0000-000000000005') = 0,
  'another church''s content is not visible');
select pg_temp.ok((select count(*) from public.plan_days) = 2, 'days of visible plans are readable');

do $$ begin
  insert into public.devotionals (title, scripture_ref, scripture_text, reflection, question, prayer, action)
  values ('X', 'Y', 'Tx', 'Rx', '¿P?', 'Or', 'Ac');
  raise exception 'FAILED: member wrote platform content';
exception when insufficient_privilege then raise notice 'ok - members cannot write platform content';
end $$;

do $$ begin
  insert into public.devotional_progress (user_id, devotional_id, status)
  values (auth.uid(), '40000000-0000-0000-0000-000000000001', 'completed');
  raise exception 'FAILED: progress written directly';
exception when insufficient_privilege then raise notice 'ok - progress can only be written through RPCs';
end $$;

do $$ begin
  perform public.save_devotional_progress('40000000-0000-0000-0000-000000000003', '{read}', null);
  raise exception 'FAILED: unpublished devotional accepted';
exception when no_data_found then raise notice 'ok - unpublished devotionals cannot be started';
end $$;

do $$ begin
  perform public.refresh_journey_stage(auth.uid());
  raise exception 'FAILED: internal function callable';
exception when insufficient_privilege then raise notice 'ok - stage advancement is not callable directly';
end $$;

-- Devotional progress + plan cascade --------------------------------------------
select public.save_devotional_progress('40000000-0000-0000-0000-000000000001', '{read,reflect}', 'Mi respuesta privada');
select pg_temp.ok((select cardinality(completed_steps) from public.devotional_progress) = 2, 'steps are saved');
select public.save_devotional_progress('40000000-0000-0000-0000-000000000001', '{read,think}', null);
select pg_temp.ok((select cardinality(completed_steps) = 3 and answer = 'Mi respuesta privada' from public.devotional_progress),
  'steps merge and the private answer is kept');

select pg_temp.ok(public.start_plan('50000000-0000-0000-0000-000000000001') = public.start_plan('50000000-0000-0000-0000-000000000001'),
  'starting the same plan twice keeps one active enrollment');

select pg_temp.ok(
  (public.complete_devotional('40000000-0000-0000-0000-000000000001', null,
     (select id from public.user_plans where status = 'active')) ->> 'plan_completed')::boolean = false,
  'day 1 of 2 does not complete the plan');
select pg_temp.ok((select count(*) from public.plan_day_completions) = 1, 'plan day 1 recorded');

select pg_temp.ok(
  (public.complete_devotional('40000000-0000-0000-0000-000000000002', null,
     (select id from public.user_plans where status = 'active')) ->> 'plan_completed')::boolean,
  'last day completes the plan');
select pg_temp.ok((select status from public.user_module_progress ump join public.journey_modules m on m.id = ump.module_id
  where m.kind = 'plan') = 'completed', 'completing the plan completes its journey module');
select pg_temp.ok((select s.key from public.profiles p join public.journey_stages s on s.id = p.current_stage_id) = 'encuentra',
  'stage does not advance while a required module is pending');

select pg_temp.ok(
  (public.complete_devotional('40000000-0000-0000-0000-000000000004') ->> 'stage_advanced')::boolean,
  'completing the last module advances the stage');
select pg_temp.ok((select s.key from public.profiles p join public.journey_stages s on s.id = p.current_stage_id) = 'crece',
  'person is now in CRECE');
select pg_temp.ok((select count(*) from public.activity_days) = 1, 'one rhythm day recorded (no content stored)');

-- Challenge check-ins --------------------------------------------------------------
select pg_temp.ok(public.challenge_checkin('60000000-0000-0000-0000-000000000001') = 1, 'today checked in');
select pg_temp.ok(public.challenge_checkin('60000000-0000-0000-0000-000000000001') = 1, 'checking in twice the same day counts once');
select pg_temp.ok(public.challenge_checkin('60000000-0000-0000-0000-000000000001', false) = 0, 'today can be undone');
select set_config('test.foreign_plan', (select id::text from public.user_plans limit 1), true);

-- Privacy of progress -------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b3'); -- leader of the same church
select pg_temp.ok((select count(*) from public.devotional_progress) = 0, 'a leader cannot read a member''s devotional answers');
select pg_temp.ok((select count(*) from public.user_plans) = 0, 'a leader cannot read a member''s plans directly');
select pg_temp.ok((select count(*) from public.activity_days) = 0, 'a leader cannot read a member''s rhythm directly');

insert into public.devotionals (source, church_id, title, scripture_ref, scripture_text, reflection, question, prayer, action, is_published)
values ('CHURCH', '30000000-0000-0000-0000-000000000001', 'Serie A', 'Juan 1', 'Tx', 'Rx', '¿P?', 'Or', 'Ac', false);
select pg_temp.ok((select count(*) from public.devotionals where title = 'Serie A') = 1, 'leaders write and see drafts of their church content');
do $$ begin
  insert into public.devotionals (source, church_id, title, scripture_ref, scripture_text, reflection, question, prayer, action)
  values ('CHURCH', '30000000-0000-0000-0000-000000000002', 'Intruso', 'Juan 1', 'Tx', 'Rx', '¿P?', 'Or', 'Ac');
  raise exception 'FAILED: leader wrote content for another church';
exception when insufficient_privilege then raise notice 'ok - leaders cannot write another church''s content';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select pg_temp.ok((select count(*) from public.devotionals where title = 'Serie A') = 0, 'members do not see unpublished church drafts');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000b2');
select pg_temp.ok((select count(*) from public.devotional_progress) = 0, 'other users never see someone else''s answers');
do $$ begin
  perform public.complete_devotional('40000000-0000-0000-0000-000000000001', null,
    current_setting('test.foreign_plan')::uuid);
  raise exception 'FAILED: completed a day on someone else''s plan';
exception when no_data_found then raise notice 'ok - cannot complete days on someone else''s plan';
end $$;

select pg_temp.act_as(null);
do $$ begin
  perform count(*) from public.plans;
  raise exception 'FAILED: anon read plans';
exception when insufficient_privilege then raise notice 'ok - anon cannot read content';
end $$;

reset role;
rollback;
