import { Action, Commitment, Goal, Preferences } from "../types";
import { freeWindows, freeMinutes } from "./capacityModel";
import { nextDate, duration } from "../utils/time";
export function assessGoals(
  goals: Goal[],
  actions: Action[],
  commitments: Commitment[],
  p: Preferences,
  today: string,
) {
  const active = goals.filter((g) => g.status === "active"),
    missing = active.filter(
      (g) =>
        g.effortMin === undefined || g.effortMax === undefined || !g.deadline,
    );
  const days = Array.from({ length: 91 }, (_, d) => {
    const windows = freeWindows(nextDate(today, d), p, commitments);
    return { date: nextDate(today, d), free: freeMinutes(windows), windows };
  });
  const weeks = Array.from({ length: 13 }, (_, w) => {
    const week = days.slice(w * 7, w * 7 + 7),
      free = Math.min(
        p.weeklyMinutes,
        week.reduce((n, d) => n + d.free, 0),
      );
    return {
      low: free * p.capacityLow,
      high: free * p.capacityHigh,
      maxWindow: Math.max(
        0,
        ...week.flatMap((d) =>
          d.windows.map((win) => duration(win.start, win.end)),
        ),
      ),
    };
  });
  const required = active
    .filter((g) => !missing.includes(g))
    .map((g) => {
      const count = Math.max(
          0,
          Math.round((Date.parse(g.deadline!) - Date.parse(today)) / 86400000) +
            1,
        ),
        weeksLeft = Math.max(1 / 7, count / 7),
        frequencyFloor = g.frequency * g.minimumMinutes;
      return {
        id: g.id,
        name: g.name,
        low: Math.max(g.effortMin! / weeksLeft, frequencyFloor),
        high: Math.max(g.effortMax! / weeksLeft, frequencyFloor),
        days: count,
        deadline: g.deadline!,
        effortMin: g.effortMin!,
        effortMax: g.effortMax!,
      };
    });
  const low = required.reduce((n, g) => n + g.low, 0),
    high = required.reduce((n, g) => n + g.high, 0),
    capacity = weeks[0]!,
    bottlenecks: string[] = [];
  function capacityThrough(count: number, allowance: number) {
    return Array.from({ length: Math.ceil(count / 7) }, (_, w) => {
      const slice = days.slice(w * 7, Math.min(count, w * 7 + 7));
      return (
        Math.min(
          (p.weeklyMinutes * slice.length) / 7,
          slice.reduce((n, d) => n + d.free, 0),
        ) * allowance
      );
    }).reduce((a, b) => a + b, 0);
  }
  for (const deadline of [
    ...new Set(required.filter((g) => g.days <= 91).map((g) => g.days)),
  ]) {
    const due = required.filter((g) => g.days <= deadline),
      demand = due.reduce((n, g) => n + g.effortMin, 0),
      available = capacityThrough(Math.max(0, deadline), p.capacityHigh);
    if (demand > available)
      bottlenecks.push(
        `${due.map((g) => g.name).join(" + ")}: ${Math.round(demand / 60)} h required by ${nextDate(today, Math.max(0, deadline - 1))}, at most ${(available / 60).toFixed(1)} h sustainable capacity.`,
      );
  }
  // A total-hours comparison can be overly optimistic if several goals
  // all need the same scarce long working window. Count contiguous sessions
  // across ALL goals with the same (or earlier) deadline. For every minimum
  // session length, the number of actions requiring at least that long must
  // fit in the maximum number of such slots provided by the calendar.
  // This is a necessary condition, not a complete scheduling proof, so it
  // catches definite collisions without mislabelling a feasible plan because
  // of a greedy allocation order.
  const jointWindowChecks = [...new Set(required
    .filter((g) => g.days > 0 && g.days <= days.length)
    .map((g) => g.days))].sort((a, b) => a - b);
  for (const deadline of jointWindowChecks) {
    const dueGoalIds = new Set(required
      .filter((g) => g.days > 0 && g.days <= deadline)
      .map((g) => g.id));
    const minimumSessions = actions
      .filter((a) =>
        dueGoalIds.has(a.goalId) &&
        !a.completed &&
        a.dependencies.every((id) =>
          actions.some((d) => d.id === id && d.completed)))
      .map((a) => Math.min(a.minutes, ...a.variants.map((v) => v.minutes)))
      .filter((minutes) => Number.isFinite(minutes) && minutes > 0);
    if (!minimumSessions.length) continue;
    const windows = days.slice(0, deadline)
      .flatMap((d) => d.windows.map((w) => duration(w.start, w.end)));
    for (const minutes of [...new Set(minimumSessions)].sort((a, b) => b - a)) {
      const needed = minimumSessions.filter((n) => n >= minutes).length;
      const slots = windows.reduce((sum, length) =>
        sum + Math.floor(length / minutes), 0);
      if (needed > slots) {
        bottlenecks.push(
          `Across goals due by ${nextDate(today, deadline - 1)}: ${needed} actions need at least ${minutes} uninterrupted minutes, but the calendar has space for at most ${slots} such sessions. Try smaller action versions, longer free windows, or different deadlines.`,
        );
        break;
      }
    }
  }
  for (const g of required) {
    const availableDays = days.slice(0, Math.min(g.days, 91)),
      unfinished = actions.filter((a) => a.goalId === g.id && !a.completed),
      viable = unfinished.filter((a) =>
        a.dependencies.every((id) =>
          actions.some((d) => d.id === id && d.completed),
        ),
      );
    if (unfinished.length && !viable.length)
      bottlenecks.push(
        `${g.name}: all unfinished actions are blocked by dependencies; resolve or split them.`,
      );
    const bins = availableDays
      .flatMap((d) => d.windows.map((w) => duration(w.start, w.end)))
      .sort((a, b) => b - a);
    for (const a of viable) {
      const smallest = Math.min(a.minutes, ...a.variants.map((v) => v.minutes)),
        index = bins.findIndex((n) => n >= smallest);
      if (index < 0) {
        bottlenecks.push(
          `${g.name}: no remaining free window fits “${a.title}” (${smallest} min minimum).`,
        );
        break;
      }
      bins[index] = bins[index]! - smallest - p.breakMinutes;
    }
    const goal = active.find((x) => x.id === g.id)!,
      frequencyWindows = availableDays
        .slice(0, 7)
        .filter((d) =>
          d.windows.some(
            (w) => duration(w.start, w.end) >= goal.minimumMinutes,
          ),
        ).length;
    if (frequencyWindows < Math.min(goal.frequency, availableDays.length))
      bottlenecks.push(
        `${g.name}: only ${frequencyWindows} days have a window for its requested ${goal.frequency} days/week.`,
      );
  }
  const status =
    !active.length || missing.length
      ? "Insufficient information"
      : bottlenecks.length
        ? "Currently infeasible"
        : low > capacity.high || high > capacity.low
          ? "At risk"
          : "Feasible";
  return {
    version: "feasibility-2",
    status,
    required: { low, high },
    capacity: { low: capacity.low, high: capacity.high },
    ratio: capacity.low ? high / capacity.low : null,
    peakWeeklyOverload: Math.max(
      0,
      ...weeks.map(
        (w, index) =>
          required
            .filter((g) => g.days > index * 7)
            .reduce((n, g) => n + g.high, 0) - w.low,
      ),
    ),
    buffer: capacity.low - high,
    bottlenecks,
    missing: missing.map(
      (g) => `${g.name}: add remaining effort range and deadline.`,
    ),
    suggestions:
      status === "Feasible"
        ? []
        : [
            "Consider extending a deadline, reducing milestone scope, or pausing a lower-priority goal. Your priorities will stay unchanged.",
          ],
    assumptions: `Next 13 weeks; ${Math.round(p.capacityLow * 100)}–${Math.round(p.capacityHigh * 100)}% of free windows, capped at ${p.weeklyMinutes / 60} discretionary hours/week. Includes minimum work frequency. Deadline demand is cumulative across goals. Beyond 13 weeks uses a weekly projection; future availability is uncertain. Smallest actions are checked against actual windows including shared cross-goal slot limits; this is a necessary-condition check, not a full resource-constrained scheduling proof. A weekly-rate overload without a concrete scheduling bottleneck is labelled At risk, not proven infeasible. Estimates are not exact.`,
  };
}
