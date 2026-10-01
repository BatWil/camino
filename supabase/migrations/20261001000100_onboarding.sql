-- =============================================================================
-- CAMINO · M1 Auth + Onboarding
-- Onboarding answers on the (owner-only) profile, server-side computation of the
-- starting journey stage, church preview by code, private avatar storage.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Onboarding vocabularies
-- -----------------------------------------------------------------------------
create type public.faith_status as enum (
  'knowing_god',     -- Estoy conociendo a Dios
  'starting',        -- Estoy comenzando
  'growing',         -- Quiero crecer
  'returning',       -- Quiero volver a acercarme
  'serving',         -- Ya sirvo en mi iglesia
  'helping_others'   -- Quiero ayudar a otros
);

create type public.growth_area as enum (
  'bible', 'prayer', 'consistency', 'identity', 'purpose', 'relationships', 'service', 'evangelism'
);

create type public.expectation as enum (
  'closer_to_god',            -- Quiero acercarme más a Dios
  'start_again',              -- Quiero volver a comenzar
  'understand_bible',         -- Quiero entender la Biblia
  'learn_to_pray',            -- Quiero aprender a orar
  'going_through_something',  -- Estoy pasando por algo
  'discover_purpose',         -- Quiero descubrir mi propósito
  'serve',                    -- Quiero servir
  'share_faith'               -- Quiero compartir mi fe
);

alter table public.profiles
  add column faith_status public.faith_status,
  add column growth_areas public.growth_area[] not null default '{}',
  add column expectations public.expectation[] not null default '{}',
  add column current_stage_id uuid references public.journey_stages (id) on delete set null,
  add constraint profiles_growth_areas_len check (cardinality(growth_areas) <= 8),
  add constraint profiles_expectations_len check (cardinality(expectations) <= 8);

-- -----------------------------------------------------------------------------
-- Column-level privileges on profiles.
-- Users edit their own identity and preferences; journey position and the
-- onboarding timestamp are only written by server functions.
-- -----------------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_path, birth_date, locale, faith_status, growth_areas, expectations)
  on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Starting stage. Accompanies discernment: it is a starting point, never a
-- label, and every stage remains explorable.
-- -----------------------------------------------------------------------------
create or replace function public.starting_stage_key(p_status public.faith_status)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'knowing_god'    then 'encuentra'
    when 'starting'       then 'encuentra'
    when 'returning'      then 'encuentra'
    when 'growing'        then 'crece'
    when 'serving'        then 'sirve'
    when 'helping_others' then 'comparte'
    else 'encuentra'
  end;
$$;

-- Minimum age to create an account without a guardian flow (see docs/supabase.md).
create or replace function public.min_account_age()
returns integer
language sql
immutable
set search_path = ''
as $$ select 13 $$;

-- -----------------------------------------------------------------------------
-- RPC · complete_onboarding
-- -----------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_display_name text,
  p_birth_date date,
  p_faith_status public.faith_status,
  p_growth_areas public.growth_area[],
  p_expectations public.expectation[]
)
returns table (stage_key text, stage_name text, stage_description text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_display_name, ''));
  v_stage public.journey_stages%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 1 and 80 then
    raise exception 'invalid display name' using errcode = '22023';
  end if;
  if p_birth_date is null or p_birth_date > current_date or p_birth_date < date '1900-01-01' then
    raise exception 'invalid birth date' using errcode = '22023';
  end if;
  if extract(year from age(current_date, p_birth_date)) < public.min_account_age() then
    raise exception 'minimum age not met' using errcode = '22023', hint = 'min_age';
  end if;
  if p_faith_status is null then
    raise exception 'faith status required' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_growth_areas), 0) = 0 or coalesce(cardinality(p_expectations), 0) = 0 then
    raise exception 'choose at least one option' using errcode = '22023';
  end if;

  select * into v_stage from public.journey_stages s
  where s.key = public.starting_stage_key(p_faith_status);

  update public.profiles p set
    display_name = v_name,
    birth_date = p_birth_date,
    faith_status = p_faith_status,
    growth_areas = (select array_agg(distinct a) from unnest(p_growth_areas) a),
    expectations = (select array_agg(distinct e) from unnest(p_expectations) e),
    -- Re-running onboarding never moves someone backwards on their journey.
    current_stage_id = coalesce(p.current_stage_id, v_stage.id),
    onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
  where p.id = v_uid;

  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  return query
    select s.key, s.name, s.description
    from public.profiles p
    join public.journey_stages s on s.id = p.current_stage_id
    where p.id = v_uid;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC · preview_church_by_code — shows "Iglesia Vida Nueva · Ciudad" before
-- joining (screen 4b). Returns only public identity, never ids or settings.
-- -----------------------------------------------------------------------------
create or replace function public.preview_church_by_code(p_code text)
returns table (church_name text, city text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_code !~ '^[A-Z0-9]{6,12}$' then
    return;
  end if;
  return query
    select c.name, c.city from public.churches c
    where c.join_code = v_code and c.is_active;
end;
$$;

revoke all on function public.starting_stage_key(public.faith_status) from public, anon;
revoke all on function public.min_account_age() from public, anon;
revoke all on function public.complete_onboarding(text, date, public.faith_status, public.growth_area[], public.expectation[]) from public, anon;
revoke all on function public.preview_church_by_code(text) from public, anon;
grant execute on function public.starting_stage_key(public.faith_status) to authenticated;
grant execute on function public.min_account_age() to authenticated;
grant execute on function public.complete_onboarding(text, date, public.faith_status, public.growth_area[], public.expectation[]) to authenticated;
grant execute on function public.preview_church_by_code(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage · avatars (private bucket). Path: {user_id}/avatar.webp
-- Images are re-encoded on the device (strips EXIF/GPS) before upload.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
