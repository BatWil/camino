# Arquitectura

## Principio: un frontend, cuatro destinos

```
Next.js (App Router, output: 'export')  →  out/  ─┬─ hosting estático (web + PWA, sw.js)
                                                   └─ npx cap sync → android/ (y ios/ en M7)
```

La app es un **export estático**: cada ruta es HTML prerenderizado + JS; los datos se obtienen en el cliente
desde Supabase con la clave `anon` y el JWT del usuario. **La seguridad vive en la base de datos (RLS)**,
no en el frontend. Consecuencias:

- No hay Server Actions, route handlers dinámicos, cookies ni middleware (no existen dentro de Capacitor).
- Rutas dinámicas (`/events/{id}`) se resolverán en M2–M4 con `generateStaticParams` + fallback cliente
  o con rutas de detalle que leen el id del path en cliente. Los deep links ya se resuelven a paths internos
  (`src/lib/deep-links.ts`).
- Lógica privilegiada (enviar notificaciones, pagos, moderación) irá en **Supabase Edge Functions** (service_role solo allí).

## Capas

| Capa           | Dónde                                                                            | Regla                                                                           |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Presentation   | `src/app/**` (rutas y layouts), `src/features/*/components`, `src/components/**` | Sin queries a Supabase                                                          |
| Domain         | `src/features/*/domain`                                                          | Tipos y reglas puras, testeables (`access.ts`, `stages.ts`)                     |
| Data           | `src/features/*/data` (repositorios) + `src/features/*/hooks` (TanStack Query)   | Único lugar que habla con Supabase                                              |
| Infrastructure | `src/lib/**`                                                                     | Supabase client, plataforma, bridge nativo, storage, analytics, PWA, deep links |

```
src/
├── app/                 rutas: (public) bienvenida/entrar · (app) inicio/camino/comunidad/perfil
│                        (panel) leader/admin · offline · manifest · error boundaries
├── components/          ui/ (primitivas del Design System) · navigation/ · layout/ · feedback/
├── features/
│   ├── auth/            repositorio, AuthProvider, guards, Bienvenida, Entrar
│   ├── profile/         perfil propio, saludo del Home
│   ├── churches/        membresías + roles (multi-iglesia), iglesia actual
│   ├── journey/         etapas de Mi Camino
│   └── panel/           layout y piezas del panel de líder/admin (separado de la app joven)
├── hooks/               hooks transversales (conectividad)
├── lib/                 env, supabase/, platform/, native/, storage/, analytics/, pwa/, query/, deep-links
├── stores/              app-store (zustand): solo iglesia seleccionada + preferencias
├── types/ utils/
```

Los dominios restantes (`onboarding`, `devotionals`, `plans`, `bible`, `journal`, `prayers`, `challenges`,
`community`, `mentoring`, `groups`, `events`, `ministries`, `achievements`, `notifications`) se crean en su
milestone con la misma estructura `domain/ data/ hooks/ components/`.

## Estado

- **Sesión**: `AuthProvider` (contexto) — `loading | authenticated | unauthenticated | unconfigured`.
- **Server state**: TanStack Query (caché, deduplicación, reintentos que no insisten en errores de permisos).
- **Global mínimo**: `stores/app-store.ts` (iglesia seleccionada, preferencias) persistido en Preferences/localStorage.
- `localStorage` / Preferences **no** son base de datos: solo tokens de sesión y preferencias.

## Plataforma

Toda detección pasa por `src/lib/platform`: `isNative()`, `isAndroid()`, `isIOS()`, `isPWA()`, `getPlatform()`.
Integraciones nativas en `src/lib/native/bridge.ts`: status bar, splash, botón atrás Android (sale en tabs raíz),
deep links `appUrlOpen`, ciclo foreground/background (auto-refresh del token solo en primer plano).

Sesión: Supabase Auth con PKCE; tokens en Capacitor Preferences (nativo) o localStorage (web).
Android excluye esos datos de backups en la nube (`data_extraction_rules.xml`).

## Analítica

`src/lib/analytics`: catálogo tipado de eventos con **lista blanca de propiedades por evento**. Cualquier
otra propiedad (texto de diario, oraciones, preguntas, check-ins) se descarta antes de llegar al proveedor.
Proveedor intercambiable (`setAnalyticsProvider`); por defecto consola en dev y no-op en prod.

## Errores y estados

`StateView` cubre `empty | error | offline | unauthorized | maintenance | unconfigured`. `app/error.tsx`,
`app/global-error.tsx`, `not-found.tsx`, `ErrorBoundary` para widgets, `OfflineBanner` global y skeletons.
Nunca pantalla blanca.

## Accesibilidad

Skip link, `aria-current` en navegación, diálogo del “+” con foco atrapado y `Esc`, touch targets ≥ 40–66px,
`prefers-reduced-motion` desactiva animaciones, etiquetas visibles en formularios.

## Decisión documentada: navegación inferior

El diseño importa un componente “Camino Nav” (84px, activo por pestaña, “+” de 66px anclado a 36px del borde)
cuyo dibujo no está en los archivos. Se implementó con la paleta del sistema: barra tinta, pestaña activa en
lima, “+” lima con anillo tinta. En ≥1024px se usa un riel lateral en el lenguaje del panel de líder (3a).
