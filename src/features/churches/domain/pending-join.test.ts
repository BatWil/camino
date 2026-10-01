import { beforeEach, describe, expect, it } from "vitest";
import { clearPendingChurchCode, postAuthPath, readPendingChurchCode, savePendingChurchCode } from "./pending-join";

describe("pending church code (QR scanned before having an account)", () => {
  beforeEach(() => sessionStorage.clear());

  it("goes home when there is nothing pending", () => {
    expect(postAuthPath()).toBe("/inicio");
  });

  it("resumes joining the scanned church right after authenticating", () => {
    savePendingChurchCode("VIDA26");
    expect(postAuthPath()).toBe("/unirse/?codigo=VIDA26");
    clearPendingChurchCode();
    expect(readPendingChurchCode()).toBeNull();
  });

  it("ignores tampered values", () => {
    sessionStorage.setItem("camino.pendingChurchCode", "/../admin");
    expect(postAuthPath()).toBe("/inicio");
  });
});
