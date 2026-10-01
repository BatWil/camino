import { describe, expect, it } from "vitest";
import { extractChurchCode, isCompleteChurchCode, normalizeChurchCode } from "./church-code";

describe("church codes", () => {
  it("normalizes what people type", () => {
    expect(normalizeChurchCode(" vida-nueva ")).toBe("VIDANUEVA");
    expect(normalizeChurchCode("ñandú 24")).toBe("NANDU24");
    expect(normalizeChurchCode("A".repeat(20))).toHaveLength(12);
  });

  it("knows when a code is complete", () => {
    expect(isCompleteChurchCode("VN24")).toBe(false);
    expect(isCompleteChurchCode("VIDA26")).toBe(true);
  });

  it("extracts the code from QR contents and links", () => {
    expect(extractChurchCode("vida26")).toBe("VIDA26");
    expect(extractChurchCode("https://app.camino.test/unirse/?codigo=vida26")).toBe("VIDA26");
    expect(extractChurchCode("https://app.camino.test/unirse/VIDA26")).toBe("VIDA26");
    expect(extractChurchCode("camino://unirse/VIDA26")).toBe("VIDA26");
    expect(extractChurchCode("camino://unirse?code=VIDA26")).toBe("VIDA26");
  });

  it("rejects unrelated QR contents", () => {
    expect(extractChurchCode("https://example.com/menu")).toBeNull();
    expect(extractChurchCode("WIFI:S:red;T:WPA;P:secreto;;")).toBeNull();
    expect(extractChurchCode("https://app.camino.test/unirse/?codigo=x';drop")).toBeNull();
  });
});
