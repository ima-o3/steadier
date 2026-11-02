import { it, expect } from "vitest";
import { indicator, detectPatterns } from "../engines/patternDetector";
import { nextDate } from "../utils/time";
it("does not use stale observations for a current pattern claim", () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({
    id: String(i),
    date: nextDate("2026-01-01", i),
    energy: 3,
  }));
  expect(detectPatterns(rows, "2026-11-02").sufficient).toBe(false);
});
it("missing data stays missing", () => {
  expect(indicator()).toBeUndefined();
  expect(
    indicator({ id: "one", date: "2026-11-02", notes: "Rest" }),
  ).toBeUndefined();
});
it("indicator only uses recorded mood and energy", () => {
  expect(indicator({ id: "one", date: "2026-11-02", mood: 8 })?.value).toBe(8);
  expect(
    indicator({ id: "one", date: "2026-11-02", mood: 8, energy: 4 })?.value,
  ).toBe(6);
});
it("has no task-completion input or penalties", () =>
  expect(
    indicator({ id: "one", date: "2026-11-02", mood: 6, energy: 6 })
      ?.explanation,
  ).toContain("not a clinical score"));
it("insufficient observations cannot yield confident patterns", () =>
  expect(
    detectPatterns([{ id: "one", date: "2026-11-02", energy: 1 }]).sufficient,
  ).toBe(false));
it("detects a sustained energy difference with explicit evidence", () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({
    id: String(i),
    date: nextDate("2026-10-01", i),
    energy: i < 14 ? 8 : 3,
  }));
  expect(detectPatterns(rows).text).toContain("3.0");
  expect(detectPatterns(rows).text).toContain(
    "does not identify a clinical episode",
  );
});
