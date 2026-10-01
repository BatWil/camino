-- =============================================================================
-- CAMINO · CONTENIDO DE MINISTERIOS (M5) — ejemplo, no contenido pastoral definitivo
-- Plan "Escuchar el llamado" (5 días, usado por Llamados) y 20 preguntas de práctica
-- de Quiz Bíblico (Romanos). Idempotente. Verifica citas con tu versión con licencia.
-- Aplicar:  psql "$DATABASE_URL" -f supabase/content/002_ministries_content.sql
-- =============================================================================
begin;

insert into public.devotionals (id, title, minutes, scripture_ref, scripture_text, scripture_version, reflection, question, prayer, action, is_published) values
  ('5672636f-30f1-598b-a46c-0af9b7be739c', 'Dios te conoce', 6, 'Jeremías 1:5', 'Antes que te formase en el vientre te conocí… te di por profeta a las naciones.', null, 'Antes de cualquier tarea, Dios conoce a la persona. Un llamado no empieza con lo que haces, sino con quién eres para Él. Nadie es un accidente en sus planes.', '¿Qué cambia saber que Dios te conocía antes de que nacieras?', 'Señor, gracias porque me conoces por completo. Ayúdame a escucharte sin miedo.', 'Escribe en tu diario qué cosas te apasionan y te quiebran el corazón.', true),
  ('f47f1584-dfd3-54b3-8511-8b88fbb18884', 'Venid en pos de mí', 6, 'Marcos 1:17', 'Venid en pos de mí, y haré que seáis pescadores de hombres.', null, 'Jesús llamó a pescadores comunes. Primero los invitó a seguirlo; Él se encargaría de formarlos. El llamado empieza siguiendo a Jesús hoy, no con todo resuelto.', '¿Qué significa para ti seguir a Jesús esta semana?', 'Jesús, quiero seguirte. Fórmame tú para lo que tengas para mí.', 'Haz hoy una cosa concreta que harías si siguieras a Jesús de cerca.', true),
  ('3b16f3bd-58fa-59b3-8880-4d4c24e4c3bb', 'Heme aquí', 6, 'Isaías 6:8', '¿A quién enviaré, y quién irá por nosotros? Entonces respondí yo: Heme aquí, envíame a mí.', null, 'Isaías no respondió por sentirse capaz, sino porque Dios lo había encontrado y transformado. La disponibilidad pesa más que la habilidad.', '¿Qué te haría decir ''heme aquí''? ¿Qué te detiene?', 'Dios, aquí estoy. Quiero estar disponible para lo que tú quieras.', 'Pregunta a un líder de tu iglesia en qué necesitan ayuda.', true),
  ('f13cec37-1ea6-5b63-8a55-a2adf14e01b8', 'No eres demasiado joven', 6, '1 Timoteo 4:12', 'Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza.', null, 'Pablo le dice a Timoteo que su edad no lo descalifica. El ejemplo empieza hoy, en lo que dices y en cómo vives, mucho antes de un título.', '¿En cuál de esas áreas quieres crecer como ejemplo?', 'Señor, úsame hoy, tal como soy. Hazme ejemplo en lo pequeño.', 'Elige un área (palabra, conducta, amor…) y practícala esta semana.', true),
  ('35f0b534-5e4b-5a5d-bf8d-1d6af8466de1', 'Confirmado en comunidad', 6, 'Hechos 13:2–3', 'Dijo el Espíritu Santo: Apartadme a Bernabé y a Saulo para la obra a que los he llamado.', null, 'El llamado de Bernabé y Saulo fue reconocido por su iglesia, que oró por ellos y los envió. Discernir un llamado no se hace a solas: se escucha a Dios junto con quienes te conocen.', '¿Con quién podrías hablar sobre lo que sientes?', 'Espíritu Santo, guíame y pon a mi lado personas que me ayuden a discernir.', 'Pide una conversación con tu pastor desde Llamados.', true)
