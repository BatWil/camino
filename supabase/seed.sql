-- =============================================================================
-- DEVELOPMENT SEED DATA · NOT FOR PRODUCTION
-- Demo tenant used to preview the screens locally. Loaded by `supabase db reset`.
-- =============================================================================

insert into public.churches (id, name, slug, join_code, city, country_code, settings)
values (
  'd0000000-0000-4000-8000-000000000001',
  'Iglesia Vida Nueva',
  'vida-nueva-dev',
  'VIDANUEVA',
  'Ciudad de México',
  'MX',
  '{"dev_seed": true}'
)
on conflict (id) do nothing;

insert into public.groups (id, church_id, name, meeting_schedule)
values (
  'd0000000-0000-4000-8000-000000000101',
  'd0000000-0000-4000-8000-000000000001',
  'Jóvenes Universitarios',
  'Viernes · 7:00 PM'
)
on conflict (id) do nothing;

-- Demo people (Daniel, Carlos) are NOT created here: register them through the
-- app, then run the snippet in docs/supabase.md ("Datos de demostración") to
-- attach them to the demo church, group and mentor role.
