import { Habit, State } from "../../types";
import { nextDate } from "../../utils/time";
export function habitProgress(
  habit: Habit,
  logs: State["habitLogs"],
  today: string,
) {
  const days = Array.from({ length: 28 }, (_, i) => nextDate(today, i - 27));
  const done = days.map((date) => !!logs[date]?.includes(habit.id));
  const week = done.slice(-7).filter(Boolean).length;
  return {
    days,
    done,
    week,
    target: habit.daysPerWeek,
    percent: Math.min(100, Math.round((week / habit.daysPerWeek) * 100)),
    total: new Set(
      Object.keys(logs).filter(
        (d) => d <= today && logs[d]?.includes(habit.id),
      ),
    ).size,
  };
}
