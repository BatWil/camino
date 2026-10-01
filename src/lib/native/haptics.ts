import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNative, isPluginAvailable } from "@/lib/platform";

/**
 * Light haptic feedback for meaningful moments (never for scrolling or noise).
 * Native: Taptic/vibrator via @capacitor/haptics. Web: navigator.vibrate where it exists (Android browsers).
 * Silent when the person prefers reduced motion.
 */
function allowed(): boolean {
  if (typeof window === "undefined") return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

export function tap(): void {
  if (!allowed()) return;
  if (isNative() && isPluginAvailable("Haptics")) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  else vibrate(8);
}

export function success(): void {
  if (!allowed()) return;
  if (isNative() && isPluginAvailable("Haptics"))
    void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  else vibrate([10, 40, 14]);
}

export function gentleWarning(): void {
  if (!allowed()) return;
  if (isNative() && isPluginAvailable("Haptics"))
    void Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  else vibrate(18);
}
