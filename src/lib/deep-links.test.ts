import { describe, expect, it } from "vitest";
import { resolveDeepLink } from "./deep-links";

const opts = { scheme: "camino", appUrl: "https://app.camino.test" };

describe("resolveDeepLink", () => {
  it("maps the custom scheme to in-app routes", () => {
    expect(resolveDeepLink("camino://events/123", opts)).toBe("/events/123");
    expect(resolveDeepLink("camino://plans/abc-1", opts)).toBe("/plan/?id=abc-1");
    expect(resolveDeepLink("camino://devotionals/d1", opts)).toBe("/devocional/?id=d1");
    expect(resolveDeepLink("camino://unirse?codigo=VIDA26", opts)).toBe("/unirse?codigo=VIDA26");
  });

  it("maps universal/app links on the app host", () => {
    expect(resolveDeepLink("https://app.camino.test/conference/st-louis", opts)).toBe("/conference/st-louis");
  });

  it("rejects other hosts, schemes and unknown sections", () => {
    expect(resolveDeepLink("https://evil.test/events/1", opts)).toBeNull();
    expect(resolveDeepLink("javascript:alert(1)", opts)).toBeNull();
    expect(resolveDeepLink("camino://admin/users", opts)).toBeNull();
    expect(resolveDeepLink("not a url", opts)).toBeNull();
  });

  it("rejects suspicious path segments", () => {
    // Dot segments are normalized by the URL parser and cannot escape the section.
    expect(resolveDeepLink("camino://events/%2e%2e/%2e%2e/admin", opts)).toBe("/events/admin");
    expect(resolveDeepLink("camino://events/a%20b", opts)).toBeNull();
  });

  it("opens home for the bare scheme", () => {
    expect(resolveDeepLink("camino://", opts)).toBe("/");
  });
});
