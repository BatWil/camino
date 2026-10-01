-- M5 · Ministerios: conferences, Fine Arts, Bible Quiz, missions, Llamados, resources.
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

-- e1 youth · e2 friend (same church) · e3 leader · e4 pastor · e5 youth other church · e6 platform admin
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'joven@test.local'),
  ('00000000-0000-0000-0000-0000000000e2', 'amigo@test.local'),
  ('00000000-0000-0000-0000-0000000000e3', 'lider@test.local'),
  ('00000000-0000-0000-0000-0000000000e4', 'pastor@test.local'),
  ('00000000-0000-0000-0000-0000000000e5', 'otro@test.local'),
  ('00000000-0000-0000-0000-0000000000e6', 'plataforma@test.local');
update public.profiles set display_name = 'Valeria Gómez' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.churches (id, name, slug, join_code) values
  ('f0000000-0000-0000-0000-000000000001', 'Iglesia M5', 'iglesia-m5', 'MCINCO'),
  ('f0000000-0000-0000-0000-000000000002', 'Otra M5', 'otra-m5', 'OTRAMV');
insert into public.church_members (church_id, user_id) values
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e2'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e3'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e4'),
  ('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e5');
insert into public.user_roles (user_id, role, church_id) values
  ('00000000-0000-0000-0000-0000000000e3', 'LEADER', 'f0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000e4', 'PASTOR', 'f0000000-0000-0000-0000-000000000001');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000e6', 'PLATFORM_ADMIN');

-- Conferences ---------------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e3');
do $$ begin
  insert into public.conferences (title, starts_on, ends_on) values ('Intrusa', current_date + 30, current_date + 33);
  raise exception 'FAILED: leader wrote platform conference';
exception when insufficient_privilege then raise notice 'ok - leaders cannot create platform conferences';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e6');
insert into public.conferences (id, title, starts_on, ends_on, location, is_published, fine_arts_deadline) values
  ('f1000000-0000-0000-0000-000000000001', 'Conferencia Nacional', current_date + 30, current_date + 34, 'St. Louis, MO', true, current_date + 10),
  ('f1000000-0000-0000-0000-000000000002', 'Borrador', current_date + 60, current_date + 61, null, false, null);
insert into public.conference_sessions (id, conference_id, day, starts_at, kind, title, place) values
  ('f1100000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', current_date + 30, '19:00', 'night', 'Apertura', 'Dome');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
select pg_temp.ok((select count(*) from public.conferences where id::text like 'f1%') = 1, 'members see published conferences only');
select pg_temp.ok((select count(*) from public.conference_sessions where conference_id::text like 'f1%') = 1, 'sessions of visible conferences are readable');
select pg_temp.ok(public.register_for_conference('f1000000-0000-0000-0000-000000000001') is not null, 'registering returns a badge code');
select pg_temp.ok(public.register_for_conference('f1000000-0000-0000-0000-000000000001')
  = (select badge_code from public.conference_registrations), 'registering twice keeps the same badge');
insert into public.conference_agenda_items (session_id) values ('f1100000-0000-0000-0000-000000000001');
select pg_temp.ok((select count(*) from public.conference_agenda_items) = 1, 'sessions can be added to my agenda');
do $$ begin
  insert into public.conference_registrations (conference_id, user_id) values ('f1000000-0000-0000-0000-000000000002', auth.uid());
  raise exception 'FAILED: direct registration';
exception when insufficient_privilege then raise notice 'ok - registrations only through the RPC';
end $$;
do $$ begin
  perform public.register_for_conference('f1000000-0000-0000-0000-000000000002');
  raise exception 'FAILED: registered to a draft';
exception when no_data_found then raise notice 'ok - unpublished conferences cannot be joined';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e2');
select pg_temp.ok(public.conference_church_count('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001') = 1,
  'members see how many from their church go');
select pg_temp.ok((select count(*) from public.conference_registrations) = 0 and (select count(*) from public.conference_agenda_items) = 0,
  'nobody sees someone else''s registration or agenda');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e5');
select pg_temp.ok(public.conference_church_count('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001') = 0,
  'other churches cannot count our registrations');

