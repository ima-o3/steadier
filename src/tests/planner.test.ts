import { describe, it, expect } from "vitest";
import { planDay, recommendMode } from "../engines/dailyPlanner";
import { freeWindows } from "../engines/capacityModel";
import { at, duration } from "../utils/time";
import { action, appointment, date, goal, prefs } from "./fixtures";
const input = {
  date,
  preferences: prefs,
  commitments: [appointment],
  actions: Array.from({ length: 8 }, (_, n) => ({ ...action, id: `a${n}` })),
  goals: [goal],
};
describe("adaptive planner", () => {
  it("does not suggest a demanding full action in recovery when no small version exists", () =>
    expect(
      planDay({
        ...input,
        mode: "recovery",
        actions: [{ ...action, variants: [] }],
      }).items,
    ).toEqual([]));
  it("preserves removed actions during regeneration", () =>
    expect(
      planDay({
        ...input,
        mode: "steady",
        excludedActionIds: input.actions.map((a) => a.id),
      }).items,
    ).toEqual([]));
  it("does not duplicate pinned routines", () => {
    const routine = {
      id: "habit",
      name: "Outside",
      minutes: 10,
      minimum: "Window",
      daysPerWeek: 3,
    };
    const first = planDay({ ...input, mode: "steady", habits: [routine] });
    const second = planDay({
      ...input,
      mode: "steady",
      habits: [routine],
      existing: first.items.map((i) => ({ ...i, locked: true })),
    });
    expect(new Set(second.items.map((i) => i.id)).size).toBe(
      second.items.length,
    );
  });
  it("low energy recommends a smaller plan without imposing a mode", () => {
    expect(recommendMode(3)).toBe("recovery");
    expect(recommendMode()).toBe("steady");
    const low = planDay({ ...input, mode: "recovery" }),
      high = planDay({ ...input, mode: "momentum" });
    expect(low.items.length).toBeLessThan(high.items.length);
    expect(low.items[0]?.title).toBe("Open notes");
  });
  it("keeps commitments, buffers, rest and tasks separate", () => {
    const result = planDay({ ...input, mode: "momentum" });
    const windows = freeWindows(date, prefs, [appointment]);
    for (const item of result.items)
      expect(
        windows.some((w) => item.start >= w.start && item.end <= w.end),
      ).toBe(true);
    for (let n = 1; n < result.items.length; n++)
      expect(result.items[n]!.start >= result.items[n - 1]!.end).toBe(true);
  });
  it("does not fill every available minute", () => {
    const result = planDay({ ...input, mode: "momentum" });
    expect(
      result.items.reduce((n, i) => n + duration(i.start, i.end), 0),
    ).toBeLessThan(480 * 0.65);
  });
  it("handles empty calendars", () =>
    expect(
      planDay({ ...input, commitments: [], mode: "steady" }).items.length,
    ).toBeGreaterThan(0));
  it("handles no available time", () =>
    expect(
      planDay({
        ...input,
        commitments: [
          {
            ...appointment,
            start: at(date, 0, prefs.zone),
            end: at(date, 23, prefs.zone),
          },
        ],
        mode: "steady",
      }).items,
    ).toEqual([]));
  it("does not place work before now", () => {
    const now = at(date, 16, prefs.zone);
    expect(
      planDay({ ...input, mode: "steady", now }).items.every(
        (i) => i.start >= now,
      ),
    ).toBe(true);
  });
  it("preserves pinned and completed manual edits", () => {
    const item = {
      ...planDay({ ...input, mode: "steady" }).items[0]!,
      locked: true,
      title: "My edited priority",
    };
    expect(
      planDay({ ...input, mode: "momentum", existing: [item] }).items,
    ).toContainEqual(item);
  });
  it("reports pinned conflicts instead of overwriting appointments", () => {
    const item = {
      ...planDay({ ...input, mode: "steady" }).items[0]!,
      locked: true,
      start: appointment.start,
      end: appointment.end,
    };
    expect(() =>
      planDay({ ...input, mode: "steady", existing: [item] }),
    ).toThrow(/conflicts/);
  });
  it("does not schedule blocked dependencies or paused goals", () => {
    expect(
      planDay({
        ...input,
        actions: [{ ...action, dependencies: ["missing"] }],
        mode: "steady",
      }).items,
    ).toEqual([]);
    expect(
      planDay({
        ...input,
        goals: [{ ...goal, status: "paused" }],
        mode: "steady",
      }).items,
    ).toEqual([]);
  });
  it("does not repeat preserved task ids", () => {
    const original = planDay({ ...input, mode: "steady" }),
      pinned = original.items.map((i) => ({ ...i, locked: true })),
      result = planDay({ ...input, mode: "momentum", existing: pinned });
    expect(new Set(result.items.map((i) => i.id)).size).toBe(
      result.items.length,
    );
  });
  it("gives high effort tasks extra recovery", () => {
    const result = planDay({ ...input, mode: "momentum" });
    for (let n = 1; n < result.items.length; n++)
      expect(
        duration(result.items[n - 1]!.end, result.items[n]!.start),
      ).toBeGreaterThanOrEqual(prefs.breakMinutes * 2);
  });
});
