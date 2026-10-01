-- =============================================================================
-- CAMINO · M6 Avisos (in-app notices + push devices + preferences)
--
--  * `notifications` is the in-app inbox (screen 7e). Rows are created only by
--    the triggers below (security definer); users read, mark read and delete
--    their own. Nobody else can read them — not leaders, not admins.
--  * Push is optional and opt-in (`notification_preferences.push_enabled`).
--    The Edge Function `push` (supabase/functions/push) sends a push for each
--    new row, honouring quiet hours and hiding private content on the lock
--    screen (mentor messages, answers). FCM credentials live only in Supabase
--    secrets, never in the app or the repository.
--  * Tone: kind, no guilt, no streak pressure. Gentle reminders ("Tu devocional
--    te espera", "Te extrañamos, sin presión") are LOCAL notifications
--    scheduled on the device from these preferences — no server tracking.
-- =============================================================================

create type public.notification_kind as enum (
  'mentor_message', 'mentorship', 'question_answered', 'new_question', 'conversation_request',
  'event_published', 'plan_invite', 'fine_arts_reviewed', 'offering_confirmed', 'service_decided', 'other'
);
create type public.device_platform as enum ('android', 'ios', 'web');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(body) <= 200),
  href text check (href is null or href ~ '^/[A-Za-z0-9/_?=&%.~-]*$'),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  pushed_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token text not null unique check (char_length(token) between 20 and 4096),
  platform public.device_platform not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index device_tokens_user_idx on public.device_tokens (user_id);

create table public.notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  push_enabled boolean not null default false,
  community boolean not null default true,
  daily_reminder boolean not null default false,
  reminder_time time not null default '19:00',
  quiet_start time not null default '21:30',
  quiet_end time not null default '08:00',
  updated_at timestamptz not null default now()
);
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Internal helper (never callable through the API)
-- -----------------------------------------------------------------------------
create or replace function public.notify(p_user uuid, p_kind public.notification_kind, p_title text, p_body text, p_href text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, href)
  select p_user, p_kind, left(p_title, 120), left(p_body, 200), p_href
  where p_user is not null;
$$;
revoke all on function public.notify(uuid, public.notification_kind, text, text, text) from public, anon, authenticated;

create or replace function public.short_quote(p text, p_len int default 60)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p is null then null
              when char_length(p) <= p_len then '“' || p || '”'
              else '“' || rtrim(left(p, p_len - 1)) || '…”' end;
$$;

