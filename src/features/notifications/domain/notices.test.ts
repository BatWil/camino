import { describe, expect, it } from "vitest";
import { comeBackDate, groupNotices, NOTICE_STYLE, parseTime, REMINDERS } from "./notices";

const now = new Date(2026, 9, 1, 12);

describe("notices", () => {
  it("groups like the design: HOY / ESTA SEMANA / ANTES", () => {
    const items = [
      { id: "a", created_at: new Date(2026, 9, 1, 9).toISOString() },
      { id: "b", created_at: new Date(2026, 8, 28, 9).toISOString() },
      { id: "c", created_at: new Date(2026, 8, 1, 9).toISOString() },
    ];
    expect(groupNotices(items, now).map((g) => [g.label, g.items.length])).toEqual([
      ["HOY", 1],
      ["ESTA SEMANA", 1],
      ["ANTES", 1],
    ]);
  });

  it("highlights answers like 7e", () => {
    expect(NOTICE_STYLE.question_answered.highlight).toBe(true);
    expect(NOTICE_STYLE.mentor_message.shape).toBe("circle");
    expect(NOTICE_STYLE.event_published.shape).toBe("square");
  });

  it("uses kind copy with no guilt", () => {
    expect(REMINDERS.daily.title).toBe("Tu devocional te espera");
    expect(REMINDERS.comeBack.title).toBe("Te extrañamos, sin presión");
    for (const r of Object.values(REMINDERS)) expect(`${r.title} ${r.body}`).not.toMatch(/racha|perdiste|fallaste/i);
  });

  it("schedules the single come-back reminder a week later at the chosen time", () => {
    const d = comeBackDate(now, "19:30:00");
    expect(d.getDate()).toBe(8);
    expect([d.getHours(), d.getMinutes()]).toEqual([19, 30]);
    expect(parseTime("25:99")).toEqual({ hour: 23, minute: 59 });
  });
});
