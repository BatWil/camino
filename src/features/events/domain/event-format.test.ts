import { describe, expect, it } from "vitest";
import { attendanceLabel, eventShareUrl, formatEventDates } from "./event-format";

const tz = "America/Mexico_City";

describe("event format", () => {
  it("formats date ranges like the design", () => {
    expect(formatEventDates("2026-10-24T22:00:00Z", "2026-10-26T20:00:00Z", tz)).toBe("24–26 OCT");
    expect(formatEventDates("2026-11-02T16:00:00Z", null, tz)).toBe("2 NOV");
    expect(formatEventDates("2026-10-30T22:00:00Z", "2026-11-02T20:00:00Z", tz)).toBe("30 OCT – 2 NOV");
  });

  it("never names attendees", () => {
    expect(attendanceLabel(40, true)).toBe("Tú y 39 más van");
    expect(attendanceLabel(40, false)).toBe("40 personas van");
    expect(attendanceLabel(1, true)).toBe("Vas tú · invita a alguien");
    expect(attendanceLabel(0, false)).toBe("Sé de los primeros en ir");
  });

  it("builds a share link to the in-app route", () => {
    expect(eventShareUrl("https://app.camino.test/", "e1")).toBe("https://app.camino.test/evento/?id=e1");
  });
});
