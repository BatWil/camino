import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shell for Android and iOS. The web bundle in out/ (npm run build)
 * is copied into the native projects by `npx cap sync`.
 */
const config: CapacitorConfig = {
  appId: "app.camino",
  appName: "Camino",
  webDir: "out",
  backgroundColor: "#0D0A26",
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "never",
    scheme: "Camino",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false, // hidden by the app once it has rendered (lib/native/bridge.ts)
      backgroundColor: "#0D0A26",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    // Edge-to-edge (enforced on Android 15+): Capacitor injects --safe-area-inset-* so the
    // layout (globals.css) pads correctly even on WebViews older than Chromium 140.
    SystemBars: {
      insetsHandling: "css",
      style: "LIGHT", // dark icons on paper; dark screens switch it at runtime (lib/native/bridge.ts)
    },
    PushNotifications: {
      presentationOptions: ["alert", "sound"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_camino",
      iconColor: "#6C4DFF",
    },
  },
};

export default config;
