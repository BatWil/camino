-- =============================================================================
-- CAMINO · M0 Foundation
-- Identity, multi-tenancy (churches), multi-role model, groups, journey stages,
-- audit log. Every table has RLS enabled and is deny-by-default: access is only
-- granted through the explicit policies below.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
-- USER is implicit for every authenticated account and is never stored in
-- user_roles; the value exists so the application can type roles uniformly.
create type public.app_role as enum (
  'USER',
  'MENTOR',
  'LEADER',
  'PASTOR',
  'CHURCH_ADMIN',
  'PLATFORM_ADMIN'
);

create type public.membership_status as enum ('pending', 'active', 'inactive');

create type public.group_member_role as enum ('member', 'leader');

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles · 1:1 with auth.users. Private to its owner (contains birth date of
-- possible minors). Other people only ever see names through narrow, audited
-- functions added in later milestones.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 80),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 512),
  birth_date date check (birth_date is null or (birth_date > date '1900-01-01' and birth_date <= current_date)),
  locale text not null default 'es' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- churches · tenants
-- -----------------------------------------------------------------------------
create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  -- Code typed by a young person or encoded in the church QR.
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6,12}$'),
  city text check (city is null or char_length(city) <= 120),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  logo_path text check (logo_path is null or char_length(logo_path) <= 512),
  -- Per-church feature toggles (ministries, conferences, fine arts...).
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger churches_set_updated_at
  before update on public.churches
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- church_members · a user may belong to several churches over time
-- -----------------------------------------------------------------------------
create table public.church_members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, user_id)
);

create index church_members_user_idx on public.church_members (user_id);

create trigger church_members_set_updated_at
  before update on public.church_members
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_roles · many roles per user, scoped to a church (PLATFORM_ADMIN is global)
-- -----------------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  church_id uuid references public.churches (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint user_roles_user_is_implicit check (role <> 'USER'),
  constraint user_roles_scope check (
    (role = 'PLATFORM_ADMIN' and church_id is null)
    or (role <> 'PLATFORM_ADMIN' and church_id is not null)
  ),
  constraint user_roles_unique unique nulls not distinct (user_id, role, church_id)
);

create index user_roles_user_idx on public.user_roles (user_id);
create index user_roles_church_idx on public.user_roles (church_id);

-- -----------------------------------------------------------------------------
-- groups · small groups inside a church
-- -----------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  meeting_schedule text check (meeting_schedule is null or char_length(meeting_schedule) <= 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_church_idx on public.groups (church_id);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.group_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

-- -----------------------------------------------------------------------------
-- journey_stages · reference data for "Mi Camino" (ENCUENTRA → GUÍA)
-- -----------------------------------------------------------------------------
create table public.journey_stages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z]+$'),
  position smallint not null unique check (position between 1 and 20),
  name text not null check (char_length(name) between 2 and 40),
  description text check (description is null or char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger journey_stages_set_updated_at
  before update on public.journey_stages
  for each row execute function public.set_updated_at();

insert into public.journey_stages (key, position, name, description) values
  ('encuentra', 1, 'ENCUENTRA', null),
  ('crece',     2, 'CRECE', 'Estás desarrollando hábitos que fortalecerán tu relación con Dios.'),
  ('vive',      3, 'VIVE', null),
  ('sirve',     4, 'SIRVE', null),
  ('comparte',  5, 'COMPARTE', null),
  ('guia',      6, 'GUÍA', null);

-- -----------------------------------------------------------------------------
-- audit_log · sensitive administrative actions. Append-only, written by
-- SECURITY DEFINER triggers/functions, readable by platform admins only.
-- Never store private content (journal, prayers, check-ins) here.
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  church_id uuid,
  action text not null check (char_length(action) <= 80),
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_church_idx on public.audit_log (church_id, created_at desc);

-- =============================================================================
-- Authorization helpers (SECURITY DEFINER so policies do not recurse through RLS)
-- =============================================================================
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'PLATFORM_ADMIN'
  );
$$;

