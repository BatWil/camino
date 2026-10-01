-- =============================================================================
-- CAMINO · M4 Comunidad
-- Series, groups (roster), mentorships with safeguarded messaging, questions
-- (anonymous or named), events & registrations, ministries & service, gifts,
-- conversation requests, prayer intercession and the leader overview.
--
-- Safeguarding for minors:
--  * Mentor ↔ youth conversations only exist inside a mentorship ASSIGNED by a
--    church leader. They are visible to both participants and to the church's
--    PASTOR/CHURCH_ADMIN (safeguarding oversight), which the UI discloses.
--  * Anyone can file a safety report; it reaches PASTOR/CHURCH_ADMIN.
--  * A mentor sees only: stage, current plan, approximate activity, check-ins
--    the youth chose to share and prayers marked MENTOR. Never the journal.
--  * Anonymous questions never expose their author through the API.
-- =============================================================================

create type public.gift_area as enum ('teaching', 'service', 'creativity', 'music', 'tech', 'care', 'evangelism', 'prayer');
create type public.question_category as enum ('faith', 'bible', 'relationships', 'doubts', 'other');
create type public.mentorship_status as enum ('active', 'ended');
create type public.message_kind as enum ('text', 'meeting', 'checkin');
create type public.meeting_status as enum ('proposed', 'confirmed', 'declined');
create type public.registration_status as enum ('registered', 'cancelled', 'attended');
create type public.service_request_status as enum ('pending', 'accepted', 'declined', 'withdrawn');
create type public.request_status as enum ('open', 'scheduled', 'closed');

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_church_leader(p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_church_role(p_church_id, array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[]);
$$;

create or replace function public.is_safeguarding_lead(p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_church_role(p_church_id, array['PASTOR','CHURCH_ADMIN']::public.app_role[]);
$$;

create or replace function public.first_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(split_part(btrim(display_name), ' ', 1), ''), 'Alguien') from public.profiles where id = p_user;
$$;

-- -----------------------------------------------------------------------------
-- Series ("SERIE · CONFORME A SU CORAZÓN · TEMA 3 DE 6")
-- -----------------------------------------------------------------------------
create table public.series (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  total_topics smallint not null default 1 check (total_topics between 1 and 52),
  current_topic smallint not null default 1,
  current_title text check (char_length(current_title) <= 120),
  plan_id uuid references public.plans (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series_topic check (current_topic between 1 and total_topics)
);
create index series_church_idx on public.series (church_id) where is_active;
create trigger series_set_updated_at before update on public.series for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Ministries & service
-- -----------------------------------------------------------------------------
create table public.ministries (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  area public.gift_area not null default 'service',
  description text check (char_length(description) <= 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index ministries_church_idx on public.ministries (church_id);

create table public.ministry_members (
  ministry_id uuid not null references public.ministries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (ministry_id, user_id)
);

create table public.service_opportunities (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  ministry_id uuid references public.ministries (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  schedule_text text check (char_length(schedule_text) <= 80),
  area public.gift_area not null default 'service',
  spots smallint check (spots between 1 and 500),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);
create index service_opportunities_church_idx on public.service_opportunities (church_id) where is_open;

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.service_opportunities (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status public.service_request_status not null default 'pending',
  message text check (char_length(message) <= 500),
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index service_requests_one_open on public.service_requests (opportunity_id, user_id) where status in ('pending', 'accepted');

-- "Descubre cómo puedes servir": interests, never a definitive diagnosis.
create table public.gift_assessments (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  scores jsonb not null check (jsonb_typeof(scores) = 'object'),
  completed_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Mentorships & safeguarded messaging
-- -----------------------------------------------------------------------------
create table public.mentorships (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  mentor_id uuid not null references auth.users (id) on delete cascade,
  mentee_id uuid not null references auth.users (id) on delete cascade,
  status public.mentorship_status not null default 'active',
  assigned_by uuid references auth.users (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (char_length(end_reason) <= 300),
  constraint mentorships_distinct check (mentor_id <> mentee_id)
);
create unique index mentorships_one_active on public.mentorships (mentee_id) where status = 'active';
create index mentorships_mentor_idx on public.mentorships (mentor_id) where status = 'active';

create table public.mentorship_messages (
  id uuid primary key default gen_random_uuid(),
  mentorship_id uuid not null references public.mentorships (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.message_kind not null default 'text',
  body text check (char_length(body) <= 2000),
  meeting_at timestamptz,
  meeting_place text check (char_length(meeting_place) <= 120),
  meeting_status public.meeting_status,
  check_in_id uuid references public.check_ins (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint messages_shape check (
    (kind = 'text' and body is not null and char_length(btrim(body)) > 0)
    or (kind = 'meeting' and meeting_at is not null and meeting_status is not null)
    or (kind = 'checkin' and check_in_id is not null)
  )
);
create index mentorship_messages_idx on public.mentorship_messages (mentorship_id, created_at);

create table public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mentorship_id uuid references public.mentorships (id) on delete set null,
  message_id uuid references public.mentorship_messages (id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

-- "Piden conversación": with a mentor, pastor or leader.
create table public.conversation_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  with_role text not null check (with_role in ('mentor', 'pastor', 'leader')),
  topic text check (char_length(topic) <= 300),
  status public.request_status not null default 'open',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Questions ("Ninguna pregunta es tonta")
-- -----------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category public.question_category not null default 'other',
  body text not null check (char_length(btrim(body)) between 5 and 2000),
  verse_ref text check (char_length(verse_ref) <= 80),
  is_anonymous boolean not null default true,
  status text not null default 'new' check (status in ('new', 'answered', 'archived')),
  created_at timestamptz not null default now()
);
create index questions_church_idx on public.questions (church_id, status);

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  answered_by uuid references auth.users (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 2 and 4000),
  publish_faq boolean not null default false,
  created_at timestamptz not null default now(),
  unique (question_id)
);

-- -----------------------------------------------------------------------------
-- Events
-- -----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  group_id uuid references public.groups (id) on delete set null,
  ministry_id uuid references public.ministries (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  description text check (char_length(description) <= 2000),
  cover_path text check (char_length(cover_path) <= 512),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_name text check (char_length(location_name) <= 120),
  cost_text text check (char_length(cost_text) <= 40),
  capacity integer check (capacity between 1 and 100000),
  registration_open boolean not null default true,
  is_published boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates check (ends_at is null or ends_at >= starts_at)
);
create index events_church_idx on public.events (church_id, starts_at);
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.registration_status not null default 'registered',
  -- Shown as a QR "ticket" for check-in at the door.
  ticket_code uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Praying for shared requests ("Orar" in Peticiones del grupo)
-- -----------------------------------------------------------------------------
create table public.prayer_intercessions (
  prayer_id uuid not null references public.prayers (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default current_date,
  primary key (prayer_id, user_id, day)
);

-- =============================================================================
-- Mentor visibility on existing private tables (only what the youth shares)
-- =============================================================================
create or replace function public.is_mentor_of(p_mentee uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mentorships m
    where m.mentee_id = p_mentee and m.mentor_id = auth.uid() and m.status = 'active'
  );
$$;

-- Check-ins are NOT exposed to mentors through the table (the note would leak):
-- shared_checkins() returns only week + mood of check-ins the youth shared.

drop policy prayers_select on public.prayers;
create policy prayers_select on public.prayers for select to authenticated
  using (
    user_id = (select auth.uid())
    or (privacy = 'GROUP' and status = 'PRAYING' and public.is_group_member(group_id))
    or (privacy = 'CHURCH' and status = 'PRAYING' and public.is_church_member(church_id))
    or (privacy = 'MENTOR' and status = 'PRAYING' and public.is_mentor_of(user_id))
  );

-- =============================================================================
-- RPCs · mentorship
-- =============================================================================
create or replace function public.assign_mentor(p_church_id uuid, p_mentor uuid, p_mentee uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_church_leader(p_church_id) then
    raise exception 'only church leaders assign mentors' using errcode = '42501';
  end if;
  if not exists (select 1 from public.user_roles where user_id = p_mentor and church_id = p_church_id and role = 'MENTOR') then
    raise exception 'that person is not a mentor in this church' using errcode = '22023';
  end if;
  if not exists (select 1 from public.church_members where church_id = p_church_id and user_id = p_mentee and status = 'active') then
    raise exception 'mentee is not an active member' using errcode = '22023';
  end if;
  update public.mentorships set status = 'ended', ended_at = now(), end_reason = 'reassigned'
  where mentee_id = p_mentee and status = 'active';
  insert into public.mentorships (church_id, mentor_id, mentee_id, assigned_by)
  values (p_church_id, p_mentor, p_mentee, auth.uid()) returning id into v_id;
  insert into public.audit_log (actor_id, church_id, action, target_table, target_id, metadata)
  values (auth.uid(), p_church_id, 'mentorship.assigned', 'mentorships', v_id, jsonb_build_object('mentor', p_mentor, 'mentee', p_mentee));
  return v_id;
end;
$$;

create or replace function public.end_mentorship(p_mentorship_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.mentorships%rowtype;
begin
  select * into v from public.mentorships where id = p_mentorship_id and status = 'active';
  if not found then raise exception 'mentorship not found' using errcode = 'P0002'; end if;
  if auth.uid() not in (v.mentee_id, v.mentor_id) and not public.is_church_leader(v.church_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.mentorships set status = 'ended', ended_at = now(), end_reason = left(p_reason, 300) where id = v.id;
  insert into public.audit_log (actor_id, church_id, action, target_table, target_id)
  values (auth.uid(), v.church_id, 'mentorship.ended', 'mentorships', v.id);
end;
$$;

-- My active mentor (for the mentee) — first name only.
create or replace function public.my_mentor()
returns table (mentorship_id uuid, mentor_id uuid, mentor_name text, church_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.mentor_id, (select display_name from public.profiles where id = m.mentor_id), m.church_id
  from public.mentorships m where m.mentee_id = auth.uid() and m.status = 'active';
$$;

-- What a mentor may see about each mentee (design 3a "PUEDES VER").
create or replace function public.my_mentees()
returns table (
  mentorship_id uuid, mentee_id uuid, first_name text, stage_key text, stage_name text,
  current_plan text, active_days_7 integer, last_active date, shared_checkins integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.mentee_id, public.first_name(m.mentee_id), s.key, s.name,
    (select pl.title from public.user_plans up join public.plans pl on pl.id = up.plan_id
       where up.user_id = m.mentee_id and up.status = 'active' order by up.started_at desc limit 1),
    (select count(*)::int from public.activity_days a where a.user_id = m.mentee_id and a.day > current_date - 7),
    (select max(day) from public.activity_days a where a.user_id = m.mentee_id),
    (select count(*)::int from public.check_ins c where c.user_id = m.mentee_id and c.shared_with_mentor)
  from public.mentorships m
  join public.profiles p on p.id = m.mentee_id
  left join public.journey_stages s on s.id = p.current_stage_id
  where m.mentor_id = auth.uid() and m.status = 'active';
$$;

create or replace function public.can_read_mentorship(p_mentorship_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mentorships m where m.id = p_mentorship_id
      and (auth.uid() in (m.mentor_id, m.mentee_id) or public.is_safeguarding_lead(m.church_id))
  );
$$;

create or replace function public.is_active_participant(p_mentorship_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mentorships m where m.id = p_mentorship_id and m.status = 'active'
      and auth.uid() in (m.mentor_id, m.mentee_id)
  );
$$;

create or replace function public.shared_checkins(p_mentorship_id uuid)
returns table (id uuid, week_start date, mood public.mood)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.week_start, c.mood
  from public.mentorships m
  join public.check_ins c on c.user_id = m.mentee_id and c.shared_with_mentor
  where m.id = p_mentorship_id
    and ((m.status = 'active' and auth.uid() = m.mentor_id) or auth.uid() = m.mentee_id)
  order by c.week_start desc;
$$;

create or replace function public.respond_meeting(p_message_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.mentorship_messages%rowtype;
begin
  select * into v from public.mentorship_messages where id = p_message_id and kind = 'meeting';
  if not found or not public.is_active_participant(v.mentorship_id) or v.sender_id = auth.uid() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.mentorship_messages
    set meeting_status = case when p_accept then 'confirmed'::public.meeting_status else 'declined'::public.meeting_status end
  where id = v.id;
end;
$$;

-- Shares one check-in with the mentor (explicit, never automatic).
create or replace function public.share_checkin_with_mentor(p_check_in_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mentorship uuid;
begin
  if not exists (select 1 from public.check_ins where id = p_check_in_id and user_id = auth.uid()) then
    raise exception 'check-in not found' using errcode = 'P0002';
  end if;
  select id into v_mentorship from public.mentorships where mentee_id = auth.uid() and status = 'active';
  if v_mentorship is null then raise exception 'no active mentor' using errcode = '22023'; end if;
  update public.check_ins set shared_with_mentor = true where id = p_check_in_id;
  insert into public.mentorship_messages (mentorship_id, sender_id, kind, check_in_id)
  values (v_mentorship, auth.uid(), 'checkin', p_check_in_id);
end;
$$;

-- =============================================================================
-- RPCs · questions
-- =============================================================================
-- Leaders see the question, never who asked when it is anonymous.
create or replace function public.leader_questions(p_church_id uuid)
returns table (id uuid, category public.question_category, body text, verse_ref text, is_anonymous boolean,
               author_name text, status text, created_at timestamptz, answer text, publish_faq boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_church_leader(p_church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select q.id, q.category, q.body, q.verse_ref, q.is_anonymous,
           case when q.is_anonymous then null else (select display_name from public.profiles where profiles.id = q.author_id) end,
           q.status, q.created_at, a.body, a.publish_faq
    from public.questions q left join public.question_answers a on a.question_id = q.id
    where q.church_id = p_church_id and q.status <> 'archived'
    order by (q.status = 'new') desc, q.created_at desc;
end;
$$;

create or replace function public.answer_question(p_question_id uuid, p_body text, p_publish_faq boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_church uuid;
begin
  select church_id into v_church from public.questions where id = p_question_id;
  if v_church is null or not public.is_church_leader(v_church) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into public.question_answers (question_id, answered_by, body, publish_faq)
  values (p_question_id, auth.uid(), btrim(p_body), p_publish_faq)
  on conflict (question_id) do update set body = excluded.body, publish_faq = excluded.publish_faq, answered_by = excluded.answered_by;
  update public.questions set status = 'answered' where id = p_question_id;
end;
$$;

-- Published Q&A for members (no author information at all).
create or replace function public.church_faq(p_church_id uuid)
returns table (id uuid, category public.question_category, question text, answer text, answered_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.category, q.body, a.body, a.created_at
  from public.questions q join public.question_answers a on a.question_id = q.id
  where q.church_id = p_church_id and a.publish_faq
    and (public.is_church_member(p_church_id) or public.is_church_leader(p_church_id))
  order by a.created_at desc;
$$;

-- =============================================================================
-- RPCs · events
-- =============================================================================
create or replace function public.register_for_event(p_event_id uuid, p_register boolean default true)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.events%rowtype;
  v_count integer;
begin
  select * into v from public.events where id = p_event_id and is_published;
  if not found or not (public.is_church_member(v.church_id) or public.is_church_leader(v.church_id)) then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  if not p_register then
    update public.event_registrations set status = 'cancelled', updated_at = now()
    where event_id = v.id and user_id = auth.uid();
    return 'cancelled';
  end if;
  if not v.registration_open or v.starts_at < now() then
    raise exception 'registration closed' using errcode = '22023';
  end if;
  perform 1 from public.events where id = v.id for update; -- serialize capacity checks
  select count(*) into v_count from public.event_registrations where event_id = v.id and status <> 'cancelled';
  if v.capacity is not null and v_count >= v.capacity
     and not exists (select 1 from public.event_registrations where event_id = v.id and user_id = auth.uid() and status <> 'cancelled') then
    raise exception 'event is full' using errcode = '22023', hint = 'full';
  end if;
  insert into public.event_registrations (event_id, user_id) values (v.id, auth.uid())
  on conflict (event_id, user_id) do update set status = 'registered', updated_at = now();
  return 'registered';
end;
$$;

-- Count only: attendees' names are not exposed to other youth.
create or replace function public.event_attendance(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.event_registrations r join public.events e on e.id = r.event_id
  where r.event_id = p_event_id and r.status <> 'cancelled'
    and (public.is_church_member(e.church_id) or public.is_church_leader(e.church_id));
$$;

-- =============================================================================
-- RPCs · service
-- =============================================================================
create or replace function public.decide_service_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.service_requests%rowtype;
  o public.service_opportunities%rowtype;
begin
  select * into r from public.service_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  select * into o from public.service_opportunities where id = r.opportunity_id;
  if not public.is_church_leader(o.church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.service_requests
    set status = case when p_accept then 'accepted'::public.service_request_status else 'declined'::public.service_request_status end,
        decided_by = auth.uid(), decided_at = now()
  where id = r.id;
  if p_accept then
    if o.ministry_id is not null then
      insert into public.ministry_members (ministry_id, user_id) values (o.ministry_id, r.user_id) on conflict do nothing;
    end if;
    if not exists (select 1 from public.moments where user_id = r.user_id and kind = 'first_service') then
      insert into public.moments (user_id, kind, title, happened_on, is_auto, ref_id)
      values (r.user_id, 'first_service', 'Comencé a servir · ' || o.title, public.user_today(r.user_id), true, r.id);
    end if;
  end if;
end;
$$;

create or replace function public.leader_service_requests(p_church_id uuid)
returns table (id uuid, opportunity text, person text, status public.service_request_status, message text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_church_leader(p_church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select r.id, o.title, (select display_name from public.profiles where profiles.id = r.user_id), r.status, r.message, r.created_at
    from public.service_requests r join public.service_opportunities o on o.id = r.opportunity_id
    where o.church_id = p_church_id and r.status <> 'withdrawn'
    order by (r.status = 'pending') desc, r.created_at desc;
end;
$$;

-- =============================================================================
-- RPCs · groups, intercession, leader overview
-- =============================================================================
-- Group roster with first names only (members of that group or leaders).
create or replace function public.group_roster(p_group_id uuid)
returns table (user_id uuid, first_name text, is_leader boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select gm.user_id, public.first_name(gm.user_id), gm.role = 'leader'
  from public.group_members gm
  where gm.group_id = p_group_id
    and (public.is_group_member(p_group_id) or public.is_church_leader(public.group_church_id(p_group_id)))
  order by gm.role desc, 2;
$$;

-- Shared requests readable by the caller, with first name and whether I prayed today.
create or replace function public.shared_prayers(p_church_id uuid)
returns table (id uuid, title text, owner_name text, group_name text, prayed_today boolean, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.title, public.first_name(p.user_id), g.name,
    exists (select 1 from public.prayer_intercessions i where i.prayer_id = p.id and i.user_id = auth.uid() and i.day = current_date),
    p.created_at
  from public.prayers p left join public.groups g on g.id = p.group_id
  where p.status = 'PRAYING' and p.user_id <> auth.uid()
    and ((p.privacy = 'GROUP' and g.church_id = p_church_id and public.is_group_member(p.group_id))
      or (p.privacy = 'CHURCH' and p.church_id = p_church_id and public.is_church_member(p_church_id)))
  order by p.created_at desc
  limit 20;
$$;

create or replace function public.prayer_intercession_count(p_prayer_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct user_id)::int from public.prayer_intercessions
  where prayer_id = p_prayer_id and exists (select 1 from public.prayers where id = p_prayer_id and user_id = auth.uid());
$$;

-- Dashboard of screen 3a: accompaniment data only ("PUEDES VER").
create or replace function public.leader_overview(p_church_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_members uuid[];
begin
  if not public.is_church_leader(p_church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  select array_agg(user_id) into v_members from public.church_members where church_id = p_church_id and status = 'active';
  v_members := coalesce(v_members, '{}');
  return jsonb_build_object(
    'youth', cardinality(v_members),
    'active_week', (select count(distinct user_id) from public.activity_days where user_id = any (v_members) and day > current_date - 7),
    'in_plans', (select count(distinct user_id) from public.user_plans where user_id = any (v_members) and status = 'active'),
    'want_serve', (select count(*) from public.service_requests r join public.service_opportunities o on o.id = r.opportunity_id
                   where o.church_id = p_church_id and r.status = 'pending'),
    'conversations', (select count(*) from public.conversation_requests where church_id = p_church_id and status = 'open'),
    'new_questions', (select count(*) from public.questions where church_id = p_church_id and status = 'new')
  );
end;
$$;

create or replace function public.leader_youth(p_church_id uuid)
returns table (user_id uuid, name text, stage_key text, stage_name text, current_plan text, last_active date,
               group_name text, mentor_name text, is_mentor boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_church_leader(p_church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select m.user_id, p.display_name, s.key, s.name,
      (select pl.title from public.user_plans up join public.plans pl on pl.id = up.plan_id
         where up.user_id = m.user_id and up.status = 'active' order by up.started_at desc limit 1),
      (select max(a.day) from public.activity_days a where a.user_id = m.user_id),
      (select g.name from public.group_members gm join public.groups g on g.id = gm.group_id
         where gm.user_id = m.user_id and g.church_id = p_church_id limit 1),
      (select public.first_name(ms.mentor_id) from public.mentorships ms where ms.mentee_id = m.user_id and ms.status = 'active' limit 1),
      exists (select 1 from public.user_roles r where r.user_id = m.user_id and r.church_id = p_church_id and r.role = 'MENTOR')
    from public.church_members m
    join public.profiles p on p.id = m.user_id
    left join public.journey_stages s on s.id = p.current_stage_id
    where m.church_id = p_church_id and m.status = 'active'
    order by p.display_name;
end;
$$;

create or replace function public.leader_conversation_requests(p_church_id uuid)
returns table (id uuid, user_id uuid, person text, with_role text, topic text, status public.request_status,
               created_at timestamptz, has_mentor boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_church_leader(p_church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select r.id, r.user_id, (select display_name from public.profiles where profiles.id = r.user_id), r.with_role, r.topic,
           r.status, r.created_at,
           exists (select 1 from public.mentorships m where m.mentee_id = r.user_id and m.status = 'active')
    from public.conversation_requests r
    where r.church_id = p_church_id and r.status <> 'closed'
    order by r.created_at desc;
end;
$$;

-- =============================================================================
-- RPCs · "Hacerlo con un amigo" (plan companions) — only people who share a group
-- =============================================================================
create or replace function public.shares_group_with(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members a join public.group_members b on b.group_id = a.group_id
    where a.user_id = auth.uid() and b.user_id = p_other and p_other <> auth.uid()
  );
$$;

create or replace function public.invite_plan_companion(p_user_plan_id uuid, p_companion uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.user_plans where id = p_user_plan_id and user_id = auth.uid() and status = 'active') then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;
  if not public.shares_group_with(p_companion) then
    raise exception 'you can only invite people from your group' using errcode = '42501';
  end if;
  insert into public.plan_companions (user_plan_id, companion_id) values (p_user_plan_id, p_companion)
  on conflict (user_plan_id, companion_id) do nothing;
end;
$$;

create or replace function public.respond_plan_invite(p_invite_id uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan uuid;
begin
  select up.plan_id into v_plan from public.plan_companions c join public.user_plans up on up.id = c.user_plan_id
  where c.id = p_invite_id and c.companion_id = auth.uid() and c.status = 'pending';
  if v_plan is null then raise exception 'invite not found' using errcode = 'P0002'; end if;
  update public.plan_companions set status = case when p_accept then 'accepted' else 'declined' end where id = p_invite_id;
  if p_accept then
    return public.start_plan(v_plan);
  end if;
  return null;
end;
$$;

create or replace function public.my_plan_invites()
returns table (id uuid, plan_id uuid, plan_title text, from_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, up.plan_id, p.title, public.first_name(up.user_id), c.created_at
  from public.plan_companions c
  join public.user_plans up on up.id = c.user_plan_id
  join public.plans p on p.id = up.plan_id
  where c.companion_id = auth.uid() and c.status = 'pending'
  order by c.created_at desc;
$$;

create or replace function public.plan_companions_of(p_user_plan_id uuid)
returns table (companion_id uuid, first_name text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.companion_id, public.first_name(c.companion_id), c.status
  from public.plan_companions c join public.user_plans up on up.id = c.user_plan_id
  where c.user_plan_id = p_user_plan_id and up.user_id = auth.uid() and c.status <> 'declined';
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.series                 enable row level security;
alter table public.ministries             enable row level security;
alter table public.ministry_members       enable row level security;
alter table public.service_opportunities  enable row level security;
alter table public.service_requests       enable row level security;
alter table public.gift_assessments       enable row level security;
alter table public.mentorships            enable row level security;
alter table public.mentorship_messages    enable row level security;
alter table public.safety_reports         enable row level security;
alter table public.conversation_requests  enable row level security;
alter table public.questions              enable row level security;
alter table public.question_answers       enable row level security;
alter table public.events                 enable row level security;
alter table public.event_registrations    enable row level security;
alter table public.prayer_intercessions   enable row level security;

revoke all on public.series, public.ministries, public.ministry_members, public.service_opportunities,
  public.service_requests, public.gift_assessments, public.mentorships, public.mentorship_messages,
  public.safety_reports, public.conversation_requests, public.questions, public.question_answers,
  public.events, public.event_registrations, public.prayer_intercessions from anon;

-- Writes that must go through RPCs.
revoke insert, update, delete on public.mentorships, public.question_answers, public.event_registrations from authenticated;
revoke update on public.mentorship_messages, public.questions, public.service_requests from authenticated;
revoke update, delete on public.safety_reports from authenticated;

-- Church-scoped content: members read, leaders write.
create policy series_read on public.series for select to authenticated
  using (public.is_church_member(church_id) or public.is_church_leader(church_id));
create policy series_write on public.series for all to authenticated
  using (public.is_church_leader(church_id)) with check (public.is_church_leader(church_id));

create policy ministries_read on public.ministries for select to authenticated
  using (public.is_church_member(church_id) or public.is_church_leader(church_id));
create policy ministries_write on public.ministries for all to authenticated
  using (public.is_church_leader(church_id)) with check (public.is_church_leader(church_id));

create policy ministry_members_read on public.ministry_members for select to authenticated
  using (user_id = (select auth.uid())
    or public.is_church_leader((select church_id from public.ministries where id = ministry_id)));
create policy ministry_members_leave on public.ministry_members for delete to authenticated
  using (user_id = (select auth.uid()));

create policy opportunities_read on public.service_opportunities for select to authenticated
  using (public.is_church_member(church_id) or public.is_church_leader(church_id));
create policy opportunities_write on public.service_opportunities for all to authenticated
  using (public.is_church_leader(church_id)) with check (public.is_church_leader(church_id));

create policy service_requests_own on public.service_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy service_requests_create on public.service_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and exists (
    select 1 from public.service_opportunities o where o.id = opportunity_id and o.is_open and public.is_church_member(o.church_id)));
create policy service_requests_withdraw on public.service_requests for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

create policy gift_assessments_own on public.gift_assessments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy mentorships_read on public.mentorships for select to authenticated
  using ((select auth.uid()) in (mentor_id, mentee_id) or public.is_church_leader(church_id));

create policy messages_read on public.mentorship_messages for select to authenticated
  using (public.can_read_mentorship(mentorship_id));
create policy messages_send on public.mentorship_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_active_participant(mentorship_id)
    and kind in ('text', 'meeting') and (kind <> 'meeting' or meeting_status = 'proposed'));

create policy safety_reports_create on public.safety_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and (public.is_church_member(church_id) or public.is_church_leader(church_id))
    and (mentorship_id is null or public.can_read_mentorship(mentorship_id)));
create policy safety_reports_read on public.safety_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_safeguarding_lead(church_id));

create policy conversation_requests_create on public.conversation_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_church_member(church_id));
create policy conversation_requests_read on public.conversation_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_church_leader(church_id)
    or (with_role = 'mentor' and public.is_mentor_of(user_id)));
create policy conversation_requests_update on public.conversation_requests for update to authenticated
  using (public.is_church_leader(church_id)) with check (public.is_church_leader(church_id));

-- Questions: only the author reads the row (leaders use leader_questions()).
create policy questions_own on public.questions for select to authenticated using (author_id = (select auth.uid()));
create policy questions_ask on public.questions for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'new' and public.is_church_member(church_id));
create policy answers_for_author on public.question_answers for select to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and q.author_id = (select auth.uid())));

create policy events_read on public.events for select to authenticated
  using ((is_published and public.is_church_member(church_id)) or public.is_church_leader(church_id));
create policy events_write on public.events for all to authenticated
  using (public.is_church_leader(church_id)) with check (public.is_church_leader(church_id));

create policy registrations_read on public.event_registrations for select to authenticated
  using (user_id = (select auth.uid())
    or public.is_church_leader((select church_id from public.events where id = event_id)));

create policy intercessions_own on public.prayer_intercessions for select to authenticated using (user_id = (select auth.uid()));
create policy intercessions_pray on public.prayer_intercessions for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.prayers p where p.id = prayer_id and p.user_id <> (select auth.uid())));

-- Function grants ------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.is_church_leader(uuid)', 'public.is_safeguarding_lead(uuid)', 'public.first_name(uuid)',
    'public.is_mentor_of(uuid)', 'public.assign_mentor(uuid, uuid, uuid)', 'public.end_mentorship(uuid, text)',
    'public.my_mentor()', 'public.my_mentees()', 'public.can_read_mentorship(uuid)', 'public.is_active_participant(uuid)',
    'public.respond_meeting(uuid, boolean)', 'public.share_checkin_with_mentor(uuid)', 'public.shared_checkins(uuid)', 'public.leader_questions(uuid)',
    'public.answer_question(uuid, text, boolean)', 'public.church_faq(uuid)', 'public.register_for_event(uuid, boolean)',
    'public.event_attendance(uuid)', 'public.decide_service_request(uuid, boolean)', 'public.leader_service_requests(uuid)',
    'public.group_roster(uuid)', 'public.shared_prayers(uuid)', 'public.prayer_intercession_count(uuid)',
    'public.leader_overview(uuid)', 'public.leader_youth(uuid)', 'public.shares_group_with(uuid)',
    'public.invite_plan_companion(uuid, uuid)', 'public.respond_plan_invite(uuid, boolean)', 'public.my_plan_invites()',
    'public.plan_companions_of(uuid)', 'public.leader_conversation_requests(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
-- Internal helper: names only through the RPCs above.
revoke execute on function public.first_name(uuid) from authenticated;
