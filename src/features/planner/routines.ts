import { State } from "../../types";
export function removeRoutine(state: State, id: string): State {
  return {
    ...state,
    habits: state.habits.filter((h) => h.id !== id),
    habitLogs: Object.fromEntries(
      Object.entries(state.habitLogs).map(([date, ids]) => [
        date,
        ids.filter((x) => x !== id),
      ]),
    ),
    plans: Object.fromEntries(
      Object.entries(state.plans).map(([date, items]) => [
        date,
        items.filter(
          (i) => i.completed || i.kind !== "habit" || i.id !== `${date}-${id}`,
        ),
      ]),
    ),
  };
}
