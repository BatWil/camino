-- M3 · Bible, journal, prayers, check-ins, moments — privacy first.
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

-- Fixtures: a youth (c1), a member of the same group (c2), the church admin (c3), a platform admin (c4)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'joven@test.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'amiga@test.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000c4', 'plataforma@test.local');
insert into public.churches (id, name, slug, join_code) values
  ('70000000-0000-0000-0000-000000000001', 'Iglesia M3', 'iglesia-m3', 'MTRES1');
insert into public.church_members (church_id, user_id) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1'),
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c2'),
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c3');
insert into public.user_roles (user_id, role, church_id) values
  ('00000000-0000-0000-0000-0000000000c3', 'CHURCH_ADMIN', '70000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000c3', 'MENTOR', '70000000-0000-0000-0000-000000000001');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000c4', 'PLATFORM_ADMIN');
insert into public.groups (id, church_id, name) values
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Grupo M3'),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Otro grupo');
insert into public.group_members (group_id, user_id) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1'),
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c2');

-- The youth writes private things -------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
insert into public.journal_entries (id, kind, body) values
  ('90000000-0000-0000-0000-000000000001', 'struggle', 'Algo muy personal');
insert into public.bible_notes (book, chapter, verse, body) values ('JHN', 15, 5, 'Nota privada');
insert into public.bible_highlights (book, chapter, verse, color) values ('JHN', 15, 5, 'yellow');
insert into public.bible_bookmarks (book, chapter, verse) values ('JHN', 15, 5);
insert into public.check_ins (week_start, mood, note) values (date_trunc('week', current_date)::date, 'anxious', 'Semana difícil');
insert into public.prayers (id, title, category) values ('91000000-0000-0000-0000-000000000001', 'Petición privada', 'studies');
insert into public.prayers (id, title, category, privacy, group_id) values
  ('91000000-0000-0000-0000-000000000002', 'Exámenes finales', 'studies', 'GROUP', '80000000-0000-0000-0000-000000000001');
insert into public.prayers (id, title, privacy) values ('91000000-0000-0000-0000-000000000003', 'Para mi mentor', 'MENTOR');

select pg_temp.ok((select count(*) from public.journal_entries) = 1, 'owner reads own journal');
select pg_temp.ok((select count(*) from public.activity_days) = 1, 'writing in the journal counts for Tu ritmo');

do $$ begin
  insert into public.journal_entries (user_id, body) values ('00000000-0000-0000-0000-0000000000c2', 'suplantación');
  raise exception 'FAILED: wrote a journal entry as someone else';
exception when insufficient_privilege then raise notice 'ok - cannot write a journal entry for someone else';
end $$;

do $$ begin
  update public.journal_entries set user_id = '00000000-0000-0000-0000-0000000000c2';
  raise exception 'FAILED: journal owner changed';
exception when insufficient_privilege then raise notice 'ok - journal entries cannot change owner';
end $$;

do $$ begin
  insert into public.prayers (title, privacy, group_id) values ('Infiltrada', 'GROUP', '80000000-0000-0000-0000-000000000002');
  raise exception 'FAILED: shared prayer into a group I am not in';
exception when insufficient_privilege then raise notice 'ok - cannot share a prayer with a group you are not in';
end $$;

-- Group member: only the GROUP prayer ---------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c2');
select pg_temp.ok((select count(*) from public.prayers) = 1, 'a group member sees only the prayer shared with the group');
select pg_temp.ok((select title from public.prayers) = 'Exámenes finales', 'and it is the shared one');
select pg_temp.ok((select count(*) from public.journal_entries) = 0, 'a friend never sees the journal');
update public.prayers set title = 'cambiada' where id = '91000000-0000-0000-0000-000000000002';
select pg_temp.ok((select title from public.prayers) = 'Exámenes finales', 'a group member cannot edit someone else''s prayer');

