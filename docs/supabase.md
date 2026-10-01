# Supabase · esquema, multi-iglesia y seguridad

## Principios

- **Deny by default**: todas las tablas de `public` tienen RLS activado (una prueba lo verifica).
  `anon` no tiene privilegios sobre ninguna tabla ni función.
- Nunca se usa `service_role` en el cliente. Solo Edge Functions (futuro) lo usan.
- Helpers `SECURITY DEFINER` con `search_path` fijado (otra prueba lo verifica) evitan recursión de RLS.
- Acciones administrativas sensibles se registran en `audit_log` (solo lectura para PLATFORM_ADMIN).

## Migración M0 — `supabase/migrations/20260930000100_foundation.sql`

| Tabla                     | Propósito                                                                             | Acceso (RLS)                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`                | 1:1 con `auth.users`. Nombre, avatar, fecha de nacimiento, onboarding                 | **Solo el dueño** lee/edita. Ni líderes ni admins (posibles menores)                                                                 |
| `churches`                | Tenants: `slug`, `join_code` único (código/QR), `settings` (toggles de ministerios)   | Miembros activos y roles de esa iglesia; crear/borrar solo PLATFORM_ADMIN; editar CHURCH_ADMIN                                       |
| `church_members`          | Pertenencia usuario↔iglesia (`pending/active/inactive`)                               | Ves la tuya; LEADER/PASTOR/CHURCH_ADMIN ven las de su iglesia. Unirse solo vía RPC                                                   |
| `user_roles`              | Multirol: MENTOR, LEADER, PASTOR, CHURCH_ADMIN (por iglesia), PLATFORM_ADMIN (global) | Sin auto-asignación; CHURCH_ADMIN gestiona roles de miembros de su iglesia (no el propio, no PLATFORM_ADMIN). Inmutables + auditados |
| `groups`, `group_members` | Grupos pequeños                                                                       | Miembros de la iglesia ven grupos; roster visible a sus miembros y líderes; escritura por líderes                                    |
| `journey_stages`          | Las 6 etapas (datos de referencia)                                                    | Lectura para autenticados; escritura PLATFORM_ADMIN                                                                                  |
| `audit_log`               | Bitácora append-only                                                                  | Lectura PLATFORM_ADMIN; nadie escribe vía API                                                                                        |

`USER` es implícito para toda cuenta y no se guarda en `user_roles`.

RPC `join_church_by_code(p_code)`: normaliza el código, valida formato, une al usuario como miembro activo
y devuelve solo `{church_id, church_name, city}`. No permite enumerar iglesias.

Triggers: `handle_new_user` (crea perfil vacío copiando solo el nombre del registro), auditoría de roles y de
cambios de estado de membresía, inmutabilidad de `user_roles`, `updated_at`.

## Migración M1 — `supabase/migrations/20261001000100_onboarding.sql`

- `profiles` + `faith_status`, `growth_areas[]`, `expectations[]` (enums) y `current_stage_id`.
- **Privilegios por columna**: el usuario edita nombre, avatar, fecha de nacimiento, idioma y preferencias;
  `onboarding_completed_at` y `current_stage_id` solo los escribe el servidor.
- RPC `complete_onboarding(...)`: valida (nombre, fecha, **edad mínima 13 años**, al menos una opción) y calcula
  la etapa inicial en el servidor (`starting_stage_key`): conociendo/comenzando/volviendo → ENCUENTRA,
  quiero crecer → CRECE, ya sirvo → SIRVE, ayudar a otros → COMPARTE. Nunca retrocede a alguien que ya avanzó.
- RPC `preview_church_by_code(code)`: devuelve solo nombre y ciudad (tarjeta de 4b); no da acceso a la iglesia.
- Storage `avatars`: bucket **privado**, 2 MB, WebP/JPEG/PNG; cada usuario solo lee/escribe `{su_id}/…`.
  La app recorta y re-codifica la foto en el dispositivo (elimina EXIF/GPS) antes de subirla.

### Configuración necesaria en el panel de Supabase (M1)

- **Authentication → URL Configuration → Redirect URLs**:
  `http://localhost:3000/**`, tu dominio de producción `https://<dominio>/**`, `camino://auth/callback`,
  `camino://auth/nueva-contrasena`.
