import { it, expect } from "vitest";
import { editPlanItem } from "../features/planner/editPlan";
import { State, PlanItem } from "../types";
import { action, date, prefs } from "./fixtures";
const item: PlanItem = {
  id: "item",
  actionId: action.id,
  title: "Open notes",
  start: "2026-11-02T09:00:00.000Z",
  end: "2026-11-02T09:05:00.000Z",
  kind: "task",
  effort: 1,
  completed: false,
  locked: true,
  variant: 2,
};
const state: State = {
  checkins: [],
  goals: [],
  milestones: [],
  actions: [action],
  commitments: [],
  plans: { [date]: [item] },
  excludedActions: {},
  habits: [],
  habitLogs: {},
  preferences: prefs,
  onboarded: true,
  demo: false,
  calendarIds: [],
  feedback: {},
  revisions: [],
};
it("completing a smaller version does not falsely complete its full action", () => {
  const result = editPlanItem(state, date, item.id, { completed: true });
  expect(result.plans[date]?.[0]?.completed).toBe(true);
  expect(result.actions[0]?.completed).toBe(false);
});
it("full action completion and its plan item change atomically", () => {
  const full = { ...state, plans: { [date]: [{ ...item, variant: 0 }] } };
  expect(
    editPlanItem(full, date, item.id, { completed: true }).actions[0]
      ?.completed,
  ).toBe(true);
});
it("allows a manually pinned item to be unpinned", () =>
  expect(
    editPlanItem(state, date, item.id, { locked: false }).plans[date]?.[0]
      ?.locked,
  ).toBe(false));
it("keeps an audit revision of previous plan", () =>
  expect(
    editPlanItem(state, date, item.id, { title: "My task" }).revisions[0]
      ?.items,
  ).toEqual([item]));
