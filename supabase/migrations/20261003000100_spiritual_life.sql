-- =============================================================================
-- CAMINO · M3 Vida espiritual
-- Bible notes/highlights/bookmarks, private journal, prayers (+ prayer mode
-- sessions), weekly check-ins, moments and "Mi historia".
--
-- Privacy model: journal, notes, check-ins and private prayers are visible to
-- their owner ONLY. There is no policy for leaders or platform admins. Prayers
-- shared with a group/church are readable by those members only.
-- Mentor visibility (prayers MENTOR, shared check-ins) arrives with mentorships
-- in M4; until then those rows stay owner-only.
-- =============================================================================

create type public.highlight_color as enum ('yellow', 'green', 'blue', 'violet');
create type public.journal_kind as enum ('free', 'gratitude', 'struggle', 'reflection', 'verse', 'devotional');
create type public.prayer_status as enum ('PRAYING', 'ANSWERED', 'ARCHIVED');
create type public.prayer_privacy as enum ('PRIVATE', 'MENTOR', 'GROUP', 'CHURCH');
create type public.prayer_category as enum ('family', 'studies', 'health', 'friends', 'church', 'work', 'faith', 'other');
create type public.mood as enum ('joy', 'peace', 'tired', 'anxious', 'lonely', 'doubts');
create type public.moment_kind as enum (
  'journey_started', 'faith_decision', 'baptism', 'first_service', 'first_preaching',
  'prayer_answered', 'plan_completed', 'stage_reached', 'calling', 'mission', 'custom'
);
create type public.attachment_kind as enum ('audio', 'photo', 'file');

-- Bible references use USFM book codes (GEN, JHN, 1CO…), independent of the version.
create domain public.usfm_book as text check (value ~ '^[1-4A-Z][A-Z0-9]{2}$');

-- -----------------------------------------------------------------------------
-- Bible
-- -----------------------------------------------------------------------------
create table public.bible_highlights (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book public.usfm_book not null,
  chapter smallint not null check (chapter between 1 and 150),
  verse smallint not null check (verse between 1 and 200),
  color public.highlight_color not null,
  created_at timestamptz not null default now(),
  primary key (user_id, book, chapter, verse)
);

create table public.bible_bookmarks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book public.usfm_book not null,
  chapter smallint not null check (chapter between 1 and 150),
  verse smallint not null check (verse between 1 and 200),
  created_at timestamptz not null default now(),
  primary key (user_id, book, chapter, verse)
);