on conflict (id) do nothing;

insert into public.plans (id, title, summary, category, color, minutes_per_day, recommended_stage_id, growth_areas, is_published)
values ('12098413-6463-5c8c-9302-b710413e4aab', 'Escuchar el llamado', 'Cinco días para escuchar a Dios sobre tu llamado, sin prisa y en comunidad.', 'leadership', '#FF4D5E', 6, (select id from public.journey_stages where key = 'guia'), '{purpose,service}', true)
on conflict (id) do nothing;

insert into public.plan_days (plan_id, day_number, devotional_id) values
  ('12098413-6463-5c8c-9302-b710413e4aab', 1, '5672636f-30f1-598b-a46c-0af9b7be739c'),
  ('12098413-6463-5c8c-9302-b710413e4aab', 2, 'f47f1584-dfd3-54b3-8511-8b88fbb18884'),
  ('12098413-6463-5c8c-9302-b710413e4aab', 3, '3b16f3bd-58fa-59b3-8880-4d4c24e4c3bb'),
  ('12098413-6463-5c8c-9302-b710413e4aab', 4, 'f13cec37-1ea6-5b63-8a55-a2adf14e01b8'),
  ('12098413-6463-5c8c-9302-b710413e4aab', 5, '35f0b534-5e4b-5a5d-bf8d-1d6af8466de1')
on conflict (plan_id, day_number) do nothing;

