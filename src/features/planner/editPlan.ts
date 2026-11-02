import { PlanItem, State } from "../../types";
export function editPlanItem(
  state: State,
  date: string,
  id: string,
  change: Partial<PlanItem>,
): State {
  const item = state.plans[date]?.find((i) => i.id === id);
  if (!item) return state;
  const updated = { ...item, ...change, locked: change.locked ?? true };
  const actions =
    change.completed !== undefined && item.actionId && item.variant === 0
      ? state.actions.map((a) =>
          a.id === item.actionId ? { ...a, completed: change.completed! } : a,
        )
      : state.actions;
  let habitLogs = state.habitLogs;
  const habit = state.habits.find((h) => `${date}-${h.id}` === item.id);
  if (change.completed !== undefined && item.kind === "habit" && habit) {
    const ids = state.habitLogs[date] || [];
    habitLogs = {
      ...state.habitLogs,
      [date]: change.completed
        ? [...new Set([...ids, habit.id])]
        : ids.filter((id) => id !== habit.id),
    };
  }
  return {
    ...state,
    actions,
    habitLogs,
    plans: {
      ...state.plans,
      [date]: state.plans[date]!.map((i) => (i.id === id ? updated : i)),
    },
    revisions: [
      ...state.revisions,
      {
        date,
        at: new Date().toISOString(),
        reason: "Manual edit",
        items: state.plans[date] || [],
      },
    ],
  };
}
