import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { migration1 } from "../migrations/001";
import { State } from "../../types";
import { indicator, detectPatterns } from "../../engines/patternDetector";
import { assessGoals } from "../../engines/goalFeasibility";
import { localDate } from "../../utils/time";
export const defaultState: State = {
  checkins: [],
  goals: [],
  milestones: [],
  actions: [],
  commitments: [],
  plans: {},
  excludedActions: {},
  habits: [],
  habitLogs: {},
  preferences: {
    zone: "Europe/London",
    startHour: 9,
    endHour: 18,
    restStart: 12,
    restEnd: 13,
    buffer: 15,
    breakMinutes: 15,
    capacityLow: 0.4,
    capacityHigh: 0.6,
    weeklyMinutes: 900,
    allDayBusy: false,
    tracking: true,
    patterns: true,
    appearance: "system",
    notifications: false,
  },
  onboarded: false,
  demo: false,
  calendarIds: [],
  feedback: {},
  revisions: [],
};
let database: SQLite.SQLiteDatabase;
export async function openStore() {
  let key = await SecureStore.getItemAsync("steadier.database.key");
  if (!key) {
    key = Array.from(await Crypto.getRandomBytesAsync(32), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    await SecureStore.setItemAsync("steadier.database.key", key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  if (!/^[a-f0-9]{64}$/.test(key))
    throw new Error("Invalid encryption key. Data has not been changed.");
  database = await SQLite.openDatabaseAsync("steadier.db");
  await database.execAsync(`PRAGMA key = "x'${key}'";`);
  const cipher = await database.getFirstAsync<Record<string, unknown>>(
    "PRAGMA cipher_version",
  );
  if (!cipher || !Object.values(cipher).some(Boolean))
    throw new Error(
      "SQLCipher is unavailable. Install a native development build; unencrypted storage is disabled.",
    );
  await database.execAsync("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
  const version = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  if ((version?.user_version || 0) > 1)
    throw new Error("This database needs a newer version of Steadier.");
  if (!version?.user_version)
    await database.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(migration1);
    });
  return readState();
}
async function rows<T>(table: string) {
  return (
    await database.getAllAsync<{ payload: string }>(
      `SELECT payload FROM ${table}`,
    )
  ).map((r) => JSON.parse(r.payload) as T);
}
async function readState(): Promise<State> {
  const settings = (await rows<Partial<State>>("users_local_settings"))[0];
  return {
    ...defaultState,
    ...settings,
    preferences: {
      ...defaultState.preferences,
      ...(await rows<State["preferences"]>("planning_preferences"))[0],
    },
    goals: await rows("goals"),
    milestones: await rows("milestones"),
    actions: await rows("actions"),
    checkins: await rows("daily_checkins"),
    commitments: await rows("commitments"),
    habits: await rows("habit_definitions"),
  };
}
export async function saveState(s: State) {
  await database.withExclusiveTransactionAsync(async (tx) => {
    const now = new Date().toISOString();
    const insert = async (
      table: string,
      id: string,
      payload: unknown,
      extra: Record<string, string | null> = {},
    ) => {
      const keys = ["id", "payload", "updated_at", ...Object.keys(extra)];
      await tx.runAsync(
        `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
        id,
        JSON.stringify(payload),
        now,
        ...Object.values(extra),
      );
    };
    for (const table of [
      "action_dependencies",
      "action_variants",
      "plan_revisions",
      "plan_items",
      "daily_plans",
      "habit_logs",
      "actions",
      "milestones",
      "goals",
      "daily_checkins",
      "commitments",
      "habit_definitions",
      "sleep_records",
      "screen_usage_records",
      "wellbeing_indicators",
      "planning_preferences",
      "users_local_settings",
      "calendar_selections",
      "calendar_sync_state",
      "suggestion_feedback",
      "pattern_insights",
      "goal_feasibility_reports",
    ])
      await tx.runAsync(`DELETE FROM ${table}`);
    for (const g of s.goals) await insert("goals", g.id, g);
    for (const m of s.milestones)
      await insert("milestones", m.id, m, { goal_id: m.goalId });
    for (const a of s.actions)
      await insert("actions", a.id, a, {
        goal_id: a.goalId,
        milestone_id: a.milestoneId || null,
      });
    for (const a of s.actions) {
      for (const [n, v] of a.variants.entries())
        await insert("action_variants", `${a.id}-${n}`, v, { action_id: a.id });
      for (const dependency of a.dependencies)
        await tx.runAsync(
          "INSERT INTO action_dependencies VALUES (?,?)",
          a.id,
          dependency,
        );
    }
    for (const c of s.checkins) {
      await insert("daily_checkins", c.id, c, { local_date: c.date });
      if (c.sleepHours !== undefined)
        await insert(
          "sleep_records",
          c.id,
          { hours: c.sleepHours, source: "manual" },
          { local_date: c.date },
        );
      if (c.screenMinutes !== undefined)
        await insert(
          "screen_usage_records",
          c.id,
          { minutes: c.screenMinutes, source: "manual" },
          { local_date: c.date },
        );
      const i = indicator(c);
      if (i)
        await insert("wellbeing_indicators", c.id, i, {
          local_date: c.date,
          algorithm_version: i.version,
        });
    }
    for (const c of s.commitments) await insert("commitments", c.id, c);
    for (const h of s.habits) await insert("habit_definitions", h.id, h);
    for (const [date, ids] of Object.entries(s.habitLogs))
      for (const id of ids)
        await insert(
          "habit_logs",
          `${date}-${id}`,
          { completed: true },
          { local_date: date, habit_id: id },
        );
    for (const [date, items] of Object.entries(s.plans)) {
      await insert(
        "daily_plans",
        date,
        { zone: s.preferences.zone },
        { local_date: date, algorithm_version: "planner-1" },
      );
      for (const item of items)
        await insert("plan_items", `${date}-${item.id}`, item, {
          plan_id: date,
          action_id: item.actionId || null,
        });
    }
    for (const [index, r] of s.revisions.entries())
      if (s.plans[r.date])
        await insert("plan_revisions", `${r.at}-${index}`, r, {
          plan_id: r.date,
        });
    await insert("planning_preferences", "local", s.preferences);
    const {
      goals,
      milestones,
      actions,
      checkins,
      commitments,
      habits,
      preferences,
      ...settings
    } = s;
    await insert("users_local_settings", "local", settings);
    for (const id of s.calendarIds)
      await insert("calendar_selections", id, { selected: true });
    await insert("calendar_sync_state", "google", {
      lastSync: s.lastSync,
      error: s.calendarError,
    });
    for (const [id, value] of Object.entries(s.feedback))
      await insert("suggestion_feedback", id, { value });
    await insert(
      "pattern_insights",
      "current",
      detectPatterns(s.checkins, localDate(s.preferences.zone)),
      {
        algorithm_version: "patterns-1",
      },
    );
    await insert(
      "goal_feasibility_reports",
      "current",
      assessGoals(
        s.goals,
        s.actions,
        s.commitments,
        s.preferences,
        localDate(s.preferences.zone),
      ),
      { algorithm_version: "feasibility-1" },
    );
  });
}
