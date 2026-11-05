import { State } from "../../types";

type Rule = (value: unknown) => boolean;
const string: Rule = (v) => typeof v === "string";
const number: Rule = (v) => typeof v === "number" && Number.isFinite(v);
const boolean: Rule = (v) => typeof v === "boolean";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const optional =
  (rule: Rule): Rule =>
  (v) =>
    v === undefined || rule(v);
const array =
  (rule: Rule): Rule =>
  (v) =>
    Array.isArray(v) && v.every(rule);
const record =
  (rule: Rule): Rule =>
  (v) =>
    object(v) &&
    Object.entries(v).every(
      ([k, x]) =>
        !["__proto__", "constructor", "prototype"].includes(k) && rule(x),
    );
const shape =
  (fields: Record<string, Rule>): Rule =>
  (v) =>
    object(v) && Object.entries(fields).every(([k, rule]) => rule(v[k]));
const oneOf =
  (...values: unknown[]): Rule =>
  (v) =>
    values.includes(v);
const item = shape({
  id: string,
  title: string,
  start: string,
  end: string,
  kind: oneOf("task", "habit"),
  effort: number,
  completed: boolean,
  locked: boolean,
  variant: number,
  actionId: optional(string),
});
const schema: Rule = shape({
  formatVersion: (v) => v === 1,
  exportedAt: string,
  goals: array(
    shape({
      id: string,
      name: string,
      description: string,
      category: string,
      importance: number,
      priority: number,
      frequency: number,
      minimumMinutes: number,
      status: oneOf("active", "paused", "completed", "archived"),
      deadline: optional(string),
      effortMin: optional(number),
      effortMax: optional(number),
    }),
  ),
  milestones: array(
    shape({
      id: string,
      goalId: string,
      name: string,
      completed: boolean,
      deadline: optional(string),
    }),
  ),
  actions: array(
    shape({
      id: string,
      goalId: string,
      milestoneId: optional(string),
      title: string,
      minutes: number,
      effort: number,
      completed: boolean,
      dependencies: array(string),
      variants: array(shape({ title: string, minutes: number })),
    }),
  ),
  checkins: array(
    shape({
      id: string,
      date: string,
      mood: optional(number),
      energy: optional(number),
      sleepQuality: optional(number),
      notes: optional(string),
      sleepHours: optional(number),
      screenMinutes: optional(number),
      functioning: optional(number),
    }),
  ),
  commitments: array(
    shape({
      id: string,
      title: string,
      start: string,
      end: string,
      busy: boolean,
      source: oneOf("manual", "google", "demo"),
      allDay: optional(boolean),
      localStart: optional(string),
      localEnd: optional(string),
    }),
  ),
  habits: array(
    shape({
      id: string,
      name: string,
      minutes: number,
      minimum: string,
      daysPerWeek: number,
    }),
  ),
  plans: record(array(item)),
  excludedActions: record(array(string)),
  habitLogs: record(array(string)),
  planMeta: optional(
    record(
      shape({
        mode: oneOf("recovery", "steady", "momentum"),
        version: string,
        explanation: string,
        createdAt: string,
      }),
    ),
  ),
  preferences: shape({
    zone: string,
    startHour: number,
    endHour: number,
    buffer: number,
    breakMinutes: number,
    restStart: number,
    restEnd: number,
    capacityLow: number,
    capacityHigh: number,
    weeklyMinutes: number,
    allDayBusy: boolean,
    tracking: boolean,
    patterns: boolean,
    appearance: oneOf("system", "light", "dark"),
    notifications: boolean,
    sleepTargetHours: optional(number),
    screenTargetMinutes: optional(number),
  }),
  onboarded: boolean,
  demo: boolean,
  calendarIds: array(string),
  lastSync: optional(string),
  calendarError: optional(string),
  feedback: record(string),
  revisions: array(
    shape({ date: string, at: string, reason: string, items: array(item) }),
  ),
});
export function parseBackup(text: string): State {
  if (text.length > 20 * 1024 * 1024)
    throw new Error("This backup is too large (maximum 20 MB).");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(
      "Choose a Steadier JSON export. This file is not valid JSON.",
    );
  }
  if (!schema(value))
    throw new Error(
      "This is not a supported, complete Steadier backup. Your existing data has not been changed.",
    );
  const { formatVersion, exportedAt, ...state } = value as State & {
    formatVersion: number;
    exportedAt: string;
  };
  for (const rows of [
    state.goals,
    state.milestones,
    state.actions,
    state.checkins,
    state.commitments,
    state.habits,
  ]) {
    if (
      rows.some((r) => !r.id) ||
      new Set(rows.map((r) => r.id)).size !== rows.length
    )
      throw new Error("Backup contains missing or duplicate IDs.");
  }
  try {
    new Intl.DateTimeFormat("en", {
      timeZone: state.preferences.zone,
    }).format();
  } catch {
    throw new Error("Backup contains an unsupported time zone.");
  }
  return state;
}
