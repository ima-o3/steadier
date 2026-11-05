import { describe, expect, it } from "vitest";
import { habitProgress } from "../features/planner/habitProgress";
const habit = {
  id: "h",
  name: "Walk",
  minutes: 10,
  daysPerWeek: 3,
  minimum: "Step outside",
};
describe("habit dashboard", () => {
  it("counts unique days within rolling week, caps progress, ignores future logs", () => {
    const logs = {
      "2026-11-05": ["h", "h"],
      "2026-11-04": ["h"],
      "2026-11-03": ["h"],
      "2026-11-02": ["h"],
      "2026-10-28": ["h"],
      "2026-11-06": ["h"],
    };
    const p = habitProgress(habit, logs, "2026-11-05");
    expect(p.week).toBe(4);
    expect(p.percent).toBe(100);
    expect(p.total).toBe(5);
    expect(p.days).toHaveLength(28);
    expect(p.days[27]).toBe("2026-11-05");
  });
  it("preserves empty and partial history without invented completions", () => {
    expect(habitProgress(habit, {}, "2026-11-05").percent).toBe(0);
    expect(
      habitProgress(habit, { "2026-11-05": ["h"] }, "2026-11-05").percent,
    ).toBe(33);
  });
});
