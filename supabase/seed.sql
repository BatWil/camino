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

-- M5 · Ministerios (dev only) -------------------------------------------------------------
insert into public.conferences (id, title, tagline, hub_title, badge, starts_on, ends_on, location, highlights, fine_arts_deadline, is_published)
values ('d0000000-0000-4000-8000-000000000501', 'Conferencia Nacional de Jóvenes',
  'Prepárate para un encuentro inolvidable con Dios.', '¿Quién irá? St. Louis 2027', 'STL·27',
  '2027-07-26', '2027-07-30', 'St. Louis, MO',
  '{Deportes,"Bellas Artes",Masterclasses,Talleres,"Servicios de noche",Exhibición}', '2027-05-15', true)
on conflict (id) do nothing;

insert into public.conference_sessions (id, conference_id, day, starts_at, kind, title, place) values
  ('d0000000-0000-4000-8000-000000000511', 'd0000000-0000-4000-8000-000000000501', '2027-07-26', '09:00', 'workshop', 'Identidad en un mundo digital', 'Sala 204'),
  ('d0000000-0000-4000-8000-000000000512', 'd0000000-0000-4000-8000-000000000501', '2027-07-26', '14:00', 'sports', 'Básquetbol · ronda 1', 'Cancha B'),
  ('d0000000-0000-4000-8000-000000000513', 'd0000000-0000-4000-8000-000000000501', '2027-07-26', '19:00', 'night', 'Apertura', 'Dome · Arena'),
  ('d0000000-0000-4000-8000-000000000514', 'd0000000-0000-4000-8000-000000000501', '2027-07-27', '10:00', 'masterclass', 'Liderar con propósito', 'Sala 110'),
  ('d0000000-0000-4000-8000-000000000515', 'd0000000-0000-4000-8000-000000000501', '2027-07-27', '13:00', 'fine_arts', 'Bellas Artes · Canto solista', 'Teatro 2'),
  ('d0000000-0000-4000-8000-000000000516', 'd0000000-0000-4000-8000-000000000501', '2027-07-27', '16:00', 'exhibit', 'Ministerios y universidades', 'Hall A'),
  ('d0000000-0000-4000-8000-000000000517', 'd0000000-0000-4000-8000-000000000501', '2027-07-27', '19:00', 'night', 'Noche de adoración', 'Dome · Arena'),
  ('d0000000-0000-4000-8000-000000000518', 'd0000000-0000-4000-8000-000000000501', '2027-07-28', '09:30', 'workshop', 'Evangelismo en tu escuela', 'Sala 301'),
  ('d0000000-0000-4000-8000-000000000519', 'd0000000-0000-4000-8000-000000000501', '2027-07-28', '15:00', 'sports', 'Pickleball · dobles', 'Cancha D'),
  ('d0000000-0000-4000-8000-000000000520', 'd0000000-0000-4000-8000-000000000501', '2027-07-28', '19:00', 'night', 'Llamado a misiones', 'Dome · Arena'),
  ('d0000000-0000-4000-8000-000000000521', 'd0000000-0000-4000-8000-000000000501', '2027-07-29', '10:00', 'fine_arts', 'Premiación', 'Teatro 1'),
  ('d0000000-0000-4000-8000-000000000522', 'd0000000-0000-4000-8000-000000000501', '2027-07-29', '19:00', 'night', 'Noche del Espíritu', 'Dome · Arena'),
  ('d0000000-0000-4000-8000-000000000523', 'd0000000-0000-4000-8000-000000000501', '2027-07-30', '09:00', 'closing', 'Envío y oración', 'Dome · Arena')
on conflict (id) do nothing;

insert into public.mission_campaigns (id, church_id, program, title, goal_amount, currency, year, story_title, story_quote)
values ('d0000000-0000-4000-8000-000000000601', 'd0000000-0000-4000-8000-000000000001', 'speed_the_light',
  'Una camioneta en Guatemala', 60000, 'MXN', 2026, 'Familia Ortiz · Guatemala', 'Con este vehículo llegaremos a 12 aldeas.')
on conflict (id) do nothing;

insert into public.resources (id, kind, title, eyebrow, description, color, position) values
  ('d0000000-0000-4000-8000-000000000701', 'guided_journal', 'Diario guiado', 'Devocional del estudiante',
   'Guiado por Dios, no por la cultura. Un hábito diario con su Palabra.', '#C6F432', 0),
  ('d0000000-0000-4000-8000-000000000702', 'book', 'Identidad sin filtros', null, null, '#3D8BFF', 1),
  ('d0000000-0000-4000-8000-000000000703', 'book', 'Lleno del Espíritu', null, null, '#FF6B4A', 2),
  ('d0000000-0000-4000-8000-000000000704', 'book', 'Fe en la escuela', null, null, '#35D07F', 3)
on conflict (id) do nothing;

insert into public.calling_stories (id, quote, author)
values ('d0000000-0000-4000-8000-000000000801', 'A los 16 sentí el llamado. Hoy pastoreo jóvenes.', 'Pastora Ana (ejemplo)')
on conflict (id) do nothing;