-- Church admin who is also a mentor: nothing private ---------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c3');
select pg_temp.ok((select count(*) from public.journal_entries) = 0, 'church admin cannot read the journal');
select pg_temp.ok((select count(*) from public.bible_notes) = 0, 'church admin cannot read Bible notes');
select pg_temp.ok((select count(*) from public.bible_highlights) = 0, 'church admin cannot read highlights');
select pg_temp.ok((select count(*) from public.check_ins) = 0, 'church admin cannot read check-ins');
select pg_temp.ok((select count(*) from public.prayers) = 0, 'church admin/mentor cannot read private, MENTOR (until M4) or other groups'' prayers');
select pg_temp.ok((select count(*) from public.moments) = 0, 'church admin cannot read moments');

-- Platform admin: still nothing private through the API ---------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c4');
select pg_temp.ok((select count(*) from public.journal_entries) = 0, 'platform admin cannot read the journal');
select pg_temp.ok((select count(*) from public.check_ins) = 0, 'platform admin cannot read check-ins');
select pg_temp.ok((select count(*) from public.prayers) = 0, 'platform admin cannot read private prayers');
delete from public.journal_entries;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select pg_temp.ok((select count(*) from public.journal_entries) = 1, 'platform admin cannot delete someone''s journal');

-- Answered prayer → automatic moment, undo removes it -----------------------------------------
update public.prayers set status = 'ANSWERED' where id = '91000000-0000-0000-0000-000000000001';
select pg_temp.ok((select answered_at is not null from public.prayers where id = '91000000-0000-0000-0000-000000000001'),
  'answered_at is set automatically');
select pg_temp.ok((select count(*) from public.moments where kind = 'prayer_answered') = 1, 'answering a prayer creates a moment');
update public.prayers set status = 'PRAYING' where id = '91000000-0000-0000-0000-000000000001';
select pg_temp.ok((select count(*) from public.moments where kind = 'prayer_answered') = 0, 'undo removes the automatic moment');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c2');
update public.prayers set status = 'ANSWERED' where id = '91000000-0000-0000-0000-000000000002';
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select pg_temp.ok((select status from public.prayers where id = '91000000-0000-0000-0000-000000000002') = 'PRAYING',
  'only the owner can mark a prayer as answered');

-- Prayer mode sessions & check-in rules ------------------------------------------------------------
insert into public.prayer_sessions (seconds) values (600);
do $$ begin
  update public.prayer_sessions set seconds = 99999;
  raise exception 'FAILED: session edited';
exception when insufficient_privilege then raise notice 'ok - prayer sessions are append-only';
end $$;
do $$ begin
  insert into public.check_ins (week_start, mood) values (date_trunc('week', current_date)::date + 2, 'joy');
  raise exception 'FAILED: non-Monday week accepted';
exception when check_violation then raise notice 'ok - check-ins are keyed by week (Monday)';
end $$;
select pg_temp.ok((select shared_with_mentor from public.check_ins limit 1) = false, 'check-ins are never shared by default');

-- Moments & story ----------------------------------------------------------------------------------
insert into public.moments (kind, title, happened_on) values ('baptism', 'Me bauticé', date '2026-08-15');
select pg_temp.ok((select count(*) from public.moments) = 1, 'manual moments are saved');
select pg_temp.ok((public.my_story_stats() ->> 'journal_entries')::int = 1 and (public.my_story_stats() ->> 'prayer_minutes')::int = 10,
  'Mi historia aggregates only the caller''s data');

-- Automatic moments from onboarding and stage changes -------------------------------------------
reset role;
update public.profiles set onboarding_completed_at = now(), current_stage_id = (select id from public.journey_stages where key = 'encuentra')
  where id = '00000000-0000-0000-0000-0000000000c2';
update public.profiles set current_stage_id = (select id from public.journey_stages where key = 'crece')
  where id = '00000000-0000-0000-0000-0000000000c2';
select pg_temp.ok((select count(*) from public.moments where user_id = '00000000-0000-0000-0000-0000000000c2'
  and kind in ('journey_started', 'stage_reached')) = 2, 'starting Camino and reaching a stage create moments');

select pg_temp.act_as(null);
do $$ begin
  perform count(*) from public.journal_entries;
  raise exception 'FAILED: anon read journal';
exception when insufficient_privilege then raise notice 'ok - anon cannot touch the journal';
end $$;

reset role;
rollback;