- **Authentication → Providers → Email**: contraseña mínima 8.
- **Google**: crear OAuth Client (Google Cloud Console), pegar Client ID/Secret en Providers → Google y añadir
  `google` a `NEXT_PUBLIC_AUTH_PROVIDERS`. **Apple**: igual con Services ID + key (requiere Apple Developer).
- Para correos reales en producción, configurar SMTP propio (el de Supabase tiene límites bajos).

## Migración M2 — `supabase/migrations/20261002000100_core_journey.sql`

| Tabla                                | Propósito                                                                                  | Acceso                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `devotionals`                        | 6 partes del diseño 2e (leer, reflexionar, pregunta, oración, acción + cita)               | Publicado: todos (PLATFORM) o miembros (CHURCH). Escribe: PLATFORM_ADMIN / líderes de esa iglesia |
| `plans`, `plan_days`                 | Planes por días (`source` PLATFORM/CHURCH, categoría, color, etapa recomendada, intereses) | Igual que devocionales                                                                            |
| `journey_modules`                    | Nodos de Mi Camino por etapa (devocional, plan o experiencia; opcionales)                  | Lectura autenticados; escribe PLATFORM_ADMIN                                                      |
| `challenges`                         | Retos semanales/diarios                                                                    | Igual que devocionales                                                                            |
| `devotional_progress`                | Pasos vistos + **respuesta privada**                                                       | Solo el dueño (ni líderes ni admins)                                                              |
| `user_plans`, `plan_day_completions` | Inscripción y días completados                                                             | Solo el dueño                                                                                     |
| `plan_companions`                    | "Hacerlo con un amigo" (modelado; UI en M4 con salvaguardas)                               | Dueño o compañero                                                                                 |
| `user_module_progress`               | Estado de cada módulo                                                                      | Solo el dueño                                                                                     |
| `challenge_checkins`                 | Días marcados del reto                                                                     | Solo el dueño                                                                                     |
| `activity_days`                      | **Tu ritmo**: solo fechas con actividad, nunca contenido                                   | Solo el dueño                                                                                     |

- El progreso **no se escribe directamente**: solo vía RPC (`save_devotional_progress`, `complete_devotional`,
  `start_plan`, `leave_plan`, `challenge_checkin`). `complete_devotional` encadena en el servidor:
  día del plan → plan completado → módulo → **avance de etapa** cuando todos los módulos obligatorios están hechos
  (nunca retrocede; las etapas futuras siguen explorables; queda en `audit_log`).
- "Hoy" usa `profiles.timezone` (la app la sincroniza con el dispositivo). El reto solo permite marcar **hoy**.

## Contenido inicial (ejemplo)

`supabase/content/001_starter_content.sql` — módulos para las 6 etapas, planes "Construyendo constancia" y
"Ansiedad y confianza" (7 días c/u), el devocional del diseño 2e y el reto "Ora por un amigo". Es idempotente.
Las citas bíblicas son breves y aproximadas: **verifícalas con la versión con licencia** antes de publicar.

```bash
# Local: se carga con `supabase db reset`. Remoto: pegarlo en SQL Editor, o
psql "$DATABASE_URL" -f supabase/content/001_starter_content.sql
```

## Pruebas de RLS

```bash
npm run test:db                              # levanta un Postgres temporal (binarios locales)
DATABASE_URL=postgres://… npm run test:db    # o contra una base vacía (CI)
```

