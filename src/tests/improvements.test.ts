import { it, expect } from "vitest";
import { goal, action, prefs, date, appointment } from "./fixtures";
import { State } from "../types";
import {
  applySimulation,
  simulatedState,
  emptySimulation,
} from "../features/goals/simulation";
import { assessGoals } from "../engines/goalFeasibility";
import { planDay } from "../engines/dailyPlanner";
import { makeEasier } from "../features/planner/makeEasier";
import { duration } from "../utils/time";
const state: State = {
  goals: [
    { ...goal, deadline: "2026-11-08", effortMin: 1200, effortMax: 1800 },
  ],
  actions: [action],
  milestones: [],
  preferences: prefs,
  commitments: [appointment],
  checkins: [],
  plans: {},
  excludedActions: {},
  habits: [],
  habitLogs: {},
  onboarded: true,
  demo: false,
  calendarIds: [],
  feedback: {},
  revisions: [],
};
const report = (s: State) =>
  assessGoals(s.goals, s.actions, s.commitments, s.preferences, date);
it("deadline and scope adjustments recalculate without mutating saved goals", () => {
  const before = JSON.stringify(state);
  const extended = simulatedState(state, {
    ...emptySimulation(),
    changes: { g: { deadline: "2026-12-20" } },
  });
  expect(report(extended).required.high).toBeLessThan(
    report(state).required.high,
  );
  const reduced = simulatedState(state, {
    ...emptySimulation(),
    changes: { g: { effortMin: 120, effortMax: 180 } },
  });
  expect(report(reduced).required.high).toBeLessThan(
    report(state).required.high,
  );
  expect(JSON.stringify(state)).toBe(before);
});
it("exclusions are preview-only and applying preserves unrelated records and fields", () => {
  const draft = {
    ...emptySimulation(),
    excluded: ["g"],
    changes: { g: { priority: 3 } },
  };
  expect(report(simulatedState(state, draft)).status).toBe(
    "Insufficient information",
  );
  const saved = applySimulation(state, draft);
  expect(saved.goals[0]).toEqual({ ...state.goals[0], priority: 3 });
  expect(saved.actions).toBe(state.actions);
  expect(saved.commitments).toBe(state.commitments);
  expect(report(simulatedState(state, emptySimulation()))).toEqual(
    report(state),
  );
});
it("missing estimates remain explicitly unknown", () => {
  const result = report({
    ...state,
    goals: [{ ...goal, effortMin: undefined }],
  });
  expect(result.weeklyStatus).toBe("Unknown");
  expect(result.missing).toHaveLength(1);
});
it("make easier shortens real work, preserves pins/completed items and records history", () => {
  const planned = planDay({
    date,
    preferences: prefs,
    commitments: [appointment],
    actions: [action],
    goals: [goal],
    mode: "momentum",
  }).items;
  const base = planned[0]!;
  const pinned = { ...base, id: "pin", locked: true };
  const done = { ...base, id: "done", completed: true };
  const input = { ...state, plans: { [date]: [base, pinned, done] } };
  const result = makeEasier(input, date, `${date}T00:00:00Z`);
  expect(
    duration(result.plans[date]![0]!.start, result.plans[date]![0]!.end),
  ).toBe(5);
  expect(result.plans[date]!.slice(1)).toEqual([pinned, done]);
  expect(result.revisions[0]?.items).toEqual(input.plans[date]);
  expect(result.goals).toBe(input.goals);
  expect(result.commitments).toBe(input.commitments);
  const second = makeEasier(result, date, `${date}T00:00:00Z`);
  expect(second.plans[date]).toEqual([pinned, done]);
});
it("low energy keeps the selected mode and respects calendar, rest, and time remaining", () => {
  const result = planDay({
    date,
    preferences: prefs,
    commitments: [appointment],
    actions: [action],
    goals: [goal],
    mode: "momentum",
    energy: 2,
    overloaded: true,
    now: `${date}T13:00:00Z`,
  });
  expect(result.explanation).toContain("keeping your chosen mode");
  expect(result.explanation).toContain("Long-term workload");
  for (const item of result.items) {
    expect(item.start >= `${date}T13:00:00Z`).toBe(true);
    expect(item.start >= appointment.end || item.end <= appointment.start).toBe(
      true,
    );
  }
});

it("demonstrates the deterministic 20–30 hour deadline scenario", () => {
  const current = report(state);
  const proposed = report(
    simulatedState(state, {
      ...emptySimulation(),
      changes: { g: { deadline: "2026-12-20" } },
    }),
  );
  expect(current.status).toBe("Currently infeasible");
  expect(current.required).toEqual({ low: 1200, high: 1800 });
  expect(current.capacity).toEqual({ low: 360, high: 540 });
  expect(proposed.status).toBe("Feasible");
  expect(proposed.required.low).toBeCloseTo(1200 / 7);
  expect(proposed.required.high).toBeCloseTo(1800 / 7);
});
