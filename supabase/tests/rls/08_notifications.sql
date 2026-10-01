-- M6 · Avisos: notices are created by the system, private to their owner; devices and preferences are owner-only.
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

-- a1 youth · a2 mentor · a3 leader · a4 another youth · a5 platform admin
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000001a1', 'joven@test.local'),
  ('00000000-0000-0000-0000-0000000001a2', 'mentor@test.local'),
  ('00000000-0000-0000-0000-0000000001a3', 'lider@test.local'),
  ('00000000-0000-0000-0000-0000000001a4', 'amiga@test.local'),
  ('00000000-0000-0000-0000-0000000001a5', 'plataforma@test.local');
update public.profiles set display_name = 'Lucía Pérez' where id = '00000000-0000-0000-0000-0000000001a1';
update public.profiles set display_name = 'Tomás Ruiz' where id = '00000000-0000-0000-0000-0000000001a2';
insert into public.churches (id, name, slug, join_code) values ('ab000000-0000-0000-0000-000000000001', 'Iglesia M6', 'iglesia-m6', 'MSEIS1');
insert into public.church_members (church_id, user_id) values
  ('ab000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000001a1'),
  ('ab000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000001a2'),
  ('ab000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000001a3'),
  ('ab000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000001a4');
insert into public.user_roles (user_id, role, church_id) values
  ('00000000-0000-0000-0000-0000000001a2', 'MENTOR', 'ab000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000001a3', 'LEADER', 'ab000000-0000-0000-0000-000000000001');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000001a5', 'PLATFORM_ADMIN');

-- Mentorship → notices for both; a message notifies the other participant ---------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000001a3');
select set_config('test.ms', public.assign_mentor('ab000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000001a2', '00000000-0000-0000-0000-0000000001a1')::text, true);
select pg_temp.ok((select count(*) from public.notifications) = 0, 'leaders never see other people''s notices');

select pg_temp.act_as('00000000-0000-0000-0000-0000000001a2');
insert into public.mentorship_messages (mentorship_id, body) values (current_setting('test.ms')::uuid, '¿Tomamos un café el jueves?');

select pg_temp.act_as('00000000-0000-0000-0000-0000000001a1');
select pg_temp.ok((select count(*) from public.notifications where kind = 'mentorship') = 1, 'the youth is told they have a mentor');
select pg_temp.ok((select title from public.notifications where kind = 'mentor_message') = 'Tomás te escribió',
  'a mentor message creates a notice with first name only');
select pg_temp.ok((select href from public.notifications where kind = 'mentor_message') like '/mentoria/?id=%', 'notices deep-link in-app');

do $$ begin
  insert into public.notifications (user_id, kind, title) values (auth.uid(), 'other', 'Falso');
  raise exception 'FAILED: forged notice';
exception when insufficient_privilege then raise notice 'ok - notices cannot be created by users';
end $$;
do $$ begin
  update public.notifications set title = 'cambiado';
  raise exception 'FAILED: notice edited';
exception when insufficient_privilege then raise notice 'ok - only read_at can change';
end $$;
select public.mark_notifications_read();
select pg_temp.ok((select count(*) from public.notifications where read_at is null) = 0, 'mark all as read');
do $$ begin
  perform public.notify(auth.uid(), 'other', 'x', null, null);
  raise exception 'FAILED: notify callable';
exception when insufficient_privilege then raise notice 'ok - notify() is internal';
end $$;

-- Questions: leaders are told there is one, never by whom -------------------------------------------
insert into public.questions (church_id, category, body, is_anonymous)
values ('ab000000-0000-0000-0000-000000000001', 'faith', '¿Cómo sé si Dios me está hablando o si solo es lo que yo quiero?', true);
select pg_temp.act_as('00000000-0000-0000-0000-0000000001a3');
select pg_temp.ok((select count(*) from public.notifications where kind = 'new_question') = 1, 'leaders are told about new questions');
select pg_temp.ok((select coalesce(title, '') || coalesce(body, '') from public.notifications where kind = 'new_question') !~ 'Lucía',
  'the notice never names the author');
select public.answer_question((select id from public.leader_questions('ab000000-0000-0000-0000-000000000001') limit 1), 'Dios habla por su Palabra.', false);
select pg_temp.act_as('00000000-0000-0000-0000-0000000001a1');
select pg_temp.ok((select body like '“¿Cómo sé si Dios%…”' and char_length(body) <= 62 from public.notifications where kind = 'question_answered'),
  'the author is told their question was answered');

-- Events reach members, not the creator -----------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000001a3');
insert into public.events (church_id, title, starts_at, created_by) values
  ('ab000000-0000-0000-0000-000000000001', 'Campamento', now() + interval '20 days', '00000000-0000-0000-0000-0000000001a3');
select pg_temp.ok((select count(*) from public.notifications where kind = 'event_published') = 0, 'the creator is not notified');
select pg_temp.act_as('00000000-0000-0000-0000-0000000001a4');
select pg_temp.ok((select count(*) from public.notifications where kind = 'event_published') = 1, 'members hear about new events');
select pg_temp.ok((select count(*) from public.notifications) = 1, 'and see nothing else of anyone');

-- Devices & preferences -----------------------------------------------------------------------------
select public.register_device('fcm-token-aaaaaaaaaaaaaaaaaaaaaaaaaa', 'android');
select pg_temp.ok((select count(*) from public.device_tokens) = 1, 'a device registers its token');
do $$ begin
  insert into public.device_tokens (user_id, token, platform) values ('00000000-0000-0000-0000-0000000001a1', 'fcm-token-bbbbbbbbbbbbbbbbbbbbbbbbbb', 'android');
  raise exception 'FAILED: token for someone else';
exception when insufficient_privilege then raise notice 'ok - tokens only through register_device';
end $$;
insert into public.notification_preferences (push_enabled, daily_reminder) values (true, true);
select pg_temp.act_as('00000000-0000-0000-0000-0000000001a1');
select public.register_device('fcm-token-aaaaaaaaaaaaaaaaaaaaaaaaaa', 'android');
select pg_temp.ok((select count(*) from public.device_tokens) = 1, 'a shared phone moves the token to the new account');
select pg_temp.ok((select count(*) from public.notification_preferences) = 0, 'preferences are private');
select pg_temp.act_as('00000000-0000-0000-0000-0000000001a4');
select pg_temp.ok((select count(*) from public.device_tokens) = 0, 'the previous account no longer receives pushes there');

select pg_temp.act_as('00000000-0000-0000-0000-0000000001a5');
select pg_temp.ok((select count(*) from public.notifications) = 0 and (select count(*) from public.device_tokens) = 0,
  'platform admins cannot read notices or devices');

select pg_temp.act_as(null);
do $$ begin
  perform count(*) from public.notifications;
  raise exception 'FAILED: anon read notices';
exception when insufficient_privilege then raise notice 'ok - anon cannot read notices';
end $$;

reset role;
rollback;
