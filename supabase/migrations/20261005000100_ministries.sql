-- =============================================================================
-- CAMINO · M5 Ministerios
-- Conferences (detail, sessions, my agenda, badge), Fine Arts entries with a
-- private bucket (MIME/size validated) and leader approval, Bible Quiz practice,
-- mission campaigns (Speed the Light / Embajadores) with private individual
-- amounts, Llamados (calling journey), resources and calling stories.
--
-- Principles kept from earlier milestones:
--  * deny by default, owner-only for anything personal;
--  * no rankings: quiz attempts are private, only the person sees their score;
--  * money: no payments in the app. A youth records an offering they gave at
--    church; the amount is visible to them and to PASTOR/CHURCH_ADMIN (who
--    confirm it). Everyone else sees only the campaign total.
-- =============================================================================

create type public.content_scope as enum ('PLATFORM', 'CHURCH');
create type public.session_kind as enum ('workshop', 'masterclass', 'sports', 'fine_arts', 'exhibit', 'night', 'closing', 'other');
create type public.fine_arts_category as enum ('solo_vocal', 'band', 'drama', 'dance', 'visual_art', 'writing');
create type public.fine_arts_status as enum ('draft', 'submitted', 'approved', 'returned');
create type public.mission_program as enum ('speed_the_light', 'ambassadors');
create type public.offering_status as enum ('recorded', 'confirmed', 'rejected');
create type public.resource_kind as enum ('guided_journal', 'book', 'link');

