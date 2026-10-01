import { describe, expect, it } from "vitest";
import { appSiteAssociation, isTeamId } from "./generate-apple-app-site-association.mjs";

describe("apple-app-site-association", () => {
  it("validates the team id", () => {
    expect(isTeamId("ABCDE12345")).toBe(true);
    expect(isTeamId("abc")).toBe(false);
    expect(isTeamId(undefined)).toBe(false);
  });

  it("links only in-app routes for the bundle", () => {
    const a = appSiteAssociation("ABCDE12345", "app.camino");
    expect(a.applinks.details[0].appIDs).toEqual(["ABCDE12345.app.camino"]);
    const paths = a.applinks.details[0].components.map((c: { "/": string }) => c["/"]);
    expect(paths).toContain("/evento/*");
    expect(paths.some((p: string) => p.startsWith("/leader"))).toBe(false);
  });
});
