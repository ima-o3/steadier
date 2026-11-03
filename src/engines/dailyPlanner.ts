import {
  Action,
  Commitment,
  Goal,
  Habit,
  Mode,
  PlanItem,
  Preferences,
} from "../types";
import { freeWindows, freeMinutes } from "./capacityModel";
import { addMinutes, duration } from "../utils/time";
export const PLANNER_VERSION = "planner-1";
export const recommendMode = (energy?: number): Mode =>
  energy === undefined
    ? "steady"
    : energy <= 3
      ? "recovery"
      : energy >= 8
        ? "momentum"
        : "steady";
export function planDay(input: {
  date: string;
  preferences: Preferences;
  commitments: Commitment[];
  actions: Action[];
  goals: Goal[];
  mode: Mode;
  habits?: Habit[];
  existing?: PlanItem[];
  now?: string;
  excludedActionIds?: string[];
}) {
  const { date, preferences: p, actions, goals, mode } = input;
  const locked = (input.existing || []).filter((i) => i.locked || i.completed);
  const originalWindows = freeWindows(date, p, input.commitments);
  for (const item of locked) {
    if (
      !originalWindows.some(
        (w) => item.start >= w.start && item.end <= w.end,
      ) ||
      locked.some(
        (other) =>
          other.id !== item.id &&
          item.start < other.end &&
          item.end > other.start,
      )
    )
      throw new Error(
        "A pinned or completed item conflicts with current availability. Move, unpin or remove it before regenerating.",
      );
  }
  const windows = freeWindows(date, p, [
    ...input.commitments,
    ...locked.map((i) => ({ ...i, busy: true, source: "manual" as const })),
  ])
    .map((w) => ({
      ...w,
      start: input.now && input.now > w.start ? input.now : w.start,
    }))
    .filter((w) => w.start < w.end);
  let budget = Math.floor(
    freeMinutes(windows) *
      { recovery: 0.2, steady: 0.45, momentum: 0.65 }[mode],
  );
  let count = 0;
  const items: PlanItem[] = [...locked];
  const candidates = actions
    .filter(
      (a) =>
        !a.completed &&
        !input.excludedActionIds?.includes(a.id) &&
        !locked.some((i) => i.actionId === a.id) &&
        goals.some((g) => g.id === a.goalId && g.status === "active") &&
        a.dependencies.every((id) =>
          actions.some((d) => d.id === id && d.completed),
        ),
    )
    .sort((a, b) => {
      const ga = goals.find((g) => g.id === a.goalId)!,
        gb = goals.find((g) => g.id === b.goalId)!;
      return (
        gb.importance - ga.importance ||
        ga.priority - gb.priority ||
        (ga.deadline || "9999").localeCompare(gb.deadline || "9999")
      );
    });
  function place(
    title: string,
    minutes: number,
    effort: number,
    kind: "task" | "habit",
    id: string,
    variant: number,
  ) {
    if (
      minutes > budget ||
      minutes <= 0 ||
      items.some((i) => i.id === `${date}-${id}`)
    )
      return false;
    const w = windows.find((w) => duration(w.start, w.end) >= minutes);
    if (!w) return false;
    const start = w.start,
      end = addMinutes(start, minutes);
    items.push({
      id: `${date}-${id}`,
      actionId: kind === "task" ? id : undefined,
      title,
      start,
      end,
      effort,
      kind,
      variant,
      locked: false,
      completed: false,
    });
    w.start = addMinutes(
      end,
      p.breakMinutes + (effort >= 7 ? p.breakMinutes : 0),
    );
    budget -= minutes;
    return true;
  }
  // Reserve a modest wellbeing routine before goal work, without filling every gap.
  for (const h of (input.habits || []).slice(0, 1))
    place(
      h.name,
      mode === "recovery" ? Math.min(h.minutes, 5) : h.minutes,
      1,
      "habit",
      h.id,
      0,
    );
  for (const a of candidates) {
    if (count >= { recovery: 1, steady: 3, momentum: 4 }[mode]) break;
    let variant =
      mode === "recovery"
        ? a.variants.length
        : mode === "steady" && a.effort > 6
          ? Math.min(1, a.variants.length)
          : 0;
    let choices = [{ title: a.title, minutes: a.minutes }, ...a.variants];
    for (; variant < choices.length; variant++) {
      const v = choices[variant]!;
      if (
        mode === "recovery" &&
        (v.minutes > 20 || (variant === 0 && a.effort > 4))
      )
        continue;
      if (place(v.title, v.minutes, a.effort, "task", a.id, variant)) {
        count++;
        break;
      }
    }
  }
  return {
    items: items.sort((a, b) => a.start.localeCompare(b.start)),
    version: PLANNER_VERSION,
    explanation: `${count} goal task${count === 1 ? "" : "s"} added. This plan leaves at least ${{ recovery: 80, steady: 55, momentum: 35 }[mode]}% of available time unscheduled, with ${p.buffer} minutes around appointments and protected rest.`,
  };
}