create or replace function public.is_church_member(p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.church_members m
    where m.church_id = p_church_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_church_role(p_church_id uuid, p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid()
      and r.church_id = p_church_id
      and r.role = any (p_roles)
  );
$$;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  );
$$;

create or replace function public.group_church_id(p_group_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select g.church_id from public.groups g where g.id = p_group_id;
$$;

-- =============================================================================
-- Triggers with side effects
-- =============================================================================

-- Create an empty profile when an auth user is created. Only the display name
-- supplied at sign-up is copied; nothing else from third-party metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  )), '');
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(v_name, 80))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Audit every role grant/revoke.
create or replace function public.audit_user_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor_id, church_id, action, target_table, target_id, metadata)
    values (auth.uid(), new.church_id, 'role.granted', 'user_roles', new.user_id,
            jsonb_build_object('role', new.role));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (actor_id, church_id, action, target_table, target_id, metadata)
    values (auth.uid(), old.church_id, 'role.revoked', 'user_roles', old.user_id,
            jsonb_build_object('role', old.role));
    return old;
  end if;
  return null;
end;
$$;

create trigger user_roles_audit
  after insert or delete on public.user_roles
  for each row execute function public.audit_user_roles();

-- Roles are immutable: revoke + grant instead of UPDATE, so the audit trail is complete.
create or replace function public.prevent_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'rows in %.% are immutable', tg_table_schema, tg_table_name
    using errcode = '42501';
end;
$$;

create trigger user_roles_immutable
  before update on public.user_roles
  for each row execute function public.prevent_update();

-- Members may only change their own membership by leaving it (DELETE).
-- Status changes are reserved to church admins/pastors (see policies) and are audited.
create or replace function public.audit_church_member_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.church_id <> old.church_id or new.user_id <> old.user_id then
    raise exception 'church_id and user_id are immutable' using errcode = '42501';
  end if;
  if new.status is distinct from old.status then
    insert into public.audit_log (actor_id, church_id, action, target_table, target_id, metadata)
    values (auth.uid(), new.church_id, 'membership.status_changed', 'church_members', new.user_id,
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

create trigger church_members_audit_status
  before update on public.church_members
  for each row execute function public.audit_church_member_status();

-- =============================================================================
-- RPC · join a church with its code (typed or read from the church QR).
-- The caller never gets read access to churches it does not belong to; the
-- function only returns the minimal public identity of the joined church.
-- =============================================================================
create or replace function public.join_church_by_code(p_code text)
returns table (church_id uuid, church_name text, city text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_church public.churches%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9]{6,12}$' then
    raise exception 'invalid church code' using errcode = '22023';
  end if;

  select * into v_church from public.churches c
  where c.join_code = v_code and c.is_active;

  if not found then
    raise exception 'church not found' using errcode = 'P0002';
  end if;

  insert into public.church_members (church_id, user_id, status)
  values (v_church.id, v_uid, 'active')
  on conflict (church_id, user_id) do nothing;

  return query select v_church.id, v_church.name, v_church.city;
end;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles       enable row level security;
alter table public.churches       enable row level security;
alter table public.church_members enable row level security;
alter table public.user_roles     enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.journey_stages enable row level security;
alter table public.audit_log      enable row level security;

-- Anonymous visitors have no table access at all.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon, public;
-- Only authenticated users may call the helpers/RPCs; RLS still applies.
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_church_member(uuid) to authenticated;
grant execute on function public.has_church_role(uuid, public.app_role[]) to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.group_church_id(uuid) to authenticated;
grant execute on function public.join_church_by_code(text) to authenticated;
-- Trigger functions must never be callable directly through the API.
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.audit_user_roles() from authenticated;
revoke execute on function public.audit_church_member_status() from authenticated;

-- audit_log is append-only through definer functions.
revoke insert, update, delete, truncate on public.audit_log from authenticated;

-- profiles ---------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- No INSERT policy: rows are created by handle_new_user(). No DELETE: cascades from auth.users.

-- churches ---------------------------------------------------------------------
create policy churches_select_member on public.churches
  for select to authenticated
  using (
    public.is_church_member(id)
    or public.has_church_role(id, array['MENTOR','LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
    or public.is_platform_admin()
  );

create policy churches_insert_platform_admin on public.churches
  for insert to authenticated
  with check (public.is_platform_admin());

create policy churches_update_admin on public.churches
  for update to authenticated
  using (public.has_church_role(id, array['CHURCH_ADMIN']::public.app_role[]) or public.is_platform_admin())
  with check (public.has_church_role(id, array['CHURCH_ADMIN']::public.app_role[]) or public.is_platform_admin());

create policy churches_delete_platform_admin on public.churches
  for delete to authenticated
  using (public.is_platform_admin());

-- church_members ---------------------------------------------------------------
create policy church_members_select on public.church_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_church_role(church_id, array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
  );

-- Joining happens through join_church_by_code(); admins may add members directly.
create policy church_members_insert_admin on public.church_members
  for insert to authenticated
  with check (public.has_church_role(church_id, array['PASTOR','CHURCH_ADMIN']::public.app_role[]));

create policy church_members_update_admin on public.church_members
  for update to authenticated
  using (public.has_church_role(church_id, array['PASTOR','CHURCH_ADMIN']::public.app_role[]))
  with check (public.has_church_role(church_id, array['PASTOR','CHURCH_ADMIN']::public.app_role[]));

create policy church_members_delete on public.church_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_church_role(church_id, array['CHURCH_ADMIN']::public.app_role[])
  );

-- user_roles -------------------------------------------------------------------
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (church_id is not null and public.has_church_role(church_id, array['PASTOR','CHURCH_ADMIN']::public.app_role[]))
    or public.is_platform_admin()
  );

-- Church admins manage church-scoped roles of their own members, never their own
-- roles and never PLATFORM_ADMIN. Platform admins manage everything.
create policy user_roles_insert on public.user_roles
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (
      role <> 'PLATFORM_ADMIN'
      and church_id is not null
      and user_id <> (select auth.uid())
      and public.has_church_role(church_id, array['CHURCH_ADMIN']::public.app_role[])
      and exists (
        select 1 from public.church_members m
        where m.church_id = user_roles.church_id and m.user_id = user_roles.user_id and m.status = 'active'
      )
    )
  );

