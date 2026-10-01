# Avisos y notificaciones (M6)

Pocos, amables y **opt-in**. Nunca culpa, nunca rachas, nunca a deshoras.

## Piezas

| Pieza                 | Dónde                                                | Qué hace                                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bandeja "Avisos" (7e) | `/avisos`, campana en Inicio                         | Avisos creados por triggers en `public.notifications`. Solo el dueño los lee. Abrir la pantalla los marca leídos.                                                                                            |
| Preferencias          | Perfil → Avisos y recordatorios (`/perfil/avisos`)   | Push en este teléfono, eventos e invitaciones, recordatorio amable + hora, horario de descanso.                                                                                                              |
| Recordatorios amables | En el dispositivo (`@capacitor/local-notifications`) | "Tu devocional te espera" diario a la hora elegida y **un solo** "Te extrañamos, sin presión" 7 días después de la última vez que abriste la app (se reprograma en cada apertura). No pasan por el servidor. |
| Push                  | Edge Function `supabase/functions/push` + FCM        | Un push por aviso nuevo si la persona lo activó; respeta horario de descanso, máximo 6 al día, y oculta el contenido privado en la pantalla bloqueada ("Abre Camino para verlo.").                           |

### Qué genera avisos

Mensaje de mentoría · mentor asignado · pregunta respondida (al autor) · pregunta nueva (a líderes, **sin
autor**) · solicitud de conversación (a líderes) · evento publicado (a los miembros, no al creador) · invitación a
plan · Bellas Artes revisada · ofrenda recibida · solicitud de servicio aceptada.

### Permisos

Nunca se piden al abrir la app. Solo cuando la persona activa un interruptor en Perfil → Avisos. En Android 13+
se usa `POST_NOTIFICATIONS`; no se pide alarma exacta (los recordatorios pueden llegar con unos minutos de
diferencia, a propósito).

## Configurar push (una vez por proyecto)

1. **Firebase**: crea un proyecto, agrega la app Android `app.camino` y descarga `google-services.json`.
   - Local: cópialo a `android/app/google-services.json` (ignorado por git).
   - CI: guarda su base64 en el secret `GOOGLE_SERVICES_JSON_BASE64`.
   - iOS (M7): sube la clave APNs a Firebase.
2. **Cuenta de servicio**: Firebase → Configuración → Cuentas de servicio → _Generar nueva clave privada_.
3. **Secrets de Supabase** (Dashboard → Edge Functions → Secrets, o CLI):
   ```bash
   npx supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)"
   npx supabase secrets set PUSH_WEBHOOK_SECRET="$(openssl rand -hex 32)"
   ```
   Borra el archivo JSON de tu computadora después. Nunca lo subas al repositorio.
4. **Desplegar la función**: `npx supabase functions deploy push`
5. **Webhook**: Dashboard → Database → Webhooks → _Create_:
   - Tabla `public.notifications`, evento **INSERT**.
   - Tipo _Supabase Edge Functions_ → `push`, método POST.
   - Header `x-camino-webhook: <el mismo PUSH_WEBHOOK_SECRET>`.
6. En el teléfono: Perfil → Avisos y recordatorios → _Notificaciones en este teléfono_.

Sin estos pasos la app funciona igual: los avisos aparecen dentro de Camino.

## Privacidad

- `notifications`, `device_tokens` y `notification_preferences`: solo el dueño (ni líderes ni PLATFORM_ADMIN).
- Un teléfono compartido: al iniciar sesión con otra cuenta el token pasa a la nueva (`register_device`).
- El canal Android "avisos" usa visibilidad privada en la pantalla bloqueada.
- Las pruebas están en `supabase/tests/rls/08_notifications.sql` y la lógica del envío en
  `supabase/functions/push/logic.test.ts`.