-- Shared: platform content is written by PLATFORM_ADMIN, church content by its leaders.
create or replace function public.can_write_scoped(p_scope public.content_scope, p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_scope = 'PLATFORM' then p_church_id is null and public.is_platform_admin()
    else p_church_id is not null and public.is_church_leader(p_church_id)
  end;
$$;

create or replace function public.can_read_scoped(p_scope public.content_scope, p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_scope = 'PLATFORM' then auth.uid() is not null
    else public.is_church_member(p_church_id) or public.is_church_leader(p_church_id)
  end;
$$;

-- -----------------------------------------------------------------------------
-- Conferences
-- -----------------------------------------------------------------------------
create table public.conferences (
  id uuid primary key default gen_random_uuid(),
  scope public.content_scope not null default 'PLATFORM',
  church_id uuid references public.churches (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  tagline text check (char_length(tagline) <= 200),
  hub_title text check (char_length(hub_title) <= 60),       -- "¿QUIÉN IRÁ? ST. LOUIS 2026"
  badge text check (char_length(badge) <= 12),                -- "NYC·26"
  starts_on date not null,
  ends_on date not null,
  location text check (char_length(location) <= 120),
  highlights text[] not null default '{}' check (cardinality(highlights) <= 12),
  registration_url text check (registration_url is null or registration_url ~ '^https://'),
  fine_arts_deadline date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conferences_dates check (ends_on >= starts_on and ends_on - starts_on <= 14),
  constraint conferences_scope check ((scope = 'PLATFORM') = (church_id is null))
);
create trigger conferences_set_updated_at before update on public.conferences for each row execute function public.set_updated_at();

create table public.conference_sessions (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences (id) on delete cascade,
  day date not null,
  starts_at time not null,
  kind public.session_kind not null default 'other',
  title text not null check (char_length(btrim(title)) between 2 and 120),
  place text check (char_length(place) <= 80),
  created_at timestamptz not null default now()
);
create index conference_sessions_idx on public.conference_sessions (conference_id, day, starts_at);

create table public.conference_registrations (
  conference_id uuid not null references public.conferences (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  church_id uuid references public.churches (id) on delete set null,
  badge_code uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  primary key (conference_id, user_id)
);

create table public.conference_agenda_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.conference_sessions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

-- -----------------------------------------------------------------------------
-- Fine Arts (Bellas Artes)
-- -----------------------------------------------------------------------------
create table public.fine_arts_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  church_id uuid not null references public.churches (id) on delete cascade,
  conference_id uuid references public.conferences (id) on delete set null,
  category public.fine_arts_category not null,
  title text check (char_length(title) <= 120),
  file_path text check (char_length(file_path) <= 512),
  file_mime text check (char_length(file_mime) <= 80),
  status public.fine_arts_status not null default 'draft',
  leader_note text check (char_length(leader_note) <= 1000),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fine_arts_church_idx on public.fine_arts_entries (church_id, status);
create trigger fine_arts_set_updated_at before update on public.fine_arts_entries for each row execute function public.set_updated_at();

-- The owner may edit only drafts/returned entries, never the review fields.
create or replace function public.fine_arts_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_church_member(new.church_id) then
      raise exception 'not a member of that church' using errcode = '42501';
    end if;
    new.status := 'draft'; new.leader_note := null; new.reviewed_by := null; new.reviewed_at := null;
    return new;
  end if;
  if current_setting('camino.reviewing', true) = 'on' and public.is_church_leader(old.church_id) then
    return new;
  end if;
  if old.status not in ('draft', 'returned') then
    raise exception 'entry is locked while in review' using errcode = '42501';
  end if;
  if new.user_id <> old.user_id or new.church_id <> old.church_id then
    raise exception 'owner and church cannot change' using errcode = '42501';
  end if;
  if new.status not in ('draft', 'submitted') then
    raise exception 'only leaders review entries' using errcode = '42501';
  end if;
  if new.status = 'submitted' and new.file_path is null then
    raise exception 'upload your presentation first' using errcode = '22023';
  end if;
  new.leader_note := old.leader_note; new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
  return new;
end;
$$;
create trigger fine_arts_guard before insert or update on public.fine_arts_entries
  for each row execute function public.fine_arts_guard();

create or replace function public.review_fine_arts_entry(p_entry_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.fine_arts_entries%rowtype;
begin
  select * into v from public.fine_arts_entries where id = p_entry_id and status = 'submitted';
  if not found or not public.is_church_leader(v.church_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform set_config('camino.reviewing', 'on', true);
  update public.fine_arts_entries
    set status = case when p_approve then 'approved'::public.fine_arts_status else 'returned'::public.fine_arts_status end,
        leader_note = left(p_note, 1000), reviewed_by = auth.uid(), reviewed_at = now()
  where id = v.id;
  perform set_config('camino.reviewing', 'off', true);
  insert into public.audit_log (actor_id, church_id, action, target_table, target_id)
  values (auth.uid(), v.church_id, case when p_approve then 'fine_arts.approved' else 'fine_arts.returned' end, 'fine_arts_entries', v.id);
end;
$$;

create or replace function public.leader_fine_arts(p_church_id uuid)
returns table (id uuid, person text, category public.fine_arts_category, title text, file_path text, file_mime text,
               status public.fine_arts_status, leader_note text, updated_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_church_leader(p_church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select e.id, (select display_name from public.profiles where profiles.id = e.user_id), e.category, e.title,
           e.file_path, e.file_mime, e.status, e.leader_note, e.updated_at
    from public.fine_arts_entries e
    where e.church_id = p_church_id and e.status <> 'draft'
    order by (e.status = 'submitted') desc, e.updated_at desc;
end;
$$;

-- Private bucket: video/audio/image/pdf, 50 MB. Owner folder = auth.uid();
-- leaders of the entry's church may read submitted files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fine-arts', 'fine-arts', false, 52428800,
  array['video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy fine_arts_files_own on storage.objects for all to authenticated
  using (bucket_id = 'fine-arts' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'fine-arts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create or replace function public.can_review_fine_arts_file(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.fine_arts_entries e
    where e.file_path = p_name and e.status <> 'draft' and public.is_church_leader(e.church_id));
$$;
revoke all on function public.can_review_fine_arts_file(text) from public, anon;
grant execute on function public.can_review_fine_arts_file(text) to authenticated;

create policy fine_arts_files_leaders on storage.objects for select to authenticated
  using (bucket_id = 'fine-arts' and public.can_review_fine_arts_file(name));

-- -----------------------------------------------------------------------------
-- Bible Quiz (practice only — no rankings)
-- -----------------------------------------------------------------------------
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  scope public.content_scope not null default 'PLATFORM',
  church_id uuid references public.churches (id) on delete cascade,
  book public.usfm_book not null,
  chapter smallint not null check (chapter between 1 and 150),
  verse_ref text check (char_length(verse_ref) <= 40),
  question text not null check (char_length(btrim(question)) between 5 and 300),
  options text[] not null check (cardinality(options) = 4),
  answer_index smallint not null check (answer_index between 0 and 3),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint quiz_scope check ((scope = 'PLATFORM') = (church_id is null))
);
create index quiz_questions_book_idx on public.quiz_questions (book, chapter) where is_published;

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book public.usfm_book not null,
  correct smallint not null check (correct >= 0),
  total smallint not null check (total between 1 and 100),
  seconds integer check (seconds between 0 and 36000),
  created_at timestamptz not null default now(),
  constraint quiz_attempts_score check (correct <= total)
);

-- -----------------------------------------------------------------------------
-- Missions (Speed the Light / Embajadores en Misión)
-- -----------------------------------------------------------------------------
create table public.mission_campaigns (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  program public.mission_program not null default 'speed_the_light',
  title text not null check (char_length(btrim(title)) between 2 and 120),      -- "para una camioneta en Guatemala"
  goal_amount numeric(12, 2) not null check (goal_amount > 0),
  currency text not null default 'MXN' check (currency ~ '^[A-Z]{3}$'),
  year smallint not null default extract(year from now())::smallint,
  story_title text check (char_length(story_title) <= 80),
  story_quote text check (char_length(story_quote) <= 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index mission_campaigns_church_idx on public.mission_campaigns (church_id, program) where is_active;

create table public.mission_offerings (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.mission_campaigns (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0 and amount <= 1000000),
  status public.offering_status not null default 'recorded',
  confirmed_by uuid references auth.users (id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index mission_offerings_campaign_idx on public.mission_offerings (campaign_id, status);

-- Totals only (never who gave what).
create or replace function public.campaign_totals(p_campaign_id uuid)
returns table (confirmed numeric, recorded numeric, givers integer)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(o.amount) filter (where o.status = 'confirmed'), 0),
         coalesce(sum(o.amount) filter (where o.status = 'recorded'), 0),
         count(distinct o.user_id) filter (where o.status <> 'rejected')::int
  from public.mission_campaigns c
  left join public.mission_offerings o on o.campaign_id = c.id
  where c.id = p_campaign_id and (public.is_church_member(c.church_id) or public.is_church_leader(c.church_id))
  group by c.id;
$$;

-- Treasury: PASTOR/CHURCH_ADMIN confirm what was actually received.
create or replace function public.confirm_offering(p_offering_id uuid, p_confirm boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_church uuid;
begin
  select c.church_id into v_church from public.mission_offerings o join public.mission_campaigns c on c.id = o.campaign_id
  where o.id = p_offering_id and o.status = 'recorded';
  if v_church is null or not public.is_safeguarding_lead(v_church) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.mission_offerings
    set status = case when p_confirm then 'confirmed'::public.offering_status else 'rejected'::public.offering_status end,
        confirmed_by = auth.uid(), confirmed_at = now()
  where id = p_offering_id;
  insert into public.audit_log (actor_id, church_id, action, target_table, target_id)
  values (auth.uid(), v_church, case when p_confirm then 'offering.confirmed' else 'offering.rejected' end, 'mission_offerings', p_offering_id);
end;
$$;

create or replace function public.treasury_offerings(p_church_id uuid)
returns table (id uuid, campaign text, person text, amount numeric, currency text, status public.offering_status, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_safeguarding_lead(p_church_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select o.id, c.title, (select display_name from public.profiles where profiles.id = o.user_id), o.amount, c.currency, o.status, o.created_at
    from public.mission_offerings o join public.mission_campaigns c on c.id = o.campaign_id
    where c.church_id = p_church_id
    order by (o.status = 'recorded') desc, o.created_at desc
    limit 200;
end;
$$;

-- -----------------------------------------------------------------------------
-- Llamados
-- -----------------------------------------------------------------------------
create table public.calling_journeys (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  studies_explored_at timestamptz
);

create table public.calling_stories (
  id uuid primary key default gen_random_uuid(),
  scope public.content_scope not null default 'PLATFORM',
  church_id uuid references public.churches (id) on delete cascade,
  quote text not null check (char_length(btrim(quote)) between 5 and 280),
  author text not null check (char_length(btrim(author)) between 2 and 80),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint calling_stories_scope check ((scope = 'PLATFORM') = (church_id is null))
);

-- "Siento el llamado": starts the journey and records a private moment once.
create or replace function public.start_calling_journey()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  insert into public.calling_journeys (user_id) values (v_uid) on conflict (user_id) do nothing;
  if found then
    insert into public.moments (user_id, kind, title, happened_on, is_auto, ref_id)
    values (v_uid, 'calling', 'Sentí el llamado', public.user_today(v_uid), true, v_uid)
    on conflict do nothing;
  end if;
end;
$$;

-- Progress of the 4 steps, computed only for the caller. The "Escuchar el llamado"
-- plan ships in supabase/content/002_ministries_content.sql with a fixed id.
create or replace function public.my_calling_progress()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'started', exists (select 1 from public.calling_journeys where user_id = auth.uid()),
    'plan_completed', exists (
      select 1 from public.user_plans up join public.plans p on p.id = up.plan_id
      where up.user_id = auth.uid() and up.status = 'completed' and p.id = '12098413-6463-5c8c-9302-b710413e4aab'),
    'plan_id', (select id from public.plans where id = '12098413-6463-5c8c-9302-b710413e4aab' and is_published),
    'pastor_requested', exists (
      select 1 from public.conversation_requests where user_id = auth.uid() and with_role = 'pastor' and topic = 'llamado'),
    'serving_since', (select min(joined_at) from public.ministry_members where user_id = auth.uid()),
    'studies_explored', exists (
      select 1 from public.calling_journeys where user_id = auth.uid() and studies_explored_at is not null)
  );
$$;

-- -----------------------------------------------------------------------------
-- Resources
-- -----------------------------------------------------------------------------
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  scope public.content_scope not null default 'PLATFORM',
  church_id uuid references public.churches (id) on delete cascade,
  kind public.resource_kind not null default 'book',
  title text not null check (char_length(btrim(title)) between 2 and 120),
  eyebrow text check (char_length(eyebrow) <= 60),
  description text check (char_length(description) <= 500),
  color text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  url text check (url is null or url ~ '^https://'),
  plan_id uuid references public.plans (id) on delete set null,
  position smallint not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint resources_scope check ((scope = 'PLATFORM') = (church_id is null))
);

-- "Noticias del ministerio" preference.
alter table public.profiles add column ministry_news boolean not null default false;
grant update (ministry_news) on public.profiles to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.conferences               enable row level security;
alter table public.conference_sessions       enable row level security;
alter table public.conference_registrations  enable row level security;
alter table public.conference_agenda_items   enable row level security;
alter table public.fine_arts_entries         enable row level security;
alter table public.quiz_questions            enable row level security;
alter table public.quiz_attempts             enable row level security;
alter table public.mission_campaigns         enable row level security;
alter table public.mission_offerings         enable row level security;
alter table public.calling_journeys          enable row level security;
alter table public.calling_stories           enable row level security;
alter table public.resources                 enable row level security;

revoke all on public.conferences, public.conference_sessions, public.conference_registrations,
  public.conference_agenda_items, public.fine_arts_entries, public.quiz_questions, public.quiz_attempts,
  public.mission_campaigns, public.mission_offerings, public.calling_journeys, public.calling_stories,
  public.resources from anon;
revoke insert, update, delete on public.conference_registrations from authenticated;
revoke update on public.quiz_attempts, public.mission_offerings, public.conference_agenda_items from authenticated;
revoke delete on public.quiz_attempts from authenticated;

create policy conferences_read on public.conferences for select to authenticated
  using ((is_published and public.can_read_scoped(scope, church_id)) or public.can_write_scoped(scope, church_id));
create policy conferences_write on public.conferences for all to authenticated
  using (public.can_write_scoped(scope, church_id)) with check (public.can_write_scoped(scope, church_id));

create policy sessions_read on public.conference_sessions for select to authenticated
  using (exists (select 1 from public.conferences c where c.id = conference_id));
create policy sessions_write on public.conference_sessions for all to authenticated
  using (exists (select 1 from public.conferences c where c.id = conference_id and public.can_write_scoped(c.scope, c.church_id)))
  with check (exists (select 1 from public.conferences c where c.id = conference_id and public.can_write_scoped(c.scope, c.church_id)));

create policy conf_registrations_own on public.conference_registrations for select to authenticated
  using (user_id = (select auth.uid()));

create policy agenda_own on public.conference_agenda_items for select to authenticated using (user_id = (select auth.uid()));
create policy agenda_add on public.conference_agenda_items for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.conference_sessions s where s.id = session_id));
create policy agenda_remove on public.conference_agenda_items for delete to authenticated using (user_id = (select auth.uid()));

create policy fine_arts_own on public.fine_arts_entries for select to authenticated using (user_id = (select auth.uid()));
create policy fine_arts_create on public.fine_arts_entries for insert to authenticated with check (user_id = (select auth.uid()));
create policy fine_arts_update on public.fine_arts_entries for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy fine_arts_delete on public.fine_arts_entries for delete to authenticated
  using (user_id = (select auth.uid()) and status in ('draft', 'returned'));

create policy quiz_read on public.quiz_questions for select to authenticated
  using ((is_published and public.can_read_scoped(scope, church_id)) or public.can_write_scoped(scope, church_id));
create policy quiz_write on public.quiz_questions for all to authenticated
  using (public.can_write_scoped(scope, church_id)) with check (public.can_write_scoped(scope, church_id));

create policy quiz_attempts_own on public.quiz_attempts for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_attempts_add on public.quiz_attempts for insert to authenticated with check (user_id = (select auth.uid()));

create policy campaigns_read on public.mission_campaigns for select to authenticated
  using (public.is_church_member(church_id) or public.is_church_leader(church_id));
create policy campaigns_write on public.mission_campaigns for all to authenticated
  using (public.is_church_leader(church_id)) with check (public.is_church_leader(church_id));

create policy offerings_own on public.mission_offerings for select to authenticated using (user_id = (select auth.uid()));
create policy offerings_record on public.mission_offerings for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'recorded' and confirmed_by is null and exists (
    select 1 from public.mission_campaigns c where c.id = campaign_id and c.is_active and public.is_church_member(c.church_id)));
create policy offerings_withdraw on public.mission_offerings for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'recorded');

create policy calling_own on public.calling_journeys for select to authenticated using (user_id = (select auth.uid()));
create policy calling_update on public.calling_journeys for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy calling_leave on public.calling_journeys for delete to authenticated using (user_id = (select auth.uid()));
revoke insert on public.calling_journeys from authenticated;

create policy stories_read on public.calling_stories for select to authenticated
  using ((is_published and public.can_read_scoped(scope, church_id)) or public.can_write_scoped(scope, church_id));
create policy stories_write on public.calling_stories for all to authenticated
  using (public.can_write_scoped(scope, church_id)) with check (public.can_write_scoped(scope, church_id));

create policy resources_read on public.resources for select to authenticated
  using ((is_published and public.can_read_scoped(scope, church_id)) or public.can_write_scoped(scope, church_id));
create policy resources_write on public.resources for all to authenticated
  using (public.can_write_scoped(scope, church_id)) with check (public.can_write_scoped(scope, church_id));

-- =============================================================================
-- RPCs · conferences
-- =============================================================================
create or replace function public.register_for_conference(p_conference_id uuid, p_register boolean default true)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.conferences%rowtype;
  v_church uuid;
  v_code uuid;
begin
  select * into c from public.conferences where id = p_conference_id and is_published;
  if not found or not public.can_read_scoped(c.scope, c.church_id) then
    raise exception 'conference not found' using errcode = 'P0002';
  end if;
  if not p_register then
    delete from public.conference_registrations where conference_id = c.id and user_id = auth.uid();
    return null;
  end if;
  if c.ends_on < current_date then raise exception 'conference is over' using errcode = '22023'; end if;
  select church_id into v_church from public.church_members
  where user_id = auth.uid() and status = 'active' order by joined_at limit 1;
  insert into public.conference_registrations (conference_id, user_id, church_id)
  values (c.id, auth.uid(), v_church)
  on conflict (conference_id, user_id) do update set church_id = coalesce(public.conference_registrations.church_id, excluded.church_id)
  returning badge_code into v_code;
  return v_code;
end;
$$;

-- "TU IGLESIA VA · 18 jóvenes inscritos": count for the caller's church only.
create or replace function public.conference_church_count(p_conference_id uuid, p_church_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.conference_registrations
  where conference_id = p_conference_id and church_id = p_church_id
    and (public.is_church_member(p_church_id) or public.is_church_leader(p_church_id));
$$;

-- =============================================================================
-- Function grants
-- =============================================================================
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.can_write_scoped(public.content_scope, uuid)', 'public.can_read_scoped(public.content_scope, uuid)',
    'public.review_fine_arts_entry(uuid, boolean, text)', 'public.leader_fine_arts(uuid)',
    'public.campaign_totals(uuid)', 'public.confirm_offering(uuid, boolean)', 'public.treasury_offerings(uuid)',
    'public.start_calling_journey()', 'public.my_calling_progress()',
    'public.register_for_conference(uuid, boolean)', 'public.conference_church_count(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke all on function public.fine_arts_guard() from public, anon, authenticated;
