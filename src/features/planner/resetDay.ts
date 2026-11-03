import { State } from "../../types";

export function resetDay(state: State, date: string, now: string): State {
  const planMeta = { ...state.planMeta };
  delete planMeta[date];
  return {
    ...state,
    plans: {
      ...state.plans,
      [date]: (state.plans[date] || []).filter((item) => item.completed),
    },
    excludedActions: { ...state.excludedActions, [date]: [] },
    planMeta,
    revisions: [
      ...state.revisions,
      {
        date,
        at: now,
        reason: "Reset unfinished plan",
        items: state.plans[date] || [],
      },
    ],
  };
}
