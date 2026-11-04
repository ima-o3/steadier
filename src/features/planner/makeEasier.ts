import { State } from "../../types";
import { addMinutes, duration } from "../../utils/time";
export function makeEasier(state: State, date: string, now: string): State {
  const before = state.plans[date] || [];
  let reduced = false;
  let items = before.map((item) => {
    if (item.locked || item.completed || item.start < now) return item;
    const action = state.actions.find((a) => a.id === item.actionId);
    const habit = state.habits.find((h) => `${date}-${h.id}` === item.id);
    const choices =
      action?.variants.map((v, i) => ({ ...v, variant: i + 1 })) ||
      (habit?.minimum
        ? [
            {
              title: habit.minimum,
              minutes: Math.min(5, habit.minutes),
              variant: 1,
            },
          ]
        : []);
    const smallest = choices
      .filter(
        (v) => v.minutes > 0 && v.minutes < duration(item.start, item.end),
      )
      .sort((a, b) => a.minutes - b.minutes)[0];
    if (!smallest) return item;
    reduced = true;
    return {
      ...item,
      title: smallest.title,
      variant: smallest.variant,
      end: addMinutes(item.start, smallest.minutes),
    };
  });
  if (!reduced) {
    const removable = [...items]
      .reverse()
      .find((i) => !i.locked && !i.completed && i.start >= now);
    if (removable) {
      items = items.filter((i) => i.id !== removable.id);
      reduced = true;
    }
  }
  if (!reduced) return state;
  return {
    ...state,
    plans: { ...state.plans, [date]: items },
    planMeta: {
      ...state.planMeta,
      [date]: {
        mode: state.planMeta?.[date]?.mode || "steady",
        version: "planner-2",
        createdAt: now,
        explanation:
          "Reduced flexible work and left the freed time open. Pinned, started and completed items stay unchanged; your chosen mode and long-term goals are unchanged.",
      },
    },
    revisions: [
      ...state.revisions,
      { date, at: now, reason: "Make it easier", items: before },
    ],
  };
}
