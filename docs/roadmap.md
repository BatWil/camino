# Roadmap por milestones

| Milestone              | Estado        | Alcance                                                                                                                   |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **M0 · Foundation**    | ✅ Completado | Proyecto, Design System, arquitectura, Supabase + RLS inicial, auth base, PWA, Capacitor Android, layouts, navegación, CI |
| M1 · Auth + Onboarding | Pendiente     | Registro, Google, Apple (preparado), recuperación, onboarding 5 pasos, unirse a iglesia (código/QR), avatar               |
| M2 · Core              | Pendiente     | Home “Mi paso de hoy”, Mi Camino interactivo, progreso, ritmo, devocionales, planes, retos                                |
| M3 · Vida espiritual   | Pendiente     | Biblia, diario privado, oración, modo oración, check-in, momentos, mi historia, offline de contenido                      |
| M4 · Comunidad         | Pendiente     | Iglesia, grupos, mentoría, preguntas, eventos, servicio, dones                                                            |
| M5 · Ministerios       | Pendiente     | Hub, conferencias, agenda, Bellas Artes, Quiz Bíblico, Misiones, Llamados, recursos                                       |
| M6 · Mobile            | Pendiente     | Permisos, push, splash/iconos finales, App Links, APK/AAB firmados, pruebas físicas                                       |
| M7 · iOS               | Pendiente     | Plataforma iOS, Sign in with Apple, APNs, Universal Links, TestFlight                                                     |

## Qué muestra hoy la app (M0)

- Bienvenida (4a) y Entrar (email/contraseña). “Crear mi cuenta”, Google y Apple indican que llegan pronto (M1).
- Inicio: saludo por hora + nombre real, card “MI CAMINO” con las etapas desde la base de datos, invitación a iglesia.
- Mi Camino: las 6 estaciones apiladas (2d) desde `journey_stages`.
- Comunidad: iglesia actual (2h) o estado vacío.
- Perfil: identidad, iglesia, accesos a paneles según rol, cerrar sesión.
- “+”: hoja “¿QUÉ QUIERES HACER?” (2c); las acciones informan su disponibilidad.
- `/leader` y `/admin` protegidos por rol con layout propio (3a).
