import { isNative } from "@/lib/platform";

/**
 * Registers /sw.js (generated at build time by scripts/generate-sw.mjs).
 * Skipped inside the native shell (assets are already bundled) and in dev.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (isNative()) return null;
  if (process.env.NODE_ENV !== "production") return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}
