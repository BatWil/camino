import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { resolveDeepLink } from "@/lib/deep-links";
import { isAndroid, isNative, isPluginAvailable } from "@/lib/platform";

/**
 * Native shell integration. Everything platform-specific is funnelled through
 * here so feature code stays identical on web, PWA, Android and iOS.
 */

export interface NativeShellOptions {
  navigate: (path: string) => void;
  goBack: () => void;
  /** True when the current route is a top-level tab (back button exits the app). */
  isAtRoot: () => boolean;
}

export async function initNativeShell(options: NativeShellOptions): Promise<() => void> {
  if (!isNative()) return () => {};

  const cleanups: Array<() => void> = [];

  if (isPluginAvailable("StatusBar")) {
    // Paper background with ink content, like the design.
    await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: "#F4F2EC" }).catch(() => {});
    }
  }

  const urlListener = await App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    const path = resolveDeepLink(event.url);
    if (path) options.navigate(path);
  });
  cleanups.push(() => void urlListener.remove());

  if (isAndroid()) {
    const backListener = await App.addListener("backButton", ({ canGoBack }) => {
      if (options.isAtRoot() || !canGoBack) void App.exitApp();
      else options.goBack();
    });
    cleanups.push(() => void backListener.remove());
  }

  if (isPluginAvailable("SplashScreen")) {
    await SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  }

  return () => cleanups.forEach((fn) => fn());
}

/** Foreground/background changes on every platform. Returns an unsubscribe function. */
export function onAppStateChange(callback: (active: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  if (isNative()) {
    let removed = false;
    let remove: (() => void) | null = null;
    void App.addListener("appStateChange", ({ isActive }) => callback(isActive)).then((handle) => {
      remove = () => void handle.remove();
      if (removed) remove();
    });
    return () => {
      removed = true;
      remove?.();
    };
  }

  const onVisibility = () => callback(document.visibilityState === "visible");
  document.addEventListener("visibilitychange", onVisibility);
  return () => document.removeEventListener("visibilitychange", onVisibility);
}
