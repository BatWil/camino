import { describe, expect, it } from "vitest";
import { assetLinks, parseFingerprints } from "./generate-assetlinks.mjs";

const FP = Array.from({ length: 32 }, () => "AB").join(":");

describe("assetlinks", () => {
  it("accepts valid SHA-256 fingerprints and drops malformed ones", () => {
    expect(parseFingerprints(`${FP.toLowerCase()}, nope`)).toEqual([FP]);
    expect(parseFingerprints(undefined)).toEqual([]);
  });

  it("builds the Digital Asset Links statement", () => {
    expect(assetLinks("app.camino", [FP])[0].target).toEqual({
      namespace: "android_app",
      package_name: "app.camino",
      sha256_cert_fingerprints: [FP],
    });
  });
});
