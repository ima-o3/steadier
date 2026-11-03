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

it("catches long-session collisions across different goals even when total free minutes suffice", () => {
  // Monday has one 100-minute window and two 60-minute windows (220 total).
  // Two 90-minute actions cannot BOTH use the one long window, even though
  // the aggregate minimum effort of 180 minutes fits in 220 free minutes.
  const calendar = [
    { ...appointment, id: "b1", start: "2026-11-02T10:40:00.000Z", end: "2026-11-02T11:00:00.000Z" },
    { ...appointment, id: "b2", start: "2026-11-02T12:00:00.000Z", end: "2026-11-02T13:00:00.000Z" },
    { ...appointment, id: "b3", start: "2026-11-02T14:00:00.000Z", end: "2026-11-02T15:00:00.000Z" },
  ];
  const preferences = { ...prefs, startHour: 9, endHour: 15, restStart: 12, restEnd: 13,
    buffer: 0, capacityLow: 0.8, capacityHigh: 1, weeklyMinutes: 10000 };
  const goals = [
    { ...goal, id: "g1", name: "First", deadline: date, effortMin: 90, effortMax: 90 },
    { ...goal, id: "g2", name: "Second", deadline: date, effortMin: 90, effortMax: 90 },
  ];
  const actions = [
    { ...action, id: "a1", goalId: "g1", minutes: 90, variants: [] },
    { ...action, id: "a2", goalId: "g2", minutes: 90, variants: [] },
  ];
  const result = assessGoals(goals, actions, calendar, preferences, date);
  expect(result.bottlenecks.join(" ")).toMatch(/Across goals.*2 actions.*90 uninterrupted minutes/);
  expect(result.status).toBe("Currently infeasible");
});

it("respects genuinely smaller action variants in the shared-window check", () => {
  const preferences = { ...prefs, startHour: 9, endHour: 11, restStart: 12, restEnd: 13,
    buffer: 0, capacityLow: 1, capacityHigh: 1, weeklyMinutes: 10000 };
  const goals = [
    { ...goal, id: "g1", deadline: date, effortMin: 20, effortMax: 20 },
    { ...goal, id: "g2", deadline: date, effortMin: 20, effortMax: 20 },
  ];
  const actions = [
    { ...action, id: "a1", goalId: "g1", minutes: 90, variants: [{ title: "Small", minutes: 20 }] },
    { ...action, id: "a2", goalId: "g2", minutes: 90, variants: [{ title: "Small", minutes: 20 }] },
  ];
  const result = assessGoals(goals, actions, [], preferences, date);
  expect(result.bottlenecks.some((s) => s.includes("Across goals"))).toBe(false);
});

it("does not claim infeasibility from inflated weekly rates for two near deadlines", () => {
  // There is a separate two-hour working window on both days. The work fits
  // those days, even though annualising today's 100 minutes to 700 min/week
  // and tomorrow's to 350 min/week exceeds the first-week rate estimate.
  const preferences = { ...prefs, startHour: 9, endHour: 11, restStart: 12, restEnd: 13,
    buffer: 0, capacityLow: 0.8, capacityHigh: 1, weeklyMinutes: 10000 };
  const goals = [
    { ...goal, id: "g1", deadline: date, effortMin: 100, effortMax: 100 },
    { ...goal, id: "g2", deadline: "2026-11-03", effortMin: 100, effortMax: 100 },
  ];
  const actions = [
    { ...action, id: "a1", goalId: "g1", minutes: 90, variants: [] },
    { ...action, id: "a2", goalId: "g2", minutes: 90, variants: [] },
  ];
  const report = assessGoals(goals, actions, [], preferences, date);
  expect(report.bottlenecks).toEqual([]);
  expect(report.status).toBe("At risk");
});
