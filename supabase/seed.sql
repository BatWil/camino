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

-- M4 · Comunidad (dev only) ---------------------------------------------------------------
insert into public.series (id, church_id, title, total_topics, current_topic, current_title)
values ('d0000000-0000-4000-8000-000000000201', 'd0000000-0000-4000-8000-000000000001',
  'Conforme a su corazón', 6, 3, 'David: un corazón que vuelve')
on conflict (id) do nothing;

insert into public.ministries (id, church_id, name, area, description) values
  ('d0000000-0000-4000-8000-000000000301', 'd0000000-0000-4000-8000-000000000001', 'Ministerio de niños', 'care', 'Acompañar a los más pequeños los domingos.'),
  ('d0000000-0000-4000-8000-000000000302', 'd0000000-0000-4000-8000-000000000001', 'Multimedia', 'tech', 'Pantallas, transmisión y redes.'),
  ('d0000000-0000-4000-8000-000000000303', 'd0000000-0000-4000-8000-000000000001', 'Bienvenida', 'service', 'Recibir a quienes llegan por primera vez.')
on conflict (id) do nothing;

insert into public.service_opportunities (id, church_id, ministry_id, title, schedule_text, area, spots) values
  ('d0000000-0000-4000-8000-000000000311', 'd0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000301', 'Ministerio de niños', 'Domingos', 'care', 2),
  ('d0000000-0000-4000-8000-000000000312', 'd0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000302', 'Multimedia', 'Sábados · capacitación incluida', 'tech', 2),
  ('d0000000-0000-4000-8000-000000000313', 'd0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000303', 'Bienvenida', 'Noche de jóvenes', 'service', null)
on conflict (id) do nothing;

insert into public.events (id, church_id, title, description, starts_at, ends_at, location_name, cost_text, capacity) values
  ('d0000000-0000-4000-8000-000000000401', 'd0000000-0000-4000-8000-000000000001', 'Campamento 2026',
   'Tres días para desconectarte y encontrarte con Dios: alabanza, talleres, deportes y fogatas.',
   '2026-10-24 16:00-06', '2026-10-26 14:00-06', 'Rancho El Cielo', '$1,200 MXN', 120),
  ('d0000000-0000-4000-8000-000000000402', 'd0000000-0000-4000-8000-000000000001', 'Evangelismo',
   'Salimos juntos a servir y compartir esperanza en el barrio.',
   '2026-11-02 10:00-06', null, 'Parque Central', 'Gratis', null)
on conflict (id) do nothing;
