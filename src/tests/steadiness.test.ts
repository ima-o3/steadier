import { expect, it } from "vitest";
import { steadiness } from "../engines/steadiness";
const base = { id: "one", date: "2026-11-04" };
it("does not invent missing factors or turn notes into ratings", () => {
  expect(steadiness({ ...base, notes: "hello" }).value).toBeUndefined();
  expect(steadiness({ ...base, mood: 8, energy: 4 }).value).toBe(6);
  expect(steadiness({ ...base, mood: NaN }).value).toBeUndefined();
});
it("uses each recorded numeric observation and explains the personal formula", () => {
  const result = steadiness({
    ...base,
    mood: 8,
    energy: 6,
    sleepQuality: 7,
    sleepHours: 7,
    screenMinutes: 180,
    functioning: 4,
  });
  expect(result.value).toBeCloseTo(39 / 5);
  expect(result.factors.map((f) => f.value)).toEqual([6, 8, 8, 10, 7]);
  expect(result.explanation).toContain("not a clinical score");
});
it("treats zero as recorded and respects changed targets with bounded contributions", () => {
  expect(steadiness({ ...base, screenMinutes: 0 }).value).toBe(10);
  expect(steadiness({ ...base, sleepHours: 0 }).value).toBe(0);
  expect(
    steadiness({ ...base, sleepHours: 7, screenMinutes: 180 }, 7, 180).value,
  ).toBe(10);
  expect(
    steadiness({ ...base, sleepHours: 24, screenMinutes: 1440 }).value,
  ).toBe(0);
});

it("excludes retired functioning values from historical scores",()=>{expect(steadiness({...base,mood:8,functioning:1}).value).toBe(8);});
