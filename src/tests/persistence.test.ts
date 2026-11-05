import { beforeEach, it, expect, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
const memory = vi.hoisted(() => ({
  db: undefined as DatabaseSync | undefined,
  key: undefined as string | undefined,
  cipher: true,
}));
vi.mock("expo-file-system", () => ({
  File: class {
    get exists() {
      return !!memory.db;
    }
  },
}));
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: async (name: string) =>
    name === "steadier.database.key" ? memory.key : null,
  setItemAsync: async (_name: string, value: string) => {
    memory.key = value;
  },
}));
vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: async (n: number) => new Uint8Array(n).fill(17),
}));
vi.mock("expo-sqlite", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  return {
    defaultDatabaseDirectory: "file:///db",
    openDatabaseAsync: async () => {
      memory.db ??= new DatabaseSync(":memory:");
      const db = memory.db;
      const adapter = {
        closeAsync: async () => {},
        execAsync: async (sql: string) => db.exec(sql),
        getFirstAsync: async (sql: string) =>
          sql === "PRAGMA cipher_version"
            ? memory.cipher
              ? { cipher_version: "test-only-adapter" }
              : null
            : db.prepare(sql).get(),
        getAllAsync: async (sql: string) => db.prepare(sql).all(),
        runAsync: async (sql: string, ...args: (string | null)[]) =>
          db.prepare(sql).run(...args),
        withExclusiveTransactionAsync: async () => {
          throw new Error(
            "A fresh transaction connection has no SQLCipher key",
          );
        },
      };
      return adapter;
    },
  };
});
import {
  defaultState,
  openStore,
  saveState,
} from "../database/repositories/store";
import { goal, action, date } from "./fixtures";
import { demoState } from "../features/demo";
import { planDay, recommendMode } from "../engines/dailyPlanner";
import { assessGoals } from "../engines/goalFeasibility";
import { localDate } from "../utils/time";
beforeEach(() => {
  memory.db?.close();
  memory.db = undefined;
  memory.key = undefined;
  memory.cipher = true;
});
it("retains personal steadiness targets after reopening encrypted store adapter", async () => {
  const original = await openStore();
  await saveState({
    ...original,
    preferences: {
      ...original.preferences,
      sleepTargetHours: 8,
      screenTargetMinutes: 300,
    },
  });
  const reopened = await openStore();
  expect(reopened.preferences.sleepTargetHours).toBe(8);
  expect(reopened.preferences.screenTargetMinutes).toBe(300);
});
it("runs the low-energy acceptance workflow locally and restores the resulting plan", async () => {
  await openStore();
  const demo = demoState(defaultState),
    today = localDate(demo.preferences.zone);
  const state = {
    ...demo,
    checkins: demo.checkins.map((c) =>
      c.date === today ? { ...c, energy: 3 } : c,
    ),
  };
  const energy = state.checkins.find((c) => c.date === today)?.energy;
  const plan = planDay({
    date: today,
    preferences: state.preferences,
    commitments: state.commitments,
    actions: state.actions,
    goals: state.goals,
    mode: recommendMode(energy),
    habits: state.habits,
  });
  const task = plan.items.find((i) => i.kind === "task")!;
  expect(task.title).toBe("Open your project notes");
  expect(
    task.end <= state.commitments[0]!.start ||
      task.start >= state.commitments[0]!.end,
  ).toBe(true);
  expect(
    assessGoals(
      state.goals,
      state.actions,
      state.commitments,
      state.preferences,
      today,
    ).status,
  ).toBe("At risk");
  await saveState({ ...state, plans: { [today]: plan.items } });
  expect((await openStore()).plans[today]).toEqual(plan.items);
});
it("persists original observations, goals, variants and plan edits across reopening", async () => {
  await openStore();
  await saveState({
    ...defaultState,
    goals: [goal],
    actions: [action],
    checkins: [{ id: "check", date, energy: 3, notes: "Rest" }],
    plans: {
      [date]: [
        {
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
        },
      ],
    },
  });
  const result = await openStore();
  expect(result.checkins[0]?.energy).toBe(3);
  expect(result.checkins[0]?.mood).toBeUndefined();
  expect(result.actions[0]?.variants).toEqual(action.variants);
  expect(result.plans[date]?.[0]?.locked).toBe(true);
  expect(memory.key).toHaveLength(64);
});
it("rolls back invalid relational saves", async () => {
  await openStore();
  await saveState({ ...defaultState, goals: [goal] });
  await expect(
    saveState({ ...defaultState, actions: [action] }),
  ).rejects.toThrow();
  expect((await openStore()).goals).toEqual([goal]);
});
it("deleting observations clears derived and manual measurement tables", async () => {
  await openStore();
  await saveState({
    ...defaultState,
    checkins: [
      { id: "check", date, mood: 5, sleepHours: 8, screenMinutes: 20 },
    ],
  });
  await saveState(defaultState);
  for (const table of [
    "daily_checkins",
    "wellbeing_indicators",
    "sleep_records",
    "screen_usage_records",
  ])
    expect(
      memory.db!.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count,
    ).toBe(0);
});
it("refuses a build without SQLCipher instead of falling back to plaintext", async () => {
  memory.cipher = false;
  await expect(openStore()).rejects.toThrow("SQLCipher is unavailable");
});
it("serializes concurrent saves on the keyed connection and recovers after rollback", async () => {
  await openStore();
  const outcomes = await Promise.allSettled([
    saveState({ ...defaultState, actions: [action] }),
    saveState({ ...defaultState, goals: [goal] }),
  ]);
  expect(outcomes.map((result) => result.status)).toEqual([
    "rejected",
    "fulfilled",
  ]);
  expect((await openStore()).goals).toEqual([goal]);
});

