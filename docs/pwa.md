# PWA

- **Manifest**: `src/app/manifest.ts` → `/manifest.webmanifest` (name, short_name, description, `start_url`
  `/?source=pwa`, `display: standalone`, `theme_color` papel, `background_color` tinta, iconos any + maskable
  192/512, shortcuts Inicio / Mi Camino / Comunidad). Apple touch icon 180px en `public/icons`.
- **Service worker**: `scripts/generate-sw.mjs` se ejecuta tras `next build` y escribe `out/sw.js` con la
  lista de precache versionada por hash.

## Estrategia de caché

| Recurso                                                   | Estrategia                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| HTML de rutas de la app joven (shell)                     | Precache; navegación network-first → página en caché → `/offline/` |
| `/_next/static/**` (JS, CSS, fuentes self-hosted), iconos | Cache-first (inmutables con hash)                                  |
| Otros GET del mismo origen                                | Network-first con respaldo en caché                                |
| **Supabase / cualquier otro origen**                      | **No se intercepta ni se cachea**                                  |
| `/leader`, `/admin`                                       | Fuera del SW (solo en línea)                                       |

Los datos privados nunca entran a Cache Storage sin una estrategia explícita. El contenido offline
(devocionales/planes descargados, diario local cifrado con cola de sincronización) se diseña en M2–M3
usando IndexedDB, no el SW.

El SW no se registra en `next dev` ni dentro de la app nativa (los assets ya van en el paquete).

## Probar la instalación

```bash
npm run build
npm start                 # sirve out/ en http://localhost:3000
```

- Chrome/Edge (escritorio o Android): icono “Instalar” en la barra de direcciones / menú → _Instalar app_.
  DevTools → Application → Manifest / Service Workers para verificar.
- Offline: DevTools → Network → _Offline_ y recarga: la app abre desde caché; rutas no visitadas muestran `/offline/`.
- Safari iOS: Compartir → _Añadir a pantalla de inicio_ (requiere HTTPS en un host real).

## Hosting

Cualquier hosting estático con HTTPS. `trailingSlash: true` genera `ruta/index.html`, por lo que no se
necesitan rewrites. Servir `sw.js` con `Cache-Control: no-cache`.
