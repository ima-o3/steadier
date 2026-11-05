import { File } from "expo-file-system";
import { parseBackup } from "./backup";
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
let transactions: Promise<void> = Promise.resolve();
// Expo's exclusive transaction helper opens a new, unkeyed connection. Keep
// SQLCipher transactions on our keyed connection and serialize every write.
function withStoreTransaction(
  task: (tx: SQLite.SQLiteDatabase) => Promise<void>,
  connection = database,
) {
  const operation = transactions.then(async () => {
    await connection.execAsync("BEGIN IMMEDIATE");
    try {
      await task(connection);
      await connection.execAsync("COMMIT");
    } catch (error) {
      try {
        await connection.execAsync("ROLLBACK");
      } catch {
        /* Preserve the original error. */
      }
      throw error;
    }
  });
  transactions = operation.catch(() => {});
  return operation;
}
const activeStoreKey = "steadier.database.active";
const legacyKey = "steadier.database.key";
const keyOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const randomKey = async () =>
  Array.from(await Crypto.getRandomBytesAsync(32), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
function databaseExists(name: string) {
  return new File(SQLite.defaultDatabaseDirectory, name).exists;
}
export async function openStore() {
  const active = await SecureStore.getItemAsync(activeStoreKey);
  if (active && !/^steadier-recovery-[a-f0-9-]+\.db$/.test(active))
    throw new Error(
      "Invalid storage selection. Your databases have not been changed.",
    );
  const name = active || "steadier.db";
  const keyName = active ? `steadier.key.${active}` : legacyKey;
  let key = await SecureStore.getItemAsync(keyName);
  if (!key) {
    if (active || databaseExists(name))
      throw new Error(
        "The encryption key for your existing database is unavailable. Restore your saved export below. The existing database has been preserved.",
      );
    key = await randomKey();
    await SecureStore.setItemAsync(keyName, key, keyOptions);
  }
  if (active && !databaseExists(name))
    throw new Error(
      "The recovered database is missing. Restore your saved export below.",
    );
  database = await openEncryptedDatabase(name, key);
  return readState();
}
async function openEncryptedDatabase(name: string, key: string) {
  if (!/^[a-f0-9]{64}$/.test(key))
    throw new Error("Invalid encryption key. Data has not been changed.");
  const database = await SQLite.openDatabaseAsync(name);
  try {
    await database.execAsync(`PRAGMA key = "x'${key}'";`);
    const cipher = await database.getFirstAsync<Record<string, unknown>>(
      "PRAGMA cipher_version",
    );
    if (!cipher || !Object.values(cipher).some(Boolean))
      throw new Error(
        "SQLCipher is unavailable. Install a native development build; unencrypted storage is disabled.",
      );
    await database.execAsync(
      "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;",
    );
    const version = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    if ((version?.user_version || 0) > 1)
      throw new Error("This database needs a newer version of Steadier.");
    if (!version?.user_version)
      await withStoreTransaction(async (tx) => {
        await tx.execAsync(migration1);
      }, database);
    return database;
  } catch (error) {
    await database.closeAsync().catch(() => {});
    throw error;
  }
}
async function rows<T>(table: string, connection = database) {
  return (
    await connection.getAllAsync<{ payload: string }>(
      `SELECT payload FROM ${table}`,
    )
  ).map((r) => JSON.parse(r.payload) as T);
}
async function readState(connection = database): Promise<State> {
  const settings = (
    await rows<Partial<State>>("users_local_settings", connection)
  )[0];
  return {
    ...defaultState,
    ...settings,
    preferences: {
      ...defaultState.preferences,
      ...(
        await rows<State["preferences"]>("planning_preferences", connection)
      )[0],
    },
    goals: await rows("goals", connection),
    milestones: await rows("milestones", connection),
    actions: await rows("actions", connection),
    checkins: await rows("daily_checkins", connection),
    commitments: await rows("commitments", connection),
    habits: await rows("habit_definitions", connection),
  };
}
export async function saveState(s: State, connection = database) {
  await withStoreTransaction(async (tx) => {
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
  }, connection);
}

// Recovery never overwrites the old database or its key. Switch only after a
// complete transaction and a fresh connection have verified the restored data.
export async function restoreBackup(text: string): Promise<State> {
  const state = parseBackup(text);
  const name = `steadier-recovery-${Crypto.randomUUID()}.db`;
  const key = await randomKey();
  const keyName = `steadier.key.${name}`;
  await SecureStore.setItemAsync(keyName, key, keyOptions);
  if ((await SecureStore.getItemAsync(keyName)) !== key)
    throw new Error(
      "Could not verify the new encryption key. Recovery was not activated.",
    );
  let candidate = await openEncryptedDatabase(name, key);
  try {
    await saveState(state, candidate);
    const integrity = await candidate.getFirstAsync<Record<string, unknown>>(
      "PRAGMA integrity_check",
    );
    if (!integrity || Object.values(integrity)[0] !== "ok")
      throw new Error("The restored database did not pass verification.");
    await candidate.closeAsync();
    candidate = await openEncryptedDatabase(name, key);
    const restored = await readState(candidate);
    await SecureStore.setItemAsync(activeStoreKey, name, keyOptions);
    const previous = database;
    database = candidate;
    if (previous) await previous.closeAsync().catch(() => {});
    return restored;
  } catch (error) {
    await candidate.closeAsync().catch(() => {});
    throw error;
  }
}
