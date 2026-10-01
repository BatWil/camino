-- =============================================================================
-- CAMINO · M2 Core
-- Journey modules, devotionals, plans, weekly challenges and "Tu ritmo".
-- Content is readable by those it is published for; progress is private to its
-- owner and written only through the RPCs below, so plan → module → stage
-- advancement stays consistent server-side.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.content_source as enum ('PLATFORM', 'CHURCH');
create type public.plan_category as enum ('daily_life', 'foundations', 'leadership');
create type public.module_kind as enum ('devotional', 'plan', 'experience');
create type public.progress_status as enum ('in_progress', 'completed');
create type public.user_plan_status as enum ('active', 'completed', 'left');
-- Design 2e chips: LEER · REFLEXIONAR · PENSAR · ESCRIBIR · ORAR · ACTUAR
create type public.devotional_step as enum ('read', 'reflect', 'think', 'write', 'pray', 'act');
create type public.challenge_kind as enum ('daily', 'weekly');

-- Palette colours allowed for content cards (exact design values).
create domain public.card_color as text
  check (value in ('#FFC83D', '#35D07F', '#3D8BFF', '#FF8A3D', '#9B6BFF', '#FF4D5E', '#C6F432', '#FF6B4A', '#0D0A26'));

-- -----------------------------------------------------------------------------
-- Timezone (for "today" in rhythm and challenges)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column timezone text not null default 'UTC'
    check (char_length(timezone) <= 64 and timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+)*$');
grant update (timezone) on public.profiles to authenticated;

create or replace function public.user_today(p_user uuid)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
begin
  select timezone into v_tz from public.profiles where id = p_user;
  begin
    return (now() at time zone coalesce(v_tz, 'UTC'))::date;
  exception when others then
    return (now() at time zone 'UTC')::date;
  end;
end;
$$;

