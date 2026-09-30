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
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F4F2EC",
      overlaysWebView: false,
    },
  },
};

export default config;
