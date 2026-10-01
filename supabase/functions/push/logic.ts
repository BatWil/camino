/**
 * Pure decision logic for the `push` Edge Function (no Deno/Node APIs, unit-tested with Vitest).
 * Tone rules: opt-in only, quiet hours respected, private content never shown on the lock screen,
 * and a small daily cap so Camino never becomes noisy.
 */

export type NotificationKind =
  | "mentor_message"
  | "mentorship"
  | "question_answered"
  | "new_question"
  | "conversation_request"
  | "event_published"
  | "plan_invite"
  | "fine_arts_reviewed"
  | "offering_confirmed"
  | "service_decided"
  | "other";

export interface NoticeRow {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
}

export interface Prefs {
  push_enabled: boolean;
  community: boolean;
  quiet_start: string; // "21:30" or "21:30:00"
  quiet_end: string;
}

/** Their content stays inside the app: the lock screen only shows a neutral line. */
export const PRIVATE_KINDS: ReadonlySet<NotificationKind> = new Set([
  "mentor_message",
  "question_answered",
  "conversation_request",
]);

/** Can be silenced with the "Comunidad" preference. */
export const COMMUNITY_KINDS: ReadonlySet<NotificationKind> = new Set(["event_published", "plan_invite"]);

export const DAILY_PUSH_CAP = 6;

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h % 24) * 60 + (m || 0);
}

/** Local "HH:MM" in an IANA time zone (falls back to UTC for unknown zones). */
export function localTime(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(
      now,
    );
  } catch {
    return now.toISOString().slice(11, 16);
  }
}

/** True inside [start, end), handling windows that cross midnight (21:30 → 08:00). */
export function isQuietTime(now: Date, timeZone: string, start: string, end: string): boolean {
  const t = minutes(localTime(now, timeZone));
  const s = minutes(start);
  const e = minutes(end);
  if (s === e) return false;
  return s < e ? t >= s && t < e : t >= s || t < e;
}

export type Decision =
  { send: true } | { send: false; reason: "disabled" | "community_off" | "quiet_hours" | "daily_cap" | "no_devices" };

export function decide(input: {
  notice: NoticeRow;
  prefs: Prefs | null;
  timeZone: string;
  now: Date;
  pushedToday: number;
  devices: number;
}): Decision {
  const { notice, prefs } = input;
  if (!prefs?.push_enabled) return { send: false, reason: "disabled" };
  if (COMMUNITY_KINDS.has(notice.kind) && !prefs.community) return { send: false, reason: "community_off" };
  if (isQuietTime(input.now, input.timeZone, prefs.quiet_start, prefs.quiet_end))
    return { send: false, reason: "quiet_hours" };
  if (input.pushedToday >= DAILY_PUSH_CAP) return { send: false, reason: "daily_cap" };
  if (input.devices === 0) return { send: false, reason: "no_devices" };
  return { send: true };
}

/** Payload actually sent to the device. Only an internal path travels as data. */
export function buildPush(notice: NoticeRow): { title: string; body: string; data: { href: string; id: string } } {
  const isPrivate = PRIVATE_KINDS.has(notice.kind);
  return {
    title: notice.title,
    body: isPrivate ? "Abre Camino para verlo." : (notice.body ?? ""),
    data: { href: notice.href && notice.href.startsWith("/") ? notice.href : "/avisos", id: notice.id },
  };
}

/** FCM HTTP v1 message for Android (channel "avisos") and iOS (APNs via FCM). */
export function fcmMessage(token: string, push: ReturnType<typeof buildPush>) {
  return {
    message: {
      token,
      notification: { title: push.title, body: push.body },
      data: push.data,
      android: { priority: "NORMAL", notification: { channel_id: "avisos", color: "#6C4DFF" } },
      apns: { payload: { aps: { sound: "default" } } },
    },
  };
}

/** APNs payload for iOS devices (raw APNs tokens from @capacitor/push-notifications). */
export function apnsPayload(push: ReturnType<typeof buildPush>, kind: NotificationKind) {
  return {
    aps: { alert: { title: push.title, body: push.body }, sound: "default", "thread-id": kind },
    href: push.data.href,
    id: push.data.id,
  };
}

export type ApnsOutcome = "sent" | "drop_token" | "retry_later";

/** 410 Unregistered / 400 BadDeviceToken → the token will never work again. */
export function apnsOutcome(status: number, reason: string | null): ApnsOutcome {
  if (status === 200) return "sent";
  if (status === 410 || (status === 400 && (reason === "BadDeviceToken" || reason === "DeviceTokenNotForTopic"))) {
    return "drop_token";
  }
  return "retry_later";
}

/** Constant-time string comparison for the webhook secret. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
