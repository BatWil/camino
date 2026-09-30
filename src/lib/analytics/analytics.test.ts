import { afterEach, describe, expect, it, vi } from "vitest";
import { analytics, sanitizeProperties, setAnalyticsProvider, type AnalyticsProvider } from "./index";

describe("analytics privacy", () => {
  afterEach(() => setAnalyticsProvider({ track() {}, identify() {}, reset() {} }));

  it("drops properties that are not allow-listed for the event", () => {
    const props = { privacy: "PRIVATE", text: "Señor, ayúdame con…", title: "Mi petición" };
    expect(sanitizeProperties("prayer_created", props)).toEqual({ privacy: "PRIVATE" });
  });

  it("drops nested objects and truncates long strings", () => {
    const out = sanitizeProperties("plan_started", { plan_id: "x".repeat(200), extra: { a: 1 } });
    expect(out.plan_id).toHaveLength(64);
    expect(out).not.toHaveProperty("extra");
  });

  it("sends no properties for events that declare none", () => {
    expect(sanitizeProperties("prayer_answered", { body: "private" })).toEqual({});
  });

  it("never throws even if the provider fails", () => {
    const failing: AnalyticsProvider = {
      track: vi.fn(() => {
        throw new Error("vendor down");
      }),
      identify() {},
      reset() {},
    };
    setAnalyticsProvider(failing);
    expect(() => analytics.track("mentor_request", {})).not.toThrow();
    expect(failing.track).toHaveBeenCalledWith("mentor_request", {});
  });
});
