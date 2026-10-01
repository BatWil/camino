import { describe, expect, it } from "vitest";
import { badgeLabel, conferenceDates, conferenceDatesShort, conferenceDays, sessionTime } from "./conference";

describe("conference", () => {
  it("formats dates like the design", () => {
    expect(conferenceDates("2027-07-27", "2027-07-31")).toBe("27–31 julio");
    expect(conferenceDates("2027-07-30", "2027-08-02")).toBe("30 julio – 2 agosto");
    expect(conferenceDatesShort("2027-07-27", "2027-07-31")).toBe("27–31 JUL");
  });

  it("lists every day with its weekday", () => {
    const days = conferenceDays("2027-07-26", "2027-07-30");
    expect(days.map((d) => `${d.dow} ${d.n}`)).toEqual(["LUN 26", "MAR 27", "MIÉ 28", "JUE 29", "VIE 30"]);
  });

  it("formats times and badges", () => {
    expect(sessionTime("09:00:00")).toBe("9:00");
    expect(badgeLabel("3f2a9c10-aaaa-bbbb-cccc-000000000000")).toBe("3F2A-9C10");
  });
});
