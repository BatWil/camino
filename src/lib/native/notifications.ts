import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { comeBackDate, isSafeInternalPath, parseTime, REMINDERS } from "@/features/notifications/domain/notices";
import { isAndroid, isIOS, isNative, isPluginAvailable } from "@/lib/platform";

/**
 * Native notifications. Push (FCM/APNs) and on-device gentle reminders.
 * Permission is NEVER requested on launch — only when the person turns avisos on.
 */

export type PushResult = "enabled" | "denied" | "unsupported" | "error";

const TOKEN_KEY = "camino.push.token";

export function pushSupported(): boolean {
  return isNative() && isPluginAvailable("PushNotifications");
}

export function devicePlatform(): "android" | "ios" | null {
  return isAndroid() ? "android" : isIOS() ? "ios" : null;
}

export function lastToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function ensureChannels() {
  if (!isAndroid()) return;
  await PushNotifications.createChannel({
    id: "avisos",
    name: "Avisos",
    description: "Mensajes de tu mentor, respuestas y eventos de tu iglesia",
    importance: 3,
    visibility: 0, // private on the lock screen
  }).catch(() => {});
  if (isPluginAvailable("LocalNotifications")) {
    await LocalNotifications.createChannel({
      id: "recordatorios",
      name: "Recordatorios amables",
      description: "Tu devocional del día, solo si lo activas",
      importance: 2,
      visibility: 0,
    }).catch(() => {});
  }
}

/** Asks for permission (only when called from a user action) and resolves with the device token. */
export async function enablePush(onToken: (token: string) => Promise<void>, prompt = true): Promise<PushResult> {
  if (!pushSupported()) return "unsupported";
  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      if (!prompt) return "denied";
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return "denied";
    await ensureChannels();
    const token = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), 15_000);
      void PushNotifications.addListener("registration", (t) => {
        clearTimeout(timer);
        resolve(t.value);
      });
      void PushNotifications.addListener("registrationError", (e) => {
        clearTimeout(timer);
        reject(new Error(e.error));
      });
      void PushNotifications.register();
    });
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
    await onToken(token);
    return "enabled";
  } catch {
    return "error";
  }
}

export async function disablePush(onForget: (token: string) => Promise<void>) {
  const token = lastToken();
  if (token) await onForget(token).catch(() => {});
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  if (pushSupported()) await PushNotifications.unregister().catch(() => {});
}

/** Taps on a push or a local reminder open the matching in-app screen (allow-listed paths only). */
export async function listenForNotificationTaps(navigate: (path: string) => void): Promise<() => void> {
  if (!isNative()) return () => {};
  const handles: Array<{ remove: () => Promise<void> }> = [];
  if (isPluginAvailable("PushNotifications")) {
    handles.push(
      await PushNotifications.addListener("pushNotificationActionPerformed", (a) => {
        const href = a.notification.data?.href;
        if (isSafeInternalPath(href)) navigate(href);
      }),
    );
  }
  if (isPluginAvailable("LocalNotifications")) {
    handles.push(
      await LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
        const href = a.notification.extra?.href;
        if (isSafeInternalPath(href)) navigate(href);
      }),
    );
  }
  return () => handles.forEach((h) => void h.remove());
}

/**
 * Gentle reminders, scheduled on the device: one daily "Tu devocional te espera" at the chosen time,
 * and a single "Te extrañamos, sin presión" 7 days after the last time the app was opened
 * (re-armed on each open, so it never repeats while the person is active).
 */
export async function syncGentleReminders(opts: { enabled: boolean; time: string; askPermission: boolean }) {
  if (!isNative() || !isPluginAvailable("LocalNotifications")) return "unsupported" as const;
  await LocalNotifications.cancel({
    notifications: [{ id: REMINDERS.daily.id }, { id: REMINDERS.comeBack.id }],
  }).catch(() => {});
  if (!opts.enabled) return "off" as const;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted" && opts.askPermission) perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return "denied" as const;
  await ensureChannels();
  const { hour, minute } = parseTime(opts.time);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDERS.daily.id,
        title: REMINDERS.daily.title,
        body: REMINDERS.daily.body,
        schedule: { on: { hour, minute }, allowWhileIdle: true },
        channelId: "recordatorios",
        extra: { href: REMINDERS.daily.href },
      },
      {
        id: REMINDERS.comeBack.id,
        title: REMINDERS.comeBack.title,
        body: REMINDERS.comeBack.body,
        schedule: { at: comeBackDate(new Date(), opts.time), allowWhileIdle: true },
        channelId: "recordatorios",
        extra: { href: REMINDERS.comeBack.href },
      },
    ],
  });
  return "on" as const;
}