-- Shared rule for content visibility (platform content for everyone signed in,
-- church content for that church's members and roles).
create or replace function public.can_read_content(p_source public.content_source, p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_source = 'PLATFORM' then auth.uid() is not null
    else p_church_id is not null and (
      public.is_church_member(p_church_id)
      or public.has_church_role(p_church_id, array['MENTOR','LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
    )
  end;
$$;

create or replace function public.can_write_content(p_source public.content_source, p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_source = 'PLATFORM' then public.is_platform_admin()
    else p_church_id is not null and (
      public.has_church_role(p_church_id, array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
      or public.is_platform_admin()
    )
  end;
$$;

-- -----------------------------------------------------------------------------
-- Devotionals
-- -----------------------------------------------------------------------------
create table public.devotionals (
  id uuid primary key default gen_random_uuid(),
  source public.content_source not null default 'PLATFORM',
  church_id uuid references public.churches (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  minutes smallint not null default 5 check (minutes between 1 and 60),
  scripture_ref text not null check (char_length(scripture_ref) between 2 and 80),
  scripture_text text not null check (char_length(scripture_text) between 2 and 1500),
  scripture_version text check (char_length(scripture_version) <= 40),
  reflection text not null check (char_length(reflection) between 2 and 4000),
  question text not null check (char_length(question) between 2 and 300),
  prayer text not null check (char_length(prayer) between 2 and 2000),
  action text not null check (char_length(action) between 2 and 300),
  audio_path text check (char_length(audio_path) <= 512),
  is_published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devotionals_scope check ((source = 'PLATFORM') = (church_id is null))
);
create index devotionals_church_idx on public.devotionals (church_id) where church_id is not null;
create trigger devotionals_set_updated_at before update on public.devotionals
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Plans
-- -----------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  source public.content_source not null default 'PLATFORM',
  church_id uuid references public.churches (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  summary text not null check (char_length(summary) between 2 and 400),
  category public.plan_category not null,
  color public.card_color not null default '#9B6BFF',
  minutes_per_day smallint not null default 6 check (minutes_per_day between 1 and 60),
  recommended_stage_id uuid references public.journey_stages (id) on delete set null,
  growth_areas public.growth_area[] not null default '{}',
  is_published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_scope check ((source = 'PLATFORM') = (church_id is null))
);
create index plans_church_idx on public.plans (church_id) where church_id is not null;
create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 90),
  devotional_id uuid not null references public.devotionals (id) on delete restrict,
  unique (plan_id, day_number)
);
create index plan_days_devotional_idx on public.plan_days (devotional_id);

-- -----------------------------------------------------------------------------
-- Journey modules (nodes of "Mi Camino")
-- -----------------------------------------------------------------------------
create table public.journey_modules (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.journey_stages (id) on delete cascade,
  position smallint not null check (position between 1 and 50),
  title text not null check (char_length(title) between 2 and 80),
  kind public.module_kind not null,
  devotional_id uuid references public.devotionals (id) on delete restrict,
  plan_id uuid references public.plans (id) on delete restrict,
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, position),
  constraint journey_modules_target check (
    (kind = 'devotional' and devotional_id is not null and plan_id is null)
    or (kind = 'plan' and plan_id is not null and devotional_id is null)
    or (kind = 'experience' and plan_id is null and devotional_id is null)
  )
);
create trigger journey_modules_set_updated_at before update on public.journey_modules
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Weekly / daily challenges
-- -----------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  source public.content_source not null default 'PLATFORM',
  church_id uuid references public.churches (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  description text not null check (char_length(description) between 2 and 400),
  kind public.challenge_kind not null default 'weekly',
  days_target smallint not null default 5 check (days_target between 1 and 7),
  stage_id uuid references public.journey_stages (id) on delete set null,
  starts_on date,
  ends_on date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenges_scope check ((source = 'PLATFORM') = (church_id is null)),
  constraint challenges_dates check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create trigger challenges_set_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Private progress
-- -----------------------------------------------------------------------------
create table public.devotional_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  devotional_id uuid not null references public.devotionals (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  completed_steps public.devotional_step[] not null default '{}',
  -- Private reflection ("Solo tú puedes leer tu respuesta"). Never exposed to anyone else.
  answer text check (char_length(answer) <= 4000),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, devotional_id)
);

create table public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  status public.user_plan_status not null default 'active',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create unique index user_plans_one_active on public.user_plans (user_id, plan_id) where status = 'active';
create index user_plans_user_idx on public.user_plans (user_id, status);

create table public.plan_day_completions (
  user_plan_id uuid not null references public.user_plans (id) on delete cascade,
  day_number smallint not null,
  completed_at timestamptz not null default now(),
  primary key (user_plan_id, day_number)
);

-- "Hacerlo con un amigo": modelled now, UI arrives with community safeguards (M4).
create table public.plan_companions (
  id uuid primary key default gen_random_uuid(),
  user_plan_id uuid not null references public.user_plans (id) on delete cascade,
  companion_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (user_plan_id, companion_id)
);

create table public.user_module_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid not null references public.journey_modules (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, module_id)
);

create table public.challenge_checkins (
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, challenge_id, day)
);

-- "Tu ritmo": one row per local day with any spiritual activity. No content.
create table public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  sources text[] not null default '{}',
  primary key (user_id, day)
);

-- =============================================================================
-- Internal helpers (not callable through the API)
-- =============================================================================
create or replace function public.record_activity(p_user uuid, p_source text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_days (user_id, day, sources)
  values (p_user, public.user_today(p_user), array[p_source])
  on conflict (user_id, day) do update
    set sources = (select array_agg(distinct s) from unnest(public.activity_days.sources || excluded.sources) s);
$$;

-- Moves the person forward when every required module of their current stage is
-- complete. Never moves backwards; stages beyond the current one stay explorable.
create or replace function public.refresh_journey_stage(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stage public.journey_stages%rowtype;
  v_pending integer;
  v_total integer;
  v_next uuid;
begin
  select s.* into v_stage from public.profiles p
  join public.journey_stages s on s.id = p.current_stage_id
  where p.id = p_user;
  if not found then return false; end if;

  select count(*), count(*) filter (where coalesce(ump.status::text, '') <> 'completed')
    into v_total, v_pending
  from public.journey_modules m
  left join public.user_module_progress ump on ump.module_id = m.id and ump.user_id = p_user
  where m.stage_id = v_stage.id and not m.is_optional;

  if v_total = 0 or v_pending > 0 then return false; end if;

  select id into v_next from public.journey_stages where position > v_stage.position order by position limit 1;
  if v_next is null then return false; end if;

  update public.profiles set current_stage_id = v_next where id = p_user;
  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (p_user, 'journey.stage_advanced', 'profiles', p_user, jsonb_build_object('to', v_next));
  return true;
end;
$$;

create or replace function public.mark_modules(p_user uuid, p_devotional uuid, p_plan uuid, p_status public.progress_status)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_module_progress (user_id, module_id, status, completed_at)
  select p_user, m.id, p_status, case when p_status = 'completed' then now() end
  from public.journey_modules m
  where (p_devotional is not null and m.devotional_id = p_devotional)
     or (p_plan is not null and m.plan_id = p_plan)
  on conflict (user_id, module_id) do update
    set status = case when public.user_module_progress.status = 'completed' then 'completed'::public.progress_status else excluded.status end,
        completed_at = coalesce(public.user_module_progress.completed_at, excluded.completed_at);
$$;

-- =============================================================================
-- RPCs
-- =============================================================================

-- Saves progress inside a devotional (steps seen, private answer). Never downgrades a completed one.
create or replace function public.save_devotional_progress(
  p_devotional_id uuid,
  p_steps public.devotional_step[],
  p_answer text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dev public.devotionals%rowtype;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_dev from public.devotionals where id = p_devotional_id and is_published;
  if not found or not public.can_read_content(v_dev.source, v_dev.church_id) then
    raise exception 'devotional not found' using errcode = 'P0002';
  end if;
  if p_answer is not null and char_length(p_answer) > 4000 then
    raise exception 'answer too long' using errcode = '22023';
  end if;

  insert into public.devotional_progress (user_id, devotional_id, completed_steps, answer)
  values (v_uid, p_devotional_id, coalesce(p_steps, '{}'), nullif(btrim(p_answer), ''))
  on conflict (user_id, devotional_id) do update set
    completed_steps = (select array_agg(distinct s) from unnest(public.devotional_progress.completed_steps || excluded.completed_steps) s),
    answer = coalesce(nullif(btrim(p_answer), ''), public.devotional_progress.answer),
    updated_at = now();

  perform public.mark_modules(v_uid, p_devotional_id, null, 'in_progress');
  perform public.record_activity(v_uid, 'devotional');
end;
$$;

create or replace function public.start_plan(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_id uuid;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_plan from public.plans where id = p_plan_id and is_published;
  if not found or not public.can_read_content(v_plan.source, v_plan.church_id) then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;

  select id into v_id from public.user_plans where user_id = v_uid and plan_id = p_plan_id and status = 'active';
  if v_id is null then
    insert into public.user_plans (user_id, plan_id) values (v_uid, p_plan_id) returning id into v_id;
    perform public.mark_modules(v_uid, null, p_plan_id, 'in_progress');
  end if;
  return v_id;
end;
$$;

create or replace function public.leave_plan(p_user_plan_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.user_plans set status = 'left', updated_at = now()
  where id = p_user_plan_id and user_id = auth.uid() and status = 'active';
$$;

-- Completes a devotional (optionally as a plan day) and cascades:
-- plan day → plan → journey modules → stage. Returns what changed so the UI can celebrate.
create or replace function public.complete_devotional(
  p_devotional_id uuid,
  p_answer text default null,
  p_user_plan_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_up public.user_plans%rowtype;
  v_day smallint;
  v_total smallint;
  v_done smallint;
  v_plan_completed boolean := false;
  v_stage_advanced boolean := false;
  v_stage record;
begin
  perform public.save_devotional_progress(p_devotional_id, array['read','reflect','think','write','pray','act']::public.devotional_step[], p_answer);

  update public.devotional_progress
    set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
  where user_id = v_uid and devotional_id = p_devotional_id;
  perform public.mark_modules(v_uid, p_devotional_id, null, 'completed');

  if p_user_plan_id is not null then
    select * into v_up from public.user_plans where id = p_user_plan_id and user_id = v_uid;
    if not found then raise exception 'plan enrollment not found' using errcode = 'P0002'; end if;

    select day_number into v_day from public.plan_days
    where plan_id = v_up.plan_id and devotional_id = p_devotional_id
      and day_number not in (select day_number from public.plan_day_completions where user_plan_id = v_up.id)
    order by day_number limit 1;

    if v_day is not null then
      insert into public.plan_day_completions (user_plan_id, day_number) values (v_up.id, v_day)
      on conflict do nothing;
    end if;

    select count(*) into v_total from public.plan_days where plan_id = v_up.plan_id;
    select count(*) into v_done from public.plan_day_completions where user_plan_id = v_up.id;
    if v_up.status = 'active' and v_done >= v_total then
      update public.user_plans set status = 'completed', completed_at = now(), updated_at = now() where id = v_up.id;
      perform public.mark_modules(v_uid, null, v_up.plan_id, 'completed');
      v_plan_completed := true;
    end if;
  end if;

  v_stage_advanced := public.refresh_journey_stage(v_uid);
  select s.key, s.name into v_stage from public.profiles p
  join public.journey_stages s on s.id = p.current_stage_id where p.id = v_uid;

  return jsonb_build_object(
    'plan_completed', v_plan_completed,
    'stage_advanced', v_stage_advanced,
    'stage_key', v_stage.key,
    'stage_name', v_stage.name
  );
end;
$$;

-- Marks today in a challenge (6a "toca hoy para completarlo"). Only today; idempotent.
create or replace function public.challenge_checkin(p_challenge_id uuid, p_done boolean default true)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ch public.challenges%rowtype;
  v_today date;
  v_week_start date;
  v_count integer;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_ch from public.challenges where id = p_challenge_id and is_published;
  if not found or not public.can_read_content(v_ch.source, v_ch.church_id) then
    raise exception 'challenge not found' using errcode = 'P0002';
  end if;

  v_today := public.user_today(v_uid);
  v_week_start := date_trunc('week', v_today)::date;

  if p_done then
    select count(*) into v_count from public.challenge_checkins
    where user_id = v_uid and challenge_id = p_challenge_id and day >= v_week_start;
    if v_count < v_ch.days_target then
      insert into public.challenge_checkins (user_id, challenge_id, day) values (v_uid, p_challenge_id, v_today)
      on conflict do nothing;
      perform public.record_activity(v_uid, 'challenge');
    end if;
  else
    delete from public.challenge_checkins where user_id = v_uid and challenge_id = p_challenge_id and day = v_today;
  end if;

  select count(*) into v_count from public.challenge_checkins
  where user_id = v_uid and challenge_id = p_challenge_id and day >= v_week_start;
  return v_count;
end;
$$;

-- =============================================================================
-- Grants & RLS
-- =============================================================================
alter table public.devotionals          enable row level security;
alter table public.plans                enable row level security;
alter table public.plan_days            enable row level security;
alter table public.journey_modules      enable row level security;
alter table public.challenges           enable row level security;
alter table public.devotional_progress  enable row level security;
alter table public.user_plans           enable row level security;
alter table public.plan_day_completions enable row level security;
alter table public.plan_companions      enable row level security;
alter table public.user_module_progress enable row level security;
alter table public.challenge_checkins   enable row level security;
alter table public.activity_days        enable row level security;

revoke all on public.devotionals, public.plans, public.plan_days, public.journey_modules, public.challenges,
  public.devotional_progress, public.user_plans, public.plan_day_completions, public.plan_companions,
  public.user_module_progress, public.challenge_checkins, public.activity_days from anon;

-- Progress is written only by the RPCs (security definer); users read their own rows.
revoke insert, update, delete on public.devotional_progress, public.user_plans, public.plan_day_completions,
  public.user_module_progress, public.challenge_checkins, public.activity_days from authenticated;

revoke all on function public.user_today(uuid) from public, anon, authenticated;
revoke all on function public.record_activity(uuid, text) from public, anon, authenticated;
revoke all on function public.refresh_journey_stage(uuid) from public, anon, authenticated;
revoke all on function public.mark_modules(uuid, uuid, uuid, public.progress_status) from public, anon, authenticated;
revoke all on function public.can_read_content(public.content_source, uuid) from public, anon;
revoke all on function public.can_write_content(public.content_source, uuid) from public, anon;
revoke all on function public.save_devotional_progress(uuid, public.devotional_step[], text) from public, anon;
revoke all on function public.start_plan(uuid) from public, anon;
revoke all on function public.leave_plan(uuid) from public, anon;
revoke all on function public.complete_devotional(uuid, text, uuid) from public, anon;
revoke all on function public.challenge_checkin(uuid, boolean) from public, anon;
grant execute on function public.can_read_content(public.content_source, uuid) to authenticated;
grant execute on function public.can_write_content(public.content_source, uuid) to authenticated;
grant execute on function public.save_devotional_progress(uuid, public.devotional_step[], text) to authenticated;
grant execute on function public.start_plan(uuid) to authenticated;
grant execute on function public.leave_plan(uuid) to authenticated;
grant execute on function public.complete_devotional(uuid, text, uuid) to authenticated;
grant execute on function public.challenge_checkin(uuid, boolean) to authenticated;

-- Content ------------------------------------------------------------------------
create policy devotionals_select on public.devotionals for select to authenticated
  using ((is_published and public.can_read_content(source, church_id)) or public.can_write_content(source, church_id));
create policy devotionals_write on public.devotionals for all to authenticated
  using (public.can_write_content(source, church_id)) with check (public.can_write_content(source, church_id));

create policy plans_select on public.plans for select to authenticated
  using ((is_published and public.can_read_content(source, church_id)) or public.can_write_content(source, church_id));
create policy plans_write on public.plans for all to authenticated
  using (public.can_write_content(source, church_id)) with check (public.can_write_content(source, church_id));

create policy plan_days_select on public.plan_days for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id));
create policy plan_days_write on public.plan_days for all to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and public.can_write_content(p.source, p.church_id)))
  with check (exists (select 1 from public.plans p where p.id = plan_id and public.can_write_content(p.source, p.church_id)));

create policy journey_modules_select on public.journey_modules for select to authenticated using (true);
create policy journey_modules_write on public.journey_modules for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy challenges_select on public.challenges for select to authenticated
  using ((is_published and public.can_read_content(source, church_id)) or public.can_write_content(source, church_id));
create policy challenges_write on public.challenges for all to authenticated
  using (public.can_write_content(source, church_id)) with check (public.can_write_content(source, church_id));

-- Private progress (owner only; no mentor/leader/admin policy on purpose) ---------
create policy devotional_progress_own on public.devotional_progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_plans_own on public.user_plans for select to authenticated
  using (user_id = (select auth.uid()));
create policy plan_day_completions_own on public.plan_day_completions for select to authenticated
  using (exists (select 1 from public.user_plans up where up.id = user_plan_id and up.user_id = (select auth.uid())));
create policy plan_companions_own on public.plan_companions for select to authenticated
  using (companion_id = (select auth.uid())
    or exists (select 1 from public.user_plans up where up.id = user_plan_id and up.user_id = (select auth.uid())));
create policy user_module_progress_own on public.user_module_progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy challenge_checkins_own on public.challenge_checkins for select to authenticated
  using (user_id = (select auth.uid()));
create policy activity_days_own on public.activity_days for select to authenticated
  using (user_id = (select auth.uid()));
