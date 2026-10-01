import { describe, expect, it } from "vitest";
import {
  apnsOutcome,
  apnsPayload,
  buildPush,
  decide,
  fcmMessage,
  isQuietTime,
  safeEqual,
  type NoticeRow,
} from "./logic";

const notice = (kind: NoticeRow["kind"], body: string | null = "Detalle"): NoticeRow => ({
  id: "n1",
  user_id: "u1",
  kind,
  title: "Título",
  body,
  href: "/mentoria/?id=1",
});
const prefs = { push_enabled: true, community: true, quiet_start: "21:30", quiet_end: "08:00" };
const noon = new Date("2026-10-01T18:00:00Z"); // 12:00 in Mexico City

describe("push logic", () => {
  it("handles quiet hours across midnight and time zones", () => {
    expect(isQuietTime(new Date("2026-10-01T04:00:00Z"), "America/Mexico_City", "21:30", "08:00")).toBe(true); // 22:00
    expect(isQuietTime(noon, "America/Mexico_City", "21:30", "08:00")).toBe(false);
    expect(isQuietTime(noon, "America/Mexico_City", "11:00", "13:00")).toBe(true);
    expect(isQuietTime(noon, "Not/AZone", "21:30", "08:00")).toBe(false); // falls back to UTC 18:00
  });

  it("is opt-in, respects preferences and a daily cap", () => {
    const base = {
      notice: notice("event_published"),
      timeZone: "America/Mexico_City",
      now: noon,
      pushedToday: 0,
      devices: 1,
    };
    expect(decide({ ...base, prefs: null })).toEqual({ send: false, reason: "disabled" });
    expect(decide({ ...base, prefs: { ...prefs, community: false } })).toEqual({
      send: false,
      reason: "community_off",
    });
    expect(decide({ ...base, prefs, pushedToday: 6 })).toEqual({ send: false, reason: "daily_cap" });
    expect(decide({ ...base, prefs, devices: 0 })).toEqual({ send: false, reason: "no_devices" });
    expect(decide({ ...base, prefs })).toEqual({ send: true });
  });

  it("never shows private content on the lock screen", () => {
    expect(buildPush(notice("mentor_message", "¿Tomamos un café?")).body).toBe("Abre Camino para verlo.");
    expect(buildPush(notice("question_answered")).body).toBe("Abre Camino para verlo.");
    expect(buildPush(notice("event_published", "Vida Nueva · 24 oct")).body).toBe("Vida Nueva · 24 oct");
  });

  it("only sends internal paths", () => {
    expect(buildPush({ ...notice("other"), href: "https://evil.test" }).data.href).toBe("/avisos");
    expect(fcmMessage("tok", buildPush(notice("other"))).message.android.notification.channel_id).toBe("avisos");
  });

  it("builds APNs payloads and handles dead tokens", () => {
    const p = apnsPayload(buildPush(notice("mentor_message", "secreto")), "mentor_message");
    expect(p.aps.alert.body).toBe("Abre Camino para verlo.");
    expect(p.href).toBe("/mentoria/?id=1");
    expect(apnsOutcome(200, null)).toBe("sent");
    expect(apnsOutcome(410, "Unregistered")).toBe("drop_token");
    expect(apnsOutcome(400, "BadDeviceToken")).toBe("drop_token");
    expect(apnsOutcome(429, "TooManyRequests")).toBe("retry_later");
  });

  it("compares secrets safely", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
  });
});
