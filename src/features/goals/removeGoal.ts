import { State, PlanItem } from "../../types";

export function removeGoal(state: State, goalId: string): State {
  const removed = new Set(
    state.actions.filter((a) => a.goalId === goalId).map((a) => a.id),
  );
  return {
    ...removeActions(state, removed),
    goals: state.goals.filter((g) => g.id !== goalId),
    milestones: state.milestones.filter((m) => m.goalId !== goalId),
  };
}

export function removeMilestone(state: State, id: string): State {
  return {
    ...state,
    milestones: state.milestones.filter((m) => m.id !== id),
    actions: state.actions.map((a) =>
      a.milestoneId === id ? { ...a, milestoneId: undefined } : a,
    ),
  };
}

export function removeActions(state: State, removed: Set<string>): State {
  const detach = (item: PlanItem): PlanItem =>
    removed.has(item.actionId ?? "") ? { ...item, actionId: undefined } : item;
  return {
    ...state,
    actions: state.actions
      .filter((a) => !removed.has(a.id))
      .map((a) => ({
        ...a,
        dependencies: a.dependencies.filter((id) => !removed.has(id)),
      })),
    plans: Object.fromEntries(
      Object.entries(state.plans).map(([date, items]) => [
        date,
        items
          .filter((item) => item.completed || !removed.has(item.actionId ?? ""))
          .map(detach),
      ]),
    ),
    revisions: state.revisions.map((revision) => ({
      ...revision,
      items: revision.items.map(detach),
    })),
    excludedActions: Object.fromEntries(
      Object.entries(state.excludedActions).map(([date, ids]) => [
        date,
        ids.filter((id) => !removed.has(id)),
      ]),
    ),
  };
}
