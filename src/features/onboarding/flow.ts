import { State } from "../../types";
export function needsWelcome(s: State) {
  return (
    !s.onboarded &&
    !s.demo &&
    !s.tutorialCompleted &&
    s.goals.length +
      s.checkins.length +
      s.habits.length +
      s.commitments.length ===
      0 &&
    Object.keys(s.plans).length === 0
  );
}
export function completeTutorial(s: State): State {
  return {
    ...s,
    onboarded: true,
    tutorialCompleted: true,
    firstGoalRequested: true,
  };
}
