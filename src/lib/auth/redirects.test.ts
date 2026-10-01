import { describe, expect, it } from "vitest";
import { parseProviders } from "@/lib/env";
import { authRedirectUrl, emailRedirectUrl, parseAuthRedirect } from "./redirects";

describe("auth redirects", () => {
  it("uses the custom scheme on native and the current origin on web", () => {
    expect(authRedirectUrl("callback", { native: true })).toBe("camino://auth/callback");
    expect(authRedirectUrl("callback", { native: false, origin: "https://app.camino.test/" })).toBe(
      "https://app.camino.test/auth/callback/",
    );
    expect(authRedirectUrl("nueva-contrasena", { native: false, origin: "http://localhost:3000" })).toBe(
      "http://localhost:3000/auth/nueva-contrasena/",
    );
  });

  it("reads PKCE codes and errors from query or hash", () => {
    expect(parseAuthRedirect("?code=abc").code).toBe("abc");
    const err = parseAuthRedirect("", "#error=access_denied&error_description=Email+link+is+invalid");
    expect(err.error).toBe("access_denied");
    expect(err.errorDescription).toBe("Email link is invalid");
  });
});

describe("enabled OAuth providers", () => {
  it("accepts only known providers", () => {
    expect(parseProviders("google, Apple ,facebook")).toEqual(["google", "apple"]);
    expect(parseProviders(undefined)).toEqual([]);
  });
  it("sends email links to the web app, never to the custom scheme", () => {
    expect(emailRedirectUrl("callback", { native: true })).toMatch(/^https?:\/\/.+\/auth\/callback\/$/);
    expect(emailRedirectUrl("callback", { native: true })).not.toContain("camino://");
    expect(emailRedirectUrl("nueva-contrasena", { native: false, origin: "https://camino-steel.vercel.app/" })).toBe(
      "https://camino-steel.vercel.app/auth/nueva-contrasena/",
    );
  });
});
