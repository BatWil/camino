# Roadmap por milestones

| Milestone                  | Estado        | Alcance                                                                                                                   |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **M0 · Foundation**        | ✅ Completado | Proyecto, Design System, arquitectura, Supabase + RLS inicial, auth base, PWA, Capacitor Android, layouts, navegación, CI |
| **M1 · Auth + Onboarding** | ✅ Completado | Registro, Google, Apple (preparado), recuperación, onboarding 6 pasos, unirse a iglesia (código/QR), avatar               |
| **M2 · Core**              | ✅ Completado | Home “Mi paso de hoy”, Mi Camino interactivo, progreso, ritmo, devocionales, planes, retos                                |
| **M3 · Vida espiritual**   | ✅ Completado | Biblia, diario privado, oración, modo oración, check-in, momentos, mi historia, offline de contenido                      |
| M4 · Comunidad             | Pendiente     | Iglesia, grupos, mentoría, preguntas, eventos, servicio, dones                                                            |
| M5 · Ministerios           | Pendiente     | Hub, conferencias, agenda, Bellas Artes, Quiz Bíblico, Misiones, Llamados, recursos                                       |
| M6 · Mobile                | Pendiente     | Permisos, push, splash/iconos finales, App Links, APK/AAB firmados, pruebas físicas                                       |
| M7 · iOS                   | Pendiente     | Plataforma iOS, Sign in with Apple, APNs, Universal Links, TestFlight                                                     |

## Qué muestra hoy la app (M0 – M3)

- Bienvenida (4a), Crear cuenta, Entrar, Recuperar contraseña, Nueva contraseña; Google/Apple cuando se activan.
- Onboarding de 6 pasos (barra del diseño): sobre ti → iglesia (4b: código/QR/sin iglesia) → foto → camino de fe (2a)
  → qué fortalecer → qué esperas → “Tu camino está listo” (2b) con la etapa calculada en el servidor.
- `/unirse/?codigo=` (destino del QR de la iglesia): si no hay sesión, el código se guarda y se aplica tras registrarse.
- Perfil → “Mi foto e intereses”.
- Inicio: saludo + foto con anillo del color de la etapa, card “MI CAMINO · ETAPA N” con la etapa real, invitación a iglesia.
- Mi Camino (2d) interactivo: etapa actual expandida con % y línea de módulos (hecho / sigue aquí / tu siguiente
  paso / disponible); cualquier etapa se abre y explora; sin bloqueos.
- Inicio (2c): Mi Camino con anillo de %, **Tu ritmo** (N de 7, mensajes amables), **Hoy** (siguiente día del plan →
  devocional a medias → lo que sugiere Mi Camino), Reto de la semana.
- Devocional (2e): 6 pasos que avanzan al leer, respuesta privada, tamaño de texto, celebración al completar.
- Planes (5b/5c): Para ti / Mi iglesia / categorías, búsqueda, en curso, terminados; detalle con días y "Empezar plan".
- Reto (6a): marcar hoy / deshacer hoy.
- Comunidad: iglesia actual (2h) o estado vacío.
- Perfil: identidad, iglesia, accesos a paneles según rol, cerrar sesión.
- “+”: hoja “¿QUÉ QUIERES HACER?” (2c); las acciones informan su disponibilidad.
- `/leader` y `/admin` protegidos por rol con layout propio (3a).
- Biblia (5a): libro/capítulo, versión, tamaño, escuchar (voz del dispositivo), resaltar en 4 colores, nota, guardar,
  compartir, **Reflexionar → Diario**, **Orar con este versículo**; Guardados y resaltados. Sin conexión: capítulos ya leídos.
- Diario (5d): privado, pregunta de hoy, filtros; **sin conexión** guarda cifrado en el dispositivo y sincroniza solo.
  Devocional → "Llevar a mi diario".
- Oración (2f): Modo oración (5/10/15/Libre), peticiones privadas o compartidas con grupo/iglesia, "Marcar respondida" con
  celebración; Modo oración (2g) a pantalla completa con guía de 5 momentos, pantalla encendida y vibración suave.
- Check-in semanal (4c), Momentos (línea de tiempo) y Mi historia ("Mira cuánto has recorrido").
- Inicio: tarjeta de Oración junto a Tu ritmo e invitación al check-in.