create policy user_roles_delete on public.user_roles
  for delete to authenticated
  using (
    public.is_platform_admin()
    or (
      role <> 'PLATFORM_ADMIN'
      and church_id is not null
      and user_id <> (select auth.uid())
      and public.has_church_role(church_id, array['CHURCH_ADMIN']::public.app_role[])
    )
  );

-- groups -----------------------------------------------------------------------
create policy groups_select on public.groups
  for select to authenticated
  using (
    public.is_church_member(church_id)
    or public.has_church_role(church_id, array['MENTOR','LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
  );

create policy groups_write on public.groups
  for all to authenticated
  using (public.has_church_role(church_id, array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[]))
  with check (public.has_church_role(church_id, array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[]));

-- group_members ----------------------------------------------------------------
create policy group_members_select on public.group_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_group_member(group_id)
    or public.has_church_role(public.group_church_id(group_id), array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
  );

create policy group_members_insert_leader on public.group_members
  for insert to authenticated
  with check (
    public.has_church_role(public.group_church_id(group_id), array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
    and exists (
      select 1 from public.church_members m
      where m.church_id = public.group_church_id(group_members.group_id)
        and m.user_id = group_members.user_id
        and m.status = 'active'
    )
  );

create policy group_members_update_leader on public.group_members
  for update to authenticated
  using (public.has_church_role(public.group_church_id(group_id), array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[]))
  with check (public.has_church_role(public.group_church_id(group_id), array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[]));

create policy group_members_delete on public.group_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_church_role(public.group_church_id(group_id), array['LEADER','PASTOR','CHURCH_ADMIN']::public.app_role[])
  );

-- journey_stages ---------------------------------------------------------------
create policy journey_stages_select on public.journey_stages
  for select to authenticated
  using (true);

create policy journey_stages_write_platform_admin on public.journey_stages
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- audit_log --------------------------------------------------------------------
create policy audit_log_select_platform_admin on public.audit_log
  for select to authenticated
  using (public.is_platform_admin());
