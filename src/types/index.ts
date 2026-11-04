export type Mode = "recovery" | "steady" | "momentum";
export interface Checkin {
  id: string;
  date: string;
  mood?: number;
  energy?: number;
  sleepQuality?: number;
  notes?: string;
  sleepHours?: number;
  screenMinutes?: number;
  functioning?: number;
}
export interface Goal {
  id: string;
  name: string;
  description: string;
  category: string;
  importance: number;
  priority: number;
  deadline?: string;
  effortMin?: number;
  effortMax?: number;
  frequency: number;
  minimumMinutes: number;
  status: "active" | "paused" | "completed" | "archived";
}
export interface Milestone {
  id: string;
  goalId: string;
  name: string;
  completed: boolean;
  deadline?: string;
}
export interface Action {
  id: string;
  goalId: string;
  milestoneId?: string;
  title: string;
  minutes: number;
  effort: number;
  completed: boolean;
  dependencies: string[];
  variants: { title: string; minutes: number }[];
}
export interface Commitment {
  id: string;
  title: string;
  start: string;
  end: string;
  busy: boolean;
  source: "manual" | "google" | "demo";
  allDay?: boolean;
  localStart?: string;
  localEnd?: string;
}
export interface PlanItem {
  id: string;
  actionId?: string;
  title: string;
  start: string;
  end: string;
  kind: "task" | "habit";
  effort: number;
  completed: boolean;
  locked: boolean;
  variant: number;
}
export interface Preferences {
  sleepTargetHours?: number;
  screenTargetMinutes?: number;
  zone: string;
  startHour: number;
  endHour: number;
  buffer: number;
  breakMinutes: number;
  restStart: number;
  restEnd: number;
  capacityLow: number;
  capacityHigh: number;
  weeklyMinutes: number;
  allDayBusy: boolean;
  tracking: boolean;
  patterns: boolean;
  appearance: "system" | "light" | "dark";
  notifications: boolean;
}
export interface Habit {
  id: string;
  name: string;
  minutes: number;
  minimum: string;
  daysPerWeek: number;
}
export interface State {
  checkins: Checkin[];
  goals: Goal[];
  milestones: Milestone[];
  actions: Action[];
  commitments: Commitment[];
  plans: Record<string, PlanItem[]>;
  excludedActions: Record<string, string[]>;
  planMeta?: Record<
    string,
    { mode: Mode; version: string; explanation: string; createdAt: string }
  >;
  habits: Habit[];
  habitLogs: Record<string, string[]>;
  preferences: Preferences;
  onboarded: boolean;
  demo: boolean;
  calendarIds: string[];
  lastSync?: string;
  calendarError?: string;
  feedback: Record<string, string>;
  revisions: { date: string; at: string; reason: string; items: PlanItem[] }[];
}
