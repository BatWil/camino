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
- Permisos: `INTERNET` (+ `ACCESS_NETWORK_STATE` que aporta el plugin Network). Cámara, notificaciones y
  canales se agregan en su milestone (M1 avatar/QR, M6 push).

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

## Pendiente (M6)

App Links https (`autoVerify` + `/.well-known/assetlinks.json`), push (FCM + canal de notificaciones),
local notifications, edge-to-edge revisado en dispositivos físicos, pruebas en gama media.

> En el entorno donde se construyó M0 el Android SDK no estaba disponible (descarga bloqueada), por lo que
> `gradlew assembleDebug` se valida en CI y en la máquina del equipo, no aquí.