it("removing a goal cleans references and preserves completed history across persistence", async () => {
  const { removeGoal } = await import("../features/goals/removeGoal");
  await openStore();
  const base = {
    id: "pending",
    actionId: action.id,
    title: "Work",
    start: `${date}T09:00:00Z`,
    end: `${date}T10:00:00Z`,
    kind: "task" as const,
    effort: 3,
    completed: false,
    locked: true,
    variant: 0,
  };
  const state = {
    ...defaultState,
    goals: [goal, { ...goal, id: "other" }],
    actions: [
      action,
      {
        ...action,
        id: "dependent",
        goalId: "other",
        dependencies: [action.id],
      },
    ],
    milestones: [
      { id: "m", goalId: goal.id, name: "Milestone", completed: false },
    ],
    checkins: [{ id: "c", date, mood: 6 }],
    plans: { [date]: [base, { ...base, id: "done", completed: true }] },
    excludedActions: { [date]: [action.id] },
    revisions: [
      { date, at: `${date}T10:00:00Z`, reason: "Original", items: [base] },
    ],
  };
  await saveState(state);
  const removed = removeGoal(state, goal.id);
  await saveState(removed);
  const restored = await openStore();
  expect(restored.goals.map((g) => g.id)).toEqual(["other"]);
  expect(restored.actions[0]!.dependencies).toEqual([]);
  expect(restored.milestones).toEqual([]);
  expect(restored.plans[date]).toHaveLength(1);
  expect(restored.plans[date]![0]!).toMatchObject({
    id: "done",
    completed: true,
  });
  expect(restored.plans[date]![0]!.actionId).toBeUndefined();
  expect(restored.revisions[0]!.items[0]!.actionId).toBeUndefined();
  expect(restored.checkins).toEqual(state.checkins);
  expect(restored.excludedActions[date]).toEqual([]);
});

it("deleting milestones keeps actions and deleting actions clears dependencies through persistence", async () => {
  const { removeActions, removeMilestone } =
    await import("../features/goals/removeGoal");
  await openStore();
  const state = {
    ...defaultState,
    goals: [goal],
    milestones: [
      {
        id: "milestone",
        goalId: goal.id,
        name: "First version",
        completed: false,
      },
    ],
    actions: [
      { ...action, milestoneId: "milestone" },
      { ...action, id: "dependent", dependencies: [action.id] },
    ],
  };
  await saveState(state);
  await saveState(removeMilestone(state, "milestone"));
  const withoutMilestone = await openStore();
  expect(withoutMilestone.milestones).toHaveLength(0);
  expect(withoutMilestone.actions).toHaveLength(2);
  expect(
    withoutMilestone.actions.find((a) => a.id === action.id)?.milestoneId,
  ).toBeUndefined();
  await saveState(removeActions(withoutMilestone, new Set([action.id])));
  const withoutAction = await openStore();
  expect(withoutAction.actions).toHaveLength(1);
  expect(withoutAction.actions[0]?.dependencies).toEqual([]);
  expect(withoutAction.goals).toEqual([goal]);
});

it("v0.1.7 schema records survive reopening and simulator changes without losing history", async () => {
  const { applySimulation, emptySimulation } =
    await import("../features/goals/simulation");
  await openStore();
  const oldState = {
    ...defaultState,
    goals: [{ ...goal, status: "paused" as const }],
    actions: [{ ...action, milestoneId: "m" }],
    milestones: [
      { id: "m", goalId: goal.id, name: "Existing milestone", completed: true },
    ],
    checkins: [{ id: "old-check", date, mood: 6, energy: 4 }],
    plans: {
      [date]: [
        {
          id: "history",
          title: "Finished",
          start: `${date}T09:00:00Z`,
          end: `${date}T09:05:00Z`,
          kind: "task" as const,
          effort: 1,
          variant: 0,
          locked: true,
          completed: true,
        },
      ],
    },
  };
  await saveState(oldState);
  const key = memory.key;
  const restored = await openStore();
  await saveState(
    applySimulation(restored, {
      ...emptySimulation(),
      changes: { g: { priority: 2 } },
    }),
  );
  const upgraded = await openStore();
  expect(upgraded.goals[0]).toMatchObject({ status: "paused", priority: 2 });
  expect(upgraded.actions).toEqual(oldState.actions);
  expect(upgraded.milestones).toEqual(oldState.milestones);
  expect(upgraded.checkins).toEqual(oldState.checkins);
  expect(upgraded.plans).toEqual(oldState.plans);
  expect(memory.key).toBe(key);
});

it("routine deletion cleans relational logs but preserves completed plan history", async () => {
  const { removeRoutine } = await import("../features/planner/routines");
  await openStore();
  const item = {
    id: `${date}-h`,
    title: "Walk",
    kind: "habit" as const,
    effort: 1,
    variant: 0,
    locked: true,
    completed: false,
    start: `${date}T09:00:00Z`,
    end: `${date}T09:10:00Z`,
  };
  const old = {
    ...defaultState,
    habits: [
      {
        id: "h",
        name: "Walk",
        minutes: 10,
        minimum: "Step outside",
        daysPerWeek: 3,
      },
    ],
    habitLogs: { [date]: ["h"] },
    plans: { [date]: [item, { ...item, id: "completed-h", completed: true }] },
    revisions: [{ date, at: item.start, reason: "Original", items: [item] }],
  };
  await saveState(old);
  await saveState(removeRoutine(old, "h"));
  const restored = await openStore();
  expect(restored.habits).toEqual([]);
  expect(restored.habitLogs[date]).toEqual([]);
  expect(restored.plans[date]).toEqual([
    { ...item, id: "completed-h", completed: true },
  ]);
  expect(restored.revisions).toEqual(old.revisions);
});
