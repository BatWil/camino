# iOS (M7)

Proyecto nativo en `ios/` (Capacitor 8, Swift Package Manager, se versiona). Bundle id **`app.camino`**,
iOS 15+, iPhone en vertical (iPad usa la misma app adaptada).

## Requisitos

- Mac con Xcode (última estable). No hace falta CocoaPods: Capacitor 8 usa Swift Package Manager.
- Apple Developer Program (cuenta de organización recomendada para una iglesia/ministerio).
- App Store Connect: app creada con el bundle id `app.camino`.

## Flujo diario

```bash
npm run build && npx cap sync ios
npx cap open ios        # Xcode → Signing & Capabilities → Team → Run
npm run icons           # regenera icono 1024 (sin transparencia) y splash si cambias assets/icon.svg
```

## Qué está configurado

| Área                | Dónde                                                                  | Detalle                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep links          | `Info.plist` → `CFBundleURLTypes`                                      | `camino://…` (también el retorno del login de Google)                                                                                                   |
| Universal Links     | `App.entitlements` → `applinks:$(CAMINO_APP_HOST)`                     | Host por build setting; el build web publica `/.well-known/apple-app-site-association` si defines `APPLE_TEAM_ID`. Solo rutas de la app (no `/leader`). |
| Sign in with Apple  | `CaminoBridgeViewController.swift` (plugin local) + `App.entitlements` | Hoja nativa de Apple → `supabase.auth.signInWithIdToken` con nonce (SHA-256 a Apple, crudo a Supabase). Obligatorio porque se ofrece Google (guía 4.8). |
| Push                | `AppDelegate.swift`, `aps-environment`, `UIBackgroundModes`            | Token APNs → `register_device` (plataforma `ios`); la Edge Function `push` envía por APNs directo. Permiso solo al activar avisos.                      |
| Recordatorios       | `@capacitor/local-notifications`                                       | Igual que Android.                                                                                                                                      |
| Barras / safe areas | `UIViewControllerBasedStatusBarAppearance` + SystemBars                | Iconos oscuros en papel, claros en pantallas oscuras; `env(safe-area-inset-*)`.                                                                         |
| Permisos            | `Info.plist`                                                           | Cámara (QR de la iglesia y foto) y fotos (foto de perfil, Bellas Artes), con textos en español.                                                         |
| Privacidad          | `PrivacyInfo.xcprivacy`                                                | Sin rastreo; datos ligados a la cuenta solo para el funcionamiento; razón `CA92.1` para UserDefaults.                                                   |
| Exportación         | `ITSAppUsesNonExemptEncryption = NO`                                   | Solo HTTPS estándar.                                                                                                                                    |
| Icono / splash      | `Assets.xcassets`                                                      | Generados por `npm run icons` (tinta + punto lima).                                                                                                     |

## Configuración en Apple Developer (una vez)

1. **Identifiers → app.camino**: activa _Push Notifications_, _Sign in with Apple_ y _Associated Domains_.
2. **Keys → +**: una clave con _Apple Push Notifications service (APNs)_ y _Sign in with Apple_. Descarga el
   `.p8` (solo se puede una vez) y anota el _Key ID_ y tu _Team ID_.
3. En Xcode, _Signing & Capabilities_ ya muestra las capacidades desde `App.entitlements`; elige tu Team.
4. **Universal Links**: en Xcode → Build Settings → `CAMINO_APP_HOST` = tu dominio (p. ej. `camino.tuiglesia.org`),
   y en Vercel la variable `APPLE_TEAM_ID` para publicar `apple-app-site-association`.

## Supabase

- **Auth → Providers → Apple**: actívalo y en _Client IDs_ agrega `app.camino` (login nativo). Para el login
  web, agrega también tu _Services ID_ y su clave secreta según la guía de Supabase.
- **Push iOS** (Edge Functions → Secrets):
  ```bash
  npx supabase secrets set APNS_KEY="$(cat AuthKey_XXXXXXXXXX.p8)" APNS_KEY_ID=XXXXXXXXXX \
    APNS_TEAM_ID=ABCDE12345 APNS_BUNDLE_ID=app.camino APNS_ENV=production
  npx supabase functions deploy push
  ```
  Usa `APNS_ENV=sandbox` para builds de desarrollo instalados desde Xcode. Borra el `.p8` de tu equipo después.

## TestFlight

- **Manual**: Xcode → Product → Archive → Distribute App → App Store Connect → Upload.
- **Automático**: `.github/workflows/ios-testflight.yml` (tag `v1.2.0` o manual). Secrets: `APPLE_TEAM_ID`,
  `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8_BASE64` (clave de API de App Store Connect, rol _App Manager_),
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; variables `NEXT_PUBLIC_APP_URL`, `CAMINO_APP_HOST`.
  Firma automática con la clave de API; el `.p8` se escribe en un archivo temporal y se borra al terminar.
- CI (`ci.yml`) compila la app para simulador en cada push (sin firmar).

## App Store Connect · App Privacy (respuestas sugeridas)

- **Tracking**: No.
- **Datos ligados a la persona, solo para funcionalidad de la app**: correo, nombre, ID de usuario, contenido del
  usuario (diario, oraciones, preguntas — cifrado en tránsito y privado por RLS), fotos (foto de perfil, Bellas
  Artes).
- **Clasificación por edad**: la app la usan menores (13+); revisa la sección _Kids/Age rating_ y la política de
  privacidad pública.
- Revisión: proporciona una cuenta de prueba (correo y contraseña) en _App Review Information_.

> En el entorno donde se construyó M7 no hay macOS ni Xcode: el proyecto se generó con `npx cap add ios`, los
> archivos se validaron (plist, pbxproj con parser) y la compilación se verifica en el job `ios` de CI y en tu Mac.
