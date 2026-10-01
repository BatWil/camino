# Android

Proyecto nativo generado por Capacitor en `android/` (se versiona). Package id: **`app.camino`**
(válido para Play Store; si la organización tiene dominio propio, puede cambiarse a su dominio invertido
antes de la primera publicación — después ya no se puede cambiar).

## Requisitos

Android Studio (SDK Platform 36, Build-Tools), JDK 21. `minSdk 24`, `targetSdk 36`.

## Flujo diario

```bash
npm run build              # export estático a out/
npx cap sync android       # copia out/ y plugins a android/
npx cap open android       # Android Studio → Run
# atajo: npm run android
```

Tras cambiar `assets/icon.svg`: `npm run icons` (regenera mipmaps, adaptive icon y splash).

## Qué está configurado (M0)

- Icono legacy + adaptive (fondo tinta, punto lima), splash tinta; el splash lo oculta la app al renderizar.
- Status bar papel con contenido oscuro (`@capacitor/status-bar`).
- Deep links `camino://…` (intent-filter) → `src/lib/deep-links.ts` → navegación interna.
- Botón atrás: retrocede; en pestañas raíz sale de la app.
- `allowBackup=false` + `data_extraction_rules.xml`: tokens y datos locales fuera de backups/transferencias.
- WebView debugging: solo en builds _debuggable_ (comportamiento por defecto de Capacitor).
- Permisos: `INTERNET` (+ `ACCESS_NETWORK_STATE` del plugin Network) y `CAMERA` (QR de la iglesia y foto; se pide
  en tiempo de ejecución solo al usarla; `android.hardware.camera` no es obligatoria). Notificaciones en M6.
- Login con Google/Apple en nativo: se abre en el navegador interno (`@capacitor/browser`) y vuelve por
  `camino://auth/callback`.

## Builds

```bash
cd android
./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease        # app/build/outputs/bundle/release/app-release.aab (Play Store)
./gradlew assembleRelease      # APK release firmado
```

CI (`.github/workflows/ci.yml`) compila `assembleDebug` y publica el APK como artefacto.

## Firma (nunca en el repositorio)

```bash
keytool -genkeypair -v -keystore camino-release.jks -alias camino -keyalg RSA -keysize 4096 -validity 10000
```

Crea `android/keystore.properties` (ignorado por git):

```properties
storeFile=/ruta/segura/camino-release.jks
storePassword=…
keyAlias=camino
keyPassword=…
```

o exporta `CAMINO_ANDROID_KEYSTORE`, `CAMINO_ANDROID_KEYSTORE_PASSWORD`, `CAMINO_ANDROID_KEY_ALIAS`,
`CAMINO_ANDROID_KEY_PASSWORD`. Sin ellos, las variantes release se generan sin firmar.
Recomendado: **Play App Signing** (Google custodia la clave de firma; tú subes con la upload key).

## Play Store (checklist)

1. Cuenta de Google Play Console. 2. Ficha, clasificación de contenido (audiencia con menores → cumplir
   Families Policy si aplica), política de privacidad pública, formulario _Data safety_. 3. Subir el `.aab`
   a pruebas internas → cerrada → producción. 4. Incrementar `versionCode`/`versionName` en `android/app/build.gradle`
   en cada release.

## M6 · Móvil

- **Edge-to-edge** (obligatorio desde Android 15 con targetSdk 36): `EdgeToEdge.enable` en `MainActivity` y
  `SystemBars.insetsHandling = "css"`, que inyecta `--safe-area-inset-*` incluso en WebViews antiguos.
  La barra cambia a iconos claros en pantallas oscuras (`setSystemBarsFor` en `lib/native/bridge.ts`).
- **Splash Android 12+**: `windowSplashScreenBackground` tinta + `splash_icon` (punto lima); versiones anteriores
  usan `@drawable/splash`.
- **Avisos**: `@capacitor/push-notifications` (FCM) y `@capacitor/local-notifications`; canales "avisos" y
  "recordatorios" con visibilidad privada; icono monocromo `ic_stat_camino`. Configuración en
  [notifications.md](notifications.md).
- **Permisos**: `POST_NOTIFICATIONS` (se pide solo al activar avisos), `RECEIVE_BOOT_COMPLETED` (recordatorios
  tras reiniciar). Sin alarmas exactas.
- **App Links**: intent-filter `https` con `autoVerify` para el host de `CAMINO_APP_HOST` (variable de entorno o
  `-PcaminoAppHost=`). El build web escribe `out/.well-known/assetlinks.json` si defines
  `ANDROID_SHA256_CERT_FINGERPRINTS` (huella SHA-256 de Play App Signing; Play Console → Integridad de la app).
  Las rutas `https://<host>/evento/?id=…` se abren tal cual dentro de la app (lista permitida en `lib/deep-links.ts`).
- **Versiones**: `versionCode`/`versionName` desde `CAMINO_VERSION_CODE` / `CAMINO_VERSION_NAME`.
- **Release firmado en CI**: `.github/workflows/android-release.yml` (tag `v1.2.0` o manual) produce `.aab` y
  `.apk` firmados con secrets (`ANDROID_KEYSTORE_BASE64`, contraseñas, alias) y verifica la firma con
  `apksigner`. El keystore se escribe en un archivo temporal y se borra al terminar.

```bash
# Codificar el keystore para el secret (en tu máquina):
base64 -w0 camino-upload.jks > keystore.b64   # macOS: base64 -i camino-upload.jks
```

Pruebas en dispositivos: [testing-devices.md](testing-devices.md).

> En el entorno donde se construyó M0 el Android SDK no estaba disponible (descarga bloqueada), por lo que
> `gradlew assembleDebug` se valida en CI y en la máquina del equipo, no aquí.
