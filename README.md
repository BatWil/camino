# CAMINO

**Un camino, no una competencia.** Plataforma cristiana que acompaña a jóvenes en su crecimiento espiritual y los conecta con su iglesia local.

Un solo frontend (Next.js + React + TypeScript + Tailwind) que se ejecuta como:

| Destino                | Cómo                                                   |
| ---------------------- | ------------------------------------------------------ |
| Navegador              | `npm run dev` / cualquier hosting estático (`out/`)    |
| PWA                    | Manifest + service worker generados en `npm run build` |
| Android (APK / AAB)    | Capacitor — `android/`                                 |
| iOS (IPA / TestFlight) | Capacitor — `ios/` se agrega en M7 (requiere macOS)    |

Backend: **Supabase** (Auth, PostgreSQL con Row Level Security, Storage, Realtime cuando aporte valor).

## Requisitos

- Node.js 22+ y npm 10+
- (Opcional) Supabase CLI vía `npx supabase` + Docker para el stack local
- (Opcional) PostgreSQL 16 local para `npm run test:db` (o `DATABASE_URL`)
- Android: Android Studio + JDK 21 · iOS: macOS + Xcode

## Desarrollo

```bash
npm install
cp .env.example .env.local        # completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev                       # http://localhost:3000
```

Sin variables de Supabase la app no queda en blanco: muestra el estado **“Falta conectar el servidor”**.

Para la Biblia, ejecuta una vez `npm run bible:install` (y haz commit de `public/bible/` para que viaje en el APK).

Antes de probar el registro, aplica las migraciones (`npx supabase db push`) y configura las Redirect URLs
(ver [docs/supabase.md](docs/supabase.md#configuración-necesaria-en-el-panel-de-supabase-m1)).

Backend local:

```bash
npx supabase start                # levanta Postgres/Auth/Storage en Docker
npx supabase db reset             # aplica migraciones + seed.sql (DEV) + content/ (contenido de ejemplo)
```

## Scripts

| Script                                | Qué hace                                                               |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                         | Servidor de desarrollo                                                 |
| `npm run build`                       | Export estático a `out/` + genera `out/sw.js`                          |
| `npm start`                           | Sirve `out/` en :3000 (probar PWA)                                     |
| `npm run lint` · `typecheck` · `test` | Validaciones (Vitest)                                                  |
| `npm run test:db`                     | Aplica migraciones sobre Postgres desechable y ejecuta las pruebas RLS |
| `npm run validate`                    | lint + typecheck + test + build                                        |
| `npm run icons`                       | Regenera iconos PWA/Android desde `assets/icon.svg`                    |
| `npm run android`                     | build + `cap sync android` + abre Android Studio                       |

## Documentación

- [docs/architecture.md](docs/architecture.md) — capas, carpetas, estado, decisiones
- [docs/design-system.md](docs/design-system.md) — tokens y componentes derivados del diseño
- [docs/supabase.md](docs/supabase.md) — esquema, multi-tenant, roles, RLS, datos de demo
- [docs/pwa.md](docs/pwa.md) — instalación, caché, offline
- [docs/android.md](docs/android.md) — debug, release, firma, Play Store
- [docs/ios.md](docs/ios.md) — preparación iOS / App Store
- [docs/roadmap.md](docs/roadmap.md) — milestones y estado (M0 ✔)