create table public.bible_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book public.usfm_book not null,
  chapter smallint not null check (chapter between 1 and 150),
  verse smallint not null check (verse between 1 and 200),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book, chapter, verse)
);
create trigger bible_notes_set_updated_at before update on public.bible_notes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Journal (private by default and by design)
-- -----------------------------------------------------------------------------
create table public.journal_entries (
  -- Client-generated ids make offline sync idempotent.
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.journal_kind not null default 'free',
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  verse_ref text check (char_length(verse_ref) <= 80),
  verse_text text check (char_length(verse_text) <= 1500),
  devotional_id uuid references public.devotionals (id) on delete set null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index journal_entries_user_idx on public.journal_entries (user_id, entry_date desc, created_at desc);
create trigger journal_entries_set_updated_at before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- Prepared for audio/photos/files (UI in a later milestone). Private bucket below.
create table public.journal_attachments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.attachment_kind not null,
  storage_path text not null check (char_length(storage_path) <= 512),
  mime_type text not null check (char_length(mime_type) <= 100),
  size_bytes integer not null check (size_bytes between 1 and 26214400),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Prayers
-- -----------------------------------------------------------------------------
create table public.prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  description text check (char_length(description) <= 2000),
  category public.prayer_category not null default 'other',
  status public.prayer_status not null default 'PRAYING',
  privacy public.prayer_privacy not null default 'PRIVATE',
  group_id uuid references public.groups (id) on delete set null,
  church_id uuid references public.churches (id) on delete set null,
  verse_ref text check (char_length(verse_ref) <= 80),
  answered_at timestamptz,
  answer_note text check (char_length(answer_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prayers_scope check (
    (privacy = 'GROUP' and group_id is not null)
    or (privacy = 'CHURCH' and church_id is not null)
    or (privacy in ('PRIVATE', 'MENTOR'))
  ),
  constraint prayers_answered check ((status = 'ANSWERED') = (answered_at is not null))
);
create index prayers_user_idx on public.prayers (user_id, status);
create index prayers_group_idx on public.prayers (group_id) where privacy = 'GROUP';
create index prayers_church_idx on public.prayers (church_id) where privacy = 'CHURCH';
create trigger prayers_set_updated_at before update on public.prayers
  for each row execute function public.set_updated_at();

create table public.prayer_updates (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayers (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- "Modo oración": only durations, for Tu ritmo. Never content.
create table public.prayer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  seconds integer not null check (seconds between 1 and 14400),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Weekly check-in ("¿Cómo estás esta semana?" · screen 4c)
-- -----------------------------------------------------------------------------
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  mood public.mood not null,
  note text check (char_length(note) <= 2000),
  -- Never shared automatically; mentor access is added in M4 only when true.
  shared_with_mentor boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start),
  constraint check_ins_monday check (extract(isodow from week_start) = 1)
);
create trigger check_ins_set_updated_at before update on public.check_ins
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Moments ("Momentos de mi camino")
-- -----------------------------------------------------------------------------
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.moment_kind not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  note text check (char_length(note) <= 1000),
  happened_on date not null default current_date,
  is_auto boolean not null default false,
  ref_id uuid,
  created_at timestamptz not null default now(),
  constraint moments_date check (happened_on > date '1900-01-01')
);
create index moments_user_idx on public.moments (user_id, happened_on desc);
-- One automatic moment per source event.
create unique index moments_auto_once on public.moments (user_id, kind, ref_id) where is_auto and ref_id is not null;

-- =============================================================================
-- Automatic moments & rhythm
-- =============================================================================
create or replace function public.add_auto_moment(p_user uuid, p_kind public.moment_kind, p_title text, p_ref uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moments (user_id, kind, title, happened_on, is_auto, ref_id)
  values (p_user, p_kind, left(p_title, 120), public.user_today(p_user), true, p_ref)
  on conflict do nothing;
$$;

create or replace function public.moments_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if old.onboarding_completed_at is null and new.onboarding_completed_at is not null then
    perform public.add_auto_moment(new.id, 'journey_started', 'Comencé Camino', new.id);
  end if;
  if old.current_stage_id is not null and new.current_stage_id is distinct from old.current_stage_id then
    select name into v_name from public.journey_stages where id = new.current_stage_id;
    perform public.add_auto_moment(new.id, 'stage_reached', 'Llegué a ' || coalesce(v_name, 'una nueva etapa'), new.current_stage_id);
  end if;
  return new;
end;
$$;
create trigger profiles_moments after update on public.profiles
  for each row execute function public.moments_from_profile();

create or replace function public.moments_from_plans()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    select title into v_title from public.plans where id = new.plan_id;
    perform public.add_auto_moment(new.user_id, 'plan_completed', 'Terminé ' || coalesce(v_title, 'un plan'), new.id);
  end if;
  return new;
end;
$$;
create trigger user_plans_moments after update on public.user_plans
  for each row execute function public.moments_from_plans();

create or replace function public.moments_from_prayers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'ANSWERED' and old.status is distinct from 'ANSWERED' then
    perform public.add_auto_moment(new.user_id, 'prayer_answered', 'Oración respondida', new.id);
  elsif old.status = 'ANSWERED' and new.status <> 'ANSWERED' then
    -- "Deshacer": remove the automatic moment for this prayer.
    delete from public.moments where user_id = new.user_id and kind = 'prayer_answered' and ref_id = new.id and is_auto;
  end if;
  return new;
end;
$$;
create trigger prayers_moments after update on public.prayers
  for each row execute function public.moments_from_prayers();

create or replace function public.activity_from_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_activity(new.user_id, tg_argv[0]);
  return new;
end;
$$;
create trigger journal_activity after insert on public.journal_entries
  for each row execute function public.activity_from_rows('journal');
create trigger prayer_session_activity after insert on public.prayer_sessions
  for each row execute function public.activity_from_rows('prayer');

-- Integrity triggers ------------------------------------------------------------------
-- Sharing a prayer requires belonging to that group/church; status/answer coherence.
create or replace function public.prayers_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.privacy = 'GROUP' and not exists (
    select 1 from public.group_members gm where gm.group_id = new.group_id and gm.user_id = new.user_id) then
    raise exception 'not a member of that group' using errcode = '42501';
  end if;
  if new.privacy = 'CHURCH' and not exists (
    select 1 from public.church_members m where m.church_id = new.church_id and m.user_id = new.user_id and m.status = 'active') then
    raise exception 'not a member of that church' using errcode = '42501';
  end if;
  if new.privacy not in ('GROUP') then new.group_id := null; end if;
  if new.privacy not in ('CHURCH') then new.church_id := null; end if;
  if new.status = 'ANSWERED' and new.answered_at is null then new.answered_at := now(); end if;
  if new.status <> 'ANSWERED' then new.answered_at := null; end if;
  return new;
end;
$$;
create trigger prayers_guard before insert or update on public.prayers
  for each row execute function public.prayers_guard();

-- user_id can never be reassigned on private rows.
create or replace function public.keep_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'owner cannot change' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger journal_keep_owner before update on public.journal_entries for each row execute function public.keep_owner();
create trigger prayers_keep_owner before update on public.prayers for each row execute function public.keep_owner();
create trigger check_ins_keep_owner before update on public.check_ins for each row execute function public.keep_owner();
create trigger moments_keep_owner before update on public.moments for each row execute function public.keep_owner();
create trigger bible_notes_keep_owner before update on public.bible_notes for each row execute function public.keep_owner();

-- =============================================================================
-- RPC · "Mi historia" (aggregates only, for the owner)
-- =============================================================================
create or replace function public.my_story_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'active_days', (select count(*) from public.activity_days where user_id = auth.uid()),
    'journal_entries', (select count(*) from public.journal_entries where user_id = auth.uid()),
    'first_journal_at', (select min(created_at) from public.journal_entries where user_id = auth.uid()),
    'answered_prayers', (select count(*) from public.prayers where user_id = auth.uid() and status = 'ANSWERED'),
    'prayer_minutes', (select coalesce(sum(seconds), 0) / 60 from public.prayer_sessions where user_id = auth.uid()),
    'plans_completed', (select count(*) from public.user_plans where user_id = auth.uid() and status = 'completed'),
    'devotionals_completed', (select count(*) from public.devotional_progress where user_id = auth.uid() and status = 'completed'),
    'started_at', (select onboarding_completed_at from public.profiles where id = auth.uid())
  );
$$;

-- =============================================================================
-- Grants & RLS
-- =============================================================================
alter table public.bible_highlights    enable row level security;
alter table public.bible_bookmarks     enable row level security;
alter table public.bible_notes         enable row level security;
alter table public.journal_entries     enable row level security;
alter table public.journal_attachments enable row level security;
alter table public.prayers             enable row level security;
alter table public.prayer_updates      enable row level security;
alter table public.prayer_sessions     enable row level security;
alter table public.check_ins           enable row level security;
alter table public.moments             enable row level security;

revoke all on public.bible_highlights, public.bible_bookmarks, public.bible_notes, public.journal_entries,
  public.journal_attachments, public.prayers, public.prayer_updates, public.prayer_sessions, public.check_ins,
  public.moments from anon;

revoke update, delete on public.prayer_sessions from authenticated;

revoke all on function public.add_auto_moment(uuid, public.moment_kind, text, uuid) from public, anon, authenticated;
revoke all on function public.moments_from_profile() from public, anon, authenticated;
revoke all on function public.moments_from_plans() from public, anon, authenticated;
revoke all on function public.moments_from_prayers() from public, anon, authenticated;
revoke all on function public.activity_from_rows() from public, anon, authenticated;
revoke all on function public.prayers_guard() from public, anon, authenticated;
revoke all on function public.my_story_stats() from public, anon;
grant execute on function public.my_story_stats() to authenticated;

-- Owner-only tables (the same four policies each) ----------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['bible_highlights', 'bible_bookmarks', 'bible_notes', 'journal_entries',
                           'journal_attachments', 'prayer_updates', 'check_ins', 'moments']
  loop
    execute format('create policy %1$s_select_own on public.%1$s for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_insert_own on public.%1$s for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_update_own on public.%1$s for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy %1$s_delete_own on public.%1$s for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Attachments must belong to one of my own entries.
create policy journal_attachments_entry_owner on public.journal_attachments as restrictive for insert to authenticated
  with check (exists (select 1 from public.journal_entries e where e.id = entry_id and e.user_id = (select auth.uid())));
-- Prayer updates only on my own prayers.
create policy prayer_updates_prayer_owner on public.prayer_updates as restrictive for insert to authenticated
  with check (exists (select 1 from public.prayers p where p.id = prayer_id and p.user_id = (select auth.uid())));

-- Prayer sessions: insert + read own.
create policy prayer_sessions_select_own on public.prayer_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy prayer_sessions_insert_own on public.prayer_sessions for insert to authenticated with check (user_id = (select auth.uid()));

-- Prayers: owner manages; shared ones are readable by that group/church.
create policy prayers_select on public.prayers for select to authenticated
  using (
    user_id = (select auth.uid())
    or (privacy = 'GROUP' and status = 'PRAYING' and public.is_group_member(group_id))
    or (privacy = 'CHURCH' and status = 'PRAYING' and public.is_church_member(church_id))
  );
create policy prayers_insert_own on public.prayers for insert to authenticated with check (user_id = (select auth.uid()));
create policy prayers_update_own on public.prayers for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy prayers_delete_own on public.prayers for delete to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Storage · journal attachments (private, owner folder only; UI later)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal', 'journal', false, 26214400,
        array['image/webp', 'image/jpeg', 'image/png', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'application/pdf'])
on conflict (id) do nothing;

create policy journal_files_own on storage.objects for all to authenticated
  using (bucket_id = 'journal' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'journal' and (storage.foldername(name))[1] = (select auth.uid())::text);
