import { describe, expect, it } from "vitest";
import { STAGE_KEYS, sortStages, stageNumber, stageTheme } from "./stages";

describe("journey stages", () => {
  it("keeps the six stages in design order", () => {
    expect(STAGE_KEYS).toEqual(["encuentra", "crece", "vive", "sirve", "comparte", "guia"]);
  });

  it("uses the exact stage colours from the design", () => {
    expect(stageTheme("encuentra").color).toBe("#FFC83D");
    expect(stageTheme("crece").color).toBe("#35D07F");
    expect(stageTheme("vive").color).toBe("#3D8BFF");
    expect(stageTheme("sirve").color).toBe("#FF8A3D");
    expect(stageTheme("comparte").color).toBe("#9B6BFF");
    expect(stageTheme("guia").color).toBe("#FF4D5E");
  });

  it("falls back safely for unknown stages", () => {
    expect(stageTheme("nueva").color).toBe("#FFFFFF");
  });

  it("sorts by position and formats ticket numbers", () => {
    expect(sortStages([{ position: 3 }, { position: 1 }]).map((s) => s.position)).toEqual([1, 3]);
    expect(stageNumber(4)).toBe("04");
  });
});
