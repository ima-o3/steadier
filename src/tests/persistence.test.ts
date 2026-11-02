import { beforeEach, it, expect, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
const memory = vi.hoisted(() => ({
  db: undefined as DatabaseSync | undefined,
  key: undefined as string | undefined,
  cipher: true,
}));
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: async () => memory.key,
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
    openDatabaseAsync: async () => {
      memory.db ??= new DatabaseSync(":memory:");
      const db = memory.db;
      const adapter = {
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
        withExclusiveTransactionAsync: async (
          fn: (tx: unknown) => Promise<void>,
        ) => {
          db.exec("BEGIN");
          try {
            await fn(adapter);
            db.exec("COMMIT");
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
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
