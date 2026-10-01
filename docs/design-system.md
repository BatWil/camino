# Design System

Fuente: `Camino UI.dc.html` (Dirección visual, pantallas 2a–2h, 3a) y `Camino App Screens.dc.html` (4a–8h).
Los valores se copian **exactos** en `src/app/globals.css` (`@theme`) y `src/features/journey/domain/stages.ts`.

## Color

| Token              | Valor     | Uso                                        |
| ------------------ | --------- | ------------------------------------------ |
| `ink` (Tinta)      | `#0D0A26` | Texto, fondos oscuros, barra de navegación |
| `paper` (Papel)    | `#F4F2EC` | Fondo principal                            |
| `violet` (Violeta) | `#6C4DFF` | Acentos, links, oración                    |
| `lime` (Lima)      | `#C6F432` | CTA principal, estado activo               |
| `coral`            | `#FF6B4A` | Acento cálido de apoyo (ritmo, retos)      |
| `lilac`            | `#E6E0FF` | Card de oración                            |
| `cream`            | `#FFF8EA` | Fondo del devocional                       |

Etapas: ENCUENTRA `#FFC83D` · CRECE `#35D07F` · VIVE `#3D8BFF` (texto blanco) · SIRVE `#FF8A3D` ·
COMPARTE `#9B6BFF` (texto blanco) · GUÍA `#FF4D5E` (texto blanco).

## Tipografía (self-hosted con `next/font`)

| Rol             | Fuente                                 | Utilidad         |
| --------------- | -------------------------------------- | ---------------- |
| Display         | Archivo 900, ancho 125%, mayúsculas    | `font-display-x` |
| Body            | Instrument Sans 400–700, 16px mínimo   | por defecto      |
| Etiquetas       | JetBrains Mono 600 10px, tracking .1em | `eyebrow`        |
| Notas a mano    | Caveat 600/700 (con moderación)        | `font-hand`      |
| Lectura bíblica | Source Serif 4                         | `font-serif`     |

## Formas

Cards 22–30px de radio (`rounded-[26px]`, `rounded-[30px]`), tiles 20px, botones píldora (`rounded-full`)
de 56/50/40px. Placeholders fotográficos con rayas: `photo-ink`, `photo-stone`.

## Componentes (src/components)

`Button`/`ButtonLink` (lime, ink, outline, violet, white), `BrandMark`, `ProgressRing` (conic), `Avatar`,
`ScreenHeader`, `Skeleton`/`ScreenSkeleton`, `StateView`, `OfflineBanner`, `ErrorBoundary`, `BottomNav`,
`QuickActionsSheet` (“¿QUÉ QUIERES HACER?”), `SideRail`, `AppShell`; panel: `PanelShell`, `PrivacyDesignCard`.

## Tono

Amigo mayor: celebra la constancia, nunca culpa. “Hoy también puedes dar un paso.” · “Siempre puedes volver.”

## Ritmo vs. “Racha” (resuelto en M2)

Las pantallas 2c y 6c muestran una card coral “RACHA · 6 DÍAS”. El brief pide comunicar **ritmo**
(“5 de 7 días”, sin presión). En M2 se mantendrá la card coral (color, forma, puntos) y se usará el copy de
ritmo: “TU RITMO · 5 DE 7 · Esta semana apartaste tiempo 5 días.” No existe una racha que se pueda perder.

## Títulos de póster

`fitTitleStyle()` (`src/utils/fit-title.ts`) reduce el tamaño de un título Archivo Expanded solo lo necesario para que
su palabra más ancha quepa en el contenedor (`@container`): nunca se parte una palabra.

## Navegación inferior

Por defecto es **flotante**: píldora tinta de 68px separada 12px de los bordes y de la barra de gestos, con el
"+" lima elevado (`--nav-height: 92px`). La barra clásica del diseño (ancho completo, 84px) sigue disponible en
Perfil → Barra de navegación; la elección se guarda por dispositivo (`preferences.navStyle`). En escritorio
(≥1024px) se usa el riel lateral en ambos casos.
