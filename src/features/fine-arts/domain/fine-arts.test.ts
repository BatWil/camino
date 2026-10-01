import { describe, expect, it } from "vitest";
import { deadlineLabel, FINE_ARTS_CATEGORIES, storageKey, validateUpload } from "./fine-arts";

describe("fine arts", () => {
  it("uses the design categories", () => {
    expect(FINE_ARTS_CATEGORIES.map((c) => c.label)).toEqual([
      "Canto solista",
      "Banda",
      "Drama",
      "Danza",
      "Arte visual",
      "Escritura",
    ]);
  });

  it("validates type and size before uploading", () => {
    expect(validateUpload({ type: "video/mp4", size: 1000 })).toBeNull();
    expect(validateUpload({ type: "application/x-msdownload", size: 1000 })).toMatch(/Formato/);
    expect(validateUpload({ type: "video/mp4", size: 60 * 1024 * 1024 })).toMatch(/50 MB/);
    expect(validateUpload({ type: "image/png", size: 0 })).toMatch(/vacío/);
  });

  it("never uses the original filename in storage", () => {
    expect(storageKey("u1", "video/quicktime", "abc")).toBe("u1/abc.mov");
  });

  it("formats the deadline note", () => {
    expect(deadlineLabel("2027-05-15")).toBe("cierre de inscripción: 15 may");
    expect(deadlineLabel(null)).toBeNull();
  });
});
