import { afterEach, describe, expect, it, vi } from "vitest";

const capacitor = vi.hoisted(() => ({ native: false, platform: "web" }));
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => capacitor.native,
    getPlatform: () => capacitor.platform,
    isPluginAvailable: () => capacitor.native,
  },
}));

import { getPlatform, isAndroid, isIOS, isNative, isPWA } from "./index";

function mockDisplayMode(standalone: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: standalone && q === "(display-mode: standalone)",
    media: q,
  })) as unknown as typeof window.matchMedia;
}

describe("platform helpers", () => {
  afterEach(() => {
    capacitor.native = false;
    capacitor.platform = "web";
  });

  it("detects a regular browser", () => {
    mockDisplayMode(false);
    expect(getPlatform()).toBe("browser");
    expect(isNative()).toBe(false);
  });

  it("detects an installed PWA", () => {
    mockDisplayMode(true);
    expect(isPWA()).toBe(true);
    expect(getPlatform()).toBe("pwa");
  });

  it("detects Android and iOS native shells (never reported as PWA)", () => {
    mockDisplayMode(true);
    capacitor.native = true;
    capacitor.platform = "android";
    expect(isAndroid()).toBe(true);
    expect(isPWA()).toBe(false);
    expect(getPlatform()).toBe("android");

    capacitor.platform = "ios";
    expect(isIOS()).toBe(true);
    expect(getPlatform()).toBe("ios");
  });
});
