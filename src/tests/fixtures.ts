import { Action, Goal, Preferences, Commitment } from "../types";
import { at } from "../utils/time";
export const date = "2026-11-02";
export const prefs: Preferences = {
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
};
export const goal: Goal = {
  id: "g",
  name: "Portfolio",
  description: "",
  category: "Work",
  importance: 5,
  priority: 1,
  deadline: "2026-12-01",
  effortMin: 120,
  effortMax: 180,
  frequency: 1,
  minimumMinutes: 5,
  status: "active",
};
export const action: Action = {
  id: "a",
  goalId: "g",
  title: "Build prototype",
  minutes: 60,
  effort: 8,
  completed: false,
  dependencies: [],
  variants: [
    { title: "Sketch prototype", minutes: 20 },
    { title: "Open notes", minutes: 5 },
  ],
};
export const appointment: Commitment = {
  id: "c",
  title: "Appointment",
  start: at(date, 14, prefs.zone),
  end: at(date, 15, prefs.zone),
  busy: true,
  source: "manual",
};
