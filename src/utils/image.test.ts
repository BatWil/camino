import { describe, expect, it } from "vitest";
import { ImageInputError, prepareAvatar, squareCrop } from "./image";

describe("avatar image preparation", () => {
  it("center-crops to a square", () => {
    expect(squareCrop(4000, 3000)).toEqual({ sx: 500, sy: 0, size: 3000 });
    expect(squareCrop(1080, 1920)).toEqual({ sx: 0, sy: 420, size: 1080 });
  });

  it("rejects non-images and huge files before decoding", async () => {
    await expect(prepareAvatar(new Blob(["x"], { type: "application/pdf" }))).rejects.toBeInstanceOf(ImageInputError);
    const huge = { type: "image/jpeg", size: 20 * 1024 * 1024 } as Blob;
    await expect(prepareAvatar(huge)).rejects.toThrow(/15 MB/);
  });
});