create or replace function public.short_date(p timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$
  select extract(day from p at time zone 'UTC')::int || ' ' ||
         (array['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[extract(month from p at time zone 'UTC')::int];
$$;

-- -----------------------------------------------------------------------------
-- Triggers that create notices
-- -----------------------------------------------------------------------------
create or replace function public.notify_mentorship_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.mentorships%rowtype;
  v_to uuid;
  v_name text;
begin
  select * into m from public.mentorships where id = new.mentorship_id;
  v_to := case when new.sender_id = m.mentor_id then m.mentee_id else m.mentor_id end;
  v_name := public.first_name(new.sender_id);
  perform public.notify(v_to, 'mentor_message',
    case new.kind
      when 'meeting' then v_name || ' propone una reunión'
      when 'checkin' then v_name || ' compartió su check-in'
      else v_name || ' te escribió' end,
    case when new.kind = 'text' then left(new.body, 90) else null end,
    '/mentoria/?id=' || new.mentorship_id);
  return new;
end;
$$;
create trigger mentorship_messages_notify after insert on public.mentorship_messages
  for each row execute function public.notify_mentorship_message();

create or replace function public.notify_mentorship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'active' then
    perform public.notify(new.mentee_id, 'mentorship', 'Tienes un mentor: ' || public.first_name(new.mentor_id),
      'Alguien de tu iglesia para caminar contigo.', '/mentoria/?id=' || new.id);
    perform public.notify(new.mentor_id, 'mentorship', 'Vas a acompañar a ' || public.first_name(new.mentee_id),
      'Solo verás lo que te comparta.', '/mentoria/?id=' || new.id);
  end if;
  return new;
end;
$$;
create trigger mentorships_notify after insert on public.mentorships
  for each row execute function public.notify_mentorship();

create or replace function public.notify_question_answered()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.questions%rowtype;
begin
  if tg_op = 'UPDATE' and new.body is not distinct from old.body then return new; end if;
  select * into q from public.questions where id = new.question_id;
  perform public.notify(q.author_id, 'question_answered', 'Tu pregunta fue respondida', public.short_quote(q.body), '/preguntas');
  return new;
end;
$$;
create trigger question_answers_notify after insert or update on public.question_answers
  for each row execute function public.notify_question_answered();

-- Leaders learn there is a new question — never who asked.
create or replace function public.notify_new_question()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body, href)
  select distinct r.user_id, 'new_question'::public.notification_kind, 'Hay una pregunta nueva', 'Respóndela con calma desde el panel.', '/leader/preguntas'
  from public.user_roles r
  where r.church_id = new.church_id and r.role in ('LEADER', 'PASTOR', 'CHURCH_ADMIN') and r.user_id <> new.author_id;
  return new;
end;
$$;
create trigger questions_notify after insert on public.questions
  for each row execute function public.notify_new_question();

create or replace function public.notify_conversation_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body, href)
  select distinct r.user_id, 'conversation_request'::public.notification_kind,
    public.first_name(new.user_id) || case new.with_role when 'mentor' then ' quiere un mentor' else ' pide conversación' end,
    null, '/leader/jovenes'
  from public.user_roles r
  where r.church_id = new.church_id and r.user_id <> new.user_id
    and r.role in ('LEADER', 'PASTOR', 'CHURCH_ADMIN');
  return new;
end;
$$;
create trigger conversation_requests_notify after insert on public.conversation_requests
  for each row execute function public.notify_conversation_request();

create or replace function public.notify_event_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_published or (tg_op = 'UPDATE' and old.is_published) or new.starts_at < now() then
    return new;
  end if;
  insert into public.notifications (user_id, kind, title, body, href)
  select m.user_id, 'event_published'::public.notification_kind, 'Nuevo evento: ' || new.title,
    (select name from public.churches where id = new.church_id) || ' · ' || public.short_date(new.starts_at),
    '/evento/?id=' || new.id
  from public.church_members m
  where m.church_id = new.church_id and m.status = 'active' and m.user_id is distinct from new.created_by;
  return new;
end;
$$;
create trigger events_notify after insert or update of is_published on public.events
  for each row execute function public.notify_event_published();

create or replace function public.notify_plan_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from uuid;
  v_title text;
begin
  select up.user_id, p.title into v_from, v_title
  from public.user_plans up join public.plans p on p.id = up.plan_id where up.id = new.user_plan_id;
  perform public.notify(new.companion_id, 'plan_invite', public.first_name(v_from) || ' te invitó a un plan',
    'Hagan juntos “' || v_title || '”.', '/comunidad');
  return new;
end;
$$;
create trigger plan_companions_notify after insert on public.plan_companions
  for each row execute function public.notify_plan_invite();

create or replace function public.notify_fine_arts_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'returned') then
    perform public.notify(new.user_id, 'fine_arts_reviewed',
      case when new.status = 'approved' then 'Tu presentación fue aprobada ✦' else 'Tu líder sugiere cambios' end,
      new.leader_note, '/bellas-artes');
  end if;
  return new;
end;
$$;
create trigger fine_arts_notify after update of status on public.fine_arts_entries
  for each row execute function public.notify_fine_arts_review();

create or replace function public.notify_offering()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.mission_program;
begin
  if new.status = 'confirmed' and old.status <> 'confirmed' then
    select program into v_program from public.mission_campaigns where id = new.campaign_id;
    perform public.notify(new.user_id, 'offering_confirmed', 'Tu ofrenda fue recibida ✦', 'Gracias por dar.',
      '/misiones/?programa=' || v_program);
  end if;
  return new;
end;
$$;
create trigger mission_offerings_notify after update of status on public.mission_offerings
  for each row execute function public.notify_offering();

create or replace function public.notify_service_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    perform public.notify(new.user_id, 'service_decided',
      '¡Te esperan en ' || (select title from public.service_opportunities where id = new.opportunity_id) || '!',
      'Un líder te contactará para empezar.', '/servir');
  end if;
  return new;
end;
$$;
create trigger service_requests_notify after update of status on public.service_requests
  for each row execute function public.notify_service_decision();

-- -----------------------------------------------------------------------------
-- RPCs
-- -----------------------------------------------------------------------------
create or replace function public.mark_notifications_read()
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

-- Registers (or moves) a device token to the caller. A token belongs to one account at a time.
create or replace function public.register_device(p_token text, p_platform public.device_platform)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  insert into public.device_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, last_seen_at = now();
end;
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.notifications             enable row level security;
alter table public.device_tokens             enable row level security;
alter table public.notification_preferences  enable row level security;

revoke all on public.notifications, public.device_tokens, public.notification_preferences from anon;
revoke insert, update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke insert, update on public.device_tokens from authenticated;

create policy notifications_own on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_read on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

create policy device_tokens_own on public.device_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy device_tokens_delete on public.device_tokens for delete to authenticated using (user_id = (select auth.uid()));

create policy notification_prefs_own on public.notification_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

do $$
declare
  f text;
begin
  foreach f in array array['public.mark_notifications_read()', 'public.register_device(text, public.device_platform)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke all on function public.short_quote(text, int) from public, anon;
revoke all on function public.short_date(timestamptz) from public, anon;
