-- M4 · Comunidad: mentorship safeguards, anonymous questions, events, service, shared prayer.
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

-- d1 youth · d2 mentor · d3 leader · d4 pastor · d5 another youth · d6 outsider (other church) · d7 platform admin
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'joven@test.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'mentor@test.local'),
  ('00000000-0000-0000-0000-0000000000d3', 'lider@test.local'),
  ('00000000-0000-0000-0000-0000000000d4', 'pastor@test.local'),
  ('00000000-0000-0000-0000-0000000000d5', 'amiga@test.local'),
  ('00000000-0000-0000-0000-0000000000d6', 'externo@test.local'),
  ('00000000-0000-0000-0000-0000000000d7', 'plataforma@test.local');
update public.profiles set display_name = 'Sofía Ramírez' where id = '00000000-0000-0000-0000-0000000000d1';
update public.profiles set display_name = 'Carlos Méndez' where id = '00000000-0000-0000-0000-0000000000d2';
update public.profiles set display_name = 'Mateo Díaz' where id = '00000000-0000-0000-0000-0000000000d5';
insert into public.churches (id, name, slug, join_code) values
  ('a0000000-0000-0000-0000-000000000001', 'Iglesia M4', 'iglesia-m4', 'MCUATRO'),
  ('a0000000-0000-0000-0000-000000000002', 'Otra M4', 'otra-m4', 'OTRAMC');
insert into public.church_members (church_id, user_id) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d1'),
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d2'),
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d3'),
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d4'),
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d5'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000d6');
insert into public.user_roles (user_id, role, church_id) values
  ('00000000-0000-0000-0000-0000000000d2', 'MENTOR', 'a0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000d3', 'LEADER', 'a0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000d4', 'PASTOR', 'a0000000-0000-0000-0000-000000000001');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000d7', 'PLATFORM_ADMIN');
insert into public.groups (id, church_id, name) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Grupo M4');
insert into public.group_members (group_id, user_id, role) values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d1', 'member'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d5', 'member');

-- Youth's private data before any mentorship ---------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
insert into public.journal_entries (body) values ('Muy privado');
insert into public.check_ins (id, week_start, mood, note) values
  ('c0000000-0000-0000-0000-000000000001', date_trunc('week', current_date)::date, 'tired', 'Semana pesada'),
  ('c0000000-0000-0000-0000-000000000002', date_trunc('week', current_date)::date - 7, 'anxious', 'No compartido');
insert into public.prayers (id, title, privacy) values ('c1000000-0000-0000-0000-000000000001', 'Para mi mentor', 'MENTOR');
insert into public.prayers (id, title, privacy, group_id) values
  ('c1000000-0000-0000-0000-000000000002', 'Por mis exámenes', 'GROUP', 'b0000000-0000-0000-0000-000000000001');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select pg_temp.ok((select count(*) from public.prayers) = 0, 'an unassigned mentor sees no MENTOR prayers');
do $$ begin
  insert into public.mentorships (church_id, mentor_id, mentee_id)
  values ('a0000000-0000-0000-0000-000000000001', auth.uid(), '00000000-0000-0000-0000-0000000000d1');
  raise exception 'FAILED: mentor self-assigned';
exception when insufficient_privilege then raise notice 'ok - mentorships cannot be created directly';
end $$;
do $$ begin
  perform public.assign_mentor('a0000000-0000-0000-0000-000000000001', auth.uid(), '00000000-0000-0000-0000-0000000000d1');
  raise exception 'FAILED: mentor assigned themselves';
exception when insufficient_privilege then raise notice 'ok - a mentor cannot assign themselves';
end $$;

-- Leader assigns (audited) -----------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
do $$ begin
  perform public.assign_mentor('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000d1');
  raise exception 'FAILED: non-mentor assigned';
exception when invalid_parameter_value then raise notice 'ok - only people with the MENTOR role can mentor';
end $$;
select set_config('test.ms', public.assign_mentor('a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d1')::text, true);
reset role;
select pg_temp.ok((select count(*) from public.audit_log where action = 'mentorship.assigned') = 1, 'mentor assignment is audited');

-- Mentor's view: only what was shared -----------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select pg_temp.ok((select count(*) from public.prayers) = 1 and (select title from public.prayers) = 'Para mi mentor',
  'the mentor sees MENTOR prayers of their mentee (not GROUP ones)');
