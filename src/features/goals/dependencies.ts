import { Action } from "../../types";
export function validateDependencies(
  id: string,
  dependencies: string[],
  actions: Action[],
) {
  if (dependencies.some((d) => !actions.some((a) => a.id === d)))
    throw new Error("Every dependency must be an existing action.");
  function reaches(current: string, seen = new Set<string>()): boolean {
    if (current === id) return true;
    if (seen.has(current)) return false;
    seen.add(current);
    return (actions.find((a) => a.id === current)?.dependencies || []).some(
      (d) => reaches(d, seen),
    );
  }
  if (dependencies.some((d) => reaches(d)))
    throw new Error(
      "Dependencies cannot refer back to this action or create a cycle.",
    );
}
