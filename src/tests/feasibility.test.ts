import { it, expect } from "vitest";
import { assessGoals } from "../engines/goalFeasibility";
import { goal, action, prefs, date, appointment } from "./fixtures";
const assess = (goals = [goal], preferences = prefs) =>
  assessGoals(goals, [action], [], preferences, date);
it("five small goals can be feasible", () =>
  expect(
    assess(
      Array.from({ length: 5 }, (_, i) => ({
        ...goal,
        id: `g${i}`,
        effortMin: 30,
        effortMax: 60,
      })),
    ).status,
  ).toBe("Feasible"));
it("one large goal can be infeasible", () =>
  expect(assess([{ ...goal, effortMin: 20000, effortMax: 25000 }]).status).toBe(
    "Currently infeasible",
  ));
it("missing estimates remain uncertain", () =>
  expect(assess([{ ...goal, effortMin: undefined }]).status).toBe(
    "Insufficient information",
  ));
it("no goals cannot yield confident feasibility", () =>
  expect(assess([]).status).toBe("Insufficient information"));
it("capacity is conservative rather than all free time", () =>
  expect(assess().capacity.high).toBe(
    prefs.weeklyMinutes * prefs.capacityHigh,
  ));
it("detects deadline bottlenecks jointly across goals", () => {
  const report = assess([
    { ...goal, deadline: date, effortMin: 100, effortMax: 100 },
    { ...goal, id: "g2", deadline: date, effortMin: 100, effortMax: 100 },
  ]);
  expect(report.bottlenecks.join(" ")).toContain("Portfolio + Portfolio");
});
it("explains tradeoffs without changing priorities", () => {
  const g = { ...goal, effortMin: 20000, effortMax: 20000 },
    r = assess([g]);
  expect(r.suggestions.join(" ")).toContain("priorities will stay unchanged");
  expect(g.priority).toBe(1);
});
it("checks actual free windows rather than only aggregate hours", () => {
  const report = assessGoals(
    [{ ...goal, minimumMinutes: 200 }],
    [{ ...action, minutes: 200, variants: [] }],
    [appointment],
    { ...prefs, startHour: 13, endHour: 16 },
    date,
  );
  expect(report.bottlenecks.join(" ")).toContain("window");
});
it("past deadlines are flagged", () =>
  expect(assess([{ ...goal, deadline: "2026-11-01" }]).status).toBe(
    "Currently infeasible",
  ));
it("applies frequency floor", () =>
  expect(
    assess([
      { ...goal, frequency: 5, minimumMinutes: 30, effortMin: 0, effortMax: 0 },
    ]).required.low,
  ).toBe(150));