select pg_temp.ok((select count(*) from public.check_ins) = 0, 'the mentor sees no check-in until the youth shares one');
select pg_temp.ok((select count(*) from public.journal_entries) = 0, 'the mentor never sees the journal');
select pg_temp.ok((select first_name from public.my_mentees()) = 'Sofía', 'my_mentees exposes first name only');
select pg_temp.ok((select shared_checkins from public.my_mentees()) = 0, 'my_mentees counts only shared check-ins');
do $$ begin
  perform public.first_name('00000000-0000-0000-0000-0000000000d1');
  raise exception 'FAILED: first_name callable';
exception when insufficient_privilege then raise notice 'ok - name helper is internal';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select pg_temp.ok((select mentor_name from public.my_mentor()) = 'Carlos Méndez', 'the youth sees their mentor');
select public.share_checkin_with_mentor('c0000000-0000-0000-0000-000000000001');
insert into public.mentorship_messages (mentorship_id, body) values (current_setting('test.ms')::uuid, 'Hola, ¿cómo estás?');
do $$ begin
  insert into public.mentorship_messages (mentorship_id, kind, check_in_id)
  values (current_setting('test.ms')::uuid, 'checkin', 'c0000000-0000-0000-0000-000000000002');
  raise exception 'FAILED: check-in card forged';
exception when insufficient_privilege then raise notice 'ok - check-in cards only come from share_checkin_with_mentor';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select pg_temp.ok((select count(*) from public.check_ins) = 0, 'the mentor cannot read check-in rows (notes stay private)');
select pg_temp.ok((select count(*) from public.shared_checkins(current_setting('test.ms')::uuid)) = 1
  and (select mood::text from public.shared_checkins(current_setting('test.ms')::uuid)) = 'tired',
  'the mentor sees exactly the one shared check-in (week + mood only)');
select pg_temp.ok((select count(*) from public.mentorship_messages) = 2, 'the mentor reads the conversation');
insert into public.mentorship_messages (mentorship_id, kind, meeting_at, meeting_place, meeting_status) values
  (current_setting('test.ms')::uuid, 'meeting', now() + interval '2 days', 'Café Nube', 'proposed');
do $$ begin
  perform public.respond_meeting((select id from public.mentorship_messages where kind = 'meeting'), true);
  raise exception 'FAILED: mentor confirmed own proposal';
exception when insufficient_privilege then raise notice 'ok - the proposer cannot confirm their own meeting';
end $$;
do $$ begin
  update public.mentorship_messages set body = 'editado';
  raise exception 'FAILED: messages edited';
exception when insufficient_privilege then raise notice 'ok - messages are immutable (auditable)';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select public.respond_meeting((select id from public.mentorship_messages where kind = 'meeting'), true);
select pg_temp.ok((select meeting_status::text from public.mentorship_messages where kind = 'meeting') = 'confirmed',
  'the youth confirms the meeting');

-- Others cannot see the conversation, safeguarding leads can --------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d5');
select pg_temp.ok((select count(*) from public.mentorship_messages) = 0, 'another youth cannot read the conversation');
do $$ begin
  insert into public.mentorship_messages (mentorship_id, body) values (current_setting('test.ms')::uuid, 'intruso');
  raise exception 'FAILED: outsider messaged';
exception when insufficient_privilege then raise notice 'ok - only participants can write';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select pg_temp.ok((select count(*) from public.mentorship_messages) = 0, 'a LEADER does not read mentorship conversations');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d4');
select pg_temp.ok((select count(*) from public.mentorship_messages) = 3, 'the PASTOR can review conversations (safeguarding)');
select pg_temp.ok((select count(*) from public.check_ins) = 0 and (select count(*) from public.journal_entries) = 0,
  'the pastor still cannot read check-ins or the journal');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d7');
select pg_temp.ok((select count(*) from public.mentorship_messages) = 0, 'the platform admin cannot read conversations');

-- Report & block ---------------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
insert into public.safety_reports (church_id, mentorship_id, reason)
values ('a0000000-0000-0000-0000-000000000001', current_setting('test.ms')::uuid, 'Me hizo sentir incómoda');
select public.end_mentorship(current_setting('test.ms')::uuid, 'blocked');
do $$ begin
  insert into public.mentorship_messages (mentorship_id, body) values (current_setting('test.ms')::uuid, 'sigo aquí');
  raise exception 'FAILED: messaged after block';
exception when insufficient_privilege then raise notice 'ok - an ended mentorship accepts no messages';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select pg_temp.ok((select count(*) from public.safety_reports) = 0, 'the reported mentor cannot see the report');
select pg_temp.ok((select count(*) from public.prayers) = 0
  and (select count(*) from public.shared_checkins(current_setting('test.ms')::uuid)) = 0,
  'after the mentorship ends the mentor loses access');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d4');