insert into public.quiz_questions (id, book, chapter, verse_ref, question, options, answer_index) values
  ('e8eeee95-c4ec-5e37-b246-55a36cc400e0', 'ROM', 1, 'Romanos 1:1', '¿Cómo se presenta Pablo al comenzar la carta?', array['Siervo de Jesucristo, llamado a ser apóstol', 'Rey de los judíos', 'Profeta de Israel', 'Discípulo de Pedro'], 0),
  ('8d5dd0b2-a681-51ab-bfa2-1e7d8e8b645b', 'ROM', 1, 'Romanos 1:7', '¿A quiénes está dirigida la carta?', array['A la iglesia de Corinto', 'A todos los que están en Roma, amados de Dios', 'A Timoteo', 'A los gálatas'], 1),
  ('2932a19b-6cdb-5bf0-919f-e77e45611264', 'ROM', 1, 'Romanos 1:16', 'Pablo no se avergüenza del evangelio porque es poder de Dios para…', array['juzgar al mundo', 'salvación de todo aquel que cree', 'hacer milagros', 'vencer a Roma'], 1),
  ('79773652-6288-5ae1-849c-1d327cf0085d', 'ROM', 3, 'Romanos 3:10', 'Según Romanos 3:10, ¿cuántos justos hay?', array['Muchos', 'Doce', 'No hay justo, ni aun uno', 'Solo los profetas'], 2),
  ('0ccf24fb-f98c-59c2-bef9-6089c35edbe2', 'ROM', 3, 'Romanos 3:23', 'Todos pecaron y están destituidos de…', array['la ley de Moisés', 'la gloria de Dios', 'la tierra prometida', 'la sabiduría'], 1),
  ('c7c62c6d-9207-566b-b38b-29449bf343a2', 'ROM', 4, 'Romanos 4:3', '¿Quién creyó a Dios y le fue contado por justicia?', array['Moisés', 'David', 'Abraham', 'Elías'], 2),
  ('0abf060b-9263-5f3a-a9bb-dff6081ccaf3', 'ROM', 5, 'Romanos 5:1', 'Justificados por la fe, tenemos ___ para con Dios.', array['paz', 'temor', 'deudas', 'distancia'], 0),
  ('8a405a26-096e-500f-bb0f-bfe4bdc98145', 'ROM', 5, 'Romanos 5:8', '¿Cómo muestra Dios su amor para con nosotros?', array['Dándonos riquezas', 'En que siendo aún pecadores, Cristo murió por nosotros', 'Quitando todo problema', 'Con señales en el cielo'], 1),
  ('da645b22-e34f-5d4a-92de-6d43562f37a1', 'ROM', 6, 'Romanos 6:4', 'Según Romanos 6:4, ¿con qué fuimos sepultados juntamente con Cristo?', array['Con la ley', 'Con el bautismo', 'Con el ayuno', 'Con la circuncisión'], 1),
  ('a5b10211-2658-5582-bea7-d949d4a9db86', 'ROM', 6, 'Romanos 6:23', 'La paga del pecado es muerte, mas la dádiva de Dios es…', array['vida eterna en Cristo Jesús', 'una segunda oportunidad', 'la ley', 'la riqueza'], 0),
  ('956b65a3-133c-5ee2-804f-d51a685c9b9d', 'ROM', 8, 'Romanos 8:1', 'Ninguna condenación hay para…', array['los que cumplen toda la ley', 'los que están en Cristo Jesús', 'los que nunca pecan', 'los apóstoles'], 1),
  ('62b77ec2-4922-5f89-b2da-ab487492bf2b', 'ROM', 8, 'Romanos 8:28', 'Según Romanos 8:28, ¿a quiénes ayudan todas las cosas para bien?', array['Los que asisten a la iglesia', 'Los que aman a Dios', 'Los que nunca fallan', 'Todos sin excepción'], 1),
  ('bd7c04e1-6219-5402-93b8-79f1a470feb4', 'ROM', 8, 'Romanos 8:38–39', 'Según Romanos 8:38–39, ¿qué nos podrá separar del amor de Dios?', array['La muerte', 'Los ángeles', 'Lo por venir', 'Ninguna cosa creada'], 3),
  ('4373db60-a9a1-5232-8be8-77c19d1ccd22', 'ROM', 10, 'Romanos 10:9', 'Si confiesas con tu boca que Jesús es el Señor y crees en tu corazón que Dios le levantó de los muertos…', array['serás salvo', 'serás profeta', 'nunca sufrirás', 'serás rico'], 0),
  ('8aaaf0e1-cc28-55bf-8bc8-b3289381e844', 'ROM', 10, 'Romanos 10:17', 'La fe viene por…', array['el ver', 'el oír, y el oír por la palabra de Dios', 'las obras', 'la tradición'], 1),
  ('b90176cd-4c85-5071-b00c-82c855d8e51a', 'ROM', 12, 'Romanos 12:1', 'Pablo nos ruega presentar nuestros cuerpos en…', array['sacrificio vivo, santo, agradable a Dios', 'ofrenda de oro', 'ayuno de cuarenta días', 'el templo de Jerusalén'], 0),
  ('67d5f4c6-0654-5797-9536-f06f4da5953c', 'ROM', 12, 'Romanos 12:2', 'No os conforméis a este siglo, sino transformaos por medio de…', array['la renovación de vuestro entendimiento', 'nuevas costumbres', 'la fuerza de voluntad', 'la ley'], 0),
  ('289bc247-9fe0-5917-bd5f-d5ff864aa21c', 'ROM', 12, 'Romanos 12:21', 'No seas vencido de lo malo, sino…', array['huye del mal', 'vence con el bien el mal', 'ignora el mal', 'castiga el mal'], 1),
  ('f2b74e63-d158-5f6f-a1a4-1577163cf21b', 'ROM', 13, 'Romanos 13:10', 'Según Romanos 13:10, el cumplimiento de la ley es…', array['el sacrificio', 'el amor', 'el diezmo', 'el ayuno'], 1),
  ('e875b435-25f4-54f0-8751-6386967e31d9', 'ROM', 16, 'Romanos 16:1', '¿A qué hermana, sierva de la iglesia en Cencrea, recomienda Pablo?', array['Lidia', 'Priscila', 'Febe', 'Dorcas'], 2)
on conflict (id) do nothing;

commit;
