import { Goal, State } from "../../types";
export type GoalChange = Partial<
  Pick<Goal, "deadline" | "effortMin" | "effortMax" | "priority">
>;
export type Simulation = {
  changes: Record<string, GoalChange>;
  excluded: string[];
  weeklyMinutes?: number;
  capacityLow?: number;
  capacityHigh?: number;
};
export const emptySimulation = (): Simulation => ({
  changes: {},
  excluded: [],
});
export function applySimulation(state: State, draft: Simulation): State {
  // Exclusions are a what-if comparison only, never an implicit archive/pause.
  return {
    ...state,
    goals: state.goals.map((g) => ({ ...g, ...draft.changes[g.id] })),
    preferences: {
      ...state.preferences,
      ...(draft.weeklyMinutes === undefined
        ? {}
        : { weeklyMinutes: draft.weeklyMinutes }),
      ...(draft.capacityLow === undefined
        ? {}
        : { capacityLow: draft.capacityLow }),
      ...(draft.capacityHigh === undefined
        ? {}
        : { capacityHigh: draft.capacityHigh }),
    },
  };
}
export function simulatedState(state: State, draft: Simulation): State {
  const proposed = applySimulation(state, draft);
  return {
    ...proposed,
    goals: proposed.goals.filter((g) => !draft.excluded.includes(g.id)),
  };
}
