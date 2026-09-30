import { Capacitor } from "@capacitor/core";

/**
 * Single place for runtime platform detection.
 * Components must use these helpers instead of checking Capacitor/window directly.
 */
export type RuntimePlatform = "android" | "ios" | "pwa" | "browser";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function isNative(): boolean {
  return hasWindow() && Capacitor.isNativePlatform();
}

export function isAndroid(): boolean {
  return isNative() && Capacitor.getPlatform() === "android";
}

export function isIOS(): boolean {
  return isNative() && Capacitor.getPlatform() === "ios";
}

/** Installed web app (standalone display mode). Never true inside the native shell. */
export function isPWA(): boolean {
  if (!hasWindow() || isNative()) return false;
  const standaloneMedia =
    typeof window.matchMedia === "function" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches);
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneMedia || iosStandalone;
}

export function getPlatform(): RuntimePlatform {
  if (isAndroid()) return "android";
  if (isIOS()) return "ios";
  if (isPWA()) return "pwa";
  return "browser";
}

/** Whether a Capacitor plugin is implemented on the current platform. */
export function isPluginAvailable(name: string): boolean {
  return hasWindow() && Capacitor.isPluginAvailable(name);
}