select pg_temp.ok((select count(*) from public.safety_reports) = 1, 'the pastor receives the safety report');
reset role;
select pg_temp.ok((select count(*) from public.audit_log where action = 'mentorship.ended') = 1, 'ending a mentorship is audited');

-- Questions: anonymity holds even for leaders and admins -----------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
insert into public.questions (id, church_id, category, body, is_anonymous) values
  ('c2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'faith', '¿Cómo sé que Dios me escucha?', true);
insert into public.questions (id, church_id, category, body, is_anonymous) values
  ('c2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'bible', '¿Qué significa Juan 15:5?', false);
do $$ begin
  insert into public.questions (church_id, body) values ('a0000000-0000-0000-0000-000000000002', 'Iglesia ajena pregunta');
  raise exception 'FAILED: asked another church';
exception when insufficient_privilege then raise notice 'ok - questions go only to your church';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select pg_temp.ok((select count(*) from public.questions) = 0, 'leaders cannot select question rows (author_id is hidden)');
select pg_temp.ok((select count(*) from public.leader_questions('a0000000-0000-0000-0000-000000000001')) = 2, 'leader inbox lists questions');
select pg_temp.ok((select author_name from public.leader_questions('a0000000-0000-0000-0000-000000000001') where is_anonymous) is null,
  'anonymous questions show no author');
select pg_temp.ok((select author_name from public.leader_questions('a0000000-0000-0000-0000-000000000001') where not is_anonymous) = 'Sofía Ramírez',
  'named questions show the author');
select public.answer_question('c2000000-0000-0000-0000-000000000001', 'Dios escucha cada oración.', true);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d6');
do $$ begin
  perform public.leader_questions('a0000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: outsider read inbox';
exception when insufficient_privilege then raise notice 'ok - other churches cannot read the inbox';
end $$;
select pg_temp.ok((select count(*) from public.church_faq('a0000000-0000-0000-0000-000000000001')) = 0, 'outsiders do not see the FAQ');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d7');
select pg_temp.ok((select count(*) from public.questions) = 0, 'platform admin cannot see who asked');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select pg_temp.ok((select count(*) from public.question_answers) = 1, 'the author receives the answer');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d5');
select pg_temp.ok((select count(*) from public.question_answers) = 0, 'others do not read private answers');
select pg_temp.ok((select count(*) from public.church_faq('a0000000-0000-0000-0000-000000000001')) = 1, 'members see published FAQ');

-- Events ------------------------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
insert into public.events (id, church_id, title, starts_at, capacity) values
  ('c3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Campamento 2026', now() + interval '20 days', 1);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select pg_temp.ok(public.register_for_event('c3000000-0000-0000-0000-000000000001') = 'registered', 'a member registers');
select pg_temp.ok(public.register_for_event('c3000000-0000-0000-0000-000000000001') = 'registered', 're-registering is idempotent');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d5');
do $$ begin
  perform public.register_for_event('c3000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: over capacity';
exception when invalid_parameter_value then raise notice 'ok - capacity is enforced';
end $$;
select pg_temp.ok((select count(*) from public.event_registrations) = 0, 'members do not see who else registered');
select pg_temp.ok(public.event_attendance('c3000000-0000-0000-0000-000000000001') = 1, 'members see only the count');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d6');
select pg_temp.ok((select count(*) from public.events) = 0, 'other churches do not see the event');
do $$ begin
  perform public.register_for_event('c3000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: outsider registered';
exception when no_data_found then raise notice 'ok - outsiders cannot register';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select pg_temp.ok((select count(*) from public.event_registrations) = 1, 'leaders see registrations for their church');

-- Service -------------------------------------------------------------------------------------------------
insert into public.ministries (id, church_id, name, area) values
  ('c4000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alabanza', 'music');
insert into public.service_opportunities (id, church_id, ministry_id, title, area) values
  ('c4100000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000001', 'Equipo de alabanza', 'music');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
insert into public.service_requests (opportunity_id) values ('c4100000-0000-0000-0000-000000000001');
do $$ begin
  update public.service_requests set status = 'accepted';
  raise exception 'FAILED: self-accepted';
exception when insufficient_privilege then raise notice 'ok - youth cannot accept their own service request';
end $$;
insert into public.gift_assessments (answers, scores) values ('{"q1":3}', '{"music":80}');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select pg_temp.ok((select count(*) from public.gift_assessments) = 0, 'leaders do not read gift answers');
select public.decide_service_request((select id from public.leader_service_requests('a0000000-0000-0000-0000-000000000001') limit 1), true);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select pg_temp.ok((select count(*) from public.ministry_members) = 1, 'accepting adds the youth to the ministry');
select pg_temp.ok((select count(*) from public.moments where kind = 'first_service') = 1, 'first service becomes a moment');

-- Shared prayer & intercession -----------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d5');
select pg_temp.ok((select count(*) from public.shared_prayers('a0000000-0000-0000-0000-000000000001')) = 1, 'group sees the shared request');
select pg_temp.ok((select owner_name from public.shared_prayers('a0000000-0000-0000-0000-000000000001')) = 'Sofía', 'with first name only');
insert into public.prayer_intercessions (prayer_id) values ('c1000000-0000-0000-0000-000000000002');
do $$ begin
  insert into public.prayer_intercessions (prayer_id) values ('c1000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: interceded on hidden prayer';
exception when insufficient_privilege then raise notice 'ok - cannot pray on a request you cannot see';
end $$;
select pg_temp.ok((select prayed_today from public.shared_prayers('a0000000-0000-0000-0000-000000000001')), 'Orar is remembered for today');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d6');
select pg_temp.ok((select count(*) from public.shared_prayers('a0000000-0000-0000-0000-000000000001')) = 0, 'outsiders see no shared requests');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select pg_temp.ok(public.prayer_intercession_count('c1000000-0000-0000-0000-000000000002') = 1, 'the owner sees how many prayed');

-- Plan companions: only people from your group ------------------------------------------------------
reset role;
insert into public.plans (id, title, summary, category, is_published) values
  ('c5000000-0000-0000-0000-000000000001', 'Plan juntos', 'Para dos', 'foundations', true);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select set_config('test.up', public.start_plan('c5000000-0000-0000-0000-000000000001')::text, true);
do $$ begin
  perform public.invite_plan_companion(current_setting('test.up')::uuid, '00000000-0000-0000-0000-0000000000d2');
  raise exception 'FAILED: invited an adult outside the group';
exception when insufficient_privilege then raise notice 'ok - you can only invite people from your group';
end $$;
select public.invite_plan_companion(current_setting('test.up')::uuid, '00000000-0000-0000-0000-0000000000d5');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d5');
select pg_temp.ok((select from_name from public.my_plan_invites()) = 'Sofía', 'the friend receives the invite');
select pg_temp.ok(public.respond_plan_invite((select id from public.my_plan_invites()), true) is not null, 'accepting starts the plan');
select pg_temp.ok((select count(*) from public.user_plans where status = 'active') = 1, 'the friend now has the plan');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select pg_temp.ok((select status from public.plan_companions_of(current_setting('test.up')::uuid)) = 'accepted', 'the owner sees who joined');

-- Leader overview & roster ------------------------------------------------------------------------
select pg_temp.ok((select count(*) from public.group_roster('b0000000-0000-0000-0000-000000000001')) = 2, 'group members see the roster');
do $$ begin
  perform public.leader_overview('a0000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: youth read dashboard';
exception when insufficient_privilege then raise notice 'ok - youth cannot read the leader dashboard';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select pg_temp.ok((public.leader_overview('a0000000-0000-0000-0000-000000000001') ->> 'youth')::int = 5, 'leader overview counts members');
select pg_temp.ok((select count(*) from public.leader_youth('a0000000-0000-0000-0000-000000000001')) = 5, 'leader sees the youth list');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d5');
insert into public.conversation_requests (church_id, with_role) values ('a0000000-0000-0000-0000-000000000001', 'mentor');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select pg_temp.ok((select count(*) from public.conversation_requests) = 0, 'youth do not see others'' conversation requests');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select pg_temp.ok((select person from public.leader_conversation_requests('a0000000-0000-0000-0000-000000000001')) = 'Mateo Díaz',
  'leaders see who asks for a conversation');
update public.conversation_requests set status = 'closed';
select pg_temp.ok((select count(*) from public.leader_conversation_requests('a0000000-0000-0000-0000-000000000001')) = 0,
  'leaders can close requests');

select pg_temp.act_as(null);
do $$ begin
  perform count(*) from public.events;
  raise exception 'FAILED: anon read events';
exception when insufficient_privilege then raise notice 'ok - anon cannot read community data';
end $$;

reset role;
rollback;
