import { State } from "../types";
import { at, localDate, nextDate } from "../utils/time";
export function demoState(s: State): State {
  const date = localDate(s.preferences.zone);
  return {
    ...s,
    demo: true,
    onboarded: true,
    checkins: Array.from({ length: 21 }, (_, i) => ({
      id: `demo-${i}`,
      date: nextDate(date, i - 20),
      energy: 3 + (i % 6),
      mood: 4 + (i % 5),
      sleepHours: 6 + (i % 3),
    })),
    goals: [
      {
        id: "demo-goal",
        name: "Build a robotics portfolio",
        description: "A small, sustainable project",
        category: "Personal project",
        importance: 5,
        priority: 1,
        deadline: nextDate(date, 28),
        effortMin: 1800,
        effortMax: 2400,
        frequency: 3,
        minimumMinutes: 5,
        status: "active",
      },
    ],
    milestones: [
      {
        id: "demo-milestone",
        goalId: "demo-goal",
        name: "Choose a first prototype",
        completed: false,
      },
    ],
    actions: [
      {
        id: "demo-action",
        goalId: "demo-goal",
        milestoneId: "demo-milestone",
        title: "Outline the robotics prototype",
        minutes: 60,
        effort: 7,
        completed: false,
        dependencies: [],
        variants: [
          { title: "List three prototype ideas", minutes: 20 },
          { title: "Open your project notes", minutes: 5 },
        ],
      },
    ],
    commitments: [
      {
        id: "demo-appointment",
        title: "Demo fixed appointment",
        start: at(date, 14, s.preferences.zone),
        end: at(date, 15, s.preferences.zone),
        busy: true,
        source: "demo",
      },
    ],
    habits: [
      {
        id: "demo-habit",
        name: "Step outside",
        minutes: 10,
        minimum: "Open a window",
        daysPerWeek: 4,
      },
    ],
  };
}
