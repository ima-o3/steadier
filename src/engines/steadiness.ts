import { Checkin } from "../types";
export function steadiness(c?: Checkin, sleepTarget = 8, screenTarget = 300) {
  const clamp = (n: number) => Math.max(0, Math.min(10, n));
  const valid = (n: number | undefined) =>
    n !== undefined && Number.isFinite(n);
  const factors = [
    {
      name: "Energy",
      raw: c?.energy,
      value: c?.energy,
      unit: "/10",
      icon: "☼",
      color: "#FFE39B",
    },
    {
      name: "Sleep duration",
      raw: c?.sleepHours,
      value: valid(c?.sleepHours)
        ? 10 - Math.abs(c!.sleepHours! - sleepTarget) * 2
        : undefined,
      unit: "h",
      icon: "☾",
      color: "#C9DAB7",
    },
    {
      name: "Mood",
      raw: c?.mood,
      value: c?.mood,
      unit: "/10",
      icon: "♡",
      color: "#F4C8E1",
    },
    {
      name: "Screen time",
      raw: c?.screenMinutes,
      value: valid(c?.screenMinutes)
        ? 10 - Math.max(0, c!.screenMinutes! - screenTarget) / 60
        : undefined,
      unit: "min",
      icon: "▣",
      color: "#C4CCFA",
    },
    {
      name: "Sleep quality",
      raw: c?.sleepQuality,
      value: c?.sleepQuality,
      unit: "/10",
      icon: "✧",
      color: "#D8C4F7",
    },
  ].map((f) => ({ ...f, value: valid(f.value) ? clamp(f.value!) : undefined }));
  const recorded = factors.filter((f) => f.value !== undefined);
  const value = recorded.length
    ? recorded.reduce((sum, f) => sum + f.value!, 0) / recorded.length
    : undefined;
  return {
    value,
    factors,
    explanation: `Equal average of ${recorded.length} recorded factors. Ratings use your 0–10 values. Sleep starts at 10 at your ${sleepTarget}h target and subtracts 2 per hour away. Screen time starts at 10 up to your ${screenTarget}min target and subtracts 1 per additional hour. Values are capped at 0–10. These are adjustable personal planning rules, not a clinical score. Missing values and notes are excluded; task completion does not affect it.`,
  };
}