-- Fine Arts -------------------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
insert into public.fine_arts_entries (id, church_id, category, title, status, leader_note)
values ('f2000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'solo_vocal', 'Mi canción', 'approved', 'yo mismo');
select pg_temp.ok((select status::text = 'draft' and leader_note is null from public.fine_arts_entries), 'new entries always start as draft');
do $$ begin
  update public.fine_arts_entries set status = 'submitted';
  raise exception 'FAILED: submitted without file';
exception when invalid_parameter_value then raise notice 'ok - an upload is required to submit';
end $$;
insert into storage.objects (bucket_id, name) values ('fine-arts', '00000000-0000-0000-0000-0000000000e1/mi-cancion.mp4');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('fine-arts', '00000000-0000-0000-0000-0000000000e2/x.mp4');
  raise exception 'FAILED: uploaded into another folder';
exception when insufficient_privilege then raise notice 'ok - uploads only into your own folder';
end $$;
update public.fine_arts_entries set file_path = '00000000-0000-0000-0000-0000000000e1/mi-cancion.mp4', file_mime = 'video/mp4', status = 'submitted';
do $$ begin
  update public.fine_arts_entries set status = 'approved';
  raise exception 'FAILED: self-approved';
exception when insufficient_privilege then raise notice 'ok - entries are locked while in review';
end $$;
do $$ begin
  insert into public.fine_arts_entries (church_id, category) values ('f0000000-0000-0000-0000-000000000002', 'band');
  raise exception 'FAILED: entry for another church';
exception when insufficient_privilege then raise notice 'ok - entries only for your church';
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e2');
select pg_temp.ok((select count(*) from public.fine_arts_entries) = 0, 'friends cannot see entries');
select pg_temp.ok((select count(*) from storage.objects where bucket_id = 'fine-arts') = 0, 'friends cannot see the file');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e3');
select pg_temp.ok((select person from public.leader_fine_arts('f0000000-0000-0000-0000-000000000001')) = 'Valeria Gómez',
  'leaders see submitted entries');
select pg_temp.ok((select count(*) from storage.objects where bucket_id = 'fine-arts') = 1, 'leaders can open the submitted file');
select public.review_fine_arts_entry('f2000000-0000-0000-0000-000000000001', true, '¡Excelente!');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
select pg_temp.ok((select status::text = 'approved' and leader_note = '¡Excelente!' from public.fine_arts_entries), 'the youth sees the approval');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e5');
do $$ begin
  perform public.leader_fine_arts('f0000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: outsider listed entries';
exception when insufficient_privilege then raise notice 'ok - other churches cannot list entries';
end $$;
reset role;
select pg_temp.ok((select count(*) from public.audit_log where action = 'fine_arts.approved') = 1, 'reviews are audited');

-- Bible Quiz -----------------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
select pg_temp.ok((select count(*) from public.quiz_questions where book = 'ROM') >= 20, 'starter quiz questions are readable');
insert into public.quiz_attempts (book, correct, total, seconds) values ('ROM', 6, 7, 140);
do $$ begin
  insert into public.quiz_attempts (book, correct, total) values ('ROM', 9, 7);
  raise exception 'FAILED: impossible score';
exception when check_violation then raise notice 'ok - scores are validated';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e3');
select pg_temp.ok((select count(*) from public.quiz_attempts) = 0, 'quiz scores are private (no rankings)');

-- Missions -----------------------------------------------------------------------------------------
insert into public.mission_campaigns (id, church_id, title, goal_amount, currency) values
  ('f3000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Camioneta en Guatemala', 60000, 'MXN');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
insert into public.mission_offerings (campaign_id, amount) values ('f3000000-0000-0000-0000-000000000001', 100);
do $$ begin
  insert into public.mission_offerings (campaign_id, amount, status) values ('f3000000-0000-0000-0000-000000000001', 5000, 'confirmed');
  raise exception 'FAILED: self-confirmed offering';
exception when insufficient_privilege then raise notice 'ok - offerings cannot be self-confirmed';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e2');
select pg_temp.ok((select count(*) from public.mission_offerings) = 0, 'peers never see individual amounts');
select pg_temp.ok((select recorded from public.campaign_totals('f3000000-0000-0000-0000-000000000001')) = 100, 'peers see only the total');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e3');
select pg_temp.ok((select count(*) from public.mission_offerings) = 0, 'a LEADER does not see individual amounts');
do $$ begin
  perform public.treasury_offerings('f0000000-0000-0000-0000-000000000001');
  raise exception 'FAILED: leader read treasury';
exception when insufficient_privilege then raise notice 'ok - only pastor/admin handle the treasury';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e4');
select public.confirm_offering((select id from public.treasury_offerings('f0000000-0000-0000-0000-000000000001') limit 1), true);
select pg_temp.ok((select confirmed from public.campaign_totals('f3000000-0000-0000-0000-000000000001')) = 100, 'confirmed offerings count toward the goal');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e5');
select pg_temp.ok((select count(*) from public.mission_campaigns) = 0, 'other churches do not see the campaign');
select pg_temp.ok((select confirmed from public.campaign_totals('f3000000-0000-0000-0000-000000000001')) is null, 'nor its totals');

-- Llamados -------------------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
do $$ begin
  insert into public.calling_journeys (user_id) values (auth.uid());
  raise exception 'FAILED: direct insert';
exception when insufficient_privilege then raise notice 'ok - the journey starts only through the RPC';
end $$;
select public.start_calling_journey();
select public.start_calling_journey();
select pg_temp.ok((select count(*) from public.moments where kind = 'calling') = 1, '"Siento el llamado" creates one private moment');
select pg_temp.ok((public.my_calling_progress() ->> 'started')::boolean, 'progress reflects the journey');
select pg_temp.ok((public.my_calling_progress() ->> 'plan_id') is not null, 'the calling plan ships with the content');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e4');
select pg_temp.ok((select count(*) from public.calling_journeys) = 0, 'not even the pastor sees someone''s calling journey');

-- Resources & preferences -------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
do $$ begin
  insert into public.resources (title) values ('Libro falso');
  raise exception 'FAILED: member wrote a resource';
exception when insufficient_privilege then raise notice 'ok - members cannot publish resources';
end $$;
update public.profiles set ministry_news = true where id = auth.uid();
select pg_temp.ok((select ministry_news from public.profiles where id = auth.uid()), 'ministry news preference is saved');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e3');
insert into public.resources (scope, church_id, kind, title) values ('CHURCH', 'f0000000-0000-0000-0000-000000000001', 'book', 'Libro de la iglesia');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e5');
select pg_temp.ok((select count(*) from public.resources where title = 'Libro de la iglesia') = 0, 'church resources stay in that church');

select pg_temp.act_as(null);
do $$ begin
  perform count(*) from public.conferences;
  raise exception 'FAILED: anon read conferences';
exception when insufficient_privilege then raise notice 'ok - anon cannot read ministries';
end $$;

reset role;
rollback;
