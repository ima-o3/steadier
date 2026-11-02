import { Checkin } from "../types";
import { nextDate } from "../utils/time";
export function indicator(c?: Checkin) {
  const values = [c?.mood, c?.energy].filter(
    (v): v is number => v !== undefined,
  );
  return values.length
    ? {
        value: values.reduce((a, b) => a + b, 0) / values.length,
        explanation: `Mean of recorded ${c?.mood !== undefined ? "mood " : ""}${c?.energy !== undefined ? "energy" : ""}; personal indicator, not a clinical score.`,
        version: "wellbeing-1",
      }
    : undefined;
}
export function detectPatterns(checkins: Checkin[], asOf?: string) {
  const end =
    asOf ||
    checkins
      .map((c) => c.date)
      .sort()
      .at(-1) ||
    new Date().toISOString().slice(0, 10);
  const rows = checkins
    .filter((c) => c.date <= end && c.date >= nextDate(end, -27))
    .sort((a, b) => a.date.localeCompare(b.date));
  const energy = rows.filter(
    (c): c is Checkin & { energy: number } => c.energy !== undefined,
  );
  const base = energy.filter((c) => c.date < nextDate(end, -6)),
    recent = energy.filter((c) => c.date >= nextDate(end, -6));
  if (energy.length < 14 || base.length < 7 || recent.length < 4)
    return {
      sufficient: false,
      text: `${energy.length}/14 energy observations in the past 28 days; ${recent.length} in the past week. About 2–4 weeks, with at least 7 baseline and 4 recent observations, are needed for an exploratory comparison.`,
    };
  const avg = (a: typeof energy) =>
    a.reduce((n, c) => n + c.energy, 0) / a.length;
  const difference = avg(recent) - avg(base);
  return {
    sufficient: true,
    text:
      difference <= -2
        ? `Recent energy averages ${avg(recent).toFixed(1)} versus your exploratory baseline of ${avg(base).toFixed(1)}. This may be a difficult period. A gentler plan or talking with someone you trust may help. This does not identify a clinical episode.`
        : `Recent energy averages ${avg(recent).toFixed(1)}; exploratory baseline ${avg(base).toFixed(1)}. No clear sustained lower-energy pattern in these observations.`,
    version: "patterns-1",
  };
}
