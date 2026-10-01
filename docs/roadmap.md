# Roadmap por milestones

| Milestone                  | Estado                                               | Alcance                                                                                                                   |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **M0 · Foundation**        | ✅ Completado                                        | Proyecto, Design System, arquitectura, Supabase + RLS inicial, auth base, PWA, Capacitor Android, layouts, navegación, CI |
| **M1 · Auth + Onboarding** | ✅ Completado                                        | Registro, Google, Apple (preparado), recuperación, onboarding 6 pasos, unirse a iglesia (código/QR), avatar               |
| **M2 · Core**              | ✅ Completado                                        | Home “Mi paso de hoy”, Mi Camino interactivo, progreso, ritmo, devocionales, planes, retos                                |
| **M3 · Vida espiritual**   | ✅ Completado                                        | Biblia, diario privado, oración, modo oración, check-in, momentos, mi historia, offline de contenido                      |
| **M4 · Comunidad**         | ✅ Completado                                        | Iglesia, grupos, mentoría, preguntas, eventos, servicio, dones                                                            |
| **M5 · Ministerios**       | ✅ Completado                                        | Hub, conferencias, agenda, Bellas Artes, Quiz Bíblico, Misiones, Llamados, recursos                                       |
| **M6 · Mobile**            | 🟡 Implementado · falta prueba en dispositivo físico | Permisos, push, splash/iconos finales, App Links, APK/AAB firmados, pruebas físicas                                       |
| M7 · iOS                   | Pendiente                                            | Plataforma iOS, Sign in with Apple, APNs, Universal Links, TestFlight                                                     |

## Qué muestra hoy la app (M0 – M6)

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
- **Comunidad (2h)**: serie actual, mi grupo (nombres de pila del grupo), mi mentor (o "Pedir un mentor"), eventos,
  peticiones del grupo con **Orar** (recuerda que oraste hoy), servir; invitaciones "Hacerlo juntos".
- **Preguntas (7a)**: anónimas por defecto o con nombre; "Mis preguntas" con la respuesta privada y FAQ de la iglesia.
  Biblia → **Preguntar** abre la pregunta con la cita.
- **Mentoría (7b)**: conversación asignada por un líder; check-in compartido, propuesta de reunión (Confirmar / Otra
  hora), **reportar** y **bloquear/terminar**; aviso de que el pastor puede revisarla. El mentor ve sus jóvenes: etapa,
  plan, participación aproximada y check-ins compartidos.
- **Servir (7c)**: test de dones privado (16 frases), "Tal vez deberías explorar…", "Encajas bien en" con "Me interesa".
- **Eventos (7d)**: detalle, inscribirme / ya no podré ir, invitar a un amigo (compartir), conteo sin nombres;
  `camino://events/{id}` abre el evento.
- Inicio: serie de la iglesia y próximo evento (2c). Check-in y petición de oración: "Compartir con mi mentor".
- Plan → **Hacerlo con un amigo**: solo personas de tu grupo.
- **Panel de líder (3a)**: dashboard real (jóvenes, % activos, en planes, quieren servir, piden conversación, preguntas
  nuevas), Jóvenes + asignar mentor (auditado), Preguntas (responder / publicar en FAQ), Servicio, Eventos, Series.
- **Ministerios (8a)**: hub Ganar / Edificar / Enviar / Liderar desde Comunidad (también sin iglesia).
- **Conferencia (8b/8c)**: detalle, "Tu iglesia va · N inscritos", registro, agenda por día con ☆ "Solo lo mío" y
  **Mi gafete** (código para el registro). `camino://conference/{id}` abre la conferencia.
- **Bellas Artes (8d)**: categoría → subir video/audio/imagen/PDF (bucket privado, máx. 50 MB) → aprobación del líder.
- **Quiz Bíblico (8e)**: práctica de 20 preguntas (Romanos incluido), retroalimentación amable, resultados privados.
- **Misiones (8f)**: Speed the Light y Embajadores; la meta muestra solo el total; registrar ofrenda (no se cobra en la
  app) y el pastor confirma lo recibido.
- **Llamados (8g)**: "Siento el llamado" (momento privado), plan "Escuchar el llamado", hablar con mi pastor, servir
  3 meses, explorar formación.
- **Recursos (8h)**: diario guiado, libros y "Noticias del ministerio".
- Deportes y Youth Alive: página informativa con cómo participar.
- Panel de líder → **Ministerios**: aprobar Bellas Artes, metas misioneras y (pastor/admin) confirmar ofrendas.
- Administración → **Ministerios**: conferencias y agenda, recursos e historias de llamado.
- **Avisos (7e)**: campana en Inicio con punto discreto; bandeja agrupada (Hoy / Esta semana / Antes); avisos de
  mentoría, respuestas, eventos, invitaciones, Bellas Artes, ofrendas y servicio.
- **Perfil → Avisos y recordatorios**: push opt-in (Android/iOS), recordatorio amable diario + un solo "te
  extrañamos" tras 7 días, horario de descanso, eventos e invitaciones.
- Android: edge-to-edge, splash 12+, App Links https, icono de notificación, release firmado en CI.
