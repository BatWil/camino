import { describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/browser", () => ({ Browser: { open: vi.fn(), close: vi.fn() } }));

import { mapAuthError } from "./auth.repository";

describe("auth error messages", () => {
  it("are human, in Spanish, and never leak backend text", () => {
    const cases: Array<[Parameters<typeof mapAuthError>[0], string]> = [
      [{ code: "invalid_credentials" }, "invalid_credentials"],
      [{ code: "user_already_exists" }, "already_exists"],
      [{ code: "weak_password" }, "weak_password"],
      [{ code: "flow_state_not_found" }, "link_other_device"],
      [{ code: "otp_expired" }, "link_expired"],
      [{ status: 429, code: "over_email_send_rate_limit" }, "rate_limited"],
      [{ message: "Unsupported provider: provider is not enabled" }, "provider_disabled"],
    ];
    for (const [input, code] of cases) {
      const err = mapAuthError(input);
      expect(err.code).toBe(code);
      expect(err.message).not.toMatch(/provider|flow|otp|rate/i);
    }
  });
});