`supabase/tests/00_supabase_shim.sql` emula lo mínimo de Supabase (roles `anon`/`authenticated`, `auth.users`,
`auth.uid()` desde `request.jwt.claims`). Las pruebas (`supabase/tests/rls/`) actúan como cada usuario, igual
que PostgREST, y cubren: aislamiento entre iglesias, perfil privado incluso para admins, anon sin acceso,
unión por código (válido, inválido, malformado, idempotente), escalamiento de roles, límites del CHURCH_ADMIN,
auditoría, grupos, onboarding (edad, validación, etapa inicial, columnas protegidas), vista previa de iglesia y
permisos del bucket de avatares, contenido por iglesia, progreso privado, cascada plan → módulo → etapa,
retos e integridad del contenido inicial. **103 aserciones, todas pasan.**

## Esquema planificado (siguientes milestones)

| Milestone | Tablas                                                                                                                                                                                                                                                                                                      | Notas de privacidad                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| M1        | `profile_preferences` (etapa inicial, intereses, expectativas), bucket `avatars`                                                                                                                                                                                                                            | Solo el dueño                                                           |
| M2        | `journey_modules`, `user_journey_progress`, `devotionals`, `devotional_steps`, `devotional_progress`, `plans` (`source`: PLATFORM/CHURCH/RECOMMENDED, `church_id` nullable), `plan_days`, `user_plans`, `plan_partners` (hacerlo con un amigo), `challenges`, `challenge_progress`, `activity_days` (ritmo) | Progreso propio; mentor ve resumen vía función acotada                  |
| M3        | `bible_notes`, `bible_highlights`, `bible_bookmarks`, `journal_entries` (+ `journal_attachments`), `prayers` (`privacy` PRIVATE por defecto), `prayer_updates`, `check_ins` (`shared_with_mentor` false por defecto), `moments`                                                                             | **Diario sin política para nadie más que el dueño** — ni PLATFORM_ADMIN |
| M4        | `mentorships`, `mentor_conversation_requests`, `questions` (`is_anonymous`; autor oculto por vista/función), `question_answers`, `events`, `event_registrations`, `ministries`, `ministry_members`, `service_opportunities`, `service_requests`, `series`                                                   | Mentor solo ve lo compartido explícitamente                             |
| M5        | `conferences`, `conference_registrations`, `conference_sessions`, `conference_agenda_items`, `fine_arts_entries` (+ bucket con validación MIME/tamaño), `bible_quiz_questions`, `quiz_attempts`, `mission_campaigns`, `mission_contributions` (monto individual privado; totales por función agregada)      |                                                                         |
| M6        | `notifications`, `device_tokens`                                                                                                                                                                                                                                                                            |                                                                         |

## Datos de demostración (solo desarrollo)

`supabase/seed.sql` crea **Iglesia Vida Nueva** (código `VIDANUEVA`) y el grupo **Jóvenes Universitarios**,
marcados con `settings.dev_seed`. Las personas se crean registrándose en la app (daniel@… y carlos@…); luego,
en el SQL editor local:

```sql
-- DEV ONLY
insert into church_members (church_id, user_id)
select 'd0000000-0000-4000-8000-000000000001', id from auth.users where email in ('daniel@camino.dev','carlos@camino.dev')
on conflict do nothing;
insert into group_members (group_id, user_id)
select 'd0000000-0000-4000-8000-000000000101', id from auth.users where email = 'daniel@camino.dev'
on conflict do nothing;
insert into user_roles (user_id, role, church_id)
select id, 'MENTOR', 'd0000000-0000-4000-8000-000000000001' from auth.users where email = 'carlos@camino.dev'
on conflict do nothing;
update profiles set display_name = 'Daniel Ríos' where id = (select id from auth.users where email = 'daniel@camino.dev');
update profiles set display_name = 'Carlos Méndez' where id = (select id from auth.users where email = 'carlos@camino.dev');
```

## Tipos

`src/lib/supabase/database.types.ts` refleja el esquema a mano en M0. Con el stack local:
`npm run db:types` genera `database.generated.ts` para compararlo/reemplazarlo.

## Desplegar a un proyecto remoto

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push          # aplica migraciones (NO aplica seed)
```
