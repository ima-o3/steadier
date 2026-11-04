import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { TodayOverview } from "../components/TodayOverview";
import { useStore } from "../components/AppState";
import { localDate } from "../utils/time";
import { prefs } from "./fixtures";
import { State } from "../types";
jest.mock("../components/AppState", () => ({ useStore: jest.fn() }));
const today = localDate(prefs.zone);
const task = {
  id: "task",
  title: "My own task",
  start: `${today}T09:00:00Z`,
  end: `${today}T09:10:00Z`,
  kind: "task" as const,
  completed: false,
  effort: 2,
  locked: false,
  variant: 0,
};
const state: State = {
  preferences: prefs,
  checkins: [{ id: "c", date: today, mood: 7, energy: 3, sleepHours: 0 }],
  goals: [],
  actions: [],
  milestones: [],
  commitments: [],
  plans: { [today]: [task] },
  excludedActions: {},
  habits: [],
  habitLogs: {},
  onboarded: true,
  demo: false,
  calendarIds: [],
  feedback: {},
  revisions: [],
};
const handlers = () => ({
  onCheckin: jest.fn(),
  onPlan: jest.fn(),
  onEasier: jest.fn(),
  onCalendar: jest.fn(),
  onSettings: jest.fn(),
  onComplete: jest.fn(),
});
test("dashboard uses actual observations and tasks and wires all quick actions", async () => {
  jest.mocked(useStore).mockReturnValue({ state, update: jest.fn() });
  const actions = handlers();
  await render(<TodayOverview {...actions} />);
  expect(
    screen.getByLabelText("Wellbeing summary: 5.0 out of 10"),
  ).toBeTruthy();
  expect(
    screen.getByText(
      "You’ve recorded low energy today. Would a gentler plan help?",
    ),
  ).toBeTruthy();
  await fireEvent.press(screen.getByText("Plan my day"));
  await fireEvent.press(screen.getByText("Check in"));
  await fireEvent.press(screen.getByText("Make it easier"));
  await fireEvent.press(
    screen.getByLabelText(
      "Your wellbeing this month: 1 recorded days. Open calendar",
    ),
  );
  await fireEvent.press(screen.getByLabelText("My own task, not completed"));
  expect(actions.onPlan).toHaveBeenCalledTimes(1);
  expect(actions.onCheckin).toHaveBeenCalledTimes(1);
  expect(actions.onEasier).toHaveBeenCalledTimes(1);
  expect(actions.onCalendar).toHaveBeenCalledTimes(1);
  expect(actions.onComplete).toHaveBeenCalledWith(task);
});
test("empty dashboard shows missing data and does not invent tasks or energy trends", async () => {
  jest.mocked(useStore).mockReturnValue({
    state: { ...state, checkins: [], plans: {} },
    update: jest.fn(),
  });
  await render(<TodayOverview {...handlers()} />);
  expect(screen.getByLabelText("Wellbeing summary: not recorded")).toBeTruthy();
  expect(screen.getByText("0 items")).toBeTruthy();
  expect(
    screen.getByText(
      "Small steps count. Choose a plan that leaves room for rest.",
    ),
  ).toBeTruthy();
});
