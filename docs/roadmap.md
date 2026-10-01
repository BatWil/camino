# Roadmap por milestones

| Milestone                  | Estado        | Alcance                                                                                                                   |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **M0 · Foundation**        | ✅ Completado | Proyecto, Design System, arquitectura, Supabase + RLS inicial, auth base, PWA, Capacitor Android, layouts, navegación, CI |
| **M1 · Auth + Onboarding** | ✅ Completado | Registro, Google, Apple (preparado), recuperación, onboarding 6 pasos, unirse a iglesia (código/QR), avatar               |
| M2 · Core                  | Pendiente     | Home “Mi paso de hoy”, Mi Camino interactivo, progreso, ritmo, devocionales, planes, retos                                |
| M3 · Vida espiritual       | Pendiente     | Biblia, diario privado, oración, modo oración, check-in, momentos, mi historia, offline de contenido                      |
| M4 · Comunidad             | Pendiente     | Iglesia, grupos, mentoría, preguntas, eventos, servicio, dones                                                            |
| M5 · Ministerios           | Pendiente     | Hub, conferencias, agenda, Bellas Artes, Quiz Bíblico, Misiones, Llamados, recursos                                       |
| M6 · Mobile                | Pendiente     | Permisos, push, splash/iconos finales, App Links, APK/AAB firmados, pruebas físicas                                       |
| M7 · iOS                   | Pendiente     | Plataforma iOS, Sign in with Apple, APNs, Universal Links, TestFlight                                                     |

## Qué muestra hoy la app (M0 + M1)

- Bienvenida (4a), Crear cuenta, Entrar, Recuperar contraseña, Nueva contraseña; Google/Apple cuando se activan.
- Onboarding de 6 pasos (barra del diseño): sobre ti → iglesia (4b: código/QR/sin iglesia) → foto → camino de fe (2a)
  → qué fortalecer → qué esperas → “Tu camino está listo” (2b) con la etapa calculada en el servidor.
- `/unirse/?codigo=` (destino del QR de la iglesia): si no hay sesión, el código se guarda y se aplica tras registrarse.
- Perfil → “Mi foto e intereses”.
- Inicio: saludo + foto con anillo del color de la etapa, card “MI CAMINO · ETAPA N” con la etapa real, invitación a iglesia.
- Mi Camino: las 6 estaciones apiladas (2d) con “estás aquí ↓” en la etapa actual.
- Comunidad: iglesia actual (2h) o estado vacío.
- Perfil: identidad, iglesia, accesos a paneles según rol, cerrar sesión.
- “+”: hoja “¿QUÉ QUIERES HACER?” (2c); las acciones informan su disponibilidad.
- `/leader` y `/admin` protegidos por rol con layout propio (3a).
