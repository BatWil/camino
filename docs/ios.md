# iOS (preparado · se agrega en M7)

El código ya es compatible con iOS: no hay lógica exclusiva de Android fuera de `src/lib/native/bridge.ts`
(y siempre detrás de `isAndroid()`), safe areas vía `env(safe-area-inset-*)` y `viewport-fit=cover`,
sesión en Capacitor Preferences (UserDefaults), deep links resueltos por `resolveDeepLink`.

## Requisitos

- macOS con Xcode (última estable) y CocoaPods/SPM según versión de Capacitor
- Apple Developer Program (cuenta de organización recomendada)
- Certificados (Apple Distribution) y provisioning profiles, o firma automática de Xcode
- App Store Connect: registro del bundle id `app.camino`, ficha, privacidad (_App Privacy_), TestFlight

## Pasos

```bash
npm install @capacitor/ios
npx cap add ios
npm run build && npx cap sync ios
npx cap open ios            # Xcode → Signing & Capabilities → Team
npm run icons               # (extender el script a ios/ en M7)
```

En Xcode:

- **URL Types**: esquema `camino` (deep links).
- **Associated Domains**: `applinks:<dominio>` + `apple-app-site-association` (Universal Links).
- **Push Notifications** + **Background Modes → Remote notifications** (APNs, M7).
- **Sign in with Apple** capability (obligatorio si se ofrece Google login en iOS) — configurar también el
  proveedor Apple en Supabase Auth.
- Status bar / teclado: revisar `Info.plist` (`UIViewControllerBasedStatusBarAppearance`) y el plugin Keyboard si hace falta.

Build: Product → Archive → Distribute → App Store Connect → TestFlight.
